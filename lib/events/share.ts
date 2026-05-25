export const CANONICAL_EVENT_SHARE_LOCALE = 'es'

export function getCanonicalEventSharePath(eventId: string) {
  return `/${CANONICAL_EVENT_SHARE_LOCALE}/events/${eventId}`
}

export function getCanonicalEventShareUrl(eventId: string, origin?: string | null) {
  const path = getCanonicalEventSharePath(eventId)
  if (!origin) return path

  return `${origin.replace(/\/$/, '')}${path}`
}

export function getEventShareTitle(eventTitle?: string | null) {
  return eventTitle?.trim() || 'Evento LEAD'
}

export function getEventShareText() {
  return 'Unete a este evento de LEAD'
}
