'use server'

import { requireAdmin } from '@/lib/auth'

export type AdminEventStatus = 'published' | 'draft' | 'upcoming' | 'past'
export type EventSortKey = 'title' | 'start_at' | 'chapter' | 'status' | 'registrations'
export type SortOrder = 'asc' | 'desc'

export type EventFilters = {
  search?: string
  chapter_ids?: string[]
  statuses?: AdminEventStatus[]
}

export type EventPagination = {
  page: number
  pageSize: 25 | 50 | 100
  sortBy?: EventSortKey
  sortOrder?: SortOrder
}

export type AdminEventListItem = {
  id: string
  title: string
  start_at: string
  end_at: string
  is_published: boolean
  chapter_id: string | null
  chapter_name: string | null
  registrations: number
  capacity: number | null
  chapter?: { id: string; name: string; university: string } | null
  event_chapter?: Array<{
    id: string
    chapter: { id: string; name: string; university: string }
  }>
}

export type AdminEventsListResponse = {
  items: AdminEventListItem[]
  total: number
  page: number
  pageSize: number
}

function getStatus(row: AdminEventListItem): AdminEventStatus {
  const now = Date.now()
  const ended = new Date(row.end_at).getTime() < now
  if (ended) return 'past'
  if (!row.is_published) return 'draft'
  if (new Date(row.start_at).getTime() > now) return 'upcoming'
  return 'published'
}

function sortRows(rows: AdminEventListItem[], sortBy: EventSortKey, sortOrder: SortOrder) {
  const direction = sortOrder === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title) * direction
      case 'chapter':
        return (a.chapter_name ?? '').localeCompare(b.chapter_name ?? '') * direction
      case 'status':
        return getStatus(a).localeCompare(getStatus(b)) * direction
      case 'registrations':
        return (a.registrations - b.registrations) * direction
      case 'start_at':
      default:
        return (new Date(a.start_at).getTime() - new Date(b.start_at).getTime()) * direction
    }
  })
}

export async function getAdminEventsList(
  filters: EventFilters,
  pagination: EventPagination
): Promise<AdminEventsListResponse> {
  const { supabase } = await requireAdmin()

  let query = supabase
    .from('event')
    .select('id, title, start_at, end_at, is_published, chapter_id, capacity, chapter(name, university), event_chapter(id, chapter(name, university)), event_registration(id, status)')

  const search = filters.search?.trim()
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (filters.chapter_ids?.length) {
    query = query.in('chapter_id', filters.chapter_ids)
  }

  const { data, error } = await query
  if (error || !data) {
    console.error('[admin/events] getAdminEventsList error:', error)
    return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
  }

  const rows: AdminEventListItem[] = data.map((row) => {
    const chapter = Array.isArray(row.chapter) ? row.chapter[0] : row.chapter
    const registrations = Array.isArray(row.event_registration)
      ? row.event_registration.filter((r) => r.status === 'registered').length
      : 0

    return {
      id: row.id,
      title: row.title,
      start_at: row.start_at,
      end_at: row.end_at,
      is_published: row.is_published,
      chapter_id: row.chapter_id,
      chapter_name: chapter?.name ?? null,
      registrations,
      capacity: row.capacity,
      chapter: chapter,
      event_chapter: Array.isArray(row.event_chapter) ? row.event_chapter : [],
    }
  })

  const filteredByStatus = rows.filter((row) => {
    if (!filters.statuses?.length) return true
    return filters.statuses.includes(getStatus(row))
  })

  const sortBy = pagination.sortBy ?? 'startAt'
  const sortOrder = pagination.sortOrder ?? 'desc'
  const sorted = sortRows(filteredByStatus, sortBy, sortOrder)
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
