import { getChapters } from '@/lib/actions/admin/get-data'
import { getUsersList } from '@/lib/actions/admin/users'
import type { ProfileStatusFilter } from '@/lib/services/admin.service'
import type { Role } from '@/lib/types'
import { UsersManagementClient } from './users-management-client'
import { PageHeader } from '@/components/ui/page-header'

type PageSearchParams = {
  search?: string
  role?: string | string[]
  chapter?: string | string[]
  approval?: string | string[]
  page?: string
  pageSize?: string
}

const PAGE_SIZES = new Set(['25', '50', '100'])
const ROLE_VALUES = new Set(['admin', 'editor', 'member', 'recruiter'])
const APPROVAL_VALUES = new Set(['complete', 'pending_approval', 'incomplete', 'no_profile'])

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  const search = params.search?.trim() ?? ''
  const roleFilters = toArray(params.role).filter((role): role is Role => ROLE_VALUES.has(role))
  const chapterFilters = toArray(params.chapter)
  const approvalFilters = toArray(params.approval).filter(
    (status): status is ProfileStatusFilter => APPROVAL_VALUES.has(status)
  )

  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const pageSize = (PAGE_SIZES.has(String(params.pageSize)) ? Number(params.pageSize) : 25) as 25 | 50 | 100

  const [{ items, total }, chapters] = await Promise.all([
    getUsersList(
      {
        search,
        roles: roleFilters,
        chapter_ids: chapterFilters,
        chapter_statuses: approvalFilters,
      },
      { page, pageSize, sortBy: 'created_at', sortOrder: 'desc' }
    ),
    getChapters(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administracion"
        title="Gestion de usuarios"
        description="Busca, filtra, actualiza roles, desactiva usuarios y exporta resultados filtrados."
      />

      <UsersManagementClient
        users={items}
        total={total}
        page={page}
        pageSize={pageSize}
        roleFilters={roleFilters}
        chapterFilters={chapterFilters}
        approvalFilters={approvalFilters}
        search={search}
        chapterOptions={chapters.map((chapter: { id: string; name: string }) => ({
          id: chapter.id,
          name: chapter.name,
        }))}
      />
    </div>
  )
}
