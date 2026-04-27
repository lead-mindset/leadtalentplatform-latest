import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventService } from '../event.service'
import { SupabaseClient } from '@supabase/supabase-js'

// ───────────────────────────────────────────────────────────────
// Helper: Build a Supabase mock that routes `from(table)` calls
// ───────────────────────────────────────────────────────────────
const buildMockSupabase = (overrides: Record<string, any> = {}) => {
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    then: vi.fn(),
  }

  const updateChain = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  const insertChain = {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  const deleteChain = {
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  const tableMocks: Record<string, any> = {
    event: {
      select: vi.fn().mockReturnValue(selectChain),
      update: vi.fn().mockReturnValue(updateChain),
      insert: vi.fn().mockReturnValue(insertChain),
      delete: vi.fn().mockReturnValue(deleteChain),
      _selectChain: selectChain,
      _updateChain: updateChain,
      _insertChain: insertChain,
    },
    event_registration: {
      select: vi.fn().mockReturnValue(selectChain),
      update: vi.fn().mockReturnValue(updateChain),
      insert: vi.fn().mockReturnValue(insertChain),
      delete: vi.fn().mockReturnValue(deleteChain),
      _selectChain: selectChain,
      _updateChain: updateChain,
      _insertChain: insertChain,
    },
    user: {
      select: vi.fn().mockReturnValue(selectChain),
      _selectChain: selectChain,
    },
    ...overrides,
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

describe('EventService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ───────────────────────────────────────────────────────────────
  // createEvent
  // ───────────────────────────────────────────────────────────────
  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      const mockEvent = { id: 'evt-1', title: 'Test Event' }

      tableMocks.event._insertChain.single.mockResolvedValueOnce({
        data: mockEvent,
        error: null,
      })

      const result = await EventService.createEvent(mockSupabase as any, {
        title: 'Test Event',
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
        eventType: 'in_person',
        chapter_id: 'ch-1',
        accessModel: 'open',
        createdById: 'user-1',
      })

      expect(result).toEqual(mockEvent)
      expect(mockSupabase.from).toHaveBeenCalledWith('event')
    })

    it('should throw on creation error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event._insertChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'DB error' },
      })

      await expect(
        EventService.createEvent(mockSupabase as any, {
          title: 'Test Event',
          startAt: new Date().toISOString(),
          endAt: new Date().toISOString(),
          eventType: 'in_person',
          chapter_id: 'ch-1',
          accessModel: 'open',
          createdById: 'user-1',
        })
      ).rejects.toThrow('DB error')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // validateEventForRegistration
  // ───────────────────────────────────────────────────────────────
  describe('validateEventForRegistration', () => {
    it('should return ok when event is valid', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      const futureDate = new Date(Date.now() + 86400000).toISOString()

      tableMocks.event._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'evt-1', title: 'Test', is_published: true, start_at: futureDate },
        error: null,
      })

      const result = await EventService.validateEventForRegistration(mockSupabase as any, 'evt-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.event.id).toBe('evt-1')
      }
    })

    it('should return error when event not found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event._selectChain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await EventService.validateEventForRegistration(mockSupabase as any, 'evt-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('Could not load this event.')
      }
    })

    it('should return error when event is not published', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'evt-1', title: 'Test', is_published: false, start_at: new Date().toISOString() },
        error: null,
      })

      const result = await EventService.validateEventForRegistration(mockSupabase as any, 'evt-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('This event is not open for registration.')
      }
    })

    it('should return error when event has already started', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      const pastDate = new Date(Date.now() - 86400000).toISOString()

      tableMocks.event._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'evt-1', title: 'Test', is_published: true, start_at: pastDate },
        error: null,
      })

      const result = await EventService.validateEventForRegistration(mockSupabase as any, 'evt-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('Registration is closed because the event has already started.')
      }
    })
  })

  // ───────────────────────────────────────────────────────────────
  // applyForEvent
  // ───────────────────────────────────────────────────────────────
  describe('applyForEvent', () => {
    it('should create a pending application', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      const mockRegistration = { id: 'reg-1', status: 'pending_review' }

      tableMocks.event_registration._insertChain.single.mockResolvedValueOnce({
        data: mockRegistration,
        error: null,
      })

      const result = await EventService.applyForEvent(mockSupabase as any, 'evt-1', 'user-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.registration.status).toBe('pending_review')
      }
    })

    it('should return error on insert failure', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._insertChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      })

      const result = await EventService.applyForEvent(mockSupabase as any, 'evt-1', 'user-1')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Could not submit application. Please try again.')
      }
    })
  })

  // ───────────────────────────────────────────────────────────────
  // registerForEvent
  // ───────────────────────────────────────────────────────────────
  describe('registerForEvent', () => {
    it('should create a new registration when none exists', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      const mockRegistration = { id: 'reg-1', status: 'registered' }

      // No existing registration
      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      tableMocks.event_registration._insertChain.single.mockResolvedValueOnce({
        data: mockRegistration,
        error: null,
      })

      const result = await EventService.registerForEvent(mockSupabase as any, 'evt-1', 'user-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.action).toBe('created')
      }
    })

    it('should return already active registration', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'reg-1', status: 'registered' },
        error: null,
      })

      const result = await EventService.registerForEvent(mockSupabase as any, 'evt-1', 'user-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.action).toBe('created')
      }
    })

    it('should revive a cancelled registration', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      const mockRegistration = { id: 'reg-1', status: 'registered' }

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'reg-1', status: 'cancelled' },
        error: null,
      })

      tableMocks.event_registration._updateChain.single.mockResolvedValueOnce({
        data: mockRegistration,
        error: null,
      })

      const result = await EventService.registerForEvent(mockSupabase as any, 'evt-1', 'user-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.action).toBe('revived')
      }
    })

    it('should handle capacity exceeded error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      tableMocks.event_registration._insertChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'CAPACITY_EXCEEDED', details: '', hint: '' },
      })

      const result = await EventService.registerForEvent(mockSupabase as any, 'evt-1', 'user-1')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.capacityExceeded).toBe(true)
      }
    })

    it('should handle duplicate key race condition', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'reg-1', status: 'registered' },
          error: null,
        })

      tableMocks.event_registration._insertChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' },
      })

      const result = await EventService.registerForEvent(mockSupabase as any, 'evt-1', 'user-1')

      expect(result.success).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getCheckInCounter
  // ───────────────────────────────────────────────────────────────
  describe('getCheckInCounter', () => {
    it('should count checked-in and total registrations', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.eq.mockResolvedValueOnce({
        data: [
          { status: 'registered' },
          { status: 'attended' },
          { status: 'attended' },
          { status: 'cancelled' },
        ],
        error: null,
      })

      const result = await EventService.getCheckInCounter(mockSupabase as any, 'evt-1')

      expect(result).toEqual({ checkedIn: 2, total: 3 })
    })

    it('should return null on error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'DB error' },
      })

      const result = await EventService.getCheckInCounter(mockSupabase as any, 'evt-1')

      expect(result).toBeNull()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // resolveCheckInCandidate
  // ───────────────────────────────────────────────────────────────
  describe('resolveCheckInCandidate', () => {
    it('should return ready status for valid registration', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'reg-1',
          event_id: 'evt-1',
          user_id: 'user-1',
          checked_in_at: null,
          checked_in_by_id: null,
          status: 'registered',
        },
        error: null,
      })

      tableMocks.user._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'user-1', name: 'John', email: 'john@test.com' },
        error: null,
      })

      const result = await EventService.resolveCheckInCandidate(mockSupabase as any, 'evt-1', 'token-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.status).toBe('ready')
        expect(result.registrationId).toBe('reg-1')
      }
    })

    it('should return already_checked_in for checked-in attendee', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'reg-1',
          event_id: 'evt-1',
          user_id: 'user-1',
          checked_in_at: '2024-01-01T00:00:00Z',
          checked_in_by_id: 'checker-1',
          status: 'attended',
        },
        error: null,
      })

      tableMocks.user._selectChain.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'user-1', name: 'John', email: 'john@test.com' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { name: 'Checker' },
          error: null,
        })

      vi.spyOn(EventService, 'getCheckInCounter').mockResolvedValueOnce({ checkedIn: 1, total: 1 })

      const result = await EventService.resolveCheckInCandidate(mockSupabase as any, 'evt-1', 'token-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.status).toBe('already_checked_in')
      }
    })

    it('should return error for missing registration', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await EventService.resolveCheckInCandidate(mockSupabase as any, 'evt-1', 'token-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('Not registered for this event')
      }
    })
  })

  // ───────────────────────────────────────────────────────────────
  // searchAttendeesForCheckIn
  // ───────────────────────────────────────────────────────────────
  describe('searchAttendeesForCheckIn', () => {
    it('should return empty array for short query', async () => {
      const { mockSupabase } = buildMockSupabase()

      const result = await EventService.searchAttendeesForCheckIn(mockSupabase as any, 'evt-1', 'a')

      expect(result).toEqual([])
    })

    it('should search and return matching attendees', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._selectChain.or.mockReturnThis()
      tableMocks.user._selectChain.limit
        .mockResolvedValueOnce({
          data: [{ id: 'user-1', name: 'John Doe', email: 'john@test.com' }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ id: 'reg-1', user_id: 'user-1', status: 'registered', checked_in_at: null }],
          error: null,
        })

      const result = await EventService.searchAttendeesForCheckIn(mockSupabase as any, 'evt-1', 'john')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('John Doe')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // checkInAttendee
  // ───────────────────────────────────────────────────────────────
  describe('checkInAttendee', () => {
    it('should check in a registered attendee', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'reg-1',
          event_id: 'evt-1',
          user_id: 'user-1',
          registered_at: '2024-01-01T00:00:00Z',
          status: 'registered',
          qr_token: 'token-1',
          checked_in_at: null,
          checked_in_by_id: null,
        },
        error: null,
      })

      tableMocks.user._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'user-1', name: 'John', email: 'john@test.com' },
        error: null,
      })

      tableMocks.event_registration._updateChain.single.mockResolvedValueOnce({
        data: {
          id: 'reg-1',
          status: 'attended',
          checked_in_at: '2024-01-02T00:00:00Z',
          checked_in_by_id: 'checker-1',
        },
        error: null,
      })

      vi.spyOn(EventService, 'getCheckInCounter').mockResolvedValueOnce({ checkedIn: 1, total: 1 })

      const result = await EventService.checkInAttendee(mockSupabase as any, 'reg-1', 'evt-1', 'checker-1')

      expect('success' in result).toBe(true)
      if ('success' in result) {
        expect(result.state).toBe('success')
        expect(result.message).toBe('Checked in successfully')
      }
    })

    it('should return already_checked_in for attended registration', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'reg-1',
          event_id: 'evt-1',
          user_id: 'user-1',
          registered_at: '2024-01-01T00:00:00Z',
          status: 'attended',
          qr_token: 'token-1',
          checked_in_at: '2024-01-01T12:00:00Z',
          checked_in_by_id: 'checker-1',
        },
        error: null,
      })

      tableMocks.user._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'user-1', name: 'John', email: 'john@test.com' },
        error: null,
      })

      vi.spyOn(EventService, 'getCheckInCounter').mockResolvedValueOnce({ checkedIn: 1, total: 1 })

      const result = await EventService.checkInAttendee(mockSupabase as any, 'reg-1', 'evt-1', 'checker-1')

      expect('success' in result).toBe(true)
      if ('success' in result) {
        expect(result.state).toBe('already_checked_in')
        expect(result.message).toBe('Already checked in')
      }
    })

    it('should return error for missing registration', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await EventService.checkInAttendee(mockSupabase as any, 'reg-1', 'evt-1', 'checker-1')

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Registration not found for this event')
      }
    })

    it('should return error when not registered', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'reg-1',
          event_id: 'evt-1',
          user_id: 'user-1',
          status: 'pending_review',
          checked_in_at: null,
        },
        error: null,
      })

      tableMocks.user._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'user-1', name: 'John', email: 'john@test.com' },
        error: null,
      })

      const result = await EventService.checkInAttendee(mockSupabase as any, 'reg-1', 'evt-1', 'checker-1')

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Not registered for this event')
      }
    })

    it('should return error on update failure', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.event_registration._selectChain.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'reg-1',
          event_id: 'evt-1',
          user_id: 'user-1',
          status: 'registered',
          checked_in_at: null,
        },
        error: null,
      })

      tableMocks.user._selectChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'user-1', name: 'John', email: 'john@test.com' },
        error: null,
      })

      tableMocks.event_registration._updateChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      })

      const result = await EventService.checkInAttendee(mockSupabase as any, 'reg-1', 'evt-1', 'checker-1')

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Failed to check in')
      }
    })
  })
})
