import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { ChapterInviteService, type ChapterInvite } from '@/lib/services/chapter-invite.service'
import type { ChapterFunctionalArea } from '@/lib/services/chapter-role-assignment.service'

export type ProtectedLeadershipRoleLevel = 'president' | 'vice_president'

export type ProtectedLeadershipInvite = {
  id: string
  email: string
  roleLevel: ProtectedLeadershipRoleLevel
  functionalArea: ChapterFunctionalArea
  displayTitle: string
  status: ChapterInvite['status']
  createdAt: string
  expiresAt: string
}

export type ActiveProtectedLeader = {
  id: string
  userId: string
  name: string | null
  email: string
  roleLevel: ProtectedLeadershipRoleLevel
  functionalArea: ChapterFunctionalArea
  displayTitle: string
  startsAt: string
}

type RoleAssignmentRow = Pick<
  Database['public']['Tables']['chapter_role_assignment']['Row'],
  'display_title' | 'functional_area' | 'id' | 'role_level' | 'starts_at' | 'user_id'
>

type UserRow = Pick<Database['public']['Tables']['user']['Row'], 'email' | 'id' | 'name'>

type ProtectedLeadershipStateResult =
  | { success: true; activeLeaders: ActiveProtectedLeader[]; invites: ProtectedLeadershipInvite[] }
  | { success: false; error: string }

type ProtectedLeadershipMutationResult =
  | { success: true; invite?: ChapterInvite; token?: string }
  | { success: false; error: string }

type ProtectedLeadershipCreateResult =
  | { success: true; invite: ChapterInvite; token: string }
  | { success: false; error: string }

type CreateProtectedLeadershipInviteParams = {
  actorUserId: string
  chapterId: string
  email: string
  roleLevel: ProtectedLeadershipRoleLevel
  functionalArea: ChapterFunctionalArea
  displayTitle: string
}

const PROTECTED_ROLE_LEVELS = ['president', 'vice_president'] as const

function toProtectedInvite(invite: ChapterInvite): ProtectedLeadershipInvite | null {
  if (invite.role_level !== 'president' && invite.role_level !== 'vice_president') return null

  return {
    id: invite.id,
    email: invite.email,
    roleLevel: invite.role_level,
    functionalArea: invite.functional_area as ChapterFunctionalArea,
    displayTitle: invite.display_title,
    status: invite.status,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at,
  }
}

async function findProtectedInvite(
  supabase: SupabaseClient<Database>,
  params: { chapterId: string; inviteId: string }
): Promise<ProtectedLeadershipInvite | null> {
  const invites = await ChapterInviteService.listChapterInvites(supabase, {
    chapterId: params.chapterId,
    inviteTypes: ['protected_leader'],
  })

  if (!invites.success) return null
  return invites.invites
    .map(toProtectedInvite)
    .filter((invite): invite is ProtectedLeadershipInvite => invite !== null)
    .find((invite) => invite.id === params.inviteId) ?? null
}

export const ChapterProtectedLeadershipInviteService = {
  async getChapterName(
    supabase: SupabaseClient<Database>,
    chapterId: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('chapter')
      .select('name, university')
      .eq('id', chapterId)
      .maybeSingle()

    if (error) return chapterId
    return data?.name ?? data?.university ?? chapterId
  },

  async getInviteState(
    supabase: SupabaseClient<Database>,
    chapterId: string
  ): Promise<ProtectedLeadershipStateResult> {
    const { data: roleRows, error: roleError } = await supabase
      .from('chapter_role_assignment')
      .select('id, user_id, role_level, functional_area, display_title, starts_at')
      .eq('chapter_id', chapterId)
      .eq('status', 'active')
      .in('role_level', PROTECTED_ROLE_LEVELS)
      .order('role_level', { ascending: true })

    if (roleError) {
      return { success: false, error: 'Failed to load protected chapter leaders.' }
    }

    const assignments = (roleRows ?? []) as RoleAssignmentRow[]
    const usersById = new Map<string, UserRow>()
    const userIds = assignments.map((row) => row.user_id)

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user')
        .select('id, email, name')
        .in('id', userIds)

      for (const user of (users ?? []) as UserRow[]) {
        usersById.set(user.id, user)
      }
    }

    const inviteResult = await ChapterInviteService.listChapterInvites(supabase, {
      chapterId,
      inviteTypes: ['protected_leader'],
    })

    if (!inviteResult.success) return inviteResult

    return {
      success: true,
      activeLeaders: assignments
        .filter((assignment) => assignment.role_level === 'president' || assignment.role_level === 'vice_president')
        .map((assignment) => {
          const user = usersById.get(assignment.user_id)
          return {
            id: assignment.id,
            userId: assignment.user_id,
            name: user?.name ?? null,
            email: user?.email ?? 'unknown',
            roleLevel: assignment.role_level as ProtectedLeadershipRoleLevel,
            functionalArea: assignment.functional_area as ChapterFunctionalArea,
            displayTitle: assignment.display_title,
            startsAt: assignment.starts_at,
          }
        }),
      invites: inviteResult.invites
        .map(toProtectedInvite)
        .filter((invite): invite is ProtectedLeadershipInvite => invite !== null),
    }
  },

  async createProtectedLeadershipInvite(
    supabase: SupabaseClient<Database>,
    params: CreateProtectedLeadershipInviteParams
  ): Promise<ProtectedLeadershipCreateResult> {
    return ChapterInviteService.createInvite(supabase, {
      actorUserId: params.actorUserId,
      chapterId: params.chapterId,
      email: params.email,
      inviteType: 'protected_leader',
      roleLevel: params.roleLevel,
      functionalArea: params.functionalArea,
      displayTitle: params.displayTitle,
    })
  },

  async revokeProtectedLeadershipInvite(
    supabase: SupabaseClient<Database>,
    params: { actorUserId: string; chapterId: string; inviteId: string }
  ): Promise<ProtectedLeadershipMutationResult> {
    const invite = await findProtectedInvite(supabase, params)
    if (!invite) return { success: false, error: 'Protected leadership invite not found.' }
    if (invite.status === 'expired') return { success: false, error: 'Expired invites can only be re-invited.' }

    return ChapterInviteService.revokeInvite(supabase, {
      actorUserId: params.actorUserId,
      inviteId: params.inviteId,
    })
  },

  async reinviteExpiredProtectedLeadershipInvite(
    supabase: SupabaseClient<Database>,
    params: { actorUserId: string; chapterId: string; inviteId: string }
  ): Promise<ProtectedLeadershipCreateResult> {
    const invite = await findProtectedInvite(supabase, params)
    if (!invite) return { success: false, error: 'Protected leadership invite not found.' }
    if (invite.status !== 'expired') {
      return { success: false, error: 'Only expired protected leadership invites can be re-invited.' }
    }

    return ChapterInviteService.reinviteExpiredInvite(supabase, {
      actorUserId: params.actorUserId,
      inviteId: params.inviteId,
    })
  },
}
