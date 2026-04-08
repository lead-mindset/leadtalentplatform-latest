'use server'

import { requireAdmin } from '@/lib/auth'

export type AdminEventStatus = 'published' | 'draft' | 'upcoming' | 'past'
export type EventSortKey = 'title' | 'startAt' | 'chapter' | 'status' | 'registrations'
export type SortOrder = 'asc' | 'desc'

export type EventFilters = {
  search?: string
  chapterIds?: string[]
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
  startAt: string
  endAt: string
  isPublished: boolean
  chapterId: string | null
  chapterName: string | null
  registrations: number
  capacity: number | null
}

export type AdminEventsListResponse = {
  items: AdminEventListItem[]
  total: number
  page: number
  pageSize: number
}

function getStatus(row: AdminEventListItem): AdminEventStatus {
  const now = Date.now()
  const ended = new Date(row.endAt).getTime() < now
  if (ended) return 'past'
  if (!row.isPublished) return 'draft'
  if (new Date(row.startAt).getTime() > now) return 'upcoming'
  return 'published'
}

function sortRows(rows: AdminEventListItem[], sortBy: EventSortKey, sortOrder: SortOrder) {
  const direction = sortOrder === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title) * direction
      case 'chapter':
        return (a.chapterName ?? '').localeCompare(b.chapterName ?? '') * direction
      case 'status':
        return getStatus(a).localeCompare(getStatus(b)) * direction
      case 'registrations':
        return (a.registrations - b.registrations) * direction
      case 'startAt':
      default:
        return (new Date(a.startAt).getTime() - new Date(b.startAt).getTime()) * direction
    }
  })
}

export async function getAdminEventsList(
  filters: EventFilters,
  pagination: EventPagination
): Promise<AdminEventsListResponse> {
  const { supabase } = await requireAdmin()

  let query = supabase
    .from('Event')
    .select('id, title, startAt, endAt, isPublished, chapterId, capacity, Chapter(name), EventRegistration(id, status)')

  const search = filters.search?.trim()
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (filters.chapterIds?.length) {
    query = query.in('chapterId', filters.chapterIds)
  }

  const { data, error } = await query
  if (error || !data) {
    console.error('[admin/events] getAdminEventsList error:', error)
    return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
  }

  const rows: AdminEventListItem[] = data.map((row) => {
    const chapter = Array.isArray(row.Chapter) ? row.Chapter[0] : row.Chapter
    const registrations = Array.isArray(row.EventRegistration)
      ? row.EventRegistration.filter((r) => r.status === 'registered').length
      : 0

    return {
      id: row.id,
      title: row.title,
      startAt: row.startAt,
      endAt: row.endAt,
      isPublished: row.isPublished,
      chapterId: row.chapterId,
      chapterName: chapter?.name ?? null,
      registrations,
      capacity: row.capacity,
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
