import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { logger } from '@/lib/logger'
import { ChapterInviteService, type ChapterInvite } from '@/lib/services/chapter-invite.service'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import type {
  AssignableChapterRoleLevel,
  ChapterFunctionalArea,
} from '@/lib/services/chapter-role-assignment.service'

export type ChapterEboardInviteStatus = 'active' | 'expired'

export type ChapterEboardInvite = Pick<
  ChapterInvite,
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
  | { success: true; invite: ChapterEboardInvite; token: string }
  | { success: false; error: string }

type InviteListResult =
  | { success: true; invites: ChapterEboardInvite[] }
  | { success: false; error: string }

type InviteMutationResult =
  | { success: true; invite?: ChapterEboardInvite; token?: string }
  | { success: false; error: string }

const REGULAR_EBOARD_ROLE_LEVELS = new Set<AssignableChapterRoleLevel>([
  'chief_of_staff',
  'director',
  'coordinator',
])

function isRegularEboardRole(roleLevel: AssignableChapterRoleLevel): boolean {
  return REGULAR_EBOARD_ROLE_LEVELS.has(roleLevel)
}

function toEboardInvite(invite: ChapterInvite): ChapterEboardInvite {
  return {
    id: invite.id,
    chapter_id: invite.chapter_id,
    email: invite.email,
    role_level: invite.role_level,
    functional_area: invite.functional_area,
    display_title: invite.display_title,
    raw_title: invite.raw_title,
    created_at: invite.created_at,
    expires_at: invite.expires_at,
    status: invite.status === 'expired' ? 'expired' : 'active',
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

async function findManagedInvite(
  supabase: SupabaseClient<Database>,
  params: InviteActionParams
): Promise<ChapterInvite | null> {
  const result = await ChapterInviteService.listChapterInvites(supabase, {
    chapterId: params.chapterId,
    inviteTypes: ['regular_eboard'],
  })

  if (!result.success) return null
  return result.invites.find((invite) => invite.id === params.inviteId) ?? null
}

export const ChapterEboardInviteService = {
  normalizeInviteEmail: ChapterInviteService.normalizeInviteEmail,

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
    const result = await ChapterInviteService.listChapterInvites(supabase, {
      chapterId,
      inviteTypes: ['regular_eboard'],
    })

    if (!result.success) return result
    return { success: true, invites: result.invites.map(toEboardInvite) }
  },

  async createChapterEboardInvite(
    supabase: SupabaseClient<Database>,
    params: CreateInviteParams
  ): Promise<CreateInviteResult> {
    if (!isRegularEboardRole(params.roleLevel)) {
      return { success: false, error: 'Chapter leaders can only invite regular e-board roles.' }
    }

    const result = await ChapterInviteService.createInvite(supabase, {
      actorUserId: params.actorUserId,
      chapterId: params.chapterId,
      email: params.email,
      inviteType: 'regular_eboard',
      roleLevel: params.roleLevel,
      functionalArea: params.functionalArea,
      displayTitle: params.displayTitle,
      rawTitle: params.displayTitle,
      metadata: { created_from: 'chapter_members_invite_panel' },
    })

    if (!result.success) return result
    return { success: true, invite: toEboardInvite(result.invite), token: result.token }
  },

  async cancelChapterEboardInvite(
    supabase: SupabaseClient<Database>,
    params: InviteActionParams
  ): Promise<InviteMutationResult> {
    const authorized = await authorizeInviteManagement(supabase, params)
    if (!authorized) {
      return { success: false, error: 'You do not have permission to manage e-board invites for this chapter.' }
    }

    const invite = await findManagedInvite(supabase, params)
    if (!invite) return { success: false, error: 'Invite not found.' }
    if (invite.status === 'expired') return { success: false, error: 'Expired invites cannot be canceled. Re-invite instead.' }

    const result = await ChapterInviteService.revokeInvite(supabase, {
      actorUserId: params.actorUserId,
      inviteId: params.inviteId,
    })
    if (!result.success) return result
    return { success: true }
  },

  async revokeChapterEboardInviteAfterSendFailure(
    supabase: SupabaseClient<Database>,
    params: InviteActionParams
  ): Promise<InviteMutationResult> {
    const result = await ChapterInviteService.revokeInvite(supabase, {
      actorUserId: params.actorUserId,
      inviteId: params.inviteId,
    })
    if (!result.success) return result
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

    const invite = await findManagedInvite(supabase, params)
    if (!invite) return { success: false, error: 'Invite not found.' }
    if (invite.status !== 'expired') return { success: false, error: 'Only expired invites can be re-invited.' }

    const result = await ChapterInviteService.reinviteExpiredInvite(supabase, {
      actorUserId: params.actorUserId,
      inviteId: params.inviteId,
    })

    if (!result.success) return result
    return { success: true, invite: toEboardInvite(result.invite), token: result.token }
  },
}

export type { CreateInviteParams as CreateChapterEboardInviteParams }
