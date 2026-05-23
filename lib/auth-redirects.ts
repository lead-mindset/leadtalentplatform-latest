import type { Role } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'

const CHAPTER_DASHBOARD_PATH = '/chapter'

export function getStudentWorkspaceRedirectPath(role: Role | null | undefined) {
  if (role === 'recruiter') return '/company'
  if (role === 'admin') return '/admin'
  if (role === 'member' || role === 'editor') return null
  if (!role) return null

  return '/auth/error'
}

export function getPostAuthRedirectPath({
  hasProfile,
  role,
  hasChapterDashboardAccess = false,
}: {
  hasProfile: boolean
  role: Role | null | undefined
  hasChapterDashboardAccess?: boolean
}) {
  if (!role) return '/onboarding'

  if (role === 'member' || role === 'editor') {
    if (hasProfile && hasChapterDashboardAccess) return CHAPTER_DASHBOARD_PATH
    return hasProfile ? '/student' : '/onboarding'
  }

  if (role === 'recruiter') return '/company'
  if (role === 'admin') return '/admin'

  return '/auth/error'
}

async function getApprovedChapterId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('chapter_membership')
    .select('chapter_id')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .maybeSingle()

  if (error || !data?.chapter_id) return null
  return data.chapter_id
}

export async function resolvePostAuthRedirectPath(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string
    hasProfile: boolean
    role: Role | null | undefined
  }
) {
  if (!params.hasProfile || (params.role !== 'member' && params.role !== 'editor')) {
    return getPostAuthRedirectPath(params)
  }

  const chapterId = await getApprovedChapterId(supabase, params.userId)
  const hasChapterDashboardAccess = chapterId
    ? await ChapterPermissionService.hasChapterPermission(supabase, {
        userId: params.userId,
        chapterId,
        permissionKey: 'chapter.dashboard.access',
      })
    : false

  return getPostAuthRedirectPath({
    ...params,
    hasChapterDashboardAccess,
  })
}
