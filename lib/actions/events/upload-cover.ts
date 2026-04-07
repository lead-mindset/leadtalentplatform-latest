'use server'

import { requireUser } from '@/lib/auth'

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

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('event-covers')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw new Error('Failed to upload cover image')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('event-covers').getPublicUrl(filePath)

  return { publicUrl }
}
