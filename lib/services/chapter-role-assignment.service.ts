import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { logger } from '@/lib/logger'
import {
  ChapterPermissionService,
  type ChapterPermissionKey,
  type ChapterRoleLevel,
} from '@/lib/services/chapter-permission.service'

export type AssignableChapterRoleLevel = Exclude<ChapterRoleLevel, 'member'>

export type ChapterFunctionalArea =
  | 'general_leadership'
  | 'strategy_operations'
  | 'marketing_communications'
  | 'events_experience'
  | 'finance_legal'
  | 'chapter_development'
  | 'academic_excellence'
  | 'professional_development'
  | 'leadership'
  | 'women_in_stem'
  | 'research'
  | 'projects'
  | 'partnerships_external_relations'
  | 'people_talent'
  | 'other'

type AssignChapterRoleParams = {
  actorUserId: string
  targetUserId: string
  chapterId: string
  roleLevel: AssignableChapterRoleLevel
  functionalArea: ChapterFunctionalArea
  displayTitle: string
  rawTitle?: string | null
}

type DeactivateChapterRoleParams = {
  actorUserId: string
  roleAssignmentId: string
  revokeReason: string
}

type AssignmentAuthResult =
  | { success: true; isAdmin: boolean }
  | { success: false; error: string }

type AssignmentResult =
  | { success: true; roleAssignmentId: string; grantedPermissions: ChapterPermissionKey[] }
  | { success: false; error: string }

type ActionResult = { success: true } | { success: false; error: string }

type ActiveRoleAssignmentRow = Pick<
  Database['public']['Tables']['chapter_role_assignment']['Row'],
  'chapter_id' | 'id' | 'role_level' | 'status' | 'user_id'
>

const PROTECTED_ROLE_LEVELS = new Set<AssignableChapterRoleLevel>(['president', 'vice_president'])
const REGULAR_EBOARD_ROLE_LEVELS = new Set<AssignableChapterRoleLevel>([
  'chief_of_staff',
  'director',
  'coordinator',
])

function isProtectedRole(roleLevel: AssignableChapterRoleLevel): boolean {
  return PROTECTED_ROLE_LEVELS.has(roleLevel)
}

function isRegularEboardRole(roleLevel: AssignableChapterRoleLevel): boolean {
  return REGULAR_EBOARD_ROLE_LEVELS.has(roleLevel)
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
    logger.error({ context: 'chapter-role-assignment/user-role', error, userId }, 'Failed to load user role')
    return null
  }

  return data?.role ?? null
}

async function authorizeAssignment(
  supabase: SupabaseClient<Database>,
  params: Pick<AssignChapterRoleParams, 'actorUserId' | 'chapterId' | 'roleLevel'>
): Promise<AssignmentAuthResult> {
  const actorRole = await getUserRole(supabase, params.actorUserId)
  if (actorRole === 'admin') return { success: true, isAdmin: true }

  if (isProtectedRole(params.roleLevel)) {
    return { success: false, error: 'Only admins can assign president or vice president roles.' }
  }

  if (!isRegularEboardRole(params.roleLevel)) {
    return { success: false, error: 'Only official e-board roles can be assigned.' }
  }

  const canAssignEboard = await ChapterPermissionService.hasChapterPermission(supabase, {
    userId: params.actorUserId,
    chapterId: params.chapterId,
    permissionKey: 'chapter.roles.assign_eboard',
  })

  if (!canAssignEboard) {
    return { success: false, error: 'You do not have permission to assign e-board roles for this chapter.' }
  }

  return { success: true, isAdmin: false }
}

async function authorizeDeactivation(
  supabase: SupabaseClient<Database>,
  params: {
    actorUserId: string
    chapterId: string
    roleLevel: AssignableChapterRoleLevel
  }
): Promise<AssignmentAuthResult> {
  const actorRole = await getUserRole(supabase, params.actorUserId)
  if (actorRole === 'admin') return { success: true, isAdmin: true }

  if (isProtectedRole(params.roleLevel)) {
    return { success: false, error: 'Only admins can deactivate president or vice president roles.' }
  }

  const canAssignEboard = await ChapterPermissionService.hasChapterPermission(supabase, {
    userId: params.actorUserId,
    chapterId: params.chapterId,
    permissionKey: 'chapter.roles.assign_eboard',
  })

  if (!canAssignEboard) {
    return { success: false, error: 'You do not have permission to deactivate e-board roles for this chapter.' }
  }

  return { success: true, isAdmin: false }
}

async function hasApprovedMembership(
  supabase: SupabaseClient<Database>,
  params: { userId: string; chapterId: string }
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
      { context: 'chapter-role-assignment/membership', error, userId: params.userId, chapterId: params.chapterId },
      'Failed to verify approved membership'
    )
    return false
  }

  return Boolean(data)
}

async function deactivateExistingPrimaryRole(
  supabase: SupabaseClient<Database>,
  params: { targetUserId: string; chapterId: string; actorUserId: string; now: string }
): Promise<ActionResult> {
  const { data: existingPrimary, error: existingError } = await supabase
    .from('chapter_role_assignment')
    .select('id, role_level')
    .match({
      user_id: params.targetUserId,
      chapter_id: params.chapterId,
      status: 'active',
    })
    .eq('is_primary', true)
    .maybeSingle()

  if (existingError) {
    logger.error(
      { context: 'chapter-role-assignment/existing-primary', error: existingError, userId: params.targetUserId },
      'Failed to load existing primary role'
    )
    return { success: false, error: 'Failed to assign chapter role.' }
  }

  if (!existingPrimary) return { success: true }

  const { error } = await supabase
    .from('chapter_role_assignment')
    .update({
      status: 'inactive',
      ends_at: params.now,
      updated_at: params.now,
    })
    .eq('id', existingPrimary.id)
    .eq('status', 'active')

  if (error) {
    logger.error(
      { context: 'chapter-role-assignment/deactivate-primary', error, userId: params.targetUserId },
      'Failed to deactivate existing primary role'
    )
    return { success: false, error: 'Failed to assign chapter role.' }
  }

  return { success: true }
}

async function writeRoleAssignmentAudit(
  supabase: SupabaseClient<Database>,
  params: {
    action: 'chapter.role.assigned' | 'chapter.role.deactivated'
    actorUserId: string
    targetUserId: string
    chapterId: string
    roleAssignmentId: string
    metadata: Record<string, string | boolean | null>
  }
): Promise<void> {
  const { error } = await supabase.from('chapter_audit_log').insert({
    action: params.action,
    actor_user_id: params.actorUserId,
    target_user_id: params.targetUserId,
    chapter_id: params.chapterId,
    entity_type: 'chapter_role_assignment',
    entity_id: params.roleAssignmentId,
    metadata: params.metadata,
  })

  if (error) {
    logger.error(
      { context: 'chapter-role-assignment/audit', error, roleAssignmentId: params.roleAssignmentId },
      'Failed to write role assignment audit log'
    )
  }
}

export const ChapterRoleAssignmentService = {
  async assignChapterRole(
    supabase: SupabaseClient<Database>,
    params: AssignChapterRoleParams
  ): Promise<AssignmentResult> {
    const displayTitle = params.displayTitle.trim()
    if (!displayTitle) {
      return { success: false, error: 'Display title is required.' }
    }

    const auth = await authorizeAssignment(supabase, params)
    if (!auth.success) return auth

    const targetHasMembership = await hasApprovedMembership(supabase, {
      userId: params.targetUserId,
      chapterId: params.chapterId,
    })

    if (!targetHasMembership) {
      return { success: false, error: 'Target user must be an approved member of this chapter.' }
    }

    const now = new Date().toISOString()
    const deactivateResult = await deactivateExistingPrimaryRole(supabase, {
      targetUserId: params.targetUserId,
      chapterId: params.chapterId,
      actorUserId: params.actorUserId,
      now,
    })

    if (!deactivateResult.success) return deactivateResult

    const { data: createdRole, error: insertError } = await supabase
      .from('chapter_role_assignment')
      .insert({
        user_id: params.targetUserId,
        chapter_id: params.chapterId,
        role_level: params.roleLevel,
        functional_area: params.functionalArea,
        display_title: displayTitle,
        raw_title: params.rawTitle ?? null,
        is_primary: true,
        status: 'active',
        assigned_by_id: params.actorUserId,
        source: auth.isAdmin ? 'manual_admin' : 'manual',
        source_preapproval_id: null,
        starts_at: now,
        updated_at: now,
      })
      .select('id')
      .single()

    if (insertError || !createdRole) {
      logger.error(
        { context: 'chapter-role-assignment/insert', error: insertError, userId: params.targetUserId },
        'Failed to insert role assignment'
      )
      return { success: false, error: 'Failed to assign chapter role.' }
    }

    const grantResult = await ChapterPermissionService.grantRoleTemplatePermissions(supabase, {
      userId: params.targetUserId,
      chapterId: params.chapterId,
      roleLevel: params.roleLevel,
      grantedById: params.actorUserId,
      source: 'role_template',
      sourceRoleAssignmentId: createdRole.id,
    })

    if (!grantResult.success) return grantResult

    await writeRoleAssignmentAudit(supabase, {
      action: 'chapter.role.assigned',
      actorUserId: params.actorUserId,
      targetUserId: params.targetUserId,
      chapterId: params.chapterId,
      roleAssignmentId: createdRole.id,
      metadata: {
        role_level: params.roleLevel,
        functional_area: params.functionalArea,
        display_title: displayTitle,
        raw_title: params.rawTitle ?? null,
        source: auth.isAdmin ? 'manual_admin' : 'manual',
      },
    })

    return {
      success: true,
      roleAssignmentId: createdRole.id,
      grantedPermissions: grantResult.grantedPermissions,
    }
  },

  async deactivateChapterRole(
    supabase: SupabaseClient<Database>,
    params: DeactivateChapterRoleParams
  ): Promise<ActionResult> {
    const reason = params.revokeReason.trim()
    if (!reason) {
      return { success: false, error: 'A revoke reason is required.' }
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('chapter_role_assignment')
      .select('id, user_id, chapter_id, role_level, status')
      .eq('id', params.roleAssignmentId)
      .maybeSingle()

    if (assignmentError || !assignment) {
      logger.error(
        { context: 'chapter-role-assignment/deactivate-find', error: assignmentError, roleAssignmentId: params.roleAssignmentId },
        'Failed to load role assignment for deactivation'
      )
      return { success: false, error: 'Role assignment not found.' }
    }

    const roleAssignment = assignment as ActiveRoleAssignmentRow
    if (roleAssignment.status !== 'active') {
      return { success: false, error: 'Only active role assignments can be deactivated.' }
    }

    const roleLevel = roleAssignment.role_level as AssignableChapterRoleLevel
    const auth = await authorizeDeactivation(supabase, {
      actorUserId: params.actorUserId,
      chapterId: roleAssignment.chapter_id,
      roleLevel,
    })

    if (!auth.success) return auth

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('chapter_role_assignment')
      .update({
        status: 'inactive',
        ends_at: now,
        updated_at: now,
      })
      .eq('id', params.roleAssignmentId)
      .eq('status', 'active')

    if (updateError) {
      logger.error(
        { context: 'chapter-role-assignment/deactivate-update', error: updateError, roleAssignmentId: params.roleAssignmentId },
        'Failed to deactivate role assignment'
      )
      return { success: false, error: 'Failed to deactivate chapter role.' }
    }

    const revokeResult = await ChapterPermissionService.revokeChapterPermissions(supabase, {
      userId: roleAssignment.user_id,
      chapterId: roleAssignment.chapter_id,
      revokedById: params.actorUserId,
      revokeReason: reason,
      sourceRoleAssignmentId: roleAssignment.id,
    })

    if (!revokeResult.success) return revokeResult

    await writeRoleAssignmentAudit(supabase, {
      action: 'chapter.role.deactivated',
      actorUserId: params.actorUserId,
      targetUserId: roleAssignment.user_id,
      chapterId: roleAssignment.chapter_id,
      roleAssignmentId: roleAssignment.id,
      metadata: {
        role_level: roleLevel,
        reason,
      },
    })

    return { success: true }
  },
}
