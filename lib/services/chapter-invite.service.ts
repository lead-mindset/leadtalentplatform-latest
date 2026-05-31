import { createHash, randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.generated'
import { logger } from '@/lib/logger'
import { generateUniqueMemberId } from '@/lib/utils/member-id'
import {
  ChapterPermissionService,
  type ChapterPermissionKey,
  type ChapterRoleLevel,
} from '@/lib/services/chapter-permission.service'
import type {
  AssignableChapterRoleLevel,
  ChapterFunctionalArea,
} from '@/lib/services/chapter-role-assignment.service'

type ChapterInviteRow = Database['public']['Tables']['chapter_invite']['Row']
type ChapterMembershipRow = Pick<
  Database['public']['Tables']['chapter_membership']['Row'],
  'approved_by_id' | 'chapter_id' | 'id' | 'joined_at' | 'member_id' | 'position' | 'status'
>
type UserRow = Pick<Database['public']['Tables']['user']['Row'], 'id' | 'role'>
type RoleAssignmentRow = Pick<Database['public']['Tables']['chapter_role_assignment']['Row'], 'id' | 'role_level'>

export type ChapterInviteType = 'member' | 'regular_eboard' | 'protected_leader'
export type ChapterInviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired'
export type ChapterInviteCreatorRole = 'admin' | 'chapter_leader' | 'system'

export type ChapterInvite = Pick<
  ChapterInviteRow,
  | 'accepted_at'
  | 'accepted_by_user_id'
  | 'chapter_id'
  | 'created_at'
  | 'created_by_role'
  | 'created_by_user_id'
  | 'display_title'
  | 'email'
  | 'expires_at'
  | 'functional_area'
  | 'id'
  | 'invite_type'
  | 'raw_title'
  | 'role_level'
> & {
  status: ChapterInviteStatus
}

type CreateInviteParams = {
  actorUserId: string
  chapterId: string
  email: string
  inviteType: ChapterInviteType
  roleLevel: AssignableChapterRoleLevel | 'member'
  functionalArea: ChapterFunctionalArea
  displayTitle: string
  rawTitle?: string | null
  metadata?: Record<string, Json | undefined>
  now?: Date
  token?: string
}

type InviteActionParams = {
  actorUserId: string
  inviteId: string
  now?: Date
}

type ReinviteParams = InviteActionParams & {
  token?: string
}

type AcceptInviteParams = {
  token: string
  userId: string
  email: string
  now?: Date
  generateMemberId?: (supabase: SupabaseClient<Database>) => Promise<string>
}

type CreateInviteResult =
  | { success: true; invite: ChapterInvite; token: string }
  | { success: false; error: string }

type InviteListResult =
  | { success: true; invites: ChapterInvite[] }
  | { success: false; error: string }

export type InviteTokenValidationResult =
  | { success: true; state: 'pending'; invite: ChapterInvite }
  | { success: true; state: 'expired' | 'revoked' | 'accepted'; invite: ChapterInvite }
  | { success: false; error: string }

type MutationResult =
  | { success: true; invite?: ChapterInvite; token?: string }
  | { success: false; error: string }

type AcceptInviteResult =
  | {
      success: true
      accepted: true
      invite: ChapterInvite
      memberId: string
      roleAssignmentId?: string
      grantedPermissions: ChapterPermissionKey[]
    }
  | { success: true; accepted: false; invite: ChapterInvite; reason: 'already_accepted_by_user' }
  | { success: false; error: string }

const INVITE_EXPIRATION_DAYS = 30
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PROTECTED_ROLE_LEVELS = new Set<string>(['president', 'vice_president'])
const REGULAR_EBOARD_ROLE_LEVELS = new Set<string>(['chief_of_staff', 'director', 'coordinator'])

export function normalizeChapterInviteEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function hashChapterInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createChapterInviteToken(): string {
  return randomBytes(32).toString('base64url')
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function toInvite(row: ChapterInviteRow, now = new Date()): ChapterInvite {
  const status = row.status === 'pending' && new Date(row.expires_at).getTime() <= now.getTime()
    ? 'expired'
    : row.status as ChapterInviteStatus

  return {
    accepted_at: row.accepted_at,
    accepted_by_user_id: row.accepted_by_user_id,
    chapter_id: row.chapter_id,
    created_at: row.created_at,
    created_by_role: row.created_by_role,
    created_by_user_id: row.created_by_user_id,
    display_title: row.display_title,
    email: row.email,
    expires_at: row.expires_at,
    functional_area: row.functional_area,
    id: row.id,
    invite_type: row.invite_type,
    raw_title: row.raw_title,
    role_level: row.role_level,
    status,
  }
}

function isProtectedRole(roleLevel: string) {
  return PROTECTED_ROLE_LEVELS.has(roleLevel)
}

function isRegularEboardRole(roleLevel: string) {
  return REGULAR_EBOARD_ROLE_LEVELS.has(roleLevel)
}

function validateInviteShape(params: CreateInviteParams): string | null {
  if (!EMAIL_REGEX.test(params.email.trim())) return 'Enter a valid email address.'
  if (!params.displayTitle.trim()) return 'Display title is required.'

  if (params.inviteType === 'member') {
    return params.roleLevel === 'member' ? null : 'Member invites must use the member role.'
  }

  if (params.inviteType === 'regular_eboard') {
    return isRegularEboardRole(params.roleLevel)
      ? null
      : 'Regular e-board invites can only use chief of staff, director, or coordinator roles.'
  }

  if (params.inviteType === 'protected_leader') {
    return isProtectedRole(params.roleLevel)
      ? null
      : 'Protected leadership invites can only use president or vice president roles.'
  }

  return 'Invalid invite type.'
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
    logger.error({ context: 'chapter-invite/user-role', error, userId }, 'Failed to load user role')
    return null
  }

  return (data as UserRow | null)?.role ?? null
}

async function canCreateInvite(
  supabase: SupabaseClient<Database>,
  params: CreateInviteParams
): Promise<{ success: true; createdByRole: ChapterInviteCreatorRole } | { success: false; error: string }> {
  const actorRole = await getUserRole(supabase, params.actorUserId)
  if (actorRole === 'admin') return { success: true, createdByRole: 'admin' }

  if (params.inviteType === 'protected_leader') {
    return { success: false, error: 'Only admins can invite presidents or vice presidents.' }
  }

  if (params.inviteType === 'member') {
    return { success: false, error: 'Only admins can create member invites in this flow.' }
  }

  const hasPermission = await ChapterPermissionService.hasChapterPermission(supabase, {
    userId: params.actorUserId,
    chapterId: params.chapterId,
    permissionKey: 'chapter.roles.assign_eboard',
  })

  return hasPermission
    ? { success: true, createdByRole: 'chapter_leader' }
    : { success: false, error: 'You do not have permission to invite e-board members for this chapter.' }
}

async function hasPendingInviteForEmail(
  supabase: SupabaseClient<Database>,
  params: { normalizedEmail: string; chapterId: string }
) {
  const { data, error } = await supabase
    .from('chapter_invite')
    .select('id')
    .match({
      normalized_email: params.normalizedEmail,
      chapter_id: params.chapterId,
      status: 'pending',
    })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error({ context: 'chapter-invite/pending-email', error }, 'Failed to check pending chapter invite')
    return true
  }

  return Boolean(data)
}

async function hasProtectedRoleConflict(
  supabase: SupabaseClient<Database>,
  params: { chapterId: string; roleLevel: string }
) {
  if (!isProtectedRole(params.roleLevel)) return false

  const { data: activeRole, error: activeError } = await supabase
    .from('chapter_role_assignment')
    .select('id')
    .match({
      chapter_id: params.chapterId,
      role_level: params.roleLevel,
      status: 'active',
    })
    .limit(1)
    .maybeSingle()

  if (activeError) {
    logger.error({ context: 'chapter-invite/protected-active-role', error: activeError }, 'Failed to check protected role')
    return true
  }

  if (activeRole) return true

  const { data: pendingInvite, error: inviteError } = await supabase
    .from('chapter_invite')
    .select('id')
    .match({
      chapter_id: params.chapterId,
      role_level: params.roleLevel,
      status: 'pending',
      invite_type: 'protected_leader',
    })
    .limit(1)
    .maybeSingle()

  if (inviteError) {
    logger.error({ context: 'chapter-invite/protected-pending', error: inviteError }, 'Failed to check protected invite')
    return true
  }

  return Boolean(pendingInvite)
}

async function findInviteByToken(
  supabase: SupabaseClient<Database>,
  token: string
): Promise<ChapterInviteRow | null> {
  const { data, error } = await supabase
    .from('chapter_invite')
    .select('*')
    .eq('token_hash', hashChapterInviteToken(token))
    .maybeSingle()

  if (error) {
    logger.error({ context: 'chapter-invite/token-find', error }, 'Failed to find chapter invite by token')
    return null
  }

  return data as ChapterInviteRow | null
}

async function findInviteById(
  supabase: SupabaseClient<Database>,
  inviteId: string
): Promise<ChapterInviteRow | null> {
  const { data, error } = await supabase
    .from('chapter_invite')
    .select('*')
    .eq('id', inviteId)
    .maybeSingle()

  if (error) {
    logger.error({ context: 'chapter-invite/id-find', error, inviteId }, 'Failed to find chapter invite')
    return null
  }

  return data as ChapterInviteRow | null
}

async function ensureApprovedMembership(
  supabase: SupabaseClient<Database>,
  invite: ChapterInviteRow,
  params: AcceptInviteParams,
  now: string
): Promise<{ success: true; memberId: string } | { success: false; error: string }> {
  const { data: otherMemberships, error: otherError } = await supabase
    .from('chapter_membership')
    .select('chapter_id, status')
    .eq('user_id', params.userId)
    .eq('status', 'approved')

  if (otherError) {
    logger.error({ context: 'chapter-invite/other-memberships', error: otherError }, 'Failed to load memberships')
    return { success: false, error: 'Failed to validate chapter membership.' }
  }

  const approvedOtherChapter = (otherMemberships ?? []).find((membership) => membership.chapter_id !== invite.chapter_id)
  if (approvedOtherChapter) {
    return { success: false, error: 'This account already belongs to another chapter. Contact support before accepting this invite.' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('chapter_membership')
    .select('approved_by_id, chapter_id, id, joined_at, member_id, position, status')
    .match({
      user_id: params.userId,
      chapter_id: invite.chapter_id,
    })
    .maybeSingle()

  if (existingError) {
    logger.error({ context: 'chapter-invite/membership-find', error: existingError }, 'Failed to load membership')
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

  const payload = {
    approved_by_id: invite.created_by_user_id ?? membership?.approved_by_id ?? null,
    joined_at: membership?.joined_at ?? now,
    member_id: memberId,
    position: membership?.position ?? 'member',
    status: 'approved' as const,
    updated_at: now,
  }

  if (membership) {
    const { error } = await supabase
      .from('chapter_membership')
      .update(payload)
      .match({
        user_id: params.userId,
        chapter_id: invite.chapter_id,
      })

    if (error) {
      logger.error({ context: 'chapter-invite/membership-update', error }, 'Failed to update membership')
      return { success: false, error: 'Failed to activate chapter membership.' }
    }
    return { success: true, memberId }
  }

  const { error } = await supabase.from('chapter_membership').insert({
    user_id: params.userId,
    chapter_id: invite.chapter_id,
    ...payload,
  })

  if (error) {
    logger.error({ context: 'chapter-invite/membership-insert', error }, 'Failed to insert membership')
    return { success: false, error: 'Failed to activate chapter membership.' }
  }

  return { success: true, memberId }
}

async function ensureRoleAssignment(
  supabase: SupabaseClient<Database>,
  invite: ChapterInviteRow,
  params: AcceptInviteParams,
  now: string
): Promise<{ success: true; roleAssignmentId?: string; roleLevel?: ChapterRoleLevel } | { success: false; error: string }> {
  if (invite.role_level === 'member') return { success: true }

  if (isProtectedRole(invite.role_level)) {
    const conflict = await hasProtectedRoleConflict(supabase, {
      chapterId: invite.chapter_id,
      roleLevel: invite.role_level,
    })
    if (conflict) {
      return { success: false, error: 'This protected chapter role is already assigned or pending.' }
    }
  }

  const { data: sourceAssignment, error: sourceError } = await supabase
    .from('chapter_role_assignment')
    .select('id, role_level')
    .match({
      user_id: params.userId,
      chapter_id: invite.chapter_id,
      status: 'active',
      source_chapter_invite_id: invite.id,
    })
    .maybeSingle()

  if (sourceError) {
    logger.error({ context: 'chapter-invite/role-source-find', error: sourceError }, 'Failed to find source role')
    return { success: false, error: 'Failed to activate chapter role.' }
  }

  if (sourceAssignment) {
    return {
      success: true,
      roleAssignmentId: (sourceAssignment as RoleAssignmentRow).id,
      roleLevel: invite.role_level as ChapterRoleLevel,
    }
  }

  const { data: primaryAssignment, error: primaryError } = await supabase
    .from('chapter_role_assignment')
    .select('id, role_level')
    .match({
      user_id: params.userId,
      chapter_id: invite.chapter_id,
      status: 'active',
      is_primary: true,
    })
    .maybeSingle()

  if (primaryError) {
    logger.error({ context: 'chapter-invite/role-primary-find', error: primaryError }, 'Failed to find primary role')
    return { success: false, error: 'Failed to activate chapter role.' }
  }

  if (primaryAssignment) {
    const { error } = await supabase
      .from('chapter_role_assignment')
      .update({
        status: 'inactive',
        ends_at: now,
        updated_at: now,
      })
      .eq('id', (primaryAssignment as RoleAssignmentRow).id)
      .eq('status', 'active')

    if (error) {
      logger.error({ context: 'chapter-invite/role-primary-deactivate', error }, 'Failed to deactivate primary role')
      return { success: false, error: 'Failed to activate chapter role.' }
    }
  }

  const { data: createdAssignment, error: insertError } = await supabase
    .from('chapter_role_assignment')
    .insert({
      user_id: params.userId,
      chapter_id: invite.chapter_id,
      role_level: invite.role_level,
      functional_area: invite.functional_area,
      display_title: invite.display_title,
      raw_title: invite.raw_title,
      is_primary: true,
      status: 'active',
      assigned_by_id: invite.created_by_user_id,
      source: 'chapter_invite',
      source_chapter_invite_id: invite.id,
      starts_at: now,
      updated_at: now,
    })
    .select('id, role_level')
    .single()

  if (insertError || !createdAssignment) {
    logger.error({ context: 'chapter-invite/role-insert', error: insertError }, 'Failed to insert role assignment')
    return { success: false, error: 'Failed to activate chapter role.' }
  }

  const assignment = createdAssignment as RoleAssignmentRow
  return {
    success: true,
    roleAssignmentId: assignment.id,
    roleLevel: assignment.role_level as ChapterRoleLevel,
  }
}

async function markAccepted(
  supabase: SupabaseClient<Database>,
  params: { inviteId: string; userId: string; now: string }
): Promise<{ success: true } | { success: false; error: string }> {
  const { error } = await supabase
    .from('chapter_invite')
    .update({
      accepted_at: params.now,
      accepted_by_user_id: params.userId,
      status: 'accepted',
      updated_at: params.now,
    })
    .eq('id', params.inviteId)
    .eq('status', 'pending')
    .is('accepted_at', null)
    .is('revoked_at', null)

  if (error) {
    logger.error({ context: 'chapter-invite/accept-mark', error, inviteId: params.inviteId }, 'Failed to accept invite')
    return { success: false, error: 'Failed to accept invite.' }
  }

  return { success: true }
}

export const ChapterInviteService = {
  normalizeInviteEmail: normalizeChapterInviteEmail,
  hashInviteToken: hashChapterInviteToken,
  createInviteToken: createChapterInviteToken,

  async createInvite(
    supabase: SupabaseClient<Database>,
    params: CreateInviteParams
  ): Promise<CreateInviteResult> {
    const validationError = validateInviteShape(params)
    if (validationError) return { success: false, error: validationError }

    const auth = await canCreateInvite(supabase, params)
    if (!auth.success) return auth

    const normalizedEmail = normalizeChapterInviteEmail(params.email)
    const hasPendingEmail = await hasPendingInviteForEmail(supabase, {
      normalizedEmail,
      chapterId: params.chapterId,
    })
    if (hasPendingEmail) {
      return { success: false, error: 'A pending invite already exists for this email and chapter.' }
    }

    const roleConflict = await hasProtectedRoleConflict(supabase, {
      chapterId: params.chapterId,
      roleLevel: params.roleLevel,
    })
    if (roleConflict) {
      return { success: false, error: 'This protected chapter role is already assigned or pending.' }
    }

    const now = params.now ?? new Date()
    const token = params.token ?? createChapterInviteToken()
    const { data, error } = await supabase
      .from('chapter_invite')
      .insert({
        chapter_id: params.chapterId,
        email: params.email.trim(),
        normalized_email: normalizedEmail,
        token_hash: hashChapterInviteToken(token),
        invite_type: params.inviteType,
        role_level: params.roleLevel,
        functional_area: params.functionalArea,
        display_title: params.displayTitle.trim(),
        raw_title: params.rawTitle ?? params.displayTitle.trim(),
        expires_at: addDays(now, INVITE_EXPIRATION_DAYS).toISOString(),
        created_by_user_id: params.actorUserId,
        created_by_role: auth.createdByRole,
        source: 'chapter_invite',
        metadata: params.metadata ?? {},
        updated_at: now.toISOString(),
      })
      .select('*')
      .single()

    if (error || !data) {
      logger.error({ context: 'chapter-invite/create', error, email: normalizedEmail }, 'Failed to create invite')
      return { success: false, error: 'Failed to create chapter invite.' }
    }

    return { success: true, invite: toInvite(data as ChapterInviteRow, now), token }
  },

  async listChapterInvites(
    supabase: SupabaseClient<Database>,
    params: { chapterId: string; inviteTypes?: ChapterInviteType[] }
  ): Promise<InviteListResult> {
    let query = supabase
      .from('chapter_invite')
      .select('*')
      .eq('chapter_id', params.chapterId)
      .in('status', ['pending'])
      .order('created_at', { ascending: false })

    if (params.inviteTypes?.length) {
      query = query.in('invite_type', params.inviteTypes)
    }

    const { data, error } = await query
    if (error) {
      logger.error({ context: 'chapter-invite/list', error, chapterId: params.chapterId }, 'Failed to list invites')
      return { success: false, error: 'Failed to load chapter invites.' }
    }

    return { success: true, invites: (data ?? []).map((row) => toInvite(row as ChapterInviteRow)) }
  },

  async validateToken(
    supabase: SupabaseClient<Database>,
    token: string,
    now = new Date()
  ): Promise<InviteTokenValidationResult> {
    const invite = await findInviteByToken(supabase, token)
    if (!invite) return { success: false, error: 'Invite not found.' }

    const mapped = toInvite(invite, now)
    if (mapped.status === 'expired') return { success: true, state: 'expired', invite: mapped }
    if (mapped.status === 'revoked') return { success: true, state: 'revoked', invite: mapped }
    if (mapped.status === 'accepted') return { success: true, state: 'accepted', invite: mapped }
    return { success: true, state: 'pending', invite: mapped }
  },

  async revokeInvite(
    supabase: SupabaseClient<Database>,
    params: InviteActionParams
  ): Promise<MutationResult> {
    const invite = await findInviteById(supabase, params.inviteId)
    if (!invite) return { success: false, error: 'Invite not found.' }
    if (invite.status !== 'pending') return { success: false, error: 'Only pending invites can be revoked.' }

    const now = (params.now ?? new Date()).toISOString()
    const { error } = await supabase
      .from('chapter_invite')
      .update({
        status: 'revoked',
        revoked_at: now,
        revoked_by_user_id: params.actorUserId,
        updated_at: now,
      })
      .eq('id', params.inviteId)
      .eq('status', 'pending')

    if (error) {
      logger.error({ context: 'chapter-invite/revoke', error, inviteId: params.inviteId }, 'Failed to revoke invite')
      return { success: false, error: 'Failed to revoke chapter invite.' }
    }

    return { success: true }
  },

  async reinviteExpiredInvite(
    supabase: SupabaseClient<Database>,
    params: ReinviteParams
  ): Promise<CreateInviteResult> {
    const invite = await findInviteById(supabase, params.inviteId)
    if (!invite) return { success: false, error: 'Invite not found.' }

    const now = params.now ?? new Date()
    if (invite.status !== 'pending' || new Date(invite.expires_at).getTime() > now.getTime()) {
      return { success: false, error: 'Only expired pending invites can be re-invited.' }
    }

    const revoke = await this.revokeInvite(supabase, {
      actorUserId: params.actorUserId,
      inviteId: invite.id,
      now,
    })
    if (!revoke.success) return revoke

    const created = await this.createInvite(supabase, {
      actorUserId: params.actorUserId,
      chapterId: invite.chapter_id,
      email: invite.email,
      inviteType: invite.invite_type as ChapterInviteType,
      roleLevel: invite.role_level as AssignableChapterRoleLevel | 'member',
      functionalArea: invite.functional_area as ChapterFunctionalArea,
      displayTitle: invite.display_title,
      rawTitle: invite.raw_title,
      metadata: { reinvited_from_invite_id: invite.id },
      token: params.token,
      now,
    })

    return created
  },

  async acceptInvite(
    supabase: SupabaseClient<Database>,
    params: AcceptInviteParams
  ): Promise<AcceptInviteResult> {
    const now = (params.now ?? new Date()).toISOString()
    const invite = await findInviteByToken(supabase, params.token)
    if (!invite) return { success: false, error: 'Invite not found.' }

    const mapped = toInvite(invite, new Date(now))
    if (mapped.status === 'expired') return { success: false, error: 'This invite has expired.' }
    if (mapped.status === 'revoked') return { success: false, error: 'This invite has been revoked.' }
    if (mapped.status === 'accepted') {
      if (mapped.accepted_by_user_id === params.userId) {
        return { success: true, accepted: false, invite: mapped, reason: 'already_accepted_by_user' }
      }
      return { success: false, error: 'This invite has already been accepted by another account.' }
    }

    const normalizedUserEmail = normalizeChapterInviteEmail(params.email)
    if (normalizedUserEmail !== invite.normalized_email) {
      return { success: false, error: 'This invite must be accepted with the invited email address.' }
    }

    const membership = await ensureApprovedMembership(supabase, invite, params, now)
    if (!membership.success) return membership

    const role = await ensureRoleAssignment(supabase, invite, params, now)
    if (!role.success) return role

    let grantedPermissions: ChapterPermissionKey[] = []
    if (role.roleLevel && role.roleAssignmentId) {
      const grant = await ChapterPermissionService.grantRoleTemplatePermissions(supabase, {
        userId: params.userId,
        chapterId: invite.chapter_id,
        roleLevel: role.roleLevel,
        grantedById: invite.created_by_user_id,
        source: 'chapter_invite',
        sourceRoleAssignmentId: role.roleAssignmentId,
      })

      if (!grant.success) return grant
      grantedPermissions = grant.grantedPermissions
    }

    const accepted = await markAccepted(supabase, {
      inviteId: invite.id,
      userId: params.userId,
      now,
    })
    if (!accepted.success) return accepted

    return {
      success: true,
      accepted: true,
      invite: toInvite({ ...invite, status: 'accepted', accepted_at: now, accepted_by_user_id: params.userId }, new Date(now)),
      memberId: membership.memberId,
      roleAssignmentId: role.roleAssignmentId,
      grantedPermissions,
    }
  },
}

export type {
  AcceptInviteParams as AcceptChapterInviteParams,
  CreateInviteParams as CreateChapterInviteParams,
}
