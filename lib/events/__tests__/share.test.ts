import { describe, expect, it } from 'vitest'
import {
  getCanonicalEventSharePath,
  getCanonicalEventShareUrl,
  getEventShareText,
  getEventShareTitle,
} from '@/lib/events/share'

describe('event share helpers', () => {
  it('builds the canonical Spanish event share path', () => {
    expect(getCanonicalEventSharePath('event-123')).toBe('/es/events/event-123')
  })

  it('builds an absolute share URL when an origin is available', () => {
    expect(getCanonicalEventShareUrl('event-123', 'https://lead.example/')).toBe(
      'https://lead.example/es/events/event-123'
    )
  })

  it('falls back to the canonical path without an origin', () => {
    expect(getCanonicalEventShareUrl('event-123')).toBe('/es/events/event-123')
  })

  it('uses event title when present and default LEAD title otherwise', () => {
    expect(getEventShareTitle('  Demo Day  ')).toBe('Demo Day')
    expect(getEventShareTitle('')).toBe('Evento LEAD')
    expect(getEventShareTitle(null)).toBe('Evento LEAD')
  })

  it('uses the launch share message', () => {
    expect(getEventShareText()).toBe('Unete a este evento de LEAD')
  })
})
