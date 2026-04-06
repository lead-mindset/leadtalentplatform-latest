'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { getEditorChapterId } from './get-data'
import type { EventRow, EventType } from '@/lib/types'

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
  chapterId: z.string().nullable().optional(),
})

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>

export type UpdateEventResponse =
  | { success: true; event: EventRow }
  | { error: string }

export async function updateEvent(input: UpdateEventInput): Promise<UpdateEventResponse> {
  const parsed = UpdateEventSchema.safeParse(input)
  if (!parsed.success) return { error: 'Validation failed' }

  const { supabase, user } = await requireUser()

  const { data: existing, error: fetchError } = await supabase
    .from('Event')
    .select('*')
    .eq('id', parsed.data.id)
    .maybeSingle<EventRow>()

  if (fetchError || !existing) {
    return { error: 'Event not found' }
  }

  if (user.role === 'editor') {
    const chapterId = await getEditorChapterId()
    if (!chapterId) return { error: 'No chapter assigned' }
    if (existing.chapterId !== chapterId) return { error: 'Insufficient permissions' }

    if ('chapterId' in parsed.data && parsed.data.chapterId !== undefined) {
      return { error: 'Editors cannot change chapter' }
    }
  } else if (user.role !== 'admin') {
    return { error: 'Insufficient permissions' }
  }

  const updatedAt = new Date().toISOString()

  const patch: Partial<EventRow> = {
    updatedAt,
  }

  const d = parsed.data
  if (d.title !== undefined) patch.title = d.title
  if (d.description !== undefined) patch.description = d.description
  if (d.coverImage !== undefined) patch.coverImage = d.coverImage
  if (d.startAt !== undefined) patch.startAt = d.startAt
  if (d.endAt !== undefined) patch.endAt = d.endAt
  if (d.location !== undefined) patch.location = d.location
  if (d.meetingUrl !== undefined) patch.meetingUrl = d.meetingUrl
  if (d.eventType !== undefined) patch.eventType = d.eventType as EventType
  if (d.capacity !== undefined) patch.capacity = d.capacity
  if (d.isPublished !== undefined) patch.isPublished = d.isPublished
  if (user.role === 'admin' && d.chapterId !== undefined) patch.chapterId = d.chapterId

  const { data: event, error } = await supabase
    .from('Event')
    .update(patch)
    .eq('id', existing.id)
    .select()
    .single<EventRow>()

  if (error || !event) {
    console.error('[updateEvent] Error:', error)
    return { error: 'Failed to update event' }
  }

  revalidatePath('/events')
  revalidatePath(`/events/${event.id}`)
  revalidatePath('/student/events')
  revalidatePath('/chapter/events')
  revalidatePath('/admin/events')

  return { success: true, event }
}

