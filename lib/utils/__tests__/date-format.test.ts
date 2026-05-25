import { describe, expect, it } from 'vitest'
import { formatLeadDate, formatLeadDateTime } from '@/lib/utils/date-format'

describe('LEAD date formatting', () => {
  it('formats dates in the LEAD launch locale and time zone', () => {
    expect(formatLeadDate('2026-05-23T04:30:00.000Z')).toBe('22 may. 2026')
  })

  it('formats date-times with deterministic 24-hour Lima time', () => {
    expect(formatLeadDateTime('2026-05-23T04:30:00.000Z')).toBe('22 may. 2026, 23:30')
  })

  it('returns the fallback for missing or invalid values', () => {
    expect(formatLeadDate(null)).toBe('-')
    expect(formatLeadDate('not-a-date', 'No date')).toBe('No date')
    expect(formatLeadDateTime(undefined, 'Pending')).toBe('Pending')
  })
})
