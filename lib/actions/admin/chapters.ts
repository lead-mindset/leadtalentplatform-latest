'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'
import type { ChapterRow, EventRow, StudentProfileRow, UserRow } from '@/lib/types'

export type ChapterSortKey =
  | 'name'
  | 'university'
  | 'city'
  | 'region'
  | 'memberCount'
  | 'activeEventsCount'

export type SortOrder = 'asc' | 'desc'

export type ChaptersFilters = {
  search?: string
}

export type ChaptersPagination = {
  page: number
  pageSize: 25 | 50 | 100
  sortBy?: ChapterSortKey
  sortOrder?: SortOrder
}

export type ChapterListItem = {
  id: string
  name: string
  university: string
  city: string | null
  region: string | null
  memberCount: number
  activeEventsCount: number
  editors: { id: string; name: string; email: string }[]
}

export type ChaptersListResponse = {
  items: ChapterListItem[]
  total: number
  page: number
  pageSize: number
}

export type ChapterFormInput = {
  id: string
  name: string
  university: string
  city?: string
  region?: string
  editorIds?: string[]
}

type ActionResult = { success: true } | { success: false; error: string }

type ChapterListRow = Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region'>
type ChapterProfileRow = Pick<StudentProfileRow, 'chapter_id' | 'user_id'> & {
  User:
    | Pick<UserRow, 'name' | 'email' | 'role'>
    | Pick<UserRow, 'name' | 'email' | 'role'>[]
    | null
}
type ChapterEventRow = Pick<EventRow, 'id' | 'chapter_id'>
type AvailableEditorRow = Pick<StudentProfileRow, 'user_id'> & {
  User:
    | Pick<UserRow, 'id' | 'name' | 'email' | 'role'>
    | Pick<UserRow, 'id' | 'name' | 'email' | 'role'>[]
    | null
}

const chapterFormSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  university: z.string().trim().min(1).max(160),
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  editorIds: z.array(z.string().trim().min(1)).optional(),
})

const chapterUpdateSchema = chapterFormSchema.omit({ id: true })

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function sortRows(items: ChapterListItem[], sortBy: ChapterSortKey, sortOrder: SortOrder): ChapterListItem[] {
  const direction = sortOrder === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * direction
      case 'university':
        return a.university.localeCompare(b.university) * direction
      case 'city':
        return (a.city ?? '').localeCompare(b.city ?? '') * direction
      case 'region':
        return (a.region ?? '').localeCompare(b.region ?? '') * direction
      case 'memberCount':
        return (a.memberCount - b.memberCount) * direction
      case 'activeEventsCount':
        return (a.activeEventsCount - b.activeEventsCount) * direction
      default:
        return a.name.localeCompare(b.name) * direction
    }
  })
}

export async function getChaptersList(
  filters: ChaptersFilters,
  pagination: ChaptersPagination
): Promise<ChaptersListResponse> {
  const { supabase } = await requireAdmin()

  let query = supabase
    .from('chapter')
    .select('id, name, university, city, region, created_at, updated_at')

  const search = filters.search?.trim()
  if (search) {
    query = query.or(`name.ilike.%${search}%,university.ilike.%${search}%`)
  }

  const { data: chapters, error } = await query
  if (error || !chapters) {
    console.error('[admin/chapters] getChaptersList error:', error)
    return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
  }

  const chapterRows = chapters as ChapterListRow[]
  const chapterIds = chapterRows.map((chapter: ChapterListRow) => chapter.id)
  if (chapterIds.length === 0) {
    return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
  }

  const now = new Date().toISOString()
  const [{ data: profiles }, { data: events }] = await Promise.all([
    supabase
      .from('student_profile')
      .select('chapter_id, user_id, User!StudentProfile_userId_fkey(name, email, role)')
      .in('chapter_id', chapterIds),
    supabase
      .from('event')
      .select('id, chapter_id')
      .in('chapter_id', chapterIds)
      .eq('is_published', true)
      .gt('end_at', now),
  ])

  const profileRows = (profiles ?? []) as ChapterProfileRow[]
  const eventRows = (events ?? []) as ChapterEventRow[]

const profileByChapter = new Map<string, ChapterProfileRow[]>()
  profileRows.forEach((profile: ChapterProfileRow) => {
    const list = profileByChapter.get(profile.chapter_id) ?? []
    list.push(profile)
    profileByChapter.set(profile.chapter_id, list)
  })

  const eventCountByChapter = new Map<string, number>()
  eventRows.forEach((event: ChapterEventRow) => {
    const current = eventCountByChapter.get(event.chapter_id ?? '') ?? 0
    eventCountByChapter.set(event.chapter_id ?? '', current + 1)
  })

  const rows: ChapterListItem[] = chapterRows.map((chapter: ChapterListRow) => {
    const chapterProfiles = profileByChapter.get(chapter.id) ?? []
    const editors = chapterProfiles
      .filter((profile: ChapterProfileRow) => {
        const user = Array.isArray(profile.User) ? profile.User[0] : profile.User
        return user?.role === 'editor'
      })
.map((profile: ChapterProfileRow) => {
        const user = Array.isArray(profile.User) ? profile.User[0] : profile.User
        return {
          id: profile.user_id,
          name: user?.name ?? 'Unknown',
          email: user?.email ?? 'unknown@example.com',
        }
      })

    return {
      id: chapter.id,
      name: chapter.name,
      university: chapter.university,
      city: chapter.city,
      region: chapter.region,
      memberCount: chapterProfiles.length,
      activeEventsCount: eventCountByChapter.get(chapter.id) ?? 0,
      editors,
    }
  })

  const sortBy = pagination.sortBy ?? 'name'
  const sortOrder = pagination.sortOrder ?? 'asc'
  const sorted = sortRows(rows, sortBy, sortOrder)
  const page = Math.max(1, pagination.page)
  const start = (page - 1) * pagination.pageSize
  const end = start + pagination.pageSize

  return {
    items: sorted.slice(start, end),
    total: sorted.length,
    page,
    pageSize: pagination.pageSize,
  }
}

export async function getChapterById(id: string) {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('chapter')
    .select('id, name, university, city, region, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[admin/chapters] getChapterById error:', error)
    return null
  }
  return data
}

export async function createChapter(input: ChapterFormInput): Promise<ActionResult> {
  const parsed = chapterFormSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid chapter ID, name, and university.' }
  }

  const { supabase } = await requireAdmin()
  const id = normalizeSlug(parsed.data.id)

  const { data: existing, error: existingError } = await supabase
    .from('chapter')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (existingError) {
    return { success: false, error: 'Failed to validate chapter ID.' }
  }

  if (existing) {
    return { success: false, error: 'Chapter ID already exists.' }
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('chapter').insert({
    id,
    name: parsed.data.name,
    university: parsed.data.university,
    city: parsed.data.city || null,
    region: parsed.data.region || null,
created_at: now,
      updated_at: now,
  })

  if (error) {
    console.error('[admin/chapters] createChapter error:', error)
    return { success: false, error: 'Failed to create chapter.' }
  }

  if (parsed.data.editorIds?.length) {
    for (const userId of parsed.data.editorIds) {
      const _ = await assignEditor(userId, id)
      void _
    }
  }

  revalidatePath('/admin/chapters')
  return { success: true }
}

export async function updateChapter(
  id: string,
  input: Omit<ChapterFormInput, 'id'>
): Promise<ActionResult> {
  const parsed = chapterUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid chapter name and university.' }
  }

  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('chapter')
.update({
      name: parsed.data.name,
      university: parsed.data.university,
      city: parsed.data.city || null,
      region: parsed.data.region || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/chapters] updateChapter error:', error)
    return { success: false, error: 'Failed to update chapter.' }
  }

  revalidatePath('/admin/chapters')
  return { success: true }
}

export async function deleteChapter(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

const [{ count: membersCount }, { count: eventsCount }] = await Promise.all([
    supabase
      .from('student_profile')
      .select('user_id', { count: 'exact', head: true })
      .eq('chapter_id', id),
    supabase
      .from('event')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', id),
  ])

  if ((membersCount ?? 0) > 0 || (eventsCount ?? 0) > 0) {
    return { success: false, error: 'Chapter cannot be deleted while it has members or events.' }
  }

  const { error } = await supabase.from('chapter').delete().eq('id', id)
  if (error) {
    console.error('[admin/chapters] deleteChapter error:', error)
    return { success: false, error: 'Failed to delete chapter.' }
  }

  revalidatePath('/admin/chapters')
  return { success: true }
}

export async function getAvailableEditors(chapterId: string) {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('student_profile')
    .select('user_id, User!StudentProfile_userId_fkey(id, name, email, role)')
    .eq('chapter_id', chapterId)

  if (error) {
    console.error('[admin/chapters] getAvailableEditors error:', error)
    return []
  }

  return ((data ?? []) as AvailableEditorRow[])
    .map((row: AvailableEditorRow) => {
      const user = Array.isArray(row.User) ? row.User[0] : row.User
      if (!user) return null
      if (user.role !== 'member' && user.role !== 'editor') return null
      return {
        id: user.id,
        name: user.name ?? 'Unknown',
        email: user.email,
        role: user.role,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export async function assignEditor(userId: string, chapterId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const { data: profile } = await supabase
    .from('student_profile')
    .select('user_id, chapter_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile || profile.chapter_id !== chapterId) {
    return { success: false, error: 'User must be a member of this chapter.' }
  }

  const { error } = await supabase.from('user').update({ role: 'editor' }).eq('id', userId)
  if (error) {
    console.error('[admin/chapters] assignEditor error:', error)
    return { success: false, error: 'Failed to assign editor.' }
  }

  revalidatePath('/admin/chapters')
  return { success: true }
}

export async function removeEditor(userId: string, chapterId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const { data: profile } = await supabase
    .from('student_profile')
    .select('user_id, chapter_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile || profile.chapter_id !== chapterId) {
    return { success: false, error: 'User does not belong to this chapter.' }
  }

  const { error } = await supabase.from('user').update({ role: 'member' }).eq('id', userId)
  if (error) {
    console.error('[admin/chapters] removeEditor error:', error)
    return { success: false, error: 'Failed to remove editor.' }
  }

  revalidatePath('/admin/chapters')
  return { success: true }
}

export async function getChapterStats(id: string) {
  const { supabase } = await requireAdmin()
  const now = new Date().toISOString()
const [{ count: members }, { count: publishedActiveEvents }, { count: totalEvents }] = await Promise.all([
    supabase
      .from('student_profile')
      .select('user_id', { count: 'exact', head: true })
      .eq('chapter_id', id),
    supabase
      .from('event')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', id)
      .eq('is_published', true)
      .gt('end_at', now),
    supabase
      .from('event')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', id),
  ])

  return {
    memberCount: members ?? 0,
    activeEventsCount: publishedActiveEvents ?? 0,
    totalEvents: totalEvents ?? 0,
  }
}
