'use client'

import { useEffect, useRef, useState, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  checkInAttendee,
  getCheckInCounter,
  resolveCheckInCandidate,
  searchAttendeesForCheckIn,
} from '@/lib/actions/events/checkin'
import type { CheckInSearchResult } from '@/lib/services/event.service'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error' | 'neutral'

type PendingCandidate = {
  registrationId: string
  eventId: string
  attendee: { id: string; name: string; email: string }
}

type StatusMessage = {
  type: 'success' | 'error' | 'neutral'
  text: string
}

export function CheckinScanner({
  eventId,
  initialCheckedIn = 0,
  initialTotal = 0,
}: {
  eventId: string
  initialCheckedIn?: number
  initialTotal?: number
}) {
  const [qrToken, setQrToken] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isConfirming, setIsConfirming] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CheckInSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [counter, setCounter] = useState({ checkedIn: initialCheckedIn, total: initialTotal })
  const [pendingCandidate, setPendingCandidate] = useState<PendingCandidate | null>(null)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [wakeLockNote, setWakeLockNote] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)
  const statusTimerRef = useRef<number | null>(null)
  const searchTimeoutRef = useRef<number | null>(null)
  const counterIntervalRef = useRef<number | null>(null)

  // ─── helpers ────────────────────────────────────────────────────────────────

  function showStatus(type: StatusMessage['type'], text: string, autoClear = true) {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    setStatus({ type, text })
    if (autoClear && type === 'success') {
      statusTimerRef.current = window.setTimeout(() => setStatus(null), 3000)
    }
  }

  async function refreshCounter() {
    const next = await getCheckInCounter(eventId)
    if (next) setCounter(next)
  }

  // ─── camera ─────────────────────────────────────────────────────────────────

  async function stopCamera() {
    if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (videoRef.current) videoRef.current.srcObject = null
    setScanStatus('idle')
  }

  async function startCamera() {
    setStatus(null)
    setScanStatus('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      // @ts-expect-error BarcodeDetector not in all TS libs
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      intervalRef.current = window.setInterval(async () => {
        const video = videoRef.current
        if (!video || video.readyState < 2) return
        try {
          const bitmap = await createImageBitmap(video)
          const codes = await detector.detect(bitmap)
          bitmap.close()
          if (codes?.length) {
            const raw = codes[0]?.rawValue ?? ''
            if (raw) { setQrToken(raw); await stopCamera() }
          }
        } catch { /* ignore intermittent failures */ }
      }, 350)
    } catch {
      setScanStatus('error')
      showStatus('error', 'No se pudo acceder a la cámara', false)
      await stopCamera()
    }
  }

  // ─── search ──────────────────────────────────────────────────────────────────

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    try {
      const formData = new FormData()
      formData.set('eventId', eventId)
      formData.set('query', query.trim())
      const results = await searchAttendeesForCheckIn(formData)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [eventId])

  function onSearchChange(value: string) {
    setSearchQuery(value)
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current)
    if (value.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    searchTimeoutRef.current = window.setTimeout(() => {
      void runSearch(value)
    }, 300)
  }

  // ─── prepare check-in ────────────────────────────────────────────────────────

  async function prepareFromToken(token: string) {
    if (!token.trim()) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('qrToken', token.trim())
      formData.set('eventId', eventId)
      const candidate = await resolveCheckInCandidate(formData)

      if (!candidate.ok) {
        showStatus('error', candidate.error, false)
        return
      }
      if (candidate.status === 'already_checked_in') {
        setCounter(candidate.counter)
        const time = new Date(candidate.checkedInAt).toLocaleTimeString()
        showStatus('neutral',
          `${candidate.attendee.name} ya hizo check-in a las ${time}${candidate.checkedInByName ? ` con ${candidate.checkedInByName}` : ''}`,
          false
        )
        return
      }
      setPendingCandidate({
        registrationId: candidate.registrationId,
        eventId: candidate.eventId,
        attendee: candidate.attendee,
      })
      setStatus(null)
    })
  }

  function prepareFromSearchResult(result: CheckInSearchResult) {
    if (result.status === 'attended') {
      const time = result.checkedInAt ? new Date(result.checkedInAt).toLocaleTimeString() : ''
      showStatus('neutral', `${result.name} ya hizo check-in${time ? ` a las ${time}` : ''}`, false)
      return
    }
    setPendingCandidate({
      registrationId: result.registrationId,
      eventId,
      attendee: { id: result.userId, name: result.name, email: result.email },
    })
    setStatus(null)
    // Clear search so the confirm card is the focus
    setSearchQuery('')
    setSearchResults([])
  }

  // ─── commit check-in ─────────────────────────────────────────────────────────

  async function commitCheckIn() {
    if (!pendingCandidate) return
    setIsConfirming(true)
    try {
      const formData = new FormData()
      formData.set('registrationId', pendingCandidate.registrationId)
      formData.set('eventId', pendingCandidate.eventId)
      const result = await checkInAttendee(formData)

      if ('error' in result) {
        showStatus('error', result.error, false)
        return
      }
      setCounter(result.counter)
      setQrToken('')
      if (result.state === 'already_checked_in') {
        showStatus('neutral', `${result.attendee.name} ya tenía check-in`)
      } else {
        showStatus('success', `${result.attendee.name} marcado como asistente`)
      }
      setPendingCandidate(null)
    } finally {
      setIsConfirming(false)
    }
  }

  function cancelPendingCheckIn() {
    setPendingCandidate(null)
    setQrToken('')
    setStatus(null)
  }

  // ─── effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    setHasBarcodeDetector('BarcodeDetector' in window)
  }, [])

  // Auto-prepare when QR token is populated from camera scan
  useEffect(() => {
    if (!qrToken.trim() || pendingCandidate || isPending) return
    void prepareFromToken(qrToken)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrToken])

  // Poll counter every 5s
  useEffect(() => {
    counterIntervalRef.current = window.setInterval(() => void refreshCounter(), 5000)
    return () => { if (counterIntervalRef.current) window.clearInterval(counterIntervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Wake lock to keep screen on
  useEffect(() => {
    async function requestWakeLock() {
      try {
        if (!('wakeLock' in navigator)) { setWakeLockNote('Mantén la pantalla encendida durante el check-in.'); return }
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        setWakeLockNote('Mantén la pantalla encendida durante el check-in.')
      }
    }
    void requestWakeLock()
    return () => { wakeLockRef.current?.release() }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current)
      void stopCamera()
    }
  }, [])


  const percentage = counter.total > 0
    ? Math.min(100, Math.round((counter.checkedIn / counter.total) * 100))
    : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Check-in en vivo</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
                {counter.checkedIn}
                <span className="text-xl font-normal text-muted-foreground"> / {counter.total}</span>
              </p>
            </div>
            <Badge variant={percentage === 100 && counter.total > 0 ? 'success' : 'outline'}>
              {percentage}% asistencia
            </Badge>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-1">Registrados: {counter.total}</span>
            <span className="rounded-full bg-muted px-2.5 py-1">Asistieron: {counter.checkedIn}</span>
            {wakeLockNote && <span className="rounded-full bg-muted px-2.5 py-1">{wakeLockNote}</span>}
          </div>
        </CardContent>
      </Card>

      {status && (
        <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium
          ${status.type === 'success' ? 'border-success/40 bg-success/10 text-success' : ''}
          ${status.type === 'error' ? 'border-destructive/40 bg-destructive/10 text-destructive' : ''}
          ${status.type === 'neutral' ? 'border-border bg-muted text-foreground' : ''}
        `}>
          {status.type === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {status.type === 'error' && <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {status.type === 'neutral' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <div className="space-y-1">
            <p>{status.text}</p>
            {status.type === 'error' && (
              <p className="font-normal text-muted-foreground">
                Revisa que la persona esté registrada para este evento y no esté pendiente, rechazada, cancelada o ya marcada.
              </p>
            )}
          </div>
        </div>
      )}

      {pendingCandidate && (
        <Card className="border-primary/60 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Confirmar asistente</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verifica el nombre antes de marcar esta asistencia.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-lg font-semibold">{pendingCandidate.attendee.name}</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{pendingCandidate.attendee.email}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={cancelPendingCheckIn}
                disabled={isConfirming}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => void commitCheckIn()}
                disabled={isConfirming}
              >
                {isConfirming
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirmando...</>
                  : 'Confirmar check-in'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Buscar asistente</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Usa nombre o correo cuando el QR no esté disponible.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                aria-label="Buscar asistentes por nombre o correo"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar nombre o correo"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                className="h-11 pr-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                No encontramos una persona registrada para &quot;{searchQuery}&quot;.
              </p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.registrationId}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{result.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{result.email}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={result.status === 'attended' ? 'success' : 'outline'}>
                          {result.status === 'attended' ? 'Asistió' : 'Registrado'}
                        </Badge>
                        <Button
                          size="sm"
                          variant={result.status === 'attended' ? 'outline' : 'default'}
                          onClick={() => prepareFromSearchResult(result)}
                          disabled={isPending}
                        >
                          {result.status === 'attended' ? 'Ver' : 'Hacer check-in'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="lg:hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Escanear QR</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Usa la cámara trasera cuando el navegador lo permita.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {scanStatus === 'scanning' && (
                <div className="overflow-hidden rounded-xl border bg-muted">
                  <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
                </div>
              )}
              {!hasBarcodeDetector && (
                <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  El escaneo con cámara no está disponible en este navegador. Busca a la persona directamente.
                </p>
              )}
              {hasBarcodeDetector && (
                <Button
                  type="button"
                  variant={scanStatus === 'scanning' ? 'destructive' : 'default'}
                  className="w-full"
                  onClick={scanStatus === 'scanning' ? stopCamera : startCamera}
                  disabled={isPending}
                >
                  {scanStatus === 'scanning' ? 'Detener cámara' : 'Iniciar cámara'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
