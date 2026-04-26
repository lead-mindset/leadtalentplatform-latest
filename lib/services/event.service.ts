import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.generated';
import { EventRow, EventType } from '@/lib/types';

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

function sanitizeRichTextHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

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
  chapterId: string | null;
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

export const EventService = {
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
        event_type: params.eventType as EventType,
        capacity: params.capacity ?? null,
        is_published: params.isPublished ?? false,
        chapter_id: params.chapterId,
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
};
