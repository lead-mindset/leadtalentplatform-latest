import { describe, expect, it } from 'vitest'
import { getGoogleCalendarUrl, getIcsContent, getIcsFileName } from '@/lib/events/calendar'

const event = {
  title: 'LEAD Spark: Demo Night',
  description: 'Meet builders, recruiters, and chapter leaders.',
  startAt: '2026-06-01T22:00:00.000Z',
  endAt: '2026-06-02T00:00:00.000Z',
  location: 'Lima Tech Hub',
  meetingUrl: null,
  detailUrl: 'https://lead.example/es/events/event-123',
}

describe('event calendar helpers', () => {
  it('builds a Google Calendar URL with event fields', () => {
    const url = new URL(getGoogleCalendarUrl(event))

    expect(url.origin).toBe('https://calendar.google.com')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('text')).toBe('LEAD Spark: Demo Night')
    expect(url.searchParams.get('dates')).toBe('20260601T220000Z/20260602T000000Z')
    expect(url.searchParams.get('location')).toBe('Lima Tech Hub')
    expect(url.searchParams.get('details')).toContain('https://lead.example/es/events/event-123')
  })

  it('falls back to meeting URL as calendar location', () => {
    const url = new URL(
      getGoogleCalendarUrl({
        ...event,
        location: null,
        meetingUrl: 'https://meet.example/lead',
      })
    )

    expect(url.searchParams.get('location')).toBe('https://meet.example/lead')
    expect(url.searchParams.get('details')).toContain('Meeting: https://meet.example/lead')
  })

  it('normalizes ICS filenames', () => {
    expect(getIcsFileName('  LEAD Spark: Demo Night!  ')).toBe('lead-spark-demo-night.ics')
    expect(getIcsFileName('!!!')).toBe('lead-event.ics')
  })

  it('creates ICS content with escaped text and UTC dates', () => {
    const ics = getIcsContent(
      {
        ...event,
        title: 'Networking, Leadership; Demo',
        description: 'Line one\nLine two',
      },
      new Date('2026-05-25T15:00:00.000Z')
    )

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('DTSTART:20260601T220000Z')
    expect(ics).toContain('DTEND:20260602T000000Z')
    expect(ics).toContain('SUMMARY:Networking\\, Leadership\\; Demo')
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two')
    expect(ics).toContain('LOCATION:Lima Tech Hub')
    expect(ics).toContain('URL:https://lead.example/es/events/event-123')
  })
})

