import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { logger } from '@/lib/logger'
import { generateUniqueMemberId } from '@/lib/utils/member-id'
import {
  ChapterPermissionService,
  type ChapterPermissionKey,
  type ChapterRoleLevel,
} from '@/lib/services/chapter-permission.service'

type ChapterPreapprovalRow = Database['public']['Tables']['chapter_preapproval']['Row']
type ChapterMembershipRow = Pick<
  Database['public']['Tables']['chapter_membership']['Row'],
  'approved_by_id' | 'id' | 'joined_at' | 'member_id' | 'position' | 'status'
>

type RoleAssignmentRow = Pick<
  Database['public']['Tables']['chapter_role_assignment']['Row'],
  'id' | 'role_level'
>

type ActivationParams = {
  userId: string
  email: string
  activatedById?: string | null
  generateMemberId?: (supabase: SupabaseClient<Database>) => Promise<string>
}

type ActivationNoopReason = 'no_matching_preapproval'

type ActivationResult =
  | {
      success: true
      activated: true
      preapprovalId: string
      chapterId: string
      preapprovalType: 'member' | 'eboard'
      memberId: string
      roleAssignmentId?: string
      grantedPermissions?: ChapterPermissionKey[]
    }
  | { success: true; activated: false; reason: ActivationNoopReason }
  | { success: false; error: string }

type MembershipResult =
  | { success: true; memberId: string }
  | { success: false; error: string }

type RoleAssignmentResult =
  | { success: true; roleAssignmentId: string; roleLevel: ChapterRoleLevel }
  | { success: false; error: string }

const ROLE_LEVELS = new Set<string>([
  'president',
  'vice_president',
  'chief_of_staff',
  'director',
  'coordinator',
  'member',
])

export function normalizePreapprovalEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isEboardPreapproval(preapproval: ChapterPreapprovalRow): preapproval is ChapterPreapprovalRow & {
  preapproval_type: 'eboard'
} {
  return preapproval.preapproval_type === 'eboard'
}

function isPreapprovalType(value: string): value is 'member' | 'eboard' {
  return value === 'member' || value === 'eboard'
}

function toChapterRoleLevel(value: string | null): ChapterRoleLevel | null {
  if (!value || !ROLE_LEVELS.has(value)) return null
  return value as ChapterRoleLevel
}

async function findActivePreapproval(
  supabase: SupabaseClient<Database>,
  email: string,
  now: string
): Promise<ChapterPreapprovalRow | null> {
  const normalizedEmail = normalizePreapprovalEmail(email)
  if (!normalizedEmail) return null

  const { data, error } = await supabase
    .from('chapter_preapproval')
    .select('*')
    .eq('normalized_email', normalizedEmail)
    .is('revoked_at', null)
    .is('consumed_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error({ context: 'chapter-preapproval/find', error, email: normalizedEmail }, 'Failed to find preapproval')
    return null
  }

  return data ?? null
}

async function ensureApprovedMembership(
  supabase: SupabaseClient<Database>,
  preapproval: ChapterPreapprovalRow,
  params: ActivationParams,
  now: string
): Promise<MembershipResult> {
  const { data: existing, error: existingError } = await supabase
    .from('chapter_membership')
    .select('approved_by_id, id, joined_at, member_id, position, status')
    .match({
      user_id: params.userId,
      chapter_id: preapproval.chapter_id,
    })
    .maybeSingle()

  if (existingError) {
    logger.error(
      { context: 'chapter-preapproval/membership-find', error: existingError, userId: params.userId },
      'Failed to find existing chapter membership'
    )
    return { success: false, error: 'Failed to activate chapter membership.' }
  }

  const membership = existing as ChapterMembershipRow | null
  if (membership?.status === 'approved' && membership.member_id) {
    return { success: true, memberId: membership.member_id }
  }

  let memberId: string
  try {
    memberId = membership?.member_id ?? await (params.generateMemberId ?? generateUniqueMemberId)(supabase)
  } catch {
    return { success: false, error: 'Could not generate a member ID - please try again.' }
  }

  const membershipPayload = {
    approved_by_id: params.activatedById ?? membership?.approved_by_id ?? null,
    joined_at: membership?.joined_at ?? now,
    member_id: memberId,
    position: membership?.position ?? 'member',
    status: 'approved' as const,
    updated_at: now,
  }

  if (membership) {
    const { error } = await supabase
      .from('chapter_membership')
      .update(membershipPayload)
      .match({
        user_id: params.userId,
        chapter_id: preapproval.chapter_id,
      })

    if (error) {
      logger.error(
        { context: 'chapter-preapproval/membership-update', error, userId: params.userId },
        'Failed to update chapter membership'
      )
      return { success: false, error: 'Failed to activate chapter membership.' }
    }

    return { success: true, memberId }
  }

  const { error } = await supabase.from('chapter_membership').insert({
    user_id: params.userId,
    chapter_id: preapproval.chapter_id,
    ...membershipPayload,
  })

  if (error) {
    logger.error(
      { context: 'chapter-preapproval/membership-insert', error, userId: params.userId },
      'Failed to insert chapter membership'
    )
    return { success: false, error: 'Failed to activate chapter membership.' }
  }

  return { success: true, memberId }
}

async function ensureRoleAssignment(
  supabase: SupabaseClient<Database>,
  preapproval: ChapterPreapprovalRow,
  params: ActivationParams,
  now: string
): Promise<RoleAssignmentResult> {
  const roleLevel = toChapterRoleLevel(preapproval.role_level)
  if (!roleLevel || !preapproval.functional_area || !preapproval.display_title) {
    return { success: false, error: 'E-board preapproval is missing role assignment details.' }
  }

  const { data: sourceAssignment, error: sourceError } = await supabase
    .from('chapter_role_assignment')
    .select('id, role_level')
    .match({
      user_id: params.userId,
      chapter_id: preapproval.chapter_id,
      status: 'active',
      source_preapproval_id: preapproval.id,
    })
    .maybeSingle()

  if (sourceError) {
    logger.error(
      { context: 'chapter-preapproval/role-source-find', error: sourceError, userId: params.userId },
      'Failed to find existing source role assignment'
    )
    return { success: false, error: 'Failed to activate chapter e-board role.' }
  }

  if (sourceAssignment) {
    return { success: true, roleAssignmentId: sourceAssignment.id, roleLevel }
  }

  const { data: primaryAssignment, error: primaryError } = await supabase
    .from('chapter_role_assignment')
    .select('id, role_level')
    .match({
      user_id: params.userId,
      chapter_id: preapproval.chapter_id,
      status: 'active',
    })
    .eq('is_primary', true)
    .maybeSingle()

  if (primaryError) {
    logger.error(
      { context: 'chapter-preapproval/role-primary-find', error: primaryError, userId: params.userId },
      'Failed to find existing primary role assignment'
    )
    return { success: false, error: 'Failed to activate chapter e-board role.' }
  }

  if (primaryAssignment) {
    return { success: true, roleAssignmentId: primaryAssignment.id, roleLevel }
  }

  const { data: createdAssignment, error: insertError } = await supabase
    .from('chapter_role_assignment')
    .insert({
      user_id: params.userId,
      chapter_id: preapproval.chapter_id,
      role_level: roleLevel,
      functional_area: preapproval.functional_area,
      display_title: preapproval.display_title,
      raw_title: preapproval.raw_title,
      is_primary: true,
      status: 'active',
      assigned_by_id: params.activatedById ?? null,
      source: 'preapproval',
      source_preapproval_id: preapproval.id,
      starts_at: now,
      updated_at: now,
    })
    .select('id, role_level')
    .single()

  if (insertError || !createdAssignment) {
    logger.error(
      { context: 'chapter-preapproval/role-insert', error: insertError, userId: params.userId },
      'Failed to insert role assignment'
    )
    return { success: false, error: 'Failed to activate chapter e-board role.' }
  }

  const assignment = createdAssignment as RoleAssignmentRow
  return { success: true, roleAssignmentId: assignment.id, roleLevel }
}

async function consumePreapproval(
  supabase: SupabaseClient<Database>,
  preapprovalId: string,
  userId: string,
  now: string
): Promise<ActivationResult | null> {
  const { error } = await supabase
    .from('chapter_preapproval')
    .update({
      consumed_at: now,
      consumed_by_user_id: userId,
      updated_at: now,
    })
    .eq('id', preapprovalId)
    .is('consumed_at', null)

  if (!error) return null

  logger.error({ context: 'chapter-preapproval/consume', error, preapprovalId }, 'Failed to consume preapproval')
  return { success: false, error: 'Failed to consume preapproval.' }
}

export const ChapterPreapprovalService = {
  async activatePreapprovalForUser(
    supabase: SupabaseClient<Database>,
    params: ActivationParams
  ): Promise<ActivationResult> {
    const now = new Date().toISOString()
    const preapproval = await findActivePreapproval(supabase, params.email, now)

    if (!preapproval || !isPreapprovalType(preapproval.preapproval_type)) {
      return { success: true, activated: false, reason: 'no_matching_preapproval' }
    }

    const membershipResult = await ensureApprovedMembership(supabase, preapproval, params, now)
    if (!membershipResult.success) return membershipResult

    let roleAssignmentId: string | undefined
    let grantedPermissions: ChapterPermissionKey[] | undefined

    if (isEboardPreapproval(preapproval)) {
      const roleResult = await ensureRoleAssignment(supabase, preapproval, params, now)
      if (!roleResult.success) return roleResult

      const grantResult = await ChapterPermissionService.grantRoleTemplatePermissions(supabase, {
        userId: params.userId,
        chapterId: preapproval.chapter_id,
        roleLevel: roleResult.roleLevel,
        grantedById: params.activatedById ?? null,
        source: 'preapproval',
        sourceRoleAssignmentId: roleResult.roleAssignmentId,
      })

      if (!grantResult.success) return grantResult

      roleAssignmentId = roleResult.roleAssignmentId
      grantedPermissions = grantResult.grantedPermissions
    }

    const consumeResult = await consumePreapproval(supabase, preapproval.id, params.userId, now)
    if (consumeResult) return consumeResult

    return {
      success: true,
      activated: true,
      preapprovalId: preapproval.id,
      chapterId: preapproval.chapter_id,
      preapprovalType: preapproval.preapproval_type,
      memberId: membershipResult.memberId,
      roleAssignmentId,
      grantedPermissions,
    }
  },
}
