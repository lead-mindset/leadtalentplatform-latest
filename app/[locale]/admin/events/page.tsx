import { getChapters } from '@/lib/actions/admin/get-data'
import { getAdminEventsList } from '@/lib/actions/admin/events'
import type { AdminEventStatus, EventSortKey, SortOrder } from '@/lib/services/admin.service'
import { EventsManagementClient } from './events-management-client'
import { PageHeader } from '@/components/ui/page-header'

type PageSearchParams = {
  search?: string
  chapter?: string | string[]
  status?: string | string[]
  page?: string
  pageSize?: string
  sortBy?: string
  sortOrder?: string
}

const PAGE_SIZES = new Set(['25', '50', '100'])
const SORT_COLUMNS = new Set(['title', 'startAt', 'chapter', 'status', 'registrations'])
const STATUS_VALUES = new Set(['published', 'draft', 'upcoming', 'past'])

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  const search = params.search?.trim() ?? ''
  const chapterFilters = toArray(params.chapter)
  const statusFilters = toArray(params.status).filter(
    (status): status is AdminEventStatus => STATUS_VALUES.has(status)
  )
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const pageSize = (PAGE_SIZES.has(String(params.pageSize)) ? Number(params.pageSize) : 25) as 25 | 50 | 100
  const sortBy = (SORT_COLUMNS.has(String(params.sortBy)) ? params.sortBy : 'startAt') as EventSortKey
  const sortOrder = (params.sortOrder === 'asc' ? 'asc' : 'desc') as SortOrder

  const [list, chapters] = await Promise.all([
    getAdminEventsList(
      { search, chapter_ids: chapterFilters, statuses: statusFilters },
      { page, pageSize, sortBy, sortOrder }
    ),
    getChapters(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Events"
        description="Manage chapter-owned and collaborative events with filters, sorting, and quick actions."
      />

      <EventsManagementClient
        items={list.items}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize as 25 | 50 | 100}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
        chapterFilters={chapterFilters}
        statusFilters={statusFilters}
        chapterOptions={chapters.map((chapter: { id: string; name: string }) => ({ id: chapter.id, name: chapter.name }))}
      />
    </div>
  )
}

