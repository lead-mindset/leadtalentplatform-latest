import { createClient } from './supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { UserRow, EditorSidebarStats, AdminStats, UserWithChapter } from './types'
import type { RecruiterUser } from './types'


export async function assertAdmin(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw new Error(`Authentication failed: ${error.message}`)
  }
  
  if (!user) {
    throw new Error('No authenticated user')
  }

  const { data: dbUser, error: dbError } = await supabase
    .from('User')
    .select('id, role')
    .eq('id', user.id)
    .single<{ id: string; role: string }>()

  if (dbError) {
    throw new Error(`Database error: ${dbError.message}`)
  }
  
  if (!dbUser) {
    throw new Error('User not found in database')
  }

  if (dbUser.role !== 'admin') {
    throw new Error('Insufficient permissions')
  }

  return dbUser
}

export async function requireAdmin() {
  const supabase = await createClient()

  try {
    const user = await assertAdmin(supabase)
    return { supabase, user }
  } catch (err) {
    // Could log error here for monitoring
    redirect('/auth/login')
  }
}

export async function requireUser(): Promise<{ 
  supabase: SupabaseClient; 
  user: UserWithChapter 
}> {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect('/auth/login')
  }

  const { data: userData, error } = await supabase
    .from('User')
    .select(`
      id, email, name, role, chapterId, phone, createdAt, updatedAt,
      Chapter(id, name, university, city, region, createdAt, updatedAt)
    `)
    .eq('id', authUser.id)
    .single<UserWithChapter>()

  if (error || !userData) {
    redirect('/auth/login')
  }

  const user: UserWithChapter = {
    ...userData,
    Chapter: userData.Chapter ?? null
  }

  return { supabase, user }
}

export async function requireUserWithRole(role: string): Promise<{ 
  supabase: SupabaseClient; 
  user: UserWithChapter 
}> {
  const { supabase, user } = await requireUser()

  if (user.role !== role) {
    redirect('/unauthorized') // More specific redirect
  }

  return { supabase, user }
}

export async function getSidebarStatsForEditor(
  supabase: SupabaseClient,
  chapterId: string | null
): Promise<EditorSidebarStats> {
  if (!chapterId) {
    return { hasPendingApprovals: false }
  }

  const { data: chapterUsers, error: usersError } = await supabase
    .from('User')
    .select('id')
    .eq('chapterId', chapterId)

  if (usersError || !chapterUsers?.length) {
    return { hasPendingApprovals: false }
  }

  const userIds = chapterUsers.map(u => u.id)

  const { count, error: countError } = await supabase
    .from('StudentProfile')
    .select('*', { count: 'exact', head: true })
    .in('userId', userIds)
    .is('approvedById', null)
    .eq('isFilled', true)
    .limit(1)

  if (countError) {
    // Log error but don't fail
    console.error('Error fetching pending approvals:', countError)
    return { hasPendingApprovals: false }
  }

  return { hasPendingApprovals: (count ?? 0) > 0 }
}

export async function getSidebarStatsForAdmin(
  supabase: SupabaseClient
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
      .select('*', { count: 'exact', head: true })
      .is('acceptedAt', null)
      .is('revokedAt', null)
      .gt('inviteExpiresAt', now),

    supabase.from('StudentProfile')
      .select('*', { count: 'exact', head: true })
      .is('approvedById', null)
      .eq('isFilled', true),

    supabase.from('User')
      .select('*', { count: 'exact', head: true }),
      
    supabase.from('Chapter')
      .select('*', { count: 'exact', head: true }),
      
    supabase.from('Company')
      .select('*', { count: 'exact', head: true })
  ])

  // Handle errors appropriately
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
  supabase: SupabaseClient;
  user: RecruiterUser;
}> {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect('/auth/login')
  }

  const { data: userData, error } = await supabase
    .from('User')
    .select('id, email, name, role, chapterId, phone, createdAt, updatedAt')
    .eq('id', authUser.id)
    .eq('role', 'recruiter')
    .single()

  if (error || !userData) {
    redirect('/auth/login')
  }

  const { data: activeAccess, error: accessError } = await supabase
    .from('RecruiterAccess')
    .select(`
      id, companyId, isActive, grantedById,
      acceptedByUserId, grantedAt, acceptedAt, revokedAt,
      inviteExpiresAt, recruiterEmail,
      Company!inner (id, name, createdat, createdbyid)
    `)
    .eq('acceptedByUserId', authUser.id)
    .eq('isActive', true)
    .is('revokedAt', null)
    .maybeSingle()

  if (accessError || !activeAccess) {
    redirect('/company/onboard')
  }

  const { data: allAccess } = await supabase
    .from('RecruiterAccess')
    .select(`
      id, companyId, isActive, grantedById,
      acceptedByUserId, grantedAt, acceptedAt, revokedAt,
      inviteExpiresAt, recruiterEmail
    `)
    .eq('acceptedByUserId', authUser.id)

  const user: RecruiterUser = {
    ...userData,
    RecruiterAccess: allAccess ?? [],
    Company: activeAccess.Company ?? null,
  }

  return { supabase, user }
}