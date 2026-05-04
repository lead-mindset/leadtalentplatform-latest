'use client'

import { useEffect, useRef, useState, useTransition, useCallback, useMemo } from 'react'
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
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'

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

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)
  const statusTimerRef = useRef<number | null>(null)
  const searchTimeoutRef = useRef<number | null>(null)
  const counterIntervalRef = useRef<number | null>(null)

  const hasBarcodeDetector = useMemo(() => {
    return typeof window !== 'undefined' && 'BarcodeDetector' in window
  }, [])

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
      showStatus('error', 'Camera permission denied', false)
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
          `${candidate.attendee.name} already checked in at ${time}${candidate.checkedInByName ? ` by ${candidate.checkedInByName}` : ''}`,
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
      showStatus('neutral', `${result.name} is already checked in${time ? ` at ${time}` : ''}`, false)
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
        showStatus('neutral', `${result.attendee.name} was already checked in`)
      } else {
        showStatus('success', `✓ ${result.attendee.name} checked in`)
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
        if (!('wakeLock' in navigator)) { setWakeLockNote('Keep your screen on during check-in.'); return }
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        setWakeLockNote('Keep your screen on during check-in.')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const percentage = counter.total > 0
    ? Math.min(100, Math.round((counter.checkedIn / counter.total) * 100))
    : 0

  return (
    <div className="space-y-4 max-w-lg mx-auto">

      <Card>
        <CardContent className="pt-5 pb-4 space-y-3">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold tabular-nums">
              {counter.checkedIn}
              <span className="text-lg font-normal text-muted-foreground"> / {counter.total}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-1">{percentage}% checked in</p>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {wakeLockNote && (
            <p className="text-xs text-muted-foreground">{wakeLockNote}</p>
          )}
        </CardContent>
      </Card>

      {status && (
        <div className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm font-medium
          ${status.type === 'success' ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300' : ''}
          ${status.type === 'error' ? 'border-destructive/40 bg-destructive/10 text-destructive' : ''}
          ${status.type === 'neutral' ? 'border-border bg-muted text-foreground' : ''}
        `}>
          {status.type === 'success' && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
          {status.type === 'error' && <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          {status.type === 'neutral' && <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <span>{status.text}</span>
        </div>
      )}

      {pendingCandidate && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Confirm check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-lg">{pendingCandidate.attendee.name}</p>
              <p className="text-sm text-muted-foreground">{pendingCandidate.attendee.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={cancelPendingCheckIn}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => void commitCheckIn()}
                disabled={isConfirming}
              >
                {isConfirming
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking in…</>
                  : 'Confirm check-in'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Search attendee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name or email…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground">No attendees found for &quot;{searchQuery}&quot;</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.registrationId}
                  className="rounded-md border p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={result.status === 'attended' ? 'secondary' : 'outline'}>
                      {result.status === 'attended' ? 'Attended' : 'Registered'}
                    </Badge>
                    <Button
                      size="sm"
                      variant={result.status === 'attended' ? 'ghost' : 'default'}
                      onClick={() => prepareFromSearchResult(result)}
                      disabled={isPending}
                    >
                      {result.status === 'attended' ? 'View' : 'Check in'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {hasBarcodeDetector && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Scan QR code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scanStatus === 'scanning' && (
              <div className="rounded-xl overflow-hidden border bg-muted">
                <video ref={videoRef} className="w-full h-auto" playsInline muted />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={scanStatus === 'scanning' ? stopCamera : startCamera}
              disabled={isPending}
            >
              {scanStatus === 'scanning' ? 'Stop camera' : 'Start camera'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Paste QR token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            placeholder="Paste token here…"
            autoComplete="off"
          />
          <Button
            type="button"
            className="w-full"
            onClick={() => void prepareFromToken(qrToken)}
            disabled={isPending || !qrToken.trim()}
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Looking up…</>
              : 'Look up attendee'
            }
          </Button>
        </CardContent>
      </Card>

    </div>
  )
}
