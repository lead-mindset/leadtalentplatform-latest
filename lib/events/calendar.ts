export type CalendarEventInput = {
  title: string
  description?: string | null
  startAt: string | Date
  endAt: string | Date
  location?: string | null
  meetingUrl?: string | null
  detailUrl: string
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value)
}

function toUtcCalendarStamp(value: string | Date) {
  const date = toDate(value)
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function getCalendarDescription(input: CalendarEventInput) {
  return [input.description?.trim(), input.meetingUrl ? `Meeting: ${input.meetingUrl}` : null, input.detailUrl]
    .filter(Boolean)
    .join('\n\n')
}

export function getGoogleCalendarUrl(input: CalendarEventInput) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${toUtcCalendarStamp(input.startAt)}/${toUtcCalendarStamp(input.endAt)}`,
    details: getCalendarDescription(input),
  })

  const location = input.location || input.meetingUrl
  if (location) params.set('location', location)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function getIcsFileName(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${slug || 'lead-event'}.ics`
}

export function getIcsContent(input: CalendarEventInput, generatedAt: Date = new Date()) {
  const location = input.location || input.meetingUrl || ''
  const description = getCalendarDescription(input)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LEAD Talent Platform//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${toUtcCalendarStamp(input.startAt)}-${getIcsFileName(input.title).replace(/\.ics$/, '')}@lead-talent-platform`,
    `DTSTAMP:${toUtcCalendarStamp(generatedAt)}`,
    `DTSTART:${toUtcCalendarStamp(input.startAt)}`,
    `DTEND:${toUtcCalendarStamp(input.endAt)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `URL:${escapeIcsText(input.detailUrl)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

