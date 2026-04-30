import { createClient } from './supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type {
  AdminStats,
  CompanyRow,
  Database,
  EditorSidebarStats,
  RecruiterAccessRow,
  RecruiterUser,
  UserRow,
} from './types'

const USER_SELECT = 'id, email, name, role, phone, gender, created_at, updated_at, deactivated_at'
const RECRUITER_ACCESS_SELECT =
  'id, company_id, is_active, granted_by_id, accepted_by_user_id, granted_at, accepted_at, revoked_at, invite_expires_at, recruiter_email, invite_token, revoked_by_id'

export async function assertAdmin(
  supabase: SupabaseClient<Database>
): Promise<UserRow> {
  const { data: auth, error } = await supabase.auth.getUser()

  if (error || !auth.user) {
    throw new Error('Not authenticated')
  }

  const { data: dbUser, error: dbError } = await supabase
    .from('user')
    .select(USER_SELECT)
    .eq('id', auth.user.id)
    .single<UserRow>()

  if (dbError || !dbUser) {
    throw new Error('User not found')
  }

  if (dbUser.role !== 'admin') {
    throw new Error('Insufficient permissions')
  }

  return dbUser
}

export async function requireAdmin(): Promise<{
  supabase: SupabaseClient<Database>
  user: UserRow
}> {
  const supabase = await createClient()

  try {
    const user = await assertAdmin(supabase)
    return { supabase, user }
  } catch {
    return redirect('/auth/login')
  }
}

export async function requireUser(): Promise<{ 
  supabase: SupabaseClient<Database>; 
  user: UserRow 
}> {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect('/auth/login')
  }

  const { data: userData, error } = await supabase
    .from('user')
    .select(USER_SELECT)
    .eq('id', authUser.id)
    .single<UserRow>()

  if (error || !userData) {
    redirect('/auth/login')
  }

  return { supabase, user: userData }
}

export async function requireUserWithRole(role: string): Promise<{
  supabase: SupabaseClient<Database>
  user: UserRow
}> {
  const { supabase, user } = await requireUser()
 
  if (user.role !== role) {
    redirect('/student')
  }
 
  return { supabase, user }
}

export async function requireChapterMember(): Promise<{
  supabase: SupabaseClient<Database>
  user: UserRow
  chapter_id: string
}> {
  const { supabase, user } = await requireUser()
 
  // Allow admin, editor, and member roles to access chapter resources
  if (!['admin', 'editor', 'member'].includes(user.role)) {
    redirect('/student')
  }

  const { data: profile, error } = await supabase
    .from('student_profile')
    .select('chapter_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !profile?.chapter_id) {
    redirect('/chapter')
  }

  return {
    supabase,
    user,
    chapter_id: profile.chapter_id,
  }
}

export async function canUserAccessChapter(
  supabase: SupabaseClient<Database>,
  user: UserRow,
  targetChapterId: string,
  eventId?: string
): Promise<boolean> {
  // Admin can access any chapter
  if (user.role === 'admin') {
    return true
  }

  // Get user's own chapter
  const { data: profile } = await supabase
    .from('student_profile')
    .select('chapter_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const userChapterId = profile?.chapter_id
  if (!userChapterId) {
    return false
  }

  // Check if user's chapter is the target chapter
  if (userChapterId === targetChapterId) {
    return true
  }

  // Check if user's chapter is a collaborator on event (editors only)
  if (eventId && user.role === 'editor') {
    const { data: collaboration } = await supabase
      .from('event_chapter')
      .select('id')
      .eq('event_id', eventId)
      .eq('chapter_id', userChapterId)
      .maybeSingle()
    
    return collaboration !== null
  }

  return false
}


export async function getSidebarStatsForEditor(
  supabase: SupabaseClient<Database>,
  chapter_id: string
): Promise<EditorSidebarStats> {
const { count, error: countError } = await supabase
    .from('student_profile')
    .select('user_id', { count: 'exact', head: true })
    .eq('chapter_id', chapter_id)
    .eq('approval_status', 'pending')
    .eq('is_filled', true)
    .limit(1)

  if (countError) {
    console.error('Error fetching pending approvals:', countError)
    return { has_pending_approvals: false }
  }

  return { has_pending_approvals: (count ?? 0) > 0 }
}

export async function getSidebarStatsForAdmin(
  supabase: SupabaseClient<Database>
): Promise<AdminStats> {
  const now = new Date().toISOString()
  
  const [
    { count: pendingInvitesCount, error: e1 },
    { count: pendingApprovalsCount, error: e2 },
    { count: total_users, error: e3 },
    { count: total_chapters, error: e4 },
    { count: total_companies, error: e5 }
  ] = await Promise.all([
supabase.from('recruiter_access')
      .select('id', { count: 'exact', head: true })
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gt('invite_expires_at', now),

    supabase.from('student_profile')
      .select('user_id', { count: 'exact', head: true })
      .eq('approval_status', 'pending')
      .eq('is_filled', true),

    supabase.from('user')
      .select('id', { count: 'exact', head: true }),
      
    supabase.from('chapter')
      .select('id', { count: 'exact', head: true }),
      
    supabase.from('company')
      .select('id', { count: 'exact', head: true })
  ])

  if (e1 || e2 || e3 || e4 || e5) {
    const errors = [e1, e2, e3, e4, e5].filter(Boolean)
    console.error('Errors fetching admin stats:', errors)
  }

  return {
    pending_invites: pendingInvitesCount ?? 0,
    pending_approvals: pendingApprovalsCount ?? 0,
    total_users: total_users ?? 0,
    total_chapters: total_chapters ?? 0,
    total_companies: total_companies ?? 0
  }
}

export async function requireRecruiter(): Promise<{
  supabase: SupabaseClient<Database>;
  user: RecruiterUser;
}> {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect('/auth/login')
  }

  const { data: userData, error } = await supabase
    .from('user')
    .select(USER_SELECT)
    .eq('id', authUser.id)
    .eq('role', 'recruiter')
    .single<UserRow>()

  if (error || !userData) {
    redirect('/auth/login')
  }

  type ActiveAccessRaw = RecruiterAccessRow & {
    Company: { id: string; name: string; created_at: string; created_by_id: string }[];
  }

  const { data: activeAccess, error: accessError } = await supabase
    .from('recruiter_access')
    .select(`
      ${RECRUITER_ACCESS_SELECT},
      Company!inner (id, name, created_at, created_by_id)
    `)
    .eq('accepted_by_user_id', authUser.id)
    .eq('is_active', true)
    .is('revoked_at', null)
    .maybeSingle<ActiveAccessRaw>()

  if (accessError || !activeAccess) {
    redirect('/company/onboard')
  }

  const { data: allAccess } = await supabase
    .from('recruiter_access')
    .select(RECRUITER_ACCESS_SELECT)
    .eq('accepted_by_user_id', authUser.id)

  const company = activeAccess.Company?.[0] ?? null
  
  const user: RecruiterUser = {
    ...userData,
    recruiter_access: allAccess ?? [],
    company: company as CompanyRow | null,
  }

  return { supabase, user }
}
