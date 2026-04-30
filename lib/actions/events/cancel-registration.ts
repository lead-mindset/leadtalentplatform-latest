'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'

export async function cancelRegistration(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()

  const registrationId = String(formData.get('registrationId') ?? '')
  if (!registrationId) return

  const result = await EventService.cancelRegistration(supabase, registrationId, user.id)
  if (!result.success) {
    console.error('[cancelRegistration] Error:', result.error)
    return
  }

  revalidatePath('/student/events')
  revalidatePath('/events')
  revalidatePath(`/events/${formData.get('eventId')}`)
}
