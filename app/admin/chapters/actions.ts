'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ChapterSchema = z.object({
  id: z.string().min(1, "Chapter ID required"),
  name: z.string().min(1, "Chapter name required"),
  university: z.string().min(1, "University required"),
  city: z.string().optional(),
  region: z.string().optional(),
})

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error("Unauthorized")
  }

  const { data: dbUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbUser?.role !== 'admin') {
    throw new Error("Forbidden")
  }

  return user
}

export async function createChapter(formData: {
  id: string
  name: string
  university: string
  city?: string
  region?: string
}) {
  const supabase = await createClient()

  try {
    await requireAdmin(supabase)

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
      return {
        error: 'Chapter ID already exists',
      }
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
      console.error('Failed to create chapter:', insertError)
      return {
        error: 'Failed to create chapter',
      }
    }

    revalidatePath('/admin/chapters')
    
    return {
      success: true,
      chapter,
    }

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return { error: 'Unauthorized' }
      }
      if (error.message === "Forbidden") {
        return { error: 'Admin access required' }
      }
    }

    console.error('Unexpected error:', error)
    return {
      error: 'Internal server error',
    }
  }
}

export async function getChapters() {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    const { data: chapters, error } = await supabase
      .from('Chapter')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch chapters:', error)
      return { error: 'Failed to fetch chapters' }
    }

    return { chapters }

  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'Internal server error' }
  }
}