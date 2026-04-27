'use server'

import { requireUser } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'

const MAX_FILE_SIZE = 2 * 1024 * 1024

export async function uploadEventCover(formData: FormData) {
  const { supabase, user } = await requireUser()
  if (user.role !== 'editor' && user.role !== 'admin') {
    throw new Error('Insufficient permissions')
  }

  const file = formData.get('cover') as File | null
  if (!file) throw new Error('Cover image file is required')
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed')
  if (file.size > MAX_FILE_SIZE) throw new Error('Cover image must be 2MB or smaller')

  const result = await EventService.uploadEventCover(supabase, user.id, file)
  return result
}
