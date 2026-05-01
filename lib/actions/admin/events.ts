'use server'

import { requireAdmin } from '@/lib/auth'
import { AdminService } from '@/lib/services/admin.service'
import {
  type AdminEventListItem,
  type AdminEventStatus,
  type AdminEventsListResponse,
  type EventFilters,
  type EventPagination,
  type EventSortKey,
  type SortOrder,
} from '@/lib/services/admin.service'

export {
  type AdminEventListItem,
  type AdminEventStatus,
  type AdminEventsListResponse,
  type EventFilters,
  type EventPagination,
  type EventSortKey,
  type SortOrder,
}

export async function getAdminEventsList(
  filters: EventFilters,
  pagination: EventPagination
): Promise<AdminEventsListResponse> {
  const { supabase } = await requireAdmin()
  return AdminService.getAdminEventsList(supabase, filters, pagination)
}
