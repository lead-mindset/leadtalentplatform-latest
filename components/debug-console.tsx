'use client'
import { useEffect, useState } from 'react'

export default function DebugConsole() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setError(event.message + '\n\n' + (event.error?.stack ?? ''))
    }
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      setError(String(event.reason) + '\n\n' + (event.reason?.stack ?? ''))
    }
    window.addEventListener('error', handler)
    window.addEventListener('unhandledrejection', rejectionHandler)
    return () => {
      window.removeEventListener('error', handler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])

  if (!error) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000', color: '#f87171',
      padding: 20, overflow: 'auto',
      fontFamily: 'monospace', fontSize: 12,
      whiteSpace: 'pre-wrap', wordBreak: 'break-all'
    }}>
      <strong style={{ color: '#fff' }}>DEBUG ERROR:</strong>{'\n\n'}{error}
    </div>
  )
}