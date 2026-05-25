'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'
import { AdminService } from '@/lib/services/admin.service'


type ActionResult = { success: true } | { success: false; error: string }

const chapterFormSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  university: z.string().trim().min(1).max(160),
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  editorIds: z.array(z.string().trim().min(1)).optional(),
})

const chapterUpdateSchema = chapterFormSchema.omit({ id: true })

export async function getChaptersList(
  filters: Parameters<typeof AdminService.getChaptersList>[1],
  pagination: Parameters<typeof AdminService.getChaptersList>[2]
) {
  const { supabase } = await requireAdmin()
  return AdminService.getChaptersList(supabase, filters, pagination)
}

export async function getChapterById(id: string) {
  const { supabase } = await requireAdmin()
  return AdminService.getChapterById(supabase, id)
}

export async function createChapter(
  input: z.infer<typeof chapterFormSchema>
): Promise<ActionResult> {
  const parsed = chapterFormSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid chapter ID, name, and university.' }
  }

  const { supabase, user } = await requireAdmin()
  const id = parsed.data.id.trim().toLowerCase().replace(/\s+/g, '-')

  const result = await AdminService.createChapter(supabase, {
    id,
    name: parsed.data.name,
    university: parsed.data.university,
    city: parsed.data.city,
    region: parsed.data.region,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  if (parsed.data.editorIds?.length) {
    for (const userId of parsed.data.editorIds) {
      await AdminService.assignEditor(supabase, userId, id, user.id)
    }
  }

  revalidatePath('/admin/chapters')
  return { success: true }
}

export async function updateChapter(
  id: string,
  input: z.infer<typeof chapterUpdateSchema>
): Promise<ActionResult> {
  const parsed = chapterUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid chapter name and university.' }
  }

  const { supabase } = await requireAdmin()
  const result = await AdminService.updateChapter(supabase, id, {
    name: parsed.data.name,
    university: parsed.data.university,
    city: parsed.data.city,
    region: parsed.data.region,
  })

  if (!result.success) {
    return result
  }

  revalidatePath('/admin/chapters')
  return { success: true }
}

export async function deleteChapter(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const result = await AdminService.deleteChapter(supabase, id)
  if (!result.success) {
    return result
  }

  revalidatePath('/admin/chapters')
  return { success: true }
}

export async function getAvailableEditors(chapter_id: string) {
  const { supabase } = await requireAdmin()
  return AdminService.getAvailableEditors(supabase, chapter_id)
}

export async function getAvailableEditorsByChapterIds(chapter_ids: string[]) {
  const { supabase } = await requireAdmin()
  return AdminService.getAvailableEditorsByChapterIds(supabase, chapter_ids)
}

export async function assignEditor(userId: string, chapter_id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin()
  const result = await AdminService.assignEditor(supabase, userId, chapter_id, user.id)
  if (result.success) {
    revalidatePath('/admin/chapters')
  }
  return result
}

export async function removeEditor(userId: string, chapter_id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const result = await AdminService.removeEditor(supabase, userId, chapter_id)
  if (result.success) {
    revalidatePath('/admin/chapters')
  }
  return result
}

export async function getChapterStats(id: string) {
  const { supabase } = await requireAdmin()
  return AdminService.getChapterStats(supabase, id)
}
