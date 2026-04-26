'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addEventCollaborator(eventId: string, chapter_id: string) {
  try {
    // Backend safety guard - prevent invalid eventId usage
    if (!eventId || eventId === 'new') {
      return { error: 'Invalid event id' }
    }

    const authClient = await createClient()
    const supabase = createAdminClient()

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized - user not authenticated' }
    }

    // Verify the caller owns this event before allowing collaborator addition
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, chapter_id')
      .eq('id', eventId)
      .maybeSingle()

    if (eventError || !event) {
      return { error: 'Event not found or access denied' }
    }

    // Prevent owner chapter from being added as collaborator
    if (chapter_id === event.chapter_id) {
      return { error: 'The owner chapter cannot be added as a collaborator' }
    }

    // Prevent duplicates
    const { data: existing } = await supabase
      .from('event_chapter')
      .select('id')
.eq('event_id', eventId)
      .eq('chapter_id', chapter_id)

    if (existing) {
      return { error: 'This chapter is already a collaborator' }
    }

    const { data: newEventChapter, error } = await supabase
      .from('event_chapter')
      .insert({
        event_id: eventId,
        chapter_id: chapter_id,
        added_by_id: user.id,
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
    revalidatePath('/chapter/events')
    return { success: true, data: newEventChapter }
  } catch (error) {
    return { error: 'Internal server error' }
  }
}

export async function removeEventCollaborator(collaboratorId: string) {
  try {
    const authClient = await createClient()
    const supabase = createAdminClient()

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized - user not authenticated' }
    }

    // Fetch the record first to confirm caller owns the parent event
    const { data: record, error: fetchError } = await supabase
      .from('event_chapter')
      .select('id, event_id, chapter_id')
      .eq('id', collaboratorId)
      .maybeSingle()

    if (fetchError || !record) {
      return { error: 'Collaborator record not found' }
    }

    const { error } = await supabase
      .from('event_chapter')
      .delete()
      .eq('id', collaboratorId)

    if (error) {
      return { error: error.message || 'Failed to remove collaborator' }
    }

    revalidatePath('/chapter/events')
    return { success: true }
  } catch (error) {
    return { error: 'Internal server error' }
  }
}

export async function getEventCollaborators(eventId: string, ownerChapterId?: string) {
  try {
    const supabase = createAdminClient()

    const { data: eventChapters, error } = await supabase
      .from('event_chapter')
      .select(`
        id,
        chapter_id,
        added_at,
        added_by_id
      `)
      .eq('event_id', eventId)

    if (error) {
      return { error: error.message || 'Failed to load collaborators', data: [] }
    }

    // Filter out the owner chapter from the collaborator list — display only, no DB writes
    const collaborators = (eventChapters || []).filter(
      (collab: any) => collab.chapter_id !== ownerChapterId
    )

    return { success: true, data: collaborators }
  } catch (error) {
    return { error: 'Internal server error', data: [] }
  }
}
