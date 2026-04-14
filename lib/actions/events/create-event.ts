'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { getEditorChapterId } from './get-data'
import type { EventRow, EventType } from '@/lib/types'

const EVENT_MUTATION_SELECT =
  'id, title, description, coverImage, startAt, endAt, location, meetingUrl, eventType, capacity, isPublished, chapterId, createdById, createdAt, updatedAt, accessModel, applicationFormUrl'

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
}).refine(
  (data) => {
    // If accessModel is 'application', applicationFormUrl is required
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
    // For online/hybrid events, meetingUrl is required
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
    // End time must be after start time
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
      .from('Event')
      .insert({
        title: data.title,
        description: data.description ? sanitizeRichTextHtml(data.description) : null,
        coverImage: data.coverImage || null,
        startAt: data.startAt,
        endAt: data.endAt,
        location: data.location ?? null,
        meetingUrl: data.meetingUrl || null,
        eventType: data.eventType as EventType,
        capacity: data.capacity ?? null,
        isPublished: data.isPublished ?? false,
        chapterId: data.chapterId ?? null,
        accessModel: data.accessModel,
        applicationFormUrl: data.accessModel === 'application' ? data.applicationFormUrl : null,
        createdById: user.id,
        createdAt: now,
        updatedAt: now,
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

  const chapterId = await getEditorChapterId()
  if (!chapterId) return { error: 'No chapter assigned' }

  const { data: event, error } = await supabase
    .from('Event')
    .insert({
      title: data.title,
      description: data.description ? sanitizeRichTextHtml(data.description) : null,
      coverImage: data.coverImage || null,
      startAt: data.startAt,
      endAt: data.endAt,
      location: data.location ?? null,
      meetingUrl: data.meetingUrl || null,
      eventType: data.eventType as EventType,
      capacity: data.capacity ?? null,
      isPublished: data.isPublished ?? false,
      chapterId,
      accessModel: data.accessModel,
      applicationFormUrl: data.accessModel === 'application' ? data.applicationFormUrl : null,
      createdById: user.id,
      createdAt: now,
      updatedAt: now,
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

