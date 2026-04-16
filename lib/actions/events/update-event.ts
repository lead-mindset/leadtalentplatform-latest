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
  accessModel: z.enum(['open', 'application']).optional(),
  applicationFormUrl: z.string().url().nullable().optional(),
})

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>

export type UpdateEventResponse =
  | { success: true; event: EventRow }
  | { error: string }

export async function updateEvent(input: UpdateEventInput): Promise<UpdateEventResponse> {
  const parsed = UpdateEventSchema.safeParse(input)
  if (!parsed.success) return { error: 'Validation failed' }

  const { supabase, user } = await requireUser()
  const chapterId = await getEditorChapterId()

  if (!chapterId) {
    return { error: 'No chapter assigned' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('Event')
    .select(EVENT_MUTATION_SELECT)
    .eq('id', parsed.data.id)
    .maybeSingle<EventRow>()

  if (fetchError || !existing) {
    return { error: 'Event not found' }
  }

  const isOwner = existing.chapterId === chapterId

  let isCollaborator = false
  if (!isOwner) {
    const { data: collaboration, error: collabError } = await (supabase as any)
      .from('EventChapter')
      .select('id')
      .eq('eventId', existing.id)
      .eq('chapterId', chapterId)
      .maybeSingle()
    
    isCollaborator = !collabError && collaboration !== null
  }

  if (!isOwner && !isCollaborator) {
    return { error: 'Insufficient permissions' }
  }

  if (user.role === 'editor' && parsed.data.chapterId !== undefined && parsed.data.chapterId !== existing.chapterId) {
    return { error: 'Editors cannot change chapter' }
  }

  const { data: event, error } = await supabase
    .from('Event')
    .update({
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select(EVENT_MUTATION_SELECT)
    .single()

  if (error || !event) {
    return { error: 'Failed to update event' }
  }

  revalidatePath('/chapter/events')
  revalidatePath(`/chapter/events/${event.id}`)

  return { success: true, event }
}

