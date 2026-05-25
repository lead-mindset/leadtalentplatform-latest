const LEAD_DISPLAY_LOCALE = 'es-PE'
const LEAD_DISPLAY_TIME_ZONE = 'America/Lima'

type DateInput = Date | string | number | null | undefined

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: LEAD_DISPLAY_TIME_ZONE,
}

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}

function toValidDate(value: DateInput) {
  if (value === null || value === undefined || value === '') return null

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function formatLeadDateValue(
  value: DateInput,
  options: Intl.DateTimeFormatOptions,
  fallback: string
) {
  const date = toValidDate(value)
  if (!date) return fallback

  return new Intl.DateTimeFormat(LEAD_DISPLAY_LOCALE, options).format(date)
}

export function formatLeadDate(value: DateInput, fallback = '-') {
  return formatLeadDateValue(value, DATE_OPTIONS, fallback)
}

export function formatLeadDateTime(value: DateInput, fallback = '-') {
  return formatLeadDateValue(value, DATE_TIME_OPTIONS, fallback)
}
