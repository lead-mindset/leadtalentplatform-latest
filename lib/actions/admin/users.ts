'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import type { ChapterRow, Role, StudentProfileRow, UserRow } from '@/lib/types'

export type ProfileStatusFilter = 'complete' | 'pending_approval' | 'incomplete' | 'no_profile'
export type UserSortKey = 'name' | 'email' | 'role' | 'chapter' | 'createdAt' | 'profileStatus'
export type SortOrder = 'asc' | 'desc'

export type UsersFilters = {
  search?: string
  roles?: Role[]
  chapterIds?: string[]
  approvalStatuses?: ProfileStatusFilter[]
}

export type UsersPagination = {
  page: number
  pageSize: 25 | 50 | 100
  sortBy?: UserSortKey
  sortOrder?: SortOrder
}

export type AdminUserListItem = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  deactivatedAt: string | null
  chapterId: string | null
  chapterName: string | null
  profileStatus: ProfileStatusFilter
}

export type UsersListResponse = {
  items: AdminUserListItem[]
  total: number
  page: number
  pageSize: number
}

type ActionResult = { success: true } | { success: false; error: string }

type BulkAction =
  | { type: 'change_role'; role: Role }
  | { type: 'deactivate' }
  | { type: 'reactivate' }

type AdminUsersProfileRow = Pick<StudentProfileRow, 'userId' | 'chapterId' | 'isFilled' | 'approvalStatus'> & {
  Chapter: Pick<ChapterRow, 'name'> | Pick<ChapterRow, 'name'>[] | null
}

type AdminUsersProfileSummary = {
  chapterId: string | null
  chapterName: string | null
  isFilled: boolean
  approvalStatus: StudentProfileRow['approvalStatus']
}

function toProfileStatus(profile: { isFilled: boolean; approvalStatus: string | null} | null): ProfileStatusFilter {
  if (!profile) return 'no_profile'
  if (!profile.isFilled) return 'incomplete'
  if (profile.approvalStatus === 'pending') return 'pending_approval'
  return 'complete'
}

function csvCell(value: string | null | undefined): string {
  const normalized = value ?? ''
  return `"${normalized.replace(/"/g, '""')}"`
}

async function queryFilteredUsers(filters: UsersFilters): Promise<AdminUserListItem[]> {
  const { supabase } = await requireAdmin()
  let userQuery = supabase.from('User').select('id, name, email, role, createdAt, deactivatedAt')

  const search = filters.search?.trim()
  if (search) {
    const escaped = search.replace(/[%_]/g, '\\$&')
    userQuery = userQuery.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
  }

  if (filters.roles && filters.roles.length > 0) {
    userQuery = userQuery.in('role', filters.roles)
  }

  const { data: users, error: usersError } = await userQuery.order('createdAt', { ascending: false })
  if (usersError || !users) {
    return []
  }

  const typedUsers = users as Pick<UserRow, 'id' | 'name' | 'email' | 'role' | 'createdAt' | 'deactivatedAt'>[]
  const userIds = typedUsers.map((user) => user.id)
  if (userIds.length === 0) return []

  const { data: profiles, error: profilesError } = await supabase
    .from('StudentProfile')
    .select('userId, chapterId, isFilled, approvalStatus, Chapter(name)')
    .in('userId', userIds)

  if (profilesError) {
    return []
  }

  const typedProfiles = (profiles ?? []) as AdminUsersProfileRow[]
  const profileMap = new Map<string, AdminUsersProfileSummary>(
    typedProfiles.map((profile) => [
      profile.userId,
      {
        chapterId: profile.chapterId,
        chapterName: Array.isArray(profile.Chapter) ? profile.Chapter[0]?.name ?? null : profile.Chapter?.name ?? null,
        isFilled: profile.isFilled,
        approvalStatus: profile.approvalStatus,
      },
    ])
  )

  const rows = typedUsers.map<AdminUserListItem>((user) => {
    const profile = profileMap.get(user.id) ?? null
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      createdAt: user.createdAt,
      deactivatedAt: user.deactivatedAt ?? null,
      chapterId: profile?.chapterId ?? null,
      chapterName: profile?.chapterName ?? null,
      profileStatus: toProfileStatus(
        profile
          ? {
              isFilled: profile.isFilled,
              approvalStatus: profile.approvalStatus,
            }
          : null
      ),
    }
  })

  return rows.filter((row) => {
    if (filters.chapterIds && filters.chapterIds.length > 0) {
      if (!row.chapterId || !filters.chapterIds.includes(row.chapterId)) return false
    }

    if (filters.approvalStatuses && filters.approvalStatuses.length > 0) {
      if (!filters.approvalStatuses.includes(row.profileStatus)) return false
    }

    return true
  })
}

function sortRows(items: AdminUserListItem[], sortBy: UserSortKey, sortOrder: SortOrder): AdminUserListItem[] {
  const direction = sortOrder === 'asc' ? 1 : -1
  const sorted = [...items]
  sorted.sort((a, b) => {
    const byString = (left: string, right: string) => left.localeCompare(right) * direction
    const byDate = (left: string, right: string) =>
      (new Date(left).getTime() - new Date(right).getTime()) * direction

    switch (sortBy) {
      case 'name':
        return byString(a.name ?? '', b.name ?? '')
      case 'email':
        return byString(a.email, b.email)
      case 'role':
        return byString(a.role, b.role)
      case 'chapter':
        return byString(a.chapterName ?? '', b.chapterName ?? '')
      case 'profileStatus':
        return byString(a.profileStatus, b.profileStatus)
      case 'createdAt':
      default:
        return byDate(a.createdAt, b.createdAt)
    }
  })
  return sorted
}

export async function getUsersList(
  filters: UsersFilters,
  pagination: UsersPagination
): Promise<UsersListResponse> {
  const rows = await queryFilteredUsers(filters)
  const sortBy = pagination.sortBy ?? 'createdAt'
  const sortOrder = pagination.sortOrder ?? 'desc'
  const sorted = sortRows(rows, sortBy, sortOrder)

  const safePage = Math.max(1, pagination.page)
  const start = (safePage - 1) * pagination.pageSize
  const end = start + pagination.pageSize

  return {
    items: sorted.slice(start, end),
    total: sorted.length,
    page: safePage,
    pageSize: pagination.pageSize,
  }
}

export async function updateUserRole(userId: string, newRole: Role): Promise<ActionResult> {
  try {
    const { supabase, user: adminUser } = await requireAdmin()
    const { error } = await supabase.from('User').update({ role: newRole }).eq('id', userId)
    if (error) {
      return { success: false, error: 'Failed to update user role.' }
    }
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Unexpected error while updating role.' }
  }
}

export async function deactivateUser(userId: string): Promise<ActionResult> {
  try {
    const { supabase, user: adminUser } = await requireAdmin()
    const { error } = await supabase
      .from('User')
      .update({ deactivatedAt: new Date().toISOString() })
      .eq('id', userId)
    if (error) {
      return { success: false, error: 'Failed to deactivate user.' }
    }
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Unexpected error while deactivating user.' }
  }
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  try {
    const { supabase, user: adminUser } = await requireAdmin()
    const { error } = await supabase.from('User').update({ deactivatedAt: null }).eq('id', userId)
    if (error) {
      return { success: false, error: 'Failed to reactivate user.' }
    }
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Unexpected error while reactivating user.' }
  }
}

export async function bulkUpdateUsers(userIds: string[], action: BulkAction): Promise<ActionResult> {
  if (userIds.length === 0) {
    return { success: false, error: 'No users selected.' }
  }

  try {
    const { supabase, user: adminUser } = await requireAdmin()

    if (action.type === 'change_role') {
      const { error } = await supabase.from('User').update({ role: action.role }).in('id', userIds)
      if (error) {
        return { success: false, error: 'Failed to update roles.' }
      }
    } else if (action.type === 'deactivate') {
      const { error } = await supabase
        .from('User')
        .update({ deactivatedAt: new Date().toISOString() })
        .in('id', userIds)
      if (error) {
        return { success: false, error: 'Failed to deactivate users.' }
      }
    } else {
      const { error } = await supabase.from('User').update({ deactivatedAt: null }).in('id', userIds)
      if (error) {
        return { success: false, error: 'Failed to reactivate users.' }
      }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Unexpected error while updating users.' }
  }
}

export async function exportUsersCSV(filters: UsersFilters): Promise<string> {
  const rows = await queryFilteredUsers(filters)
  const header = [
    'Name',
    'Email',
    'Role',
    'Chapter',
    'Join Date',
    'Profile Status',
    'Deactivated At',
  ].join(',')

  const dataRows = rows.map((row) =>
    [
      csvCell(row.name),
      csvCell(row.email),
      csvCell(row.role),
      csvCell(row.chapterName),
      csvCell(new Date(row.createdAt).toISOString()),
      csvCell(row.profileStatus),
      csvCell(row.deactivatedAt),
    ].join(',')
  )

  return [header, ...dataRows].join('\n')
}
