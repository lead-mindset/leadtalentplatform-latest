'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EventChapterInsert } from '@/lib/types'

export async function addEventCollaborators(
  eventId: string,
  chapterIds: string[]
) {
  if (!eventId || eventId === 'new' || !chapterIds.length) {
    return { error: 'Event ID and at least one chapter ID are required' }
  }

  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Authentication required' }
  }

  // Validate that the event exists and user has permission
  const { data: event, error: eventError } = await supabase
    .from('Event')
    .select('id')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { error: 'Event not found' }
  }

  // Prepare insert data
  const inserts: EventChapterInsert[] = chapterIds.map(chapterId => ({
    eventId,
    chapterId,
    addedById: user.id,
  }))

  // Insert collaborators
  const { error: insertError } = await supabase
    .from('EventChapter')
    .insert(inserts)

  if (insertError) {
    console.error('Failed to add event collaborators:', insertError)
    return { error: 'Failed to add collaborators' }
  }

  revalidatePath(`/chapter/events/${eventId}`)
  revalidatePath('/chapter/events')
  
  return { success: true }
}
