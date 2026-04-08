'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'

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
    .from('Chapter')
    .select('id, name, university, city, region, createdAt, updatedAt')

  const search = filters.search?.trim()
  if (search) {
    query = query.or(`name.ilike.%${search}%,university.ilike.%${search}%`)
  }

  const { data: chapters, error } = await query
  if (error || !chapters) {
    console.error('[admin/chapters] getChaptersList error:', error)
    return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
  }

  const chapterIds = chapters.map((chapter) => chapter.id)
  if (chapterIds.length === 0) {
    return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
  }

  const now = new Date().toISOString()
  const [{ data: profiles }, { data: events }] = await Promise.all([
    supabase
      .from('StudentProfile')
      .select('chapterId, userId, User!StudentProfile_userId_fkey(name, email, role)')
      .in('chapterId', chapterIds),
    supabase
      .from('Event')
      .select('id, chapterId')
      .in('chapterId', chapterIds)
      .eq('isPublished', true)
      .gt('endAt', now),
  ])

  const profileByChapter = new Map<string, (typeof profiles)[number][]>()
  ;(profiles ?? []).forEach((profile) => {
    const list = profileByChapter.get(profile.chapterId) ?? []
    list.push(profile)
    profileByChapter.set(profile.chapterId, list)
  })

  const eventCountByChapter = new Map<string, number>()
  ;(events ?? []).forEach((event) => {
    const current = eventCountByChapter.get(event.chapterId ?? '') ?? 0
    eventCountByChapter.set(event.chapterId ?? '', current + 1)
  })

  const rows: ChapterListItem[] = chapters.map((chapter) => {
    const chapterProfiles = profileByChapter.get(chapter.id) ?? []
    const editors = chapterProfiles
      .filter((profile) => {
        const user = Array.isArray(profile.User) ? profile.User[0] : profile.User
        return user?.role === 'editor'
      })
      .map((profile) => {
        const user = Array.isArray(profile.User) ? profile.User[0] : profile.User
        return {
          id: profile.userId,
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
    .from('Chapter')
    .select('id, name, university, city, region, createdAt, updatedAt')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[admin/chapters] getChapterById error:', error)
    return null
  }
  return data
}

export async function createChapter(input: ChapterFormInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const id = normalizeSlug(input.id)
  if (!id || !input.name.trim() || !input.university.trim()) {
    return { success: false, error: 'Chapter ID, name, and university are required.' }
  }

  const { data: existing } = await supabase.from('Chapter').select('id').eq('id', id).maybeSingle()
  if (existing) {
    return { success: false, error: 'Chapter ID already exists.' }
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('Chapter').insert({
    id,
    name: input.name.trim(),
    university: input.university.trim(),
    city: input.city?.trim() || null,
    region: input.region?.trim() || null,
    createdAt: now,
    updatedAt: now,
  })

  if (error) {
    console.error('[admin/chapters] createChapter error:', error)
    return { success: false, error: 'Failed to create chapter.' }
  }

  if (input.editorIds?.length) {
    for (const userId of input.editorIds) {
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
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('Chapter')
    .update({
      name: input.name.trim(),
      university: input.university.trim(),
      city: input.city?.trim() || null,
      region: input.region?.trim() || null,
      updatedAt: new Date().toISOString(),
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
      .from('StudentProfile')
      .select('*', { count: 'exact', head: true })
      .eq('chapterId', id),
    supabase
      .from('Event')
      .select('*', { count: 'exact', head: true })
      .eq('chapterId', id),
  ])

  if ((membersCount ?? 0) > 0 || (eventsCount ?? 0) > 0) {
    return { success: false, error: 'Chapter cannot be deleted while it has members or events.' }
  }

  const { error } = await supabase.from('Chapter').delete().eq('id', id)
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
    .from('StudentProfile')
    .select('userId, User!StudentProfile_userId_fkey(id, name, email, role)')
    .eq('chapterId', chapterId)

  if (error) {
    console.error('[admin/chapters] getAvailableEditors error:', error)
    return []
  }

  return (data ?? [])
    .map((row) => {
      const user = Array.isArray(row.User) ? row.User[0] : row.User
      if (!user) return null
      if (user.role !== 'member' && user.role !== 'editor') return null
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export async function assignEditor(userId: string, chapterId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const { data: profile } = await supabase
    .from('StudentProfile')
    .select('userId, chapterId')
    .eq('userId', userId)
    .maybeSingle()

  if (!profile || profile.chapterId !== chapterId) {
    return { success: false, error: 'User must be a member of this chapter.' }
  }

  const { error } = await supabase.from('User').update({ role: 'editor' }).eq('id', userId)
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
    .from('StudentProfile')
    .select('userId, chapterId')
    .eq('userId', userId)
    .maybeSingle()

  if (!profile || profile.chapterId !== chapterId) {
    return { success: false, error: 'User does not belong to this chapter.' }
  }

  const { error } = await supabase.from('User').update({ role: 'member' }).eq('id', userId)
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
      .from('StudentProfile')
      .select('*', { count: 'exact', head: true })
      .eq('chapterId', id),
    supabase
      .from('Event')
      .select('*', { count: 'exact', head: true })
      .eq('chapterId', id)
      .eq('isPublished', true)
      .gt('endAt', now),
    supabase
      .from('Event')
      .select('*', { count: 'exact', head: true })
      .eq('chapterId', id),
  ])

  return {
    memberCount: members ?? 0,
    activeEventsCount: publishedActiveEvents ?? 0,
    totalEvents: totalEvents ?? 0,
  }
}
