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

const USER_SELECT = 'id, email, name, role, phone, createdAt, updatedAt, deactivatedAt'
const RECRUITER_ACCESS_SELECT =
  'id, companyId, isActive, grantedById, acceptedByUserId, grantedAt, acceptedAt, revokedAt, inviteExpiresAt, recruiterEmail, inviteToken, revokedById'

export async function assertAdmin(
  supabase: SupabaseClient<Database>
): Promise<UserRow> {
  const { data: auth, error } = await supabase.auth.getUser()

  if (error || !auth.user) {
    throw new Error('Not authenticated')
  }

  const { data: dbUser, error: dbError } = await supabase
    .from('User')
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
    .from('User')
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

export async function requireChapterEditor(): Promise<{
  supabase: SupabaseClient<Database>
  user: UserRow
  chapterId: string
}> {
  const { supabase, user } = await requireUserWithRole('editor')

  const { data: profile, error } = await supabase
    .from('StudentProfile')
    .select('chapterId')
    .eq('userId', user.id)
    .maybeSingle()

  if (error || !profile?.chapterId) {
    redirect('/chapter')
  }

  return {
    supabase,
    user,
    chapterId: profile.chapterId,
  }
}

export async function getSidebarStatsForEditor(
  supabase: SupabaseClient<Database>,
  chapterId: string
): Promise<EditorSidebarStats> {
  const { count, error: countError } = await supabase
    .from('StudentProfile')
    .select('userId', { count: 'exact', head: true })
    .eq('chapterId', chapterId)
    .eq('approvalStatus', 'pending')
    .eq('isFilled', true)
    .limit(1)

  if (countError) {
    console.error('Error fetching pending approvals:', countError)
    return { hasPendingApprovals: false }
  }

  return { hasPendingApprovals: (count ?? 0) > 0 }
}

export async function getSidebarStatsForAdmin(
  supabase: SupabaseClient<Database>
): Promise<AdminStats> {
  const now = new Date().toISOString()
  
  const [
    { count: pendingInvitesCount, error: e1 },
    { count: pendingApprovalsCount, error: e2 },
    { count: totalUsers, error: e3 },
    { count: totalChapters, error: e4 },
    { count: totalCompanies, error: e5 }
  ] = await Promise.all([
    supabase.from('RecruiterAccess')
      .select('id', { count: 'exact', head: true })
      .is('acceptedAt', null)
      .is('revokedAt', null)
      .gt('inviteExpiresAt', now),

    supabase.from('StudentProfile')
      .select('userId', { count: 'exact', head: true })
      .eq('approvalStatus', 'pending')
      .eq('isFilled', true),

    supabase.from('User')
      .select('id', { count: 'exact', head: true }),
      
    supabase.from('Chapter')
      .select('id', { count: 'exact', head: true }),
      
    supabase.from('Company')
      .select('id', { count: 'exact', head: true })
  ])

  if (e1 || e2 || e3 || e4 || e5) {
    const errors = [e1, e2, e3, e4, e5].filter(Boolean)
    console.error('Errors fetching admin stats:', errors)
  }

  return {
    pendingInvites: pendingInvitesCount ?? 0,
    pendingApprovals: pendingApprovalsCount ?? 0,
    totalUsers: totalUsers ?? 0,
    totalChapters: totalChapters ?? 0,
    totalCompanies: totalCompanies ?? 0
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
    .from('User')
    .select(USER_SELECT)
    .eq('id', authUser.id)
    .eq('role', 'recruiter')
    .single<UserRow>()

  if (error || !userData) {
    redirect('/auth/login')
  }

  type ActiveAccessRaw = RecruiterAccessRow & {
    Company: { id: string; name: string; createdat: string; createdbyid: string }[];
  }

  const { data: activeAccess, error: accessError } = await supabase
    .from('RecruiterAccess')
    .select(`
      ${RECRUITER_ACCESS_SELECT},
      Company!inner (id, name, createdat, createdbyid)
    `)
    .eq('acceptedByUserId', authUser.id)
    .eq('isActive', true)
    .is('revokedAt', null)
    .maybeSingle<ActiveAccessRaw>()

  if (accessError || !activeAccess) {
    redirect('/company/onboard')
  }

  const { data: allAccess } = await supabase
    .from('RecruiterAccess')
    .select(RECRUITER_ACCESS_SELECT)
    .eq('acceptedByUserId', authUser.id)

  const company = activeAccess.Company?.[0] ?? null
  
  const user: RecruiterUser = {
    ...userData,
    RecruiterAccess: allAccess ?? [],
    Company: company as CompanyRow | null,
  }

  return { supabase, user }
}
