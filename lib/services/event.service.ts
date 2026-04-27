import { randomUUID } from 'node:crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.generated';
import { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types';

/**
 * Service Layer: Event Domain
 *
 * All event-related business logic and database operations live here.
 * Server Actions in `lib/actions/events/` act as thin controllers —
 * they validate auth/Zod inputs and delegate to this service.
 *
 * Design decisions:
 * - HTML sanitization strips <script>, <style>, and event handlers to prevent XSS
 *   in rich-text event descriptions.
 * - Services are framework-agnostic so logic can be reused by future mobile apps
 *   or background jobs without importing Next.js runtime code.
 */

const EVENT_MUTATION_SELECT =
  'id, title, description, cover_image, start_at, end_at, location, meeting_url, event_type, capacity, is_published, chapter_id, created_by_id, created_at, updated_at, access_model, application_form_url, location_name, location_address, location_city, location_region, location_latitude, location_longitude';

const EVENT_REGISTRATION_LOOKUP_SELECT =
  'id, title, is_published, start_at';

function sanitizeRichTextHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

// ───────────────────────────────────────────────────────────────
// Capacity check
// ───────────────────────────────────────────────────────────────

function isCapacityExceededError(err: { message?: string; details?: string; hint?: string } | null): boolean {
  if (!err) return false;
  const blob = `${err.message ?? ''} ${err.details ?? ''} ${err.hint ?? ''}`;
  return blob.includes('CAPACITY_EXCEEDED');
}

function isDuplicateError(err: { message?: string } | null): boolean {
  if (!err?.message) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('duplicate') || msg.includes('unique');
}

function isActiveRegistrationStatus(status: RegistrationStatus | string | undefined): boolean {
  return status === 'registered' || status === 'attended';
}

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

export type CreateEventParams = {
  title: string;
  description?: string;
  coverImage?: string | null;
  startAt: string;
  endAt: string;
  location?: string | null;
  meetingUrl?: string | null;
  eventType: string;
  capacity?: number | null;
  isPublished?: boolean;
  chapter_id: string | null;
  accessModel: 'open' | 'application';
  applicationFormUrl?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  locationCity?: string | null;
  locationRegion?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  createdById: string;
};

export type EventValidationResult =
  | { ok: true; event: Pick<EventRow, 'id' | 'title' | 'is_published' | 'start_at'> }
  | { ok: false; error: string };

export type RegistrationResult =
  | { success: true; registration: EventRegistrationRow; action: 'created' | 'revived' }
  | { success: false; error: string; capacityExceeded?: boolean };

export type ApplicationResult =
  | { success: true; registration: EventRegistrationRow }
  | { success: false; error: string };

export type CheckInCounter = {
  checkedIn: number;
  total: number;
};

export type CheckInCandidate =
  | {
      ok: true;
      status: 'ready';
      registrationId: string;
      eventId: string;
      attendee: { id: string; name: string; email: string };
    }
  | {
      ok: true;
      status: 'already_checked_in';
      eventId: string;
      attendee: { id: string; name: string; email: string };
      checkedInAt: string;
      checkedInByName: string | null;
      counter: CheckInCounter;
    }
  | { ok: false; error: string };

export type CheckInSearchResult = {
  registrationId: string;
  userId: string;
  name: string;
  email: string;
  status: RegistrationStatus;
  checkedInAt: string | null;
};

export type CheckInResponse =
  | {
      success: true;
      state: 'success' | 'already_checked_in';
      message: string;
      registration: EventRegistrationRow;
      attendee: { id: string; name: string; email: string };
      counter: CheckInCounter;
    }
  | { error: string };

// ───────────────────────────────────────────────────────────────
// Service
// ───────────────────────────────────────────────────────────────

export const EventService = {
  // ───────────────────────────────────────────────────────────────
  // createEvent
  // ───────────────────────────────────────────────────────────────
  async createEvent(
    supabase: SupabaseClient<Database>,
    params: CreateEventParams
  ): Promise<EventRow> {
    const now = new Date().toISOString();

    const { data: event, error } = await supabase
      .from('event')
      .insert({
        title: params.title,
        description: params.description ? sanitizeRichTextHtml(params.description) : null,
        cover_image: params.coverImage || null,
        start_at: params.startAt,
        end_at: params.endAt,
        location: params.location ?? null,
        meeting_url: params.meetingUrl || null,
        event_type: params.eventType as any,
        capacity: params.capacity ?? null,
        is_published: params.isPublished ?? false,
        chapter_id: params.chapter_id,
        access_model: params.accessModel,
        application_form_url:
          params.accessModel === 'application' ? params.applicationFormUrl : null,
        location_name: params.locationName ?? null,
        location_address: params.locationAddress ?? null,
        location_city: params.locationCity ?? null,
        location_region: params.locationRegion ?? null,
        location_latitude: params.locationLatitude ?? null,
        location_longitude: params.locationLongitude ?? null,
        created_by_id: params.createdById,
        created_at: now,
        updated_at: now,
      })
      .select(EVENT_MUTATION_SELECT)
      .single();

    if (error || !event) {
      throw new Error(error?.message || 'Failed to create event');
    }

    return event as EventRow;
  },

  // ───────────────────────────────────────────────────────────────
  // Event validation (used by registerForEvent)
  // ───────────────────────────────────────────────────────────────
  async validateEventForRegistration(
    supabase: SupabaseClient<Database>,
    eventId: string
  ): Promise<EventValidationResult> {
    const { data: event, error } = await supabase
      .from('event')
      .select(EVENT_REGISTRATION_LOOKUP_SELECT)
      .eq('id', eventId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: 'Could not load this event.' };
    }
    if (!event) {
      return { ok: false, error: 'Event not found.' };
    }
    if (!event.is_published) {
      return { ok: false, error: 'This event is not open for registration.' };
    }

    const starts_at = new Date(event.start_at).getTime();
    if (!Number.isFinite(starts_at)) {
      return { ok: false, error: 'This event has invalid dates.' };
    }
    if (Date.now() >= starts_at) {
      return { ok: false, error: 'Registration is closed because the event has already started.' };
    }

    return { ok: true, event };
  },

  // ───────────────────────────────────────────────────────────────
  // applyForEvent
  // ───────────────────────────────────────────────────────────────
  async applyForEvent(
    supabase: SupabaseClient<Database>,
    eventId: string,
    userId: string
  ): Promise<ApplicationResult> {
    const now = new Date().toISOString();

    const { data: registration, error } = await supabase
      .from('event_registration')
      .insert({
        event_id: eventId,
        user_id: userId,
        registered_at: now,
        status: 'pending_review' as RegistrationStatus,
        qr_token: null,
        checked_in_at: null,
        checked_in_by_id: null,
      })
      .select()
      .single();

    if (error || !registration) {
      console.error('[applyForEvent] Error:', error);
      return { success: false, error: 'Could not submit application. Please try again.' };
    }

    return { success: true, registration };
  },

  // ───────────────────────────────────────────────────────────────
  // registerForEvent
  // ───────────────────────────────────────────────────────────────
  async registerForEvent(
    supabase: SupabaseClient<Database>,
    eventId: string,
    userId: string
  ): Promise<RegistrationResult> {
    const now = new Date().toISOString();

    // 1. Check for existing registration
    const { data: existing, error: existingError } = await supabase
      .from('event_registration')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle<{ id: string; status: RegistrationStatus }>();

    if (existingError) {
      console.error('[registerForEvent] existing lookup:', existingError);
    }

    // 2. Handle already active registrations
    if (existing && isActiveRegistrationStatus(existing.status)) {
      return {
        success: true,
        registration: existing as EventRegistrationRow,
        action: 'created',
      };
    }

    // 3. Revive cancelled registrations
    if (existing?.status === 'cancelled') {
      const { data: revived, error: reviveError } = await supabase
        .from('event_registration')
        .update({
          status: 'registered' as RegistrationStatus,
          registered_at: now,
          qr_token: randomUUID(),
          checked_in_at: null,
          checked_in_by_id: null,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (!reviveError && revived) {
        return { success: true, registration: revived as EventRegistrationRow, action: 'revived' };
      }
      console.error('[registerForEvent] re-register after cancel failed:', reviveError);
      return { success: false, error: 'Could not complete registration. Please try again.' };
    }

    // 4. Insert new registration
    const { data: registration, error } = await supabase
      .from('event_registration')
      .insert({
        event_id: eventId,
        user_id: userId,
        registered_at: now,
        status: 'registered',
        qr_token: randomUUID(),
        checked_in_at: null,
        checked_in_by_id: null,
      })
      .select()
      .single();

    if (error || !registration) {
      if (isCapacityExceededError(error)) {
        return {
          success: false,
          error: 'Someone just took the last spot. Check back — cancellations open it back up.',
          capacityExceeded: true,
        };
      }

      // Handle duplicate key race condition
      if (isDuplicateError(error)) {
        const { data: row } = await supabase
          .from('event_registration')
          .select('id, status')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .maybeSingle<{ id: string; status: RegistrationStatus }>();

        if (row && isActiveRegistrationStatus(row.status)) {
          return {
            success: true,
            registration: row as EventRegistrationRow,
            action: 'created',
          };
        }
        if (row?.status === 'cancelled') {
          const { data: revived, error: reviveError } = await supabase
            .from('event_registration')
            .update({
              status: 'registered' as RegistrationStatus,
              registered_at: now,
              qr_token: randomUUID(),
              checked_in_at: null,
              checked_in_by_id: null,
            })
            .eq('id', row.id)
            .select()
            .single();

          if (!reviveError && revived) {
            return {
              success: true,
              registration: revived as EventRegistrationRow,
              action: 'revived',
            };
          }
        }
        return { success: false, error: 'You are already registered for this event.' };
      }

      console.error('[registerForEvent] insert failed:', error);
      return { success: false, error: 'Could not complete registration. Please try again.' };
    }

    return { success: true, registration: registration as EventRegistrationRow, action: 'created' };
  },

  // ───────────────────────────────────────────────────────────────
  // getCheckInCounter
  // ───────────────────────────────────────────────────────────────
  async getCheckInCounter(
    supabase: SupabaseClient<Database>,
    eventId: string
  ): Promise<CheckInCounter | null> {
    const { data, error } = await supabase
      .from('event_registration')
      .select('status')
      .eq('event_id', eventId);

    if (error || !data) return null;

    const rows = data as Array<{ status: RegistrationStatus }>;
    const checkedIn = rows.filter((r) => r.status === 'attended').length;
    const total = rows.filter((r) => r.status === 'registered' || r.status === 'attended').length;

    return { checkedIn, total };
  },

  // ───────────────────────────────────────────────────────────────
  // resolveCheckInCandidate
  // ───────────────────────────────────────────────────────────────
  async resolveCheckInCandidate(
    supabase: SupabaseClient<Database>,
    eventId: string,
    token: string
  ): Promise<CheckInCandidate> {
    const { data: registration, error } = await supabase
      .from('event_registration')
      .select('id, event_id, user_id, checked_in_at, checked_in_by_id, status')
      .eq('qr_token', token)
      .eq('event_id', eventId)
      .maybeSingle();

    if (error || !registration) {
      return { ok: false, error: 'Not registered for this event' };
    }

    // Fetch attendee separately to avoid FK hint issues
    const { data: attendeeData } = await supabase
      .from('user')
      .select('id, name, email')
      .eq('id', registration.user_id)
      .maybeSingle();

    const attendeePayload = {
      id: attendeeData?.id ?? registration.user_id,
      name: attendeeData?.name ?? 'Unknown attendee',
      email: attendeeData?.email ?? 'unknown@email',
    };

    if (registration.checked_in_at || registration.status === 'attended') {
      let checkedInByName: string | null = null;
      if (registration.checked_in_by_id) {
        const { data: checker } = await supabase
          .from('user')
          .select('name')
          .eq('id', registration.checked_in_by_id)
          .maybeSingle();
        checkedInByName = checker?.name ?? null;
      }
      const counter = await this.getCheckInCounter(supabase, eventId);
      return {
        ok: true,
        status: 'already_checked_in',
        eventId,
        attendee: attendeePayload,
        checkedInAt: registration.checked_in_at ?? new Date().toISOString(),
        checkedInByName,
        counter: counter ?? { checkedIn: 0, total: 0 },
      };
    }

    if (registration.status !== 'registered') {
      return { ok: false, error: 'Not registered for this event' };
    }

    return {
      ok: true,
      status: 'ready',
      registrationId: registration.id,
      eventId,
      attendee: attendeePayload,
    };
  },

  // ───────────────────────────────────────────────────────────────
  // searchAttendeesForCheckIn
  // ───────────────────────────────────────────────────────────────
  async searchAttendeesForCheckIn(
    supabase: SupabaseClient<Database>,
    eventId: string,
    query: string
  ): Promise<CheckInSearchResult[]> {
    if (query.length < 2) return [];

    const { data: users, error: userError } = await supabase
      .from('user')
      .select('id, name, email')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);

    if (userError || !users?.length) return [];

    const userIds = users.map((u: { id: string }) => u.id);

    const { data, error } = await supabase
      .from('event_registration')
      .select('id, user_id, status, checked_in_at')
      .eq('event_id', eventId)
      .in('status', ['registered', 'attended'])
      .in('user_id', userIds)
      .limit(8);

    if (error || !data) return [];

    const userMap = new Map(users.map((u: { id: string; name?: string; email?: string }) => [u.id, u]));

    return (data as Array<{ id: string; user_id: string; status: string; checked_in_at: string | null }>)
      .map((registration) => {
        const user = userMap.get(registration.user_id);
        return {
          registrationId: registration.id,
          userId: registration.user_id,
          name: user?.name ?? 'Unknown attendee',
          email: user?.email ?? '',
          status: registration.status as RegistrationStatus,
          checkedInAt: registration.checked_in_at ?? null,
        };
      });
  },

  // ───────────────────────────────────────────────────────────────
  // checkInAttendee
  // ───────────────────────────────────────────────────────────────
  async checkInAttendee(
    supabase: SupabaseClient<Database>,
    registrationId: string,
    eventId: string,
    checkedInById: string
  ): Promise<CheckInResponse> {
    const { data: reg, error: regError } = await supabase
      .from('event_registration')
      .select('id, event_id, user_id, registered_at, status, qr_token, checked_in_at, checked_in_by_id')
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (regError || !reg) {
      return { error: 'Registration not found for this event' };
    }

    // Fetch attendee separately
    const { data: attendeeData } = await supabase
      .from('user')
      .select('id, name, email')
      .eq('id', reg.user_id)
      .maybeSingle();

    const attendeePayload = {
      id: attendeeData?.id ?? reg.user_id,
      name: attendeeData?.name ?? 'Unknown attendee',
      email: attendeeData?.email ?? '',
    };

    if (reg.checked_in_at || reg.status === 'attended') {
      const counter = await this.getCheckInCounter(supabase, eventId);
      return {
        success: true,
        state: 'already_checked_in',
        message: 'Already checked in',
        registration: reg as EventRegistrationRow,
        attendee: attendeePayload,
        counter: counter ?? { checkedIn: 0, total: 0 },
      };
    }

    if (reg.status !== 'registered') {
      return { error: 'Not registered for this event' };
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('event_registration')
      .update({
        status: 'attended' as RegistrationStatus,
        checked_in_at: now,
        checked_in_by_id: checkedInById,
      })
      .eq('id', reg.id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('[checkInAttendee] update error:', updateError);
      return { error: 'Failed to check in' };
    }

    const counter = await this.getCheckInCounter(supabase, eventId);
    return {
      success: true,
      state: 'success',
      message: 'Checked in successfully',
      registration: updated as EventRegistrationRow,
      attendee: attendeePayload,
      counter: counter ?? { checkedIn: 0, total: 0 },
    };
  },
};
