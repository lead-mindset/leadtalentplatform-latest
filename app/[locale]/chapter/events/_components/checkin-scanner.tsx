'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { checkInAttendee } from '@/lib/actions/events/checkin'

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error'

export function CheckinScanner() {
  const [qrToken, setQrToken] = useState('')
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)

  const hasBarcodeDetector = useMemo(() => {
    return typeof window !== 'undefined' && 'BarcodeDetector' in window
  }, [])

  async function stopCamera() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
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
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.message || 'Camera permission denied')
      await stopCamera()
    }
  }

  async function onCheckIn() {
    setMessage(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('qrToken', qrToken.trim())
      const res = await checkInAttendee(fd)
      if ('error' in res) {
        setStatus('error')
        setMessage(res.error)
      } else {
        setStatus('success')
        setMessage('Checked in successfully')
        setQrToken('')
      }
    })
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
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
              Camera scanning isn’t supported on this device/browser. Use manual token entry below.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            placeholder="Paste / type token or scan to fill"
          />
          <Button type="button" className="w-full" onClick={onCheckIn} disabled={isPending || !qrToken.trim()}>
            Check in
          </Button>

          {message && (
            <div
              className={
                status === 'success'
                  ? 'rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success'
                  : 'rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'
              }
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

