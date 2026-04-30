'use client'

import { useEffect } from 'react'

/** Scrolls to the registration card that matches `?event=` after post-registration redirect. */
export function ScrollToHighlightedEvent({ eventId }: { eventId: string | undefined }) {
  useEffect(() => {
    if (!eventId) return
    const el = document.getElementById(`event-reg-${eventId}`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [eventId])
  return null
}
