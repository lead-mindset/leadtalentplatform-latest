'use server'

import { requireAdmin } from '@/lib/auth'
import { AdminService } from '@/lib/services/admin.service'

export async function getAdminEventsList(
  filters: EventFilters,
  pagination: EventPagination
): Promise<AdminEventsListResponse> {
  const { supabase } = await requireAdmin()
  return AdminService.getAdminEventsList(supabase, filters, pagination)
}
