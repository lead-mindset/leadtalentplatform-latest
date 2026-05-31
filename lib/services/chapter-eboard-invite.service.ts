import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { logger } from '@/lib/logger'
import {
  ChapterPermissionService,
} from '@/lib/services/chapter-permission.service'
import type {
  AssignableChapterRoleLevel,
  ChapterFunctionalArea,
} from '@/lib/services/chapter-role-assignment.service'

type ChapterPreapprovalRow = Database['public']['Tables']['chapter_preapproval']['Row']

export type ChapterEboardInviteStatus = 'active' | 'expired'

export type ChapterEboardInvite = Pick<
  ChapterPreapprovalRow,
  | 'chapter_id'
  | 'created_at'
  | 'display_title'
  | 'email'
  | 'expires_at'
  | 'functional_area'
  | 'id'
  | 'raw_title'
  | 'role_level'
> & {
  status: ChapterEboardInviteStatus
}

type CreateInviteParams = {
  actorUserId: string
  chapterId: string
  email: string
  roleLevel: AssignableChapterRoleLevel
  functionalArea: ChapterFunctionalArea
  displayTitle: string
}

type InviteActionParams = {
  actorUserId: string
  chapterId: string
  inviteId: string
}

type CreateInviteResult =
  | { success: true; invite: ChapterEboardInvite }
  | { success: false; error: string }

type InviteListResult =
  | { success: true; invites: ChapterEboardInvite[] }
  | { success: false; error: string }

type InviteMutationResult =
  | { success: true; invite?: ChapterEboardInvite }
  | { success: false; error: string }

const CHAPTER_LEADER_INVITE_SOURCE = 'chapter_leader_invite'
const CHAPTER_INVITE_EXPIRATION_DAYS = 30
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGULAR_EBOARD_ROLE_LEVELS = new Set<AssignableChapterRoleLevel>([
  'chief_of_staff',
  'director',
  'coordinator',
])

function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase()
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function isRegularEboardRole(roleLevel: AssignableChapterRoleLevel): boolean {
  return REGULAR_EBOARD_ROLE_LEVELS.has(roleLevel)
}

function toInvite(row: ChapterPreapprovalRow, now = new Date()): ChapterEboardInvite {
  return {
    id: row.id,
    chapter_id: row.chapter_id,
    email: row.email,
    role_level: row.role_level,
    functional_area: row.functional_area,
    display_title: row.display_title,
    raw_title: row.raw_title,
    created_at: row.created_at,
    expires_at: row.expires_at,
    status: new Date(row.expires_at).getTime() <= now.getTime() ? 'expired' : 'active',
  }
}

async function authorizeInviteManagement(
  supabase: SupabaseClient<Database>,
  params: { actorUserId: string; chapterId: string }
): Promise<boolean> {
  return ChapterPermissionService.hasChapterPermission(supabase, {
    userId: params.actorUserId,
    chapterId: params.chapterId,
    permissionKey: 'chapter.roles.assign_eboard',
  })
}

async function findInviteById(
  supabase: SupabaseClient<Database>,
  inviteId: string
): Promise<ChapterPreapprovalRow | null> {
  const { data, error } = await supabase
    .from('chapter_preapproval')
    .select('*')
    .eq('id', inviteId)
    .eq('source', CHAPTER_LEADER_INVITE_SOURCE)
    .eq('preapproval_type', 'eboard')
    .is('consumed_at', null)
    .is('revoked_at', null)
    .maybeSingle()

  if (error) {
    logger.error({ context: 'chapter-eboard-invite/find', error, inviteId }, 'Failed to find e-board invite')
    return null
  }

  return data ?? null
}

type ExistingOpenInviteResult =
  | { exists: false }
  | { exists: true; status: ChapterEboardInviteStatus }

async function findExistingOpenInvite(
  supabase: SupabaseClient<Database>,
  params: { normalizedEmail: string; chapterId: string; nowIso: string }
): Promise<ExistingOpenInviteResult> {
  const { data, error } = await supabase
    .from('chapter_preapproval')
    .select('id, expires_at')
    .eq('normalized_email', params.normalizedEmail)
    .eq('chapter_id', params.chapterId)
    .is('consumed_at', null)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error(
      { context: 'chapter-eboard-invite/existing-open', error, email: params.normalizedEmail },
      'Failed to check existing e-board invite'
    )
    return { exists: true, status: 'active' }
  }

  if (!data) return { exists: false }

  return {
    exists: true,
    status: new Date(data.expires_at).getTime() <= new Date(params.nowIso).getTime()
      ? 'expired'
      : 'active',
  }
}

async function insertInvite(
  supabase: SupabaseClient<Database>,
  params: CreateInviteParams & { now: Date }
): Promise<CreateInviteResult> {
  const email = params.email.trim()
  const normalizedEmail = normalizeInviteEmail(email)
  const displayTitle = params.displayTitle.trim()

  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Enter a valid email address.' }
  }

  if (!displayTitle) {
    return { success: false, error: 'Display title is required.' }
  }

  if (!isRegularEboardRole(params.roleLevel)) {
    return { success: false, error: 'Chapter leaders can only invite regular e-board roles.' }
  }

  const nowIso = params.now.toISOString()
  const existing = await findExistingOpenInvite(supabase, {
    normalizedEmail,
    chapterId: params.chapterId,
    nowIso,
  })

  if (existing.exists) {
    return {
      success: false,
      error: existing.status === 'expired'
        ? 'An expired invite already exists for this email. Use re-invite from the pending invite list.'
        : 'An active invite already exists for this email and chapter.',
    }
  }

  const expiresAt = addDays(params.now, CHAPTER_INVITE_EXPIRATION_DAYS).toISOString()
  const { data, error } = await supabase
    .from('chapter_preapproval')
    .insert({
      email,
      normalized_email: normalizedEmail,
      chapter_id: params.chapterId,
      preapproval_type: 'eboard',
      role_level: params.roleLevel,
      functional_area: params.functionalArea,
      display_title: displayTitle,
      raw_title: displayTitle,
      expires_at: expiresAt,
      created_by_id: params.actorUserId,
      source: CHAPTER_LEADER_INVITE_SOURCE,
      notes: 'Created by chapter e-board invite flow',
      updated_at: nowIso,
    })
    .select('*')
    .single()

  if (error || !data) {
    logger.error(
      { context: 'chapter-eboard-invite/insert', error, email: normalizedEmail },
      'Failed to create e-board invite'
    )
    return { success: false, error: 'Failed to create e-board invite.' }
  }

  return { success: true, invite: toInvite(data as ChapterPreapprovalRow, params.now) }
}

export const ChapterEboardInviteService = {
  normalizeInviteEmail,

  async getChapterDisplayName(
    supabase: SupabaseClient<Database>,
    chapterId: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('chapter')
      .select('name, university')
      .eq('id', chapterId)
      .maybeSingle()

    if (error) {
      logger.error({ context: 'chapter-eboard-invite/chapter-name', error, chapterId }, 'Failed to load chapter name')
    }

    return data?.name ?? data?.university ?? chapterId
  },

  async listChapterEboardInvites(
    supabase: SupabaseClient<Database>,
    chapterId: string
  ): Promise<InviteListResult> {
    const { data, error } = await supabase
      .from('chapter_preapproval')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('source', CHAPTER_LEADER_INVITE_SOURCE)
      .eq('preapproval_type', 'eboard')
      .is('consumed_at', null)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error({ context: 'chapter-eboard-invite/list', error, chapterId }, 'Failed to list e-board invites')
      return { success: false, error: 'Failed to load e-board invites.' }
    }

    return {
      success: true,
      invites: (data ?? []).map((row) => toInvite(row as ChapterPreapprovalRow)),
    }
  },

  async createChapterEboardInvite(
    supabase: SupabaseClient<Database>,
    params: CreateInviteParams
  ): Promise<CreateInviteResult> {
    const authorized = await authorizeInviteManagement(supabase, params)
    if (!authorized) {
      return { success: false, error: 'You do not have permission to invite e-board members for this chapter.' }
    }

    return insertInvite(supabase, { ...params, now: new Date() })
  },

  async cancelChapterEboardInvite(
    supabase: SupabaseClient<Database>,
    params: InviteActionParams
  ): Promise<InviteMutationResult> {
    const authorized = await authorizeInviteManagement(supabase, params)
    if (!authorized) {
      return { success: false, error: 'You do not have permission to manage e-board invites for this chapter.' }
    }

    const invite = await findInviteById(supabase, params.inviteId)
    if (!invite || invite.chapter_id !== params.chapterId) {
      return { success: false, error: 'Invite not found.' }
    }

    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      return { success: false, error: 'Expired invites cannot be canceled. Re-invite instead.' }
    }

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('chapter_preapproval')
      .update({
        revoked_at: now,
        revoked_by_id: params.actorUserId,
        updated_at: now,
        notes: [invite.notes, 'Canceled by chapter leader before acceptance'].filter(Boolean).join(' | '),
      })
      .eq('id', params.inviteId)
      .is('consumed_at', null)
      .is('revoked_at', null)

    if (error) {
      logger.error({ context: 'chapter-eboard-invite/cancel', error, inviteId: params.inviteId }, 'Failed to cancel e-board invite')
      return { success: false, error: 'Failed to cancel e-board invite.' }
    }

    return { success: true }
  },

  async revokeChapterEboardInviteAfterSendFailure(
    supabase: SupabaseClient<Database>,
    params: InviteActionParams
  ): Promise<InviteMutationResult> {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('chapter_preapproval')
      .update({
        revoked_at: now,
        revoked_by_id: params.actorUserId,
        updated_at: now,
        notes: 'Revoked automatically because invite email delivery failed',
      })
      .eq('id', params.inviteId)
      .eq('chapter_id', params.chapterId)
      .eq('source', CHAPTER_LEADER_INVITE_SOURCE)
      .is('consumed_at', null)
      .is('revoked_at', null)

    if (error) {
      logger.error(
        { context: 'chapter-eboard-invite/revoke-send-failure', error, inviteId: params.inviteId },
        'Failed to revoke e-board invite after send failure'
      )
      return { success: false, error: 'Failed to revoke failed invite.' }
    }

    return { success: true }
  },

  async reinviteExpiredChapterEboardInvite(
    supabase: SupabaseClient<Database>,
    params: InviteActionParams
  ): Promise<CreateInviteResult> {
    const authorized = await authorizeInviteManagement(supabase, params)
    if (!authorized) {
      return { success: false, error: 'You do not have permission to manage e-board invites for this chapter.' }
    }

    const invite = await findInviteById(supabase, params.inviteId)
    if (!invite || invite.chapter_id !== params.chapterId) {
      return { success: false, error: 'Invite not found.' }
    }

    if (new Date(invite.expires_at).getTime() > Date.now()) {
      return { success: false, error: 'Only expired invites can be re-invited.' }
    }

    const roleLevel = invite.role_level as AssignableChapterRoleLevel | null
    const functionalArea = invite.functional_area as ChapterFunctionalArea | null
    if (!roleLevel || !functionalArea || !invite.display_title) {
      return { success: false, error: 'Expired invite is missing role details.' }
    }

    const now = new Date()
    const nowIso = now.toISOString()
    const { error: revokeError } = await supabase
      .from('chapter_preapproval')
      .update({
        revoked_at: nowIso,
        revoked_by_id: params.actorUserId,
        updated_at: nowIso,
        notes: [invite.notes, 'Re-invited by chapter leader after expiration'].filter(Boolean).join(' | '),
      })
      .eq('id', params.inviteId)
      .is('consumed_at', null)
      .is('revoked_at', null)

    if (revokeError) {
      logger.error(
        { context: 'chapter-eboard-invite/reinvite-revoke', error: revokeError, inviteId: params.inviteId },
        'Failed to revoke expired e-board invite'
      )
      return { success: false, error: 'Failed to re-invite e-board member.' }
    }

    return insertInvite(supabase, {
      actorUserId: params.actorUserId,
      chapterId: params.chapterId,
      email: invite.email,
      roleLevel,
      functionalArea,
      displayTitle: invite.display_title,
      now,
    })
  },
}

export type { CreateInviteParams as CreateChapterEboardInviteParams }
