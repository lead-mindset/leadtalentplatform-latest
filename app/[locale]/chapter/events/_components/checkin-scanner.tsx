'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  checkInAttendee,
  getCheckInCounter,
  resolveCheckInCandidate,
  searchAttendeesForCheckIn,
  type CheckInSearchResult,
} from '@/lib/actions/events/checkin'
import { Badge } from '@/components/ui/badge'

type ScanStatus = 'idle' | 'scanning' | 'success' | 'neutral' | 'error'

type PendingCandidate = {
  registrationId: string
  eventId: string
  attendee: { id: string; name: string; email: string }
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
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CheckInSearchResult[]>([])
  const [counter, setCounter] = useState({ checkedIn: initialCheckedIn, total: initialTotal })
  const [pendingCandidate, setPendingCandidate] = useState<PendingCandidate | null>(null)
  const [confirmCountdown, setConfirmCountdown] = useState(1)
  const [wakeLockNote, setWakeLockNote] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const confirmTimerRef = useRef<number | null>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)

  const hasBarcodeDetector = useMemo(() => {
    return typeof window !== 'undefined' && 'BarcodeDetector' in window
  }, [])

  async function stopCamera() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (status === 'scanning') setStatus('idle')
  }

  async function startCamera() {
    setMessage(null)
    setStatus('scanning')

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

      // @ts-expect-error BarcodeDetector is not in TS lib by default in some setups
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })

      intervalRef.current = window.setInterval(async () => {
        const video = videoRef.current
        if (!video || video.readyState < 2) return

        try {
          const bitmap = await createImageBitmap(video)
          // @ts-expect-error detector type
          const codes = await detector.detect(bitmap)
          bitmap.close()

          if (codes?.length) {
            const raw = codes[0]?.rawValue ?? ''
            if (raw) {
              setQrToken(raw)
              await stopCamera()
            }
          }
        } catch {
          // Ignore intermittent scan failures
        }
      }, 350)
    } catch {
      setStatus('error')
      setMessage('Camera permission denied')
      await stopCamera()
    }
  }

  function setResult(nextStatus: ScanStatus, text: string) {
    setStatus(nextStatus)
    setMessage(text)
  }

  async function refreshCounter() {
    const nextCounter = await getCheckInCounter(eventId)
    if (nextCounter) setCounter(nextCounter)
  }

  async function onPrepareFromToken() {
    setMessage(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('qrToken', qrToken.trim())
      formData.set('eventId', eventId)
      const candidate = await resolveCheckInCandidate(formData)
      if (!candidate.ok) {
        setResult('error', candidate.error)
        return
      }
      if (candidate.status === 'already_checked_in') {
        setCounter(candidate.counter)
        const checkedInAt = new Date(candidate.checkedInAt).toLocaleTimeString()
        setResult(
          'neutral',
          `${candidate.attendee.name} is already checked in (${checkedInAt}${candidate.checkedInByName ? ` by ${candidate.checkedInByName}` : ''})`
        )
        return
      }
      setPendingCandidate({
        registrationId: candidate.registrationId,
        eventId: candidate.eventId,
        attendee: candidate.attendee,
      })
      setConfirmCountdown(1)
      setResult('neutral', `Ready to check in ${candidate.attendee.name}`)
    })
  }

  function cancelPendingCheckIn() {
    if (confirmTimerRef.current) {
      window.clearInterval(confirmTimerRef.current)
      confirmTimerRef.current = null
    }
    setPendingCandidate(null)
    setConfirmCountdown(1)
    setResult('idle', 'Check-in cancelled')
  }

  async function commitCheckIn(candidate: PendingCandidate) {
    const formData = new FormData()
    formData.set('registrationId', candidate.registrationId)
    formData.set('eventId', candidate.eventId)
    const result = await checkInAttendee(formData)
    if ('error' in result) {
      setResult('error', result.error)
      return
    }

    setCounter(result.counter)
    setQrToken('')
    if (result.state === 'already_checked_in') {
      setResult('neutral', `${result.attendee.name} is already checked in`)
      return
    }
    setResult('success', `${result.attendee.name} checked in`)
  }

  function startAutoConfirm(candidate: PendingCandidate) {
    if (confirmTimerRef.current) {
      window.clearInterval(confirmTimerRef.current)
      confirmTimerRef.current = null
    }

    let remaining = 1
    setConfirmCountdown(remaining)
    confirmTimerRef.current = window.setInterval(async () => {
      remaining -= 0.25
      if (remaining <= 0) {
        if (confirmTimerRef.current) {
          window.clearInterval(confirmTimerRef.current)
          confirmTimerRef.current = null
        }
        setPendingCandidate(null)
        await commitCheckIn(candidate)
        return
      }
      setConfirmCountdown(Number(remaining.toFixed(2)))
    }, 250)
  }

  async function runSearch() {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    const formData = new FormData()
    formData.set('eventId', eventId)
    formData.set('query', searchQuery.trim())
    const results = await searchAttendeesForCheckIn(formData)
    setSearchResults(results)
  }

  function onPrepareFromSearchResult(result: CheckInSearchResult) {
    if (result.status === 'attended') {
      setResult('neutral', `${result.name} is already checked in`)
      return
    }
    setPendingCandidate({
      registrationId: result.registrationId,
      eventId,
      attendee: { id: result.userId, name: result.name, email: result.email },
    })
    setConfirmCountdown(1)
    setResult('neutral', `Ready to check in ${result.name}`)
  }

  useEffect(() => {
    if (!pendingCandidate) return
    startAutoConfirm(pendingCandidate)

    return () => {
      if (confirmTimerRef.current) {
        window.clearInterval(confirmTimerRef.current)
        confirmTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCandidate?.registrationId])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshCounter()
    }, 4000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  useEffect(() => {
    async function requestWakeLock() {
      try {
        if (!('wakeLock' in navigator)) {
          setWakeLockNote('Keep your screen on while checking in.')
          return
        }
        // @ts-expect-error wake lock API is not always in TS lib
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        setWakeLockNote('Keep your screen on while checking in.')
      }
    }
    void requestWakeLock()
    return () => {
      if (wakeLockRef.current?.release) wakeLockRef.current.release()
    }
  }, [])

  useEffect(() => {
    const searchTimeout = window.setTimeout(() => {
      void runSearch()
    }, 250)
    return () => window.clearTimeout(searchTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, eventId])

  useEffect(() => {
    if (!qrToken.trim() || pendingCandidate || isPending) return
    void onPrepareFromToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrToken, eventId])

  useEffect(() => {
    void refreshCounter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) window.clearInterval(confirmTimerRef.current)
      void stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'success') return
    const timer = window.setTimeout(() => setStatus('idle'), 900)
    return () => window.clearTimeout(timer)
  }, [status])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Live Counter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-semibold tabular-nums">
            {counter.checkedIn} of {counter.total} checked in
          </p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${counter.total > 0 ? Math.min(100, Math.round((counter.checkedIn / counter.total) * 100)) : 0}%` }}
            />
          </div>
          {wakeLockNote && (
            <p className="text-xs text-muted-foreground">{wakeLockNote}</p>
          )}
        </CardContent>
      </Card>

      {pendingCandidate && (
        <Card className="border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle>Mark {pendingCandidate.attendee.name} as attended?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Auto-confirming in {confirmCountdown.toFixed(2)}s
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelPendingCheckIn}>Cancel</Button>
              <Button onClick={() => {
                cancelPendingCheckIn()
                void commitCheckIn(pendingCandidate)
              }}>
                Confirm now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Scan QR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasBarcodeDetector ? (
            <>
              <div className="rounded-xl overflow-hidden border bg-muted">
                <video ref={videoRef} className="w-full h-auto" playsInline muted />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {status !== 'scanning' ? (
                  <Button type="button" variant="outline" onClick={startCamera} disabled={isPending}>
                    Start camera
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={stopCamera} disabled={isPending}>
                    Stop camera
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Camera scanning is not supported on this browser. Use manual methods below.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual token check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={qrToken}
            onChange={(event) => setQrToken(event.target.value)}
            placeholder="Paste or type QR token"
          />
          <Button type="button" className="w-full" onClick={onPrepareFromToken} disabled={isPending || !qrToken.trim()}>
            Prepare check-in
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual search fallback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or email (2+ characters)"
          />
          <div className="space-y-2">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching attendees yet.</p>
            ) : (
              searchResults.map((result) => (
                <div key={result.registrationId} className="rounded-md border p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.status === 'attended' ? 'secondary' : 'outline'}>
                      {result.status === 'attended' ? 'Attended' : 'Registered'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => onPrepareFromSearchResult(result)}>
                      Check in
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {message && (
        <div
          className={
            status === 'success'
              ? 'rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success'
              : status === 'neutral'
                ? 'rounded-md border border-border bg-muted px-3 py-2 text-sm'
                : 'rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          }
        >
          {message}
        </div>
      )}
    </div>
  )
}

