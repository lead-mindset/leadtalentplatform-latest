'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requireUser } from '@/lib/auth'
import { getEditorChapterId } from './get-data'
import type { EventRow, EventType } from '@/lib/types'

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
})

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
        description: data.description ?? null,
        coverImage: data.coverImage || null,
        startAt: data.startAt,
        endAt: data.endAt,
        location: data.location ?? null,
        meetingUrl: data.meetingUrl || null,
        eventType: data.eventType as EventType,
        capacity: data.capacity ?? null,
        isPublished: data.isPublished ?? false,
        chapterId: data.chapterId ?? null,
        createdById: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .select()
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
      description: data.description ?? null,
      coverImage: data.coverImage || null,
      startAt: data.startAt,
      endAt: data.endAt,
      location: data.location ?? null,
      meetingUrl: data.meetingUrl || null,
      eventType: data.eventType as EventType,
      capacity: data.capacity ?? null,
      isPublished: data.isPublished ?? false,
      chapterId,
      createdById: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single<EventRow>()

  if (error || !event) {
    console.error('[createEvent] editor insert error:', error)
    return { error: 'Failed to create event' }
  }

  revalidatePath('/chapter/events')
  return { success: true, event }
}

