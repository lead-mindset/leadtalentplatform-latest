import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerForEvent } from '../register'
import { requireUser } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'
import { getEventRegistrationPreflight } from '@/lib/actions/events/register.helpers'
import { revalidatePath } from 'next/cache'

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  requireUser: vi.fn(),
  getEventRegistrationPreflight: vi.fn(),
  validateEventForRegistration: vi.fn(),
  registerForEvent: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: mocks.headers,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
  unstable_cache: (callback: unknown) => callback,
}))

vi.mock('@/lib/auth', () => ({
  requireUser: mocks.requireUser,
}))

vi.mock('@/lib/services/event.service', () => ({
  EventService: {
    applyForEvent: vi.fn(),
    validateEventForRegistration: mocks.validateEventForRegistration,
    registerForEvent: mocks.registerForEvent,
  },
}))

vi.mock('@/lib/actions/events/register.helpers', () => ({
  getEventRegistrationPreflight: mocks.getEventRegistrationPreflight,
}))

vi.mock('@/lib/emails/send-email', () => ({
  sendApplicationReceivedEmail: vi.fn(),
  sendEventRegistrationConfirmedEmail: vi.fn().mockResolvedValue({ success: true }),
}))

function buildFormData(eventId = 'event-123', subscribe = true) {
  const formData = new FormData()
  formData.set('eventId', eventId)
  if (subscribe) {
    formData.set('subscribeToHostChapters', 'true')
  }
  return formData
}

describe('registerForEvent server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.headers.mockResolvedValue({
      get: (name: string) => (name === 'referer' ? 'http://localhost:3000/es/events/event-123' : null),
    })
    const eventQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          title: 'Demo event',
          start_at: '2026-06-01T15:00:00.000Z',
          location: 'Lima',
          meeting_url: null,
          event_type: 'in_person',
        },
      }),
    }
    mocks.requireUser.mockResolvedValue({
      supabase: { from: vi.fn(() => eventQuery) },
      user: { id: 'user-123', email: 'participant@test.com', name: 'Test Participant' },
    })
    mocks.getEventRegistrationPreflight.mockResolvedValue({ ok: true })
    mocks.validateEventForRegistration.mockResolvedValue({ ok: true, event: { id: 'event-123' } })
    mocks.registerForEvent.mockResolvedValue({
      success: true,
      registration: { id: 'registration-123' },
      action: 'created',
    })
  })

  it('returns a localized QR route after successful registration', async () => {
    const result = await registerForEvent(null, buildFormData())

    expect(result).toEqual({
      success: true,
      redirectPath: '/es/student/events?event=event-123',
    })
    expect(requireUser).toHaveBeenCalled()
    expect(getEventRegistrationPreflight).toHaveBeenCalledWith(expect.anything(), {
      userId: 'user-123',
      eventId: 'event-123',
    })
    expect(EventService.validateEventForRegistration).toHaveBeenCalledWith(expect.anything(), 'event-123')
    expect(EventService.registerForEvent).toHaveBeenCalledWith(expect.anything(), 'event-123', 'user-123', {
      subscribeToHostChapters: true,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/events')
    expect(revalidatePath).toHaveBeenCalledWith('/events/event-123')
    expect(revalidatePath).toHaveBeenCalledWith('/student/events')
  })

  it('passes unchecked newsletter opt-in to the service', async () => {
    await registerForEvent(null, buildFormData('event-123', false))

    expect(EventService.registerForEvent).toHaveBeenCalledWith(expect.anything(), 'event-123', 'user-123', {
      subscribeToHostChapters: false,
    })
  })

  it('uses Spanish as the fallback locale when the referer has no supported locale', async () => {
    mocks.headers.mockResolvedValue({
      get: (name: string) => (name === 'referer' ? 'http://localhost:3000/events/event-123' : null),
    })

    await expect(registerForEvent(null, buildFormData())).resolves.toMatchObject({
      success: true,
      redirectPath: '/es/student/events?event=event-123',
    })
  })

  it('returns a visible onboarding error when the user lacks a basic profile', async () => {
    mocks.getEventRegistrationPreflight.mockResolvedValue({
      ok: false,
      reason: 'missing_profile',
      error: 'Complete onboarding before registering for this event.',
      onboardingPath: '/onboarding?next=%2Fevents%2Fevent-123',
    })

    const result = await registerForEvent(null, buildFormData())

    expect(result).toEqual({
      error: 'Complete onboarding before registering for this event.',
      requiresOnboarding: true,
      onboardingPath: '/onboarding?next=%2Fevents%2Fevent-123',
    })
    expect(EventService.validateEventForRegistration).not.toHaveBeenCalled()
    expect(EventService.registerForEvent).not.toHaveBeenCalled()
  })

  it('returns validation errors without calling the registration service', async () => {
    mocks.validateEventForRegistration.mockResolvedValue({
      ok: false,
      error: 'Registration is closed because the event has already started.',
    })

    const result = await registerForEvent(null, buildFormData())

    expect(result).toEqual({
      error: 'Registration is closed because the event has already started.',
    })
    expect(EventService.registerForEvent).not.toHaveBeenCalled()
  })

  it('returns service errors and capacity flags for visible UI feedback', async () => {
    mocks.registerForEvent.mockResolvedValue({
      success: false,
      error: 'Someone just took the last spot. Check back - cancellations open it back up.',
      capacityExceeded: true,
    })

    const result = await registerForEvent(null, buildFormData())

    expect(result).toEqual({
      error: 'Someone just took the last spot. Check back - cancellations open it back up.',
      capacityExceeded: true,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/events/event-123')
  })

  it('returns an auth error when no user is available', async () => {
    mocks.requireUser.mockResolvedValue({
      supabase: { from: vi.fn() },
      user: null,
    })

    const result = await registerForEvent(null, buildFormData())

    expect(result).toEqual({ error: 'You need to sign in to register.' })
    expect(EventService.registerForEvent).not.toHaveBeenCalled()
  })
})
