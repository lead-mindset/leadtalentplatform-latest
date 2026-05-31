import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { logger } from '@/lib/logger'

export const CHAPTER_PERMISSION_KEYS = [
  'chapter.dashboard.access',
  'chapter.members.view_approved',
  'chapter.members.view_alumni',
  'chapter.members.view_member_contact',
  'chapter.members.view_applicants',
  'chapter.members.view_rejected',
  'chapter.members.view_inactive',
  'chapter.members.manage_applications',
  'chapter.members.revoke',
  'chapter.roles.assign_eboard',
  'chapter.events.manage',
  'chapter.events.view_registrations',
  'chapter.events.check_in',
  'chapter.events.archive',
  'chapter.funding.view',
  'chapter.funding.submit',
  'chapter.funding.review',
  'chapter.pulse.view',
  'chapter.pulse.manage_action_plan',
  'chapter.impact_metrics.view',
  'chapter.impact_metrics.edit',
] as const

export type ChapterPermissionKey = (typeof CHAPTER_PERMISSION_KEYS)[number]

export type ChapterRoleLevel =
  | 'president'
  | 'vice_president'
  | 'chief_of_staff'
  | 'director'
  | 'coordinator'
  | 'member'

type ChapterGrantSource = 'role_template' | 'manual_admin' | 'preapproval' | 'chapter_invite' | 'migration'

type PermissionTarget = {
  userId: string
  chapterId: string
}

type PermissionCheckParams = PermissionTarget & {
  permissionKey: ChapterPermissionKey
}

type GrantRoleTemplatePermissionsParams = PermissionTarget & {
  roleLevel: ChapterRoleLevel
  grantedById?: string | null
  source?: ChapterGrantSource
  sourceRoleAssignmentId?: string | null
}

type RevokeChapterPermissionsParams = PermissionTarget & {
  revokedById: string
  revokeReason: string
  permissionKeys?: ChapterPermissionKey[]
  sourceRoleAssignmentId?: string
}

type ActionResult = { success: true } | { success: false; error: string }
type GrantPermissionsResult =
  | { success: true; grantedPermissions: ChapterPermissionKey[] }
  | { success: false; error: string }

const COMMON_EBOARD_PERMISSIONS = [
  'chapter.dashboard.access',
  'chapter.members.view_approved',
  'chapter.members.view_alumni',
  'chapter.members.view_member_contact',
  'chapter.events.manage',
  'chapter.events.view_registrations',
  'chapter.events.check_in',
  'chapter.funding.view',
  'chapter.funding.submit',
] as const satisfies readonly ChapterPermissionKey[]

const CHAPTER_OPERATIONS_PERMISSIONS = [
  'chapter.members.view_applicants',
  'chapter.members.view_rejected',
  'chapter.members.view_inactive',
  'chapter.members.manage_applications',
  'chapter.events.archive',
] as const satisfies readonly ChapterPermissionKey[]

const PRESIDENT_VP_PERMISSIONS = [
  ...COMMON_EBOARD_PERMISSIONS,
  ...CHAPTER_OPERATIONS_PERMISSIONS,
  'chapter.members.revoke',
  'chapter.roles.assign_eboard',
] as const satisfies readonly ChapterPermissionKey[]

const CHIEF_OF_STAFF_PERMISSIONS = [
  ...COMMON_EBOARD_PERMISSIONS,
  ...CHAPTER_OPERATIONS_PERMISSIONS,
] as const satisfies readonly ChapterPermissionKey[]

export const CHAPTER_ROLE_PERMISSION_TEMPLATES = {
  president: PRESIDENT_VP_PERMISSIONS,
  vice_president: PRESIDENT_VP_PERMISSIONS,
  chief_of_staff: CHIEF_OF_STAFF_PERMISSIONS,
  director: COMMON_EBOARD_PERMISSIONS,
  coordinator: COMMON_EBOARD_PERMISSIONS,
  member: [],
} as const satisfies Record<ChapterRoleLevel, readonly ChapterPermissionKey[]>

const CHAPTER_PERMISSION_KEY_SET = new Set<string>(CHAPTER_PERMISSION_KEYS)

function isChapterPermissionKey(value: string): value is ChapterPermissionKey {
  return CHAPTER_PERMISSION_KEY_SET.has(value)
}

function uniquePermissionKeys(keys: readonly ChapterPermissionKey[]): ChapterPermissionKey[] {
  return Array.from(new Set(keys))
}

async function getUserRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('user')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    logger.error({ context: 'chapter-permission/user-role', error, userId }, 'Failed to load user role')
    return null
  }

  return data?.role ?? null
}

async function hasApprovedChapterMembership(
  supabase: SupabaseClient<Database>,
  params: PermissionTarget
): Promise<boolean> {
  const { data, error } = await supabase
    .from('chapter_membership')
    .select('user_id')
    .match({
      user_id: params.userId,
      chapter_id: params.chapterId,
      status: 'approved',
    })
    .maybeSingle()

  if (error) {
    logger.error(
      { context: 'chapter-permission/membership', error, userId: params.userId, chapterId: params.chapterId },
      'Failed to verify approved chapter membership'
    )
    return false
  }

  return Boolean(data)
}

export const ChapterPermissionService = {
  getTemplatePermissions(roleLevel: ChapterRoleLevel): ChapterPermissionKey[] {
    return uniquePermissionKeys(CHAPTER_ROLE_PERMISSION_TEMPLATES[roleLevel])
  },

  async hasChapterPermission(
    supabase: SupabaseClient<Database>,
    params: PermissionCheckParams
  ): Promise<boolean> {
    const role = await getUserRole(supabase, params.userId)
    if (role === 'admin') return true
    if (!role || role === 'recruiter') return false

    const hasMembership = await hasApprovedChapterMembership(supabase, params)
    if (!hasMembership) return false

    const { data, error } = await supabase
      .from('chapter_permission_grant')
      .select('permission_key')
      .match({
        user_id: params.userId,
        chapter_id: params.chapterId,
        permission_key: params.permissionKey,
      })
      .is('revoked_at', null)
      .maybeSingle()

    if (error) {
      logger.error(
        {
          context: 'chapter-permission/check',
          error,
          userId: params.userId,
          chapterId: params.chapterId,
          permissionKey: params.permissionKey,
        },
        'Failed to check chapter permission grant'
      )
      return false
    }

    return Boolean(data)
  },

  async requireChapterPermission(
    supabase: SupabaseClient<Database>,
    params: PermissionCheckParams
  ): Promise<ActionResult> {
    const hasPermission = await this.hasChapterPermission(supabase, params)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to perform this chapter action.' }
    }

    return { success: true }
  },

  async getChapterPermissionSet(
    supabase: SupabaseClient<Database>,
    params: PermissionTarget
  ): Promise<ChapterPermissionKey[]> {
    const role = await getUserRole(supabase, params.userId)
    if (role === 'admin') return [...CHAPTER_PERMISSION_KEYS]
    if (!role || role === 'recruiter') return []

    const hasMembership = await hasApprovedChapterMembership(supabase, params)
    if (!hasMembership) return []

    const { data, error } = await supabase
      .from('chapter_permission_grant')
      .select('permission_key')
      .match({
        user_id: params.userId,
        chapter_id: params.chapterId,
      })
      .is('revoked_at', null)

    if (error) {
      logger.error(
        { context: 'chapter-permission/list', error, userId: params.userId, chapterId: params.chapterId },
        'Failed to list chapter permissions'
      )
      return []
    }

    return uniquePermissionKeys(
      (data ?? [])
        .map((grant) => grant.permission_key)
        .filter(isChapterPermissionKey)
    )
  },

  async grantRoleTemplatePermissions(
    supabase: SupabaseClient<Database>,
    params: GrantRoleTemplatePermissionsParams
  ): Promise<GrantPermissionsResult> {
    const templatePermissions = this.getTemplatePermissions(params.roleLevel)
    if (templatePermissions.length === 0) return { success: true, grantedPermissions: [] }

    const { data: existingGrants, error: existingError } = await supabase
      .from('chapter_permission_grant')
      .select('permission_key')
      .match({
        user_id: params.userId,
        chapter_id: params.chapterId,
      })
      .is('revoked_at', null)
      .in('permission_key', templatePermissions)

    if (existingError) {
      logger.error(
        { context: 'chapter-permission/grant-existing', error: existingError, userId: params.userId },
        'Failed to load existing chapter permission grants'
      )
      return { success: false, error: 'Failed to grant chapter permissions.' }
    }

    const existingPermissions = new Set(
      (existingGrants ?? [])
        .map((grant) => grant.permission_key)
        .filter(isChapterPermissionKey)
    )
    const missingPermissions = templatePermissions.filter((permission) => !existingPermissions.has(permission))

    if (missingPermissions.length === 0) {
      return { success: true, grantedPermissions: [] }
    }

    const now = new Date().toISOString()
    const { error: insertError } = await supabase.from('chapter_permission_grant').insert(
      missingPermissions.map((permissionKey) => ({
        user_id: params.userId,
        chapter_id: params.chapterId,
        permission_key: permissionKey,
        source: params.source ?? 'role_template',
        source_role_assignment_id: params.sourceRoleAssignmentId ?? null,
        granted_by_id: params.grantedById ?? null,
        granted_at: now,
      }))
    )

    if (insertError) {
      logger.error(
        { context: 'chapter-permission/grant-insert', error: insertError, userId: params.userId },
        'Failed to insert chapter permission grants'
      )
      return { success: false, error: 'Failed to grant chapter permissions.' }
    }

    return { success: true, grantedPermissions: missingPermissions }
  },

  async revokeChapterPermissions(
    supabase: SupabaseClient<Database>,
    params: RevokeChapterPermissionsParams
  ): Promise<ActionResult> {
    const reason = params.revokeReason.trim()
    if (!reason) {
      return { success: false, error: 'A revoke reason is required.' }
    }

    if (!params.permissionKeys?.length && !params.sourceRoleAssignmentId) {
      return { success: false, error: 'At least one permission key or source role assignment is required.' }
    }

    let query = supabase
      .from('chapter_permission_grant')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by_id: params.revokedById,
        revoke_reason: reason,
      })
      .match({
        user_id: params.userId,
        chapter_id: params.chapterId,
      })
      .is('revoked_at', null)

    if (params.permissionKeys?.length) {
      query = query.in('permission_key', params.permissionKeys)
    }

    if (params.sourceRoleAssignmentId) {
      query = query.eq('source_role_assignment_id', params.sourceRoleAssignmentId)
    }

    const { error } = await query
    if (error) {
      logger.error(
        { context: 'chapter-permission/revoke', error, userId: params.userId, chapterId: params.chapterId },
        'Failed to revoke chapter permission grants'
      )
      return { success: false, error: 'Failed to revoke chapter permissions.' }
    }

    return { success: true }
  },
}
