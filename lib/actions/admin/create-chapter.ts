'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { requireAdmin } from '@/lib/auth'

const ChapterSchema = z.object({
  id: z.string().min(1, "Chapter ID required"),
  name: z.string().min(1, "Chapter name required"),
  university: z.string().min(1, "University required"),
  city: z.string().optional(),
  region: z.string().optional(),
})

export async function createChapter(formData: {
  id: string
  name: string
  university: string
  city?: string
  region?: string
}) {
  const { supabase } = await requireAdmin()

  const parsed = ChapterSchema.safeParse(formData)

  if (!parsed.success) {
    return {
      error: 'Validation failed',
      details: parsed.error.errors,
    }
  }

  const { id, name, university, city, region } = parsed.data

  const { data: existing } = await supabase
    .from('Chapter')
    .select('id')
    .eq('id', id)
    .single()

  if (existing) {
    return { error: 'Chapter ID already exists' }
  }

  const now = new Date().toISOString()

  const { data: chapter, error: insertError } = await supabase
    .from('Chapter')
    .insert({
      id,
      name,
      university,
      city: city || null,
      region: region || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single()

  if (insertError) {
    console.error(insertError)
    return { error: 'Failed to create chapter' }
  }

  revalidatePath('/admin/chapters')

  return {
    success: true,
    chapter,
  }
}

export async function getChapters() {
  const { supabase } = await requireUser()

  const { data: chapters, error } = await supabase
    .from('Chapter')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error(error)
    return { error: 'Failed to fetch chapters' }
  }

  return { chapters }
}