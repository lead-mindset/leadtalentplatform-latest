import { logger } from '@/lib/logger'
import { randomUUID } from 'node:crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.generated';
import { EventRow, EventRegistrationRow, RegistrationStatus, EventWithDetails, EventChapterRow, RegistrationWithUser, UserRow, ChapterRow } from '@/lib/types';
import { NewsletterSubscriptionService } from '@/lib/services/newsletter-subscription.service';
import { EventApplicationAnswerInput, EventApplicationService } from '@/lib/services/event-application.service';

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

type EventWithChapterViewRow = Database['public']['Views']['event_with_chapter']['Row']

type EventAdminJoinedRow = EventRow & {
  owner_chapter: Pick<ChapterRow, 'id' | 'name' | 'university'> | Pick<ChapterRow, 'id' | 'name' | 'university'>[] | null
  collaborators:
    | (EventChapterRow & {
        chapter: Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region'> | Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region'>[] | null
      })[]
    | null
  created_by: Pick<UserRow, 'id' | 'name' | 'email'> | Pick<UserRow, 'id' | 'name' | 'email'>[] | null
  event_registration: { id: string; status: string }[] | null
}

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

type EventNewsletterOptions = {
  subscribeToHostChapters?: boolean
  applicationAnswers?: EventApplicationAnswerInput[]
}

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
        event_type: params.eventType as 'in_person' | 'online' | 'hybrid',
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
    userId: string,
    options: EventNewsletterOptions = {}
  ): Promise<ApplicationResult> {
    const now = new Date().toISOString();
    const questions = await EventApplicationService.getQuestionsForEvent(supabase, eventId);

    if (questions.length > 0) {
      const answerValidation = EventApplicationService.validateAnswers(
        questions,
        options.applicationAnswers ?? []
      );

      if (!answerValidation.success) {
        return { success: false, error: answerValidation.error };
      }
    }

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
      logger.error({ context: 'applyForEvent', error: error }, 'Error');
      return { success: false, error: 'Could not submit application. Please try again.' };
    }

    if (questions.length > 0) {
      const answerResult = await EventApplicationService.saveAnswersForRegistration(supabase, {
        registrationId: registration.id,
        questions,
        answers: options.applicationAnswers ?? [],
      });

      if (!answerResult.success) {
        await supabase.from('event_registration').delete().eq('id', registration.id);
        return { success: false, error: answerResult.error };
      }
    }

    if (options.subscribeToHostChapters) {
      const subscriptionResult = await NewsletterSubscriptionService.subscribeForEventRegistration(supabase, {
        userId,
        eventId,
        source: 'event_registration',
      })

      if (!subscriptionResult.success) {
        logger.error(
          { context: 'applyForEvent.newsletter', error: subscriptionResult.error },
          'Newsletter subscription failed'
        )
      }
    }

    return { success: true, registration };
  },

  // ───────────────────────────────────────────────────────────────
  // registerForEvent
  // ───────────────────────────────────────────────────────────────
  async registerForEvent(
    supabase: SupabaseClient<Database>,
    eventId: string,
    userId: string,
    options: EventNewsletterOptions = {}
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
      logger.error({ context: 'registerForEvent', error: existingError }, 'existing lookup');
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
        if (options.subscribeToHostChapters) {
          const subscriptionResult = await NewsletterSubscriptionService.subscribeForEventRegistration(supabase, {
            userId,
            eventId,
            source: 'event_registration',
          })

          if (!subscriptionResult.success) {
            logger.error(
              { context: 'registerForEvent.newsletter.revive', error: subscriptionResult.error },
              'Newsletter subscription failed'
            )
          }
        }

        return { success: true, registration: revived as EventRegistrationRow, action: 'revived' };
      }
      logger.error({ context: 'registerForEvent', error: reviveError }, 're-register after cancel failed');
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
            if (options.subscribeToHostChapters) {
              const subscriptionResult = await NewsletterSubscriptionService.subscribeForEventRegistration(supabase, {
                userId,
                eventId,
                source: 'event_registration',
              })

              if (!subscriptionResult.success) {
                logger.error(
                  { context: 'registerForEvent.newsletter.duplicateRevive', error: subscriptionResult.error },
                  'Newsletter subscription failed'
                )
              }
            }

            return {
              success: true,
              registration: revived as EventRegistrationRow,
              action: 'revived',
            };
          }
        }
        return { success: false, error: 'You are already registered for this event.' };
      }

      logger.error({ context: 'registerForEvent', error: error }, 'insert failed');
      return { success: false, error: 'Could not complete registration. Please try again.' };
    }

    if (options.subscribeToHostChapters) {
      const subscriptionResult = await NewsletterSubscriptionService.subscribeForEventRegistration(supabase, {
        userId,
        eventId,
        source: 'event_registration',
      })

      if (!subscriptionResult.success) {
        logger.error(
          { context: 'registerForEvent.newsletter.create', error: subscriptionResult.error },
          'Newsletter subscription failed'
        )
      }
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

    const userMap = new Map(users.map((u: { id: string; name: string | null; email: string }) => [u.id, { name: u.name ?? undefined, email: u.email ?? undefined }]));

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
      logger.error({ context: 'checkInAttendee', error: updateError }, 'update error');
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

  async getEventById(
    supabase: SupabaseClient<Database>,
    eventId: string,
    select: string = EVENT_MUTATION_SELECT
  ) {
    const { data: event, error } = await supabase
      .from('event')
      .select(select)
      .eq('id', eventId)
      .maybeSingle<EventRow>();

    if (error || !event) return null;
    return event as EventRow;
  },

  async updateEvent(
    supabase: SupabaseClient<Database>,
    eventId: string,
    updates: Partial<Pick<EventRow,
      | 'title'
      | 'description'
      | 'cover_image'
      | 'start_at'
      | 'end_at'
      | 'location'
      | 'meeting_url'
      | 'event_type'
      | 'capacity'
      | 'is_published'
      | 'chapter_id'
      | 'access_model'
      | 'application_form_url'
      | 'location_name'
      | 'location_address'
      | 'location_city'
      | 'location_region'
      | 'location_latitude'
      | 'location_longitude'
      | 'updated_at'
    >>
  ): Promise<EventRow | null> {
    const { data: event, error } = await supabase
      .from('event')
      .update(updates)
      .eq('id', eventId)
      .select(EVENT_MUTATION_SELECT)
      .single();

    if (error || !event) {
      logger.error({ context: 'EventService.updateEvent', error: error }, 'Error');
      return null;
    }

    return event as EventRow;
  },

  async deleteEvent(supabase: SupabaseClient<Database>, eventId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('event').delete().eq('id', eventId);
    if (error) {
      logger.error({ context: 'EventService.deleteEvent', error: error }, 'Error');
      return { success: false, error: 'Failed to delete event' };
    }
    return { success: true };
  },

  async cancelRegistration(
    supabase: SupabaseClient<Database>,
    registrationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const REGISTRATION_SELECT = 'id, event_id, user_id, status, checked_in_at';
    const EVENT_DATE_SELECT = 'id, start_at';

    const { data: reg, error: regError } = await supabase
      .from('event_registration')
      .select(REGISTRATION_SELECT)
      .eq('id', registrationId)
      .maybeSingle<Pick<EventRegistrationRow, 'id' | 'event_id' | 'user_id' | 'status' | 'checked_in_at'>>();

    if (regError || !reg) {
      return { success: false, error: 'Registration not found' };
    }
    if (reg.user_id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }
    if (reg.checked_in_at) {
      return { success: false, error: 'Already checked in' };
    }
    if (reg.status !== 'registered') {
      return { success: false, error: 'Not registered' };
    }

    const { data: event } = await supabase
      .from('event')
      .select(EVENT_DATE_SELECT)
      .eq('id', reg.event_id)
      .maybeSingle();

    if (event) {
      const startsAt = new Date(event.start_at).getTime();
      if (Number.isFinite(startsAt) && Date.now() >= startsAt) {
        return { success: false, error: 'Event already started' };
      }
    }

    const { data: updated, error } = await supabase
      .from('event_registration')
      .update({
        status: 'cancelled' as RegistrationStatus,
      })
      .eq('id', reg.id)
      .select()
      .single<EventRegistrationRow>();

    if (error || !updated) {
      logger.error({ context: 'EventService.cancelRegistration', error: error }, 'Error');
      return { success: false, error: 'Failed to cancel registration' };
    }

    return { success: true };
  },

  async uploadEventCover(
    supabase: SupabaseClient<Database>,
    userId: string,
    file: File
  ): Promise<{ publicUrl: string }> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('event-covers')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error('Failed to upload cover image');
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('event-covers').getPublicUrl(filePath);

    return { publicUrl };
  },

  // ───────────────────────────────────────────────────────────────
  // getPublishedEvents
  // ───────────────────────────────────────────────────────────────
  async getPublishedEvents(
    supabase: SupabaseClient<Database>
  ): Promise<EventWithDetails[]> {
    const { data, error } = await supabase
      .from('event_with_chapter')
      .select(`
        id,
        title,
        description,
        cover_image,
        start_at,
        end_at,
        location,
        meeting_url,
        event_type,
        capacity,
        is_published,
        access_model,
        application_form_url,
        chapter_id,
        created_by_id,
        created_at,
        updated_at,
        chapter_name,
        chapter_university,
        chapter_city,
        chapter_region
      `)
      .eq('is_published', true)
      .order('start_at', { ascending: true })

    if (error || !data) {
      logger.error({ context: 'getPublishedEvents', error: error }, 'Error')
      return []
    }

    const eventRows = data as EventWithChapterViewRow[]
    const eventIds = eventRows.map((event) => event.id).filter((id): id is string => Boolean(id))

    const { data: registrations, error: registrationsError } = await supabase
      .from('event_registration')
      .select('event_id, status')
      .in('event_id', eventIds)
      .eq('status', 'registered')

    if (registrationsError) {
      logger.error({ context: 'getPublishedEvents', error: registrationsError }, 'Registration count error')
    }

    const countsByEventId = new Map<string, number>()
    for (const row of registrations ?? []) {
      countsByEventId.set(row.event_id, (countsByEventId.get(row.event_id) ?? 0) + 1)
    }

    return eventRows
      .map((event) => {
        const chapter = event.chapter_name ? {
          id: event.chapter_id,
          name: event.chapter_name,
          university: event.chapter_university,
          city: event.chapter_city,
          region: event.chapter_region,
          created_at: null,
          updated_at: null,
          instagram_url: null,
          latitude: null,
          longitude: null,
          location_point: null,
        } : null

        return {
          id: event.id ?? '',
          title: event.title ?? '',
          description: event.description,
          cover_image: event.cover_image,
          start_at: event.start_at ?? '',
          end_at: event.end_at ?? '',
          location: event.location,
          meeting_url: event.meeting_url,
          event_type: event.event_type ?? 'in_person',
          capacity: event.capacity,
          is_published: event.is_published ?? false,
          access_model: event.access_model ?? 'open',
          application_form_url: event.application_form_url,
          chapter_id: event.chapter_id,
          created_by_id: event.created_by_id ?? '',
          created_at: event.created_at ?? '',
          updated_at: event.updated_at ?? '',
          location_address: null,
          location_city: null,
          location_latitude: null,
          location_longitude: null,
          location_name: null,
          location_point: null,
          location_region: null,
          chapter: chapter as unknown as EventWithDetails['chapter'],
          owner_chapter: chapter as unknown as EventWithDetails['owner_chapter'],
          event_chapter: [],
          collaborators: [],
          created_by: null,
          _count: {
            registrations: event.id ? countsByEventId.get(event.id) ?? 0 : 0,
            chapters: 0,
          },
        } as EventWithDetails
      })
  },

  // ───────────────────────────────────────────────────────────────
  // getEventByIdWithDetails
  // ───────────────────────────────────────────────────────────────
  async getEventByIdWithDetails(
    supabase: SupabaseClient<Database>,
    id: string
  ): Promise<EventWithDetails | null> {
    const { data, error } = await supabase
      .from('event_with_chapter')
      .select(`
        id,
        title,
        description,
        cover_image,
        start_at,
        end_at,
        location,
        meeting_url,
        event_type,
        capacity,
        is_published,
        access_model,
        application_form_url,
        chapter_id,
        created_by_id,
        created_at,
        updated_at,
        chapter_name,
        chapter_university,
        chapter_city,
        chapter_region
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      logger.error({ context: 'getEventById', error: error }, 'Error')
      return null
    }

    if (!data) return null

    const { count, error: countError } = await supabase
      .from('event_registration')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('status', 'registered')

    if (countError) {
      logger.error({ context: 'getEventById', error: countError }, 'Registration count error')
    }

    const event = data as EventWithChapterViewRow
    const chapter = event.chapter_name ? {
      id: event.chapter_id,
      name: event.chapter_name,
      university: event.chapter_university,
      city: event.chapter_city,
      region: event.chapter_region,
      created_at: null,
      updated_at: null,
      instagram_url: null,
      latitude: null,
      longitude: null,
      location_point: null,
    } : null

    return {
      id: event.id ?? '',
      title: event.title ?? '',
      description: event.description,
      cover_image: event.cover_image,
      start_at: event.start_at ?? '',
      end_at: event.end_at ?? '',
      location: event.location,
      meeting_url: event.meeting_url,
      event_type: event.event_type ?? 'in_person',
      capacity: event.capacity,
      is_published: event.is_published ?? false,
      access_model: event.access_model ?? 'open',
      application_form_url: event.application_form_url,
      chapter_id: event.chapter_id,
      created_by_id: event.created_by_id ?? '',
      created_at: event.created_at ?? '',
      updated_at: event.updated_at ?? '',
      location_address: null,
      location_city: null,
      location_latitude: null,
      location_longitude: null,
      location_name: null,
      location_point: null,
      location_region: null,
      chapter: chapter as unknown as EventWithDetails['chapter'],
      owner_chapter: chapter as unknown as EventWithDetails['owner_chapter'],
      event_chapter: [],
      collaborators: [],
      created_by: null,
      _count: {
        registrations: count ?? 0,
        chapters: 0,
      },
    }
  },

  // ───────────────────────────────────────────────────────────────
  // getMyRegistrations
  // ───────────────────────────────────────────────────────────────
  async getMyRegistrations(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<(EventRegistrationRow & { event: EventRow | null })[]> {
    const { data, error } = await supabase
      .from('event_registration_with_event')
      .select(`
        id,
        event_id,
        user_id,
        registered_at,
        status,
        qr_token,
        checked_in_at,
        checked_in_by_id,
        event_title,
        event_description,
        event_start_at,
        event_end_at,
        event_location,
        event_meeting_url,
        event_type,
        event_capacity,
        event_is_published,
        event_chapter_id,
        event_access_model
      `)
      .eq('user_id', userId)
      .order('registered_at', { ascending: false })

    if (error || !data) {
      logger.error({ context: 'getMyRegistrations', error: error }, 'Error')
      return []
    }

    return (data as unknown[]).map((row: unknown) => {
      const r = row as Record<string, unknown>;

      const event: EventRow | null = r.event_title ? {
        id: r.event_id as string,
        title: r.event_title as string,
        description: r.event_description as string | null,
        start_at: r.event_start_at as string,
        end_at: r.event_end_at as string,
        location: r.event_location as string | null,
        meeting_url: r.event_meeting_url as string | null,
        event_type: r.event_type as "in_person" | "online" | "hybrid",
        capacity: r.event_capacity as number | null,
        is_published: r.event_is_published as boolean,
        chapter_id: r.event_chapter_id as string | null,
        access_model: r.event_access_model as string,
        created_by_id: r.user_id as string,
        created_at: r.registered_at as string,
        updated_at: r.registered_at as string,
        cover_image: null,
        application_form_url: null,
        location_address: null,
        location_city: null,
        location_latitude: null,
        location_longitude: null,
        location_name: null,
        location_point: null,
        location_region: null,
      } : null

      return {
        id: r.id as string,
        event_id: r.event_id as string,
        user_id: r.user_id as string,
        registered_at: r.registered_at as string,
        status: r.status as RegistrationStatus,
        qr_token: r.qr_token as string | null,
        checked_in_at: r.checked_in_at as string | null,
        checked_in_by_id: r.checked_in_by_id as string | null,
        event: event,
      }
    })
  },

  // ───────────────────────────────────────────────────────────────
  // getChapterEvents
  // ───────────────────────────────────────────────────────────────
  async getChapterEvents(
    supabase: SupabaseClient<Database>,
    chapter_id: string
  ): Promise<(EventWithDetails & { is_owned_by_chapter: boolean })[]> {
    try {
      const { data: ownedEvents, error: ownedError } = await supabase
        .from('event_with_chapter')
        .select(`
          id,
          title,
          description,
          cover_image,
          start_at,
          end_at,
          location,
          meeting_url,
          event_type,
          capacity,
          is_published,
          access_model,
          application_form_url,
          chapter_id,
          created_by_id,
          created_at,
          updated_at,
          chapter_name,
          chapter_university,
          chapter_city,
          chapter_region
        `)
        .eq('chapter_id', chapter_id)
        .order('start_at', { ascending: false })

      if (ownedError) {
        logger.error({ context: 'getChapterEvents', error: ownedError }, 'Owned events error')
      }

      const { data: eventChapterRecords, error: ecError } = await supabase
        .from('event_chapter')
        .select('event_id')
        .eq('chapter_id', chapter_id)

      if (ecError) {
        logger.error({ context: 'getChapterEvents', error: ecError }, 'event_chapter lookup error')
      }

      let collaboratedEvents: EventWithChapterViewRow[] = []

      if (eventChapterRecords && eventChapterRecords.length > 0) {
        const eventIds = eventChapterRecords.map((r: unknown) => (r as Record<string, unknown>).event_id as string)

        const { data: collabData, error: collabError } = await supabase
          .from('event_with_chapter')
          .select(`
            id,
            title,
            description,
            cover_image,
            start_at,
            end_at,
            location,
            meeting_url,
            event_type,
            capacity,
            is_published,
            access_model,
            application_form_url,
            chapter_id,
            created_by_id,
            created_at,
            updated_at,
            chapter_name,
            chapter_university,
            chapter_city,
            chapter_region
          `)
          .in('id', eventIds)
          .order('start_at', { ascending: false })

        if (collabError) {
          logger.error({ context: 'getChapterEvents', error: collabError }, 'Collaborated events error')
        }

        collaboratedEvents = (collabData || []) as EventWithChapterViewRow[]
      }

      const transformEventData = (e: EventWithChapterViewRow): EventWithDetails => {
        const chapter = e.chapter_name ? {
          id: e.chapter_id as string,
          name: e.chapter_name as string,
          university: e.chapter_university as string,
          city: e.chapter_city as string,
          region: e.chapter_region as string,
          created_at: null,
          updated_at: null,
          instagram_url: null,
          latitude: null,
          longitude: null,
          location_point: null,
        } : null

        return {
          id: e.id as string,
          title: e.title as string,
          description: e.description as string | null,
          cover_image: e.cover_image as string | null,
          start_at: e.start_at as string,
          end_at: e.end_at as string,
          location: e.location as string | null,
          meeting_url: e.meeting_url as string | null,
          event_type: e.event_type as "in_person" | "online" | "hybrid",
          capacity: e.capacity as number | null,
          is_published: e.is_published as boolean,
          access_model: e.access_model as string,
          application_form_url: e.application_form_url as string | null,
          chapter_id: e.chapter_id as string | null,
          created_by_id: e.created_by_id as string,
          created_at: e.created_at as string,
          updated_at: e.updated_at as string,
          location_address: null,
          location_city: null,
          location_latitude: null,
          location_longitude: null,
          location_name: null,
          location_point: null,
          location_region: null,
          chapter: chapter as EventWithDetails['chapter'],
          owner_chapter: chapter as EventWithDetails['owner_chapter'],
          event_chapter: [],
          collaborators: [],
          created_by: null,
          _count: {
            registrations: 0,
            chapters: 0,
          },
        }
      }

      const allEvents = [...((ownedEvents || []) as EventWithChapterViewRow[]), ...collaboratedEvents]
      const uniqueEvents = allEvents.reduce((acc: EventWithChapterViewRow[], event: EventWithChapterViewRow) => {
        if (!acc.find((existing) => existing.id === event.id)) acc.push(event)
        return acc
      }, [])

      return uniqueEvents
        .map(transformEventData)
        .map((event) => ({
          ...event,
          is_owned_by_chapter: event.chapter_id === chapter_id,
        }))
        .filter((e): e is EventWithDetails & { is_owned_by_chapter: boolean } => e !== null)
    } catch (error) {
      logger.error({ context: 'getChapterEvents', error: error }, 'Unexpected error')
      return []
    }
  },

  // ───────────────────────────────────────────────────────────────
  // getAllEventsAdmin
  // ───────────────────────────────────────────────────────────────
  async getAllEventsAdmin(supabase: SupabaseClient<Database>): Promise<EventWithDetails[]> {
    const EVENT_SELECT = `
      id,
      title,
      description,
      cover_image,
      start_at,
      end_at,
      location,
      meeting_url,
      event_type,
      capacity,
      is_published,
      chapter_id,
      created_by_id,
      created_at,
      updated_at,
      access_model,
      application_form_url,
      location_name,
      location_address,
      location_city,
      location_region,
      location_latitude,
      location_longitude,
      owner_chapter:chapter!event_chapter_id_fkey ( id, name, university ),
      collaborators:event_chapter (
        chapter:chapter!event_chapter_chapter_id_fkey ( id, name, university, city, region )
      ),
      created_by:user!event_created_by_id_fkey ( id, name, email ),
      event_registration:event_registration!event_registration_event_id_fkey ( id, status )
    `

    function mapEvent(raw: EventAdminJoinedRow, registeredCount = 0): EventWithDetails | null {
      const owner_chapter = Array.isArray(raw.owner_chapter) ? raw.owner_chapter[0] : raw.owner_chapter
      const createdBy = Array.isArray(raw.created_by) ? raw.created_by[0] : raw.created_by

      const collaborators = (raw.collaborators ?? [])
        .map((collab) => {
          const chapter = Array.isArray(collab.chapter) ? collab.chapter[0] : collab.chapter
          if (!chapter) return null
          return {
            ...collab,
            chapter,
            name: chapter.name,
          }
        })
        .filter((collaborator) => collaborator !== null) as EventWithDetails['collaborators']

      return {
        id: raw.id,
        title: raw.title,
        description: raw.description ?? null,
        cover_image: raw.cover_image ?? null,
        start_at: raw.start_at,
        end_at: raw.end_at,
        location: raw.location ?? null,
        meeting_url: raw.meeting_url ?? null,
        event_type: raw.event_type,
        capacity: raw.capacity ?? null,
        is_published: !!raw.is_published,
        access_model: raw.access_model,
        application_form_url: raw.application_form_url ?? null,
        chapter_id: raw.chapter_id ?? null,
        created_by_id: raw.created_by_id,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        location_address: null,
        location_city: null,
        location_latitude: null,
        location_longitude: null,
        location_name: null,
        location_point: null,
        location_region: null,
        chapter: owner_chapter,
        owner_chapter,
        event_chapter: collaborators as unknown as EventWithDetails['event_chapter'],
        collaborators,
        created_by: createdBy,
        _count: {
          registrations: registeredCount,
          chapters: collaborators.length,
        },
      }
    }

    const { data, error } = await supabase
      .from('event')
      .select(EVENT_SELECT)
      .order('start_at', { ascending: false })

    if (error || !data) {
      logger.error({ context: 'getAllEventsAdmin', error: error }, 'Error')
      return []
    }

    return (data as unknown as EventAdminJoinedRow[])
      .map(event => mapEvent(event, 0))
      .filter((e): e is EventWithDetails => e !== null)
  },

  // ───────────────────────────────────────────────────────────────
  // getEventRegistrations
  // ───────────────────────────────────────────────────────────────
  async getEventRegistrations(
    supabase: SupabaseClient<Database>,
    eventId: string
  ): Promise<RegistrationWithUser[]> {
      const { data, error } = await supabase
        .from('event_registration')
        .select(`
          id,
          event_id,
        user_id,
        registered_at,
        status,
        qr_token,
          checked_in_at,
          checked_in_by_id,
          user:user!event_registration_user_id_fkey (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('event_id', eventId)
        .order('registered_at', { ascending: true })

    if (error || !data) {
      logger.error({ context: 'getEventRegistrations', error: error }, 'Error')
        return []
      }

      const userIds = Array.from(
        new Set(
          (data as Array<{ user_id: string | null }>)
            .map((registration) => registration.user_id)
            .filter((userId): userId is string => Boolean(userId))
        )
      )

      const { data: profiles, error: profilesError } = userIds.length > 0
        ? await supabase
            .from('person_profile')
            .select('user_id, major_or_interest, graduation_year, linkedin_url')
            .in('user_id', userIds)
        : { data: [], error: null }

      if (profilesError) {
        logger.error({ context: 'getEventRegistrations.profiles', error: profilesError }, 'Error')
      }

      const profileByUserId = new Map(
        (profiles ?? []).map((profile) => [profile.user_id, profile])
      )

      function mapRegistration(raw: unknown): RegistrationWithUser | null {
        if (!raw || typeof raw !== 'object') return null
        const r = raw as Record<string, unknown>
        const u = Array.isArray(r.user) ? (r.user as unknown[])[0] : r.user
        const userRecord = u as Record<string, unknown> | null
        const profile = profileByUserId.get(String(r.user_id))
        return {
          id: String(r.id),
          event_id: String(r.event_id),
          user_id: String(r.user_id),
        registered_at: String(r.registered_at),
        status: r.status as RegistrationStatus,
        qr_token: (r.qr_token as string | null) ?? null,
          checked_in_at: (r.checked_in_at as string | null) ?? null,
          checked_in_by_id: (r.checked_in_by_id as string | null) ?? null,
          user: u as RegistrationWithUser['user'],
          person_profile: profile
            ? {
                major_or_interest: profile.major_or_interest,
                graduation_year: profile.graduation_year,
                linkedin_url: profile.linkedin_url,
              }
            : null,
        }
      }

    const registrations = (data as unknown[])
      .map(mapRegistration)
      .filter((r): r is RegistrationWithUser => r !== null)

    const answers = await EventApplicationService.getAnswersForRegistrations(
      supabase,
      registrations.map((registration) => registration.id)
    )

    return registrations.map((registration) => ({
      ...registration,
      application_answers: answers.filter((answer) => answer.registration_id === registration.id),
    }))
  },

  // ───────────────────────────────────────────────────────────────
  // Event collaborators
  // ───────────────────────────────────────────────────────────────
  async addEventCollaborator(
    supabase: SupabaseClient<Database>,
    eventId: string,
    chapter_id: string,
    userId: string
  ): Promise<{ success: true; data?: unknown } | { error: string }> {
    if (!eventId || eventId === 'new') {
      return { error: 'Invalid event id' }
    }

    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, chapter_id')
      .eq('id', eventId)
      .maybeSingle()

    if (eventError || !event) {
      return { error: 'Event not found or access denied' }
    }

    if (chapter_id === event.chapter_id) {
      return { error: 'The owner chapter cannot be added as a collaborator' }
    }

    const { data: existing } = await supabase
      .from('event_chapter')
      .select('id')
      .eq('event_id', eventId)
      .eq('chapter_id', chapter_id)

    if (existing && existing.length > 0) {
      return { error: 'This chapter is already a collaborator' }
    }

    const { data: newEventChapter, error } = await supabase
      .from('event_chapter')
      .insert({
        event_id: eventId,
        chapter_id: chapter_id,
        added_by_id: userId,
      })
      .select(`
        id,
        chapter_id,
        added_at,
        added_by_id,
        chapter:chapter!event_chapter_chapter_id_fkey (id, name, university),
        added_by:user!event_chapter_added_by_id_fkey (id, name, email)
      `)
      .single()

    if (error) {
      return { error: error.message || 'Failed to add collaborator' }
    }

    return { success: true, data: newEventChapter }
  },

  async removeEventCollaborator(
    supabase: SupabaseClient<Database>,
    collaboratorId: string
  ): Promise<{ success: true } | { error: string }> {
    const { error } = await supabase
      .from('event_chapter')
      .delete()
      .eq('id', collaboratorId)

    if (error) {
      return { error: error.message || 'Failed to remove collaborator' }
    }

    return { success: true }
  },

  async getEventCollaborators(
    supabase: SupabaseClient<Database>,
    eventId: string,
    ownerChapterId?: string
  ): Promise<{ success: true; data: unknown[] } | { error: string; data: [] }> {
    const { data: eventChapters, error } = await supabase
      .from('event_chapter')
      .select(`
        id,
        chapter_id,
        added_at,
        added_by_id,
        chapter:chapter!event_chapter_chapter_id_fkey (id, name, university),
        added_by:user!event_chapter_added_by_id_fkey (id, name, email)
      `)
      .eq('event_id', eventId)

    if (error) {
      return { error: error.message || 'Failed to load collaborators', data: [] }
    }

    const collaborators = (eventChapters || []).filter(
      (collab: unknown) => (collab as Record<string, unknown>).chapter_id !== ownerChapterId
    )

    return { success: true, data: collaborators }
  },

  /**
   * Check if a chapter is a collaborator on an event.
   */
  async checkEventCollaboration(
    supabase: SupabaseClient<Database>,
    eventId: string,
    chapterId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('event_chapter')
      .select('id')
      .eq('event_id', eventId)
      .eq('chapter_id', chapterId)
      .maybeSingle()

    if (error) {
      logger.error({ context: 'checkEventCollaboration', error: error }, 'error')
      return false
    }

    return data !== null
  },

  /**
   * Get approved registrations with applicant and event details.
   */
  async getApprovedRegistrations(
    supabase: SupabaseClient<Database>,
    registrationIds: string[]
  ): Promise<
    Array<{
      id: string
      applicant: { email: string; name: string | null } | null
      checked_in_by: { email: string; name: string | null } | null
      event: {
        title: string
        start_at: string
        location: string | null
        meeting_url: string | null
        event_type: string
      } | null
    }>
  > {
    const { data, error } = await supabase
      .from('event_registration')
      .select(`
        id,
        applicant:user!event_registration_user_id_fkey (email, name),
        checked_in_by:user!event_registration_checked_in_by_id_fkey (email, name),
        event:event!event_registration_event_id_fkey (title, start_at, location, meeting_url, event_type)
      `)
      .in('id', registrationIds)
      .eq('status', 'registered')

    if (error || !data) {
      logger.error({ context: 'getApprovedRegistrations', error: error }, 'error')
      return []
    }

    return (data as unknown[]).map((raw) => {
      const r = raw as Record<string, unknown>
      const applicant = Array.isArray(r.applicant) ? (r.applicant as unknown[])[0] : r.applicant
      const checkedInBy = Array.isArray(r.checked_in_by) ? (r.checked_in_by as unknown[])[0] : r.checked_in_by
      const event = Array.isArray(r.event) ? (r.event as unknown[])[0] : r.event

      return {
        id: String(r.id),
        applicant: applicant
          ? {
              email: String((applicant as Record<string, unknown>).email),
              name: ((applicant as Record<string, unknown>).name as string | null) ?? null,
            }
          : null,
        checked_in_by: checkedInBy
          ? {
              email: String((checkedInBy as Record<string, unknown>).email),
              name: ((checkedInBy as Record<string, unknown>).name as string | null) ?? null,
            }
          : null,
        event: event
          ? {
              title: String((event as Record<string, unknown>).title),
              start_at: String((event as Record<string, unknown>).start_at),
              location: ((event as Record<string, unknown>).location as string | null) ?? null,
              meeting_url: ((event as Record<string, unknown>).meeting_url as string | null) ?? null,
              event_type: String((event as Record<string, unknown>).event_type),
            }
          : null,
      }
    })
  },

  /**
   * Get rejected registrations with user and event details.
   */
  async getRejectedRegistrations(
    supabase: SupabaseClient<Database>,
    registrationIds: string[]
  ): Promise<
    Array<{
      id: string
      user: { email: string; name: string | null } | null
      event: {
        title: string
        chapter: { name: string } | null
      } | null
    }>
  > {
    const { data, error } = await supabase
      .from('event_registration')
      .select(`
        id,
        user:user!event_registration_user_id_fkey (email, name),
        event:event!event_registration_event_id_fkey (title, chapter!inner(name))
      `)
      .in('id', registrationIds)
      .eq('status', 'rejected')

    if (error || !data) {
      logger.error({ context: 'getRejectedRegistrations', error: error }, 'error')
      return []
    }

    return (data as unknown[]).map((raw) => {
      const r = raw as Record<string, unknown>
      const user = Array.isArray(r.user) ? (r.user as unknown[])[0] : r.user
      const event = Array.isArray(r.event) ? (r.event as unknown[])[0] : r.event
      const chapter = event
        ? Array.isArray((event as Record<string, unknown>).chapter)
          ? ((event as Record<string, unknown>).chapter as unknown[])[0]
          : (event as Record<string, unknown>).chapter
        : null

      return {
        id: String(r.id),
        user: user
          ? {
              email: String((user as Record<string, unknown>).email),
              name: ((user as Record<string, unknown>).name as string | null) ?? null,
            }
          : null,
        event: event
          ? {
              title: String((event as Record<string, unknown>).title),
              chapter: chapter
                ? {
                    name: String((chapter as Record<string, unknown>).name),
                  }
                : null,
            }
          : null,
      }
    })
  },

  /**
   * Bulk reject event applications.
   */
  async bulkRejectApplications(
    supabase: SupabaseClient<Database>,
    eventId: string,
    applicationIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('event_registration')
      .update({
        status: 'rejected',
        qr_token: undefined,
      })
      .in('id', applicationIds)
      .eq('event_id', eventId)
      .eq('status', 'pending_review')

    if (error) {
      logger.error({ context: 'bulkRejectApplications', error }, 'Failed to reject applications')
      return { success: false, error: 'Failed to reject applications' }
    }

    return { success: true }
  },

  /**
   * Bulk add event collaborators.
   */
  async addEventCollaboratorsBulk(
    supabase: SupabaseClient<Database>,
    eventId: string,
    chapterIds: string[],
    addedById: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!eventId || eventId === 'new' || !chapterIds.length) {
      return { success: false, error: 'Event ID and at least one chapter ID are required' }
    }

    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: 'Event not found' }
    }

    const inserts = chapterIds.map((chapter_id) => ({
      event_id: eventId,
      chapter_id,
      added_by_id: addedById,
    }))

    const { error: insertError } = await supabase.from('event_chapter').insert(inserts)

    if (insertError) {
      logger.error({ context: 'Failed', error: insertError }, 'Failed to add event collaborators')
      return { success: false, error: 'Failed to add collaborators' }
    }

    return { success: true }
  },

  /**
   * Get a user's role from the user table.
   */
  async getUserRole(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('user')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      logger.error({ context: 'getUserRole', error: error }, 'error')
      return null
    }

    return (data?.role as string) ?? null
  },
};
