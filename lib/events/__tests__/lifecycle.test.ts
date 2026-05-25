import { describe, expect, it } from 'vitest'
import { getEventLifecycle } from '@/lib/events/lifecycle'

const NOW = new Date('2026-05-25T15:00:00.000Z')

const futureEvent = {
  startAt: '2026-05-26T15:00:00.000Z',
  endAt: '2026-05-26T17:00:00.000Z',
  accessModel: 'open' as const,
  capacity: 30,
  registeredCount: 12,
}

describe('event lifecycle helpers', () => {
  it('marks upcoming open events as registration open', () => {
    expect(getEventLifecycle(futureEvent, NOW)).toMatchObject({
      state: 'registration_open',
      label: 'Registro abierto',
      canRegister: true,
      canApply: false,
      canShowQr: false,
    })
  })

  it('marks upcoming application events as application required', () => {
    expect(getEventLifecycle({ ...futureEvent, accessModel: 'application' }, NOW)).toMatchObject({
      state: 'application_required',
      canRegister: false,
      canApply: true,
    })
  })

  it('marks full events before open/application states', () => {
    expect(getEventLifecycle({ ...futureEvent, capacity: 12, registeredCount: 12 }, NOW)).toMatchObject({
      state: 'full',
      badgeVariant: 'destructive',
      canRegister: false,
    })
  })

  it('marks live and past events by time', () => {
    expect(
      getEventLifecycle(
        {
          ...futureEvent,
          startAt: '2026-05-25T14:00:00.000Z',
          endAt: '2026-05-25T16:00:00.000Z',
        },
        NOW
      )
    ).toMatchObject({ state: 'live', badgeVariant: 'live' })

    expect(
      getEventLifecycle(
        {
          ...futureEvent,
          startAt: '2026-05-24T14:00:00.000Z',
          endAt: '2026-05-24T16:00:00.000Z',
        },
        NOW
      )
    ).toMatchObject({ state: 'past', canRegister: false })
  })

  it('prioritizes user registration states over event availability', () => {
    expect(getEventLifecycle({ ...futureEvent, registrationStatus: 'registered' }, NOW)).toMatchObject({
      state: 'registered',
      canShowQr: true,
    })
    expect(getEventLifecycle({ ...futureEvent, registrationStatus: 'pending_review' }, NOW)).toMatchObject({
      state: 'pending_review',
      canShowQr: false,
    })
    expect(getEventLifecycle({ ...futureEvent, registrationStatus: 'rejected' }, NOW)).toMatchObject({
      state: 'rejected',
      badgeVariant: 'destructive',
    })
    expect(getEventLifecycle({ ...futureEvent, registrationStatus: 'cancelled' }, NOW)).toMatchObject({
      state: 'cancelled',
      badgeVariant: 'outline',
    })
    expect(getEventLifecycle({ ...futureEvent, registrationStatus: 'attended' }, NOW)).toMatchObject({
      state: 'attended',
      canShowQr: false,
    })
  })

  it('treats checked-in registrations as attended', () => {
    expect(getEventLifecycle({ ...futureEvent, registrationStatus: 'registered', checkedInAt: NOW.toISOString() }, NOW))
      .toMatchObject({ state: 'attended' })
  })

  it('returns date pending for invalid dates', () => {
    expect(getEventLifecycle({ ...futureEvent, startAt: null }, NOW)).toMatchObject({
      state: 'date_pending',
      isActionable: false,
    })
  })
})

