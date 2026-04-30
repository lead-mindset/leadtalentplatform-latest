import { ChaptersManagementClient } from './chapters-management-client'
import {
  getAvailableEditors,
  getChaptersList,
  type ChapterSortKey,
  type SortOrder,
} from '@/lib/actions/admin/chapters'

type PageSearchParams = {
  search?: string
  page?: string
  pageSize?: string
  sortBy?: string
  sortOrder?: string
}

const PAGE_SIZES = new Set(['25', '50', '100'])
const SORT_COLUMNS = new Set(['name', 'university', 'city', 'region', 'member_count', 'active_events_count'])

export default async function AdminChaptersPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  const search = params.search?.trim() ?? ''
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const pageSize = (PAGE_SIZES.has(String(params.pageSize)) ? Number(params.pageSize) : 25) as 25 | 50 | 100
  const sortBy = (SORT_COLUMNS.has(String(params.sortBy)) ? params.sortBy : 'name') as ChapterSortKey
  const sortOrder = (params.sortOrder === 'desc' ? 'desc' : 'asc') as SortOrder

  const list = await getChaptersList({ search }, { page, pageSize, sortBy, sortOrder })
  const availableEditorsEntries = await Promise.all(
    list.items.map(async (chapter) => [chapter.id, await getAvailableEditors(chapter.id)] as const)
  )
  const availableEditorsByChapter = Object.fromEntries(availableEditorsEntries)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Chapters Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage chapter metadata, editor assignments, and safe deletion checks.
        </p>
      </div>
      <ChaptersManagementClient
        items={list.items}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize as 25 | 50 | 100}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
        availableEditorsByChapter={availableEditorsByChapter}
      />
    </div>
  )
}