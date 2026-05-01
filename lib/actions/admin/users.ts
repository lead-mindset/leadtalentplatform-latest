'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { AdminService } from '@/lib/services/admin.service'
import type { Role } from '@/lib/types'

export async function getUsersList(
  filters: UsersFilters,
  pagination: UsersPagination
): Promise<UsersListResponse> {
  const { supabase } = await requireAdmin()
  return AdminService.getUsersList(supabase, filters, pagination)
}

export async function updateUserRole(userId: string, newRole: Role): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const result = await AdminService.updateUserRole(supabase, userId, newRole)
    if (result.success) {
      revalidatePath('/admin/users')
    }
    return result
  } catch {
    return { success: false, error: 'Unexpected error while updating role.' }
  }
}

export async function deactivateUser(userId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const result = await AdminService.deactivateUser(supabase, userId)
    if (result.success) {
      revalidatePath('/admin/users')
    }
    return result
  } catch {
    return { success: false, error: 'Unexpected error while deactivating user.' }
  }
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const result = await AdminService.reactivateUser(supabase, userId)
    if (result.success) {
      revalidatePath('/admin/users')
    }
    return result
  } catch {
    return { success: false, error: 'Unexpected error while reactivating user.' }
  }
}

export async function bulkUpdateUsers(userIds: string[], action: BulkAction): Promise<ActionResult> {
  if (userIds.length === 0) {
    return { success: false, error: 'No users selected.' }
  }

  try {
    const { supabase } = await requireAdmin()
    const result = await AdminService.bulkUpdateUsers(supabase, userIds, action)
    revalidatePath('/admin/users')
    return result
  } catch {
    return { success: false, error: 'Unexpected error while updating users.' }
  }
}

export async function exportUsersCSV(filters: UsersFilters): Promise<string> {
  const { supabase } = await requireAdmin()
  return AdminService.exportUsersCSV(supabase, filters)
}
