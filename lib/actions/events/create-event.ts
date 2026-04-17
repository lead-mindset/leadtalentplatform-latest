'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { requireChapterMember } from '@/lib/auth'
import type { EventRow, EventType } from '@/lib/types'

const EVENT_MUTATION_SELECT =
  'id, title, description, cover_image, start_at, end_at, location, meeting_url, event_type, capacity, is_published, chapter_id, created_by_id, created_at, updated_at, access_model, application_form_url, location_name, location_address, location_city, location_region, location_latitude, location_longitude'

function sanitizeRichTextHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

const EventInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  location: z.string().optional(),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  eventType: z.enum(['in_person', 'online', 'hybrid']),
  capacity: z.coerce.number().int().nonnegative().optional(),
  chapterId: z.string().optional().nullable(),
  isPublished: z.coerce.boolean().optional(),
  accessModel: z.enum(['open', 'application']).default('open'),
  applicationFormUrl: z.string().url().nullable().optional(),
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationRegion: z.string().optional(),
  locationLatitude: z.number().optional().nullable(),
  locationLongitude: z.number().optional().nullable(),
}).refine(
  (data) => {
    if (data.accessModel === 'application') {
      return data.applicationFormUrl && data.applicationFormUrl.trim().length > 0
    }
    return true
  },
  {
    message: 'Application form URL is required for application-gated events',
    path: ['applicationFormUrl'],
  }
).refine(
  (data) => {
    if (data.eventType !== 'in_person') {
      return data.meetingUrl && data.meetingUrl.trim().length > 0
    }
    return true
  },
  {
    message: 'Meeting URL is required for online or hybrid events',
    path: ['meetingUrl'],
  }
).refine(
  (data) => {
    return new Date(data.endAt) > new Date(data.startAt)
  },
  {
    message: 'End time must be after start time',
    path: ['endAt'],
  }
)

export type CreateEventInput = z.infer<typeof EventInputSchema>

export type CreateEventResponse =
  | { success: true; event: EventRow }
  | { error: string }

export async function createEvent(input: CreateEventInput): Promise<CreateEventResponse> {
  const parsed = EventInputSchema.safeParse(input)
  if (!parsed.success) return { error: 'Validation failed' }

  const data = parsed.data

  const { supabase, user } = await requireUser()

  const now = new Date().toISOString()

  if (user.role === 'admin') {
    const { data: event, error } = await supabase
      .from('event')
      .insert({
        title: data.title,
        description: data.description ? sanitizeRichTextHtml(data.description) : null,
        cover_image: data.coverImage || null,
        start_at: data.startAt,
        end_at: data.endAt,
        location: data.location ?? null,
        meeting_url: data.meetingUrl || null,
        event_type: data.eventType as EventType,
        capacity: data.capacity ?? null,
        is_published: data.isPublished ?? false,
        chapter_id: data.chapterId ?? null,
        access_model: data.accessModel,
        application_form_url: data.accessModel === 'application' ? data.applicationFormUrl : null,
        location_name: data.locationName ?? null,
        location_address: data.locationAddress ?? null,
        location_city: data.locationCity ?? null,
        location_region: data.locationRegion ?? null,
        location_latitude: data.locationLatitude ?? null,
        location_longitude: data.locationLongitude ?? null,
        created_by_id: user.id,
        created_at: now,
        updated_at: now,
      })
      .select(EVENT_MUTATION_SELECT)
      .single<EventRow>()

    if (error || !event) {
      console.error('[createEvent] admin insert error:', error)
      return { error: 'Failed to create event' }
    }

    revalidatePath('/admin/events')
    return { success: true, event }
  }

  if (user.role !== 'editor') return { error: 'Insufficient permissions' }

  const { chapterId } = await requireChapterMember()
  if (!chapterId) return { error: 'No chapter assigned' }

  const { data: event, error } = await supabase
    .from('event')
    .insert({
      title: data.title,
      description: data.description ? sanitizeRichTextHtml(data.description) : null,
      cover_image: data.coverImage || null,
      start_at: data.startAt,
      end_at: data.endAt,
      location: data.location ?? null,
      meeting_url: data.meetingUrl || null,
      event_type: data.eventType as EventType,
      capacity: data.capacity ?? null,
      is_published: data.isPublished ?? false,
      chapter_id: chapterId,
      access_model: data.accessModel,
      application_form_url: data.accessModel === 'application' ? data.applicationFormUrl : null,
      location_name: data.locationName ?? null,
      location_address: data.locationAddress ?? null,
      location_city: data.locationCity ?? null,
      location_region: data.locationRegion ?? null,
      location_latitude: data.locationLatitude ?? null,
      location_longitude: data.locationLongitude ?? null,
      created_by_id: user.id,
      created_at: now,
      updated_at: now,
    })
    .select(EVENT_MUTATION_SELECT)
    .single<EventRow>()

  if (error || !event) {
    console.error('[createEvent] editor insert error:', error)
    return { error: 'Failed to create event' }
  }

  revalidatePath('/chapter/events')
  return { success: true, event }
}