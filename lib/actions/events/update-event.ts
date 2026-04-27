'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { requireChapterMember } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'
import type { EventRow, EventType } from '@/lib/types'

const EVENT_MUTATION_SELECT =
  'id, title, description, cover_image, start_at, end_at, location, meeting_url, event_type, capacity, is_published, chapter_id, created_by_id, created_at, updated_at, access_model, application_form_url, location_name, location_address, location_city, location_region, location_latitude, location_longitude'

const UpdateEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  location: z.string().nullable().optional(),
  meetingUrl: z.string().url().nullable().optional(),
  eventType: z.enum(['in_person', 'online', 'hybrid']).optional(),
  capacity: z.number().int().nonnegative().nullable().optional(),
  isPublished: z.boolean().optional(),
  chapter_id: z.string().nullable().optional(),
  accessModel: z.enum(['open', 'application']).optional(),
  applicationFormUrl: z.string().url().nullable().optional(),
  locationName: z.string().nullable().optional(),
  locationAddress: z.string().nullable().optional(),
  locationCity: z.string().nullable().optional(),
  locationRegion: z.string().nullable().optional(),
  locationLatitude: z.number().nullable().optional(),
  locationLongitude: z.number().nullable().optional(),
})

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>

export type UpdateEventResponse =
  | { success: true; event: EventRow }
  | { error: string }

export async function updateEvent(input: UpdateEventInput): Promise<UpdateEventResponse> {
  const parsed = UpdateEventSchema.safeParse(input)
  if (!parsed.success) return { error: 'Validation failed' }

  const { supabase, user } = await requireUser()
  const { chapter_id } = await requireChapterMember()

  if (!chapter_id) {
    return { error: 'No chapter assigned' }
  }

  const existing = await EventService.getEventById(supabase, parsed.data.id, EVENT_MUTATION_SELECT)

  if (!existing) {
    return { error: 'Event not found' }
  }

  const isOwner = existing.chapter_id === chapter_id

  let isCollaborator = false
  if (!isOwner) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: collaboration, error: collabError } = await (supabase as any)
      .from('event_chapter')
      .select('id')
      .eq('event_id', existing.id)
      .eq('chapter_id', chapter_id)
      .maybeSingle()
    
    isCollaborator = !collabError && collaboration !== null
  }

  if (!isOwner && !isCollaborator) {
    return { error: 'Insufficient permissions' }
  }

  if (user.role === 'editor' && parsed.data.chapter_id !== undefined && parsed.data.chapter_id !== existing.chapter_id) {
    return { error: 'Editors cannot change chapter' }
  }

  const d = parsed.data
  const event = await EventService.updateEvent(supabase, existing.id, {
    title: d.title,
    description: d.description,
    cover_image: d.coverImage,
    start_at: d.startAt,
    end_at: d.endAt,
    location: d.location,
    meeting_url: d.meetingUrl,
    event_type: d.eventType as EventType,
    capacity: d.capacity,
    is_published: d.isPublished,
    chapter_id: d.chapter_id,
    access_model: d.accessModel,
    application_form_url: d.applicationFormUrl,
    location_name: d.locationName ?? null,
    location_address: d.locationAddress ?? null,
    location_city: d.locationCity ?? null,
    location_region: d.locationRegion ?? null,
    location_latitude: d.locationLatitude ?? null,
    location_longitude: d.locationLongitude ?? null,
    updated_at: new Date().toISOString(),
  })

  if (!event) {
    return { error: 'Failed to update event' }
  }

  revalidatePath('/chapter/events')
  revalidatePath(`/chapter/events/${event.id}`)

  return { success: true, event }
}
