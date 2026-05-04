import { CompaniesManagementClient } from './companies-management-client'
import { getCompaniesList } from '@/lib/actions/admin/companies'
import type { CompanySortKey, SortOrder } from '@/lib/services/admin.service'

type PageSearchParams = {
  search?: string
  page?: string
  pageSize?: string
  sortBy?: string
  sortOrder?: string
}

const PAGE_SIZES = new Set(['25', '50', '100'])
const SORT_COLUMNS = new Set(['name', 'createdat', 'active_recruiters', 'pending_invites'])

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  const search = params.search?.trim() ?? ''
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const pageSize = (PAGE_SIZES.has(String(params.pageSize)) ? Number(params.pageSize) : 25) as 25 | 50 | 100
  const sortBy = (SORT_COLUMNS.has(String(params.sortBy)) ? params.sortBy : 'createdat') as CompanySortKey
  const sortOrder = (params.sortOrder === 'asc' ? 'asc' : 'desc') as SortOrder
  const list = await getCompaniesList({ search }, { page, pageSize, sortBy, sortOrder })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Companies Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage companies, company representative access, and invite token generation.
        </p>
      </div>
      <CompaniesManagementClient
        items={list.items}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize as 25 | 50 | 100}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
