'use server'

import { z } from 'zod'
import { revalidatePath, revalidateTag } from 'next/cache'
import { EventService } from '@/lib/services/event.service'
import { EventApplicationService } from '@/lib/services/event-application.service'
import { PUBLIC_EVENTS_CACHE_TAG } from '@/lib/data/public-events'
import type { EventRow, EventType } from '@/lib/types'
import { assertCanManageEvent } from './access'

const ApplicationQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  questionText: z.string().min(1),
  questionType: z.enum(['short_text', 'long_text', 'single_select', 'checkbox', 'url']),
  options: z.array(z.string()).nullable().optional(),
  isRequired: z.boolean().optional(),
})

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
  applicationQuestions: z.array(ApplicationQuestionSchema).optional(),
  locationName: z.string().nullable().optional(),
  locationAddress: z.string().nullable().optional(),
  locationCity: z.string().nullable().optional(),
  locationRegion: z.string().nullable().optional(),
  locationLatitude: z.number().nullable().optional(),
  locationLongitude: z.number().nullable().optional(),
}).refine(
  (data) => {
    if (data.isPublished === true && data.accessModel === 'application') {
      return Boolean(data.applicationQuestions?.length)
    }
    return true
  },
  {
    message: 'Application events need at least one native question',
    path: ['applicationQuestions'],
  }
).refine(
  (data) => {
    if (data.isPublished === true && data.eventType && data.eventType !== 'in_person') {
      return Boolean(data.meetingUrl?.trim())
    }
    return true
  },
  {
    message: 'Meeting URL is required for online or hybrid events',
    path: ['meetingUrl'],
  }
)

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>

export type UpdateEventResponse =
  | { success: true; event: EventRow }
  | { error: string }

export async function updateEvent(input: UpdateEventInput): Promise<UpdateEventResponse> {
  const parsed = UpdateEventSchema.safeParse(input)
  if (!parsed.success) return { error: 'Validation failed' }

  const access = await assertCanManageEvent(parsed.data.id)
  if ('error' in access) return { error: access.error }
  const { supabase, user, event: existing } = access

  if (user.role !== 'admin' && parsed.data.chapter_id !== undefined && parsed.data.chapter_id !== existing.chapter_id) {
    return { error: 'Chapter users cannot change event chapter' }
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
    application_form_url: null,
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

  if (d.accessModel === 'application') {
    const questionsResult = await EventApplicationService.upsertQuestionsForEvent(supabase, {
      eventId: event.id,
      questions: d.applicationQuestions ?? [],
      requireCompleteQuestions: d.isPublished === true,
    })

    if (!questionsResult.success) return { error: questionsResult.error }
  }

  revalidateTag(PUBLIC_EVENTS_CACHE_TAG, { expire: 0 })
  revalidatePath('/chapter/events')
  revalidatePath(`/chapter/events/${event.id}`)

  return { success: true, event }
}
