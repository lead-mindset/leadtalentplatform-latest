import { createClient } from './supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { UserRow } from './types'
import type { EditorSidebarStats } from './types'
import type { AdminStats } from './types'
import type { UserWithChapter } from './types'


export async function requireAdmin(): Promise<{ supabase: SupabaseClient; user: { id: string; role: string } }> {
  const supabase = await createClient()
  console.log('[requireAdmin] Supabase client created')

  const { data: { user: authUser } } = await supabase.auth.getUser()
  console.log('[requireAdmin] Authenticated user:', authUser)

  if (!authUser) {
    console.log('[requireAdmin] No authenticated user, redirecting')
    redirect('/auth/login')
  }

  console.log('[requireAdmin] Fetching user data from User table')
  const { data: userData, error } = await supabase
    .from('User')
    .select('id, role')
    .eq('id', authUser.id)
    .single<{ id: string; role: string }>()

  console.log('[requireAdmin] DB query result:', { userData, error })

  if (error || !userData) {
    console.log('[requireAdmin] User not found in DB, redirecting')
    redirect('/auth/login')
  }

  if (userData.role !== 'admin') {
    console.log('[requireAdmin] User is not admin, redirecting')
    redirect('/auth/login')
  }

  console.log('[requireAdmin] Authenticated admin user:', userData)
  return { supabase, user: userData }
}


export async function requireUser(): Promise<{ supabase: SupabaseClient; user: UserRow }> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/auth/login')

  const { data: userData, error } = await supabase
    .from('User')
    .select(`
    id, email, name, role, chapterId,
    Chapter(id, name, university, city, region, createdAt, updatedAt)
  `)
    .eq('id', authUser.id)
    .single<UserWithChapter>()

  if (error || !userData) redirect('/auth/login')
  console.log('userdata:', userData)

  const user: UserWithChapter = {
    ...userData,
    Chapter: userData.Chapter ?? null
  }

  console.log('Authenticated user:', user)
  return { supabase, user }
}


export async function requireUserWithRole(role: string): Promise<{ supabase: SupabaseClient; user: UserRow }> {
  const { supabase, user } = await requireUser()

  if (role && user.role !== role) {
    redirect('/auth/login')
  }

  return { supabase, user }
}



export async function getSidebarStatsForEditor(
  supabase: SupabaseClient,
  chapterId: string | null
): Promise<EditorSidebarStats> {

  if (!chapterId) return { hasPendingApprovals: false }

  const { data: chapterUsers } = await supabase
    .from('User')
    .select('id')
    .eq('chapterId', chapterId)

  if (!chapterUsers?.length) return { hasPendingApprovals: false }

  const userIds = chapterUsers.map(u => u.id)

  const { count } = await supabase
    .from('StudentProfile')
    .select('*', { count: 'exact', head: true })
    .in('userId', userIds)
    .is('approvedById', null)
    .eq('isFilled', true)
    .limit(1)

  return { hasPendingApprovals: !!count }
}

export async function getSidebarStatsForAdmin(
  supabase: SupabaseClient
): Promise<AdminStats> {
  const [
    { count: pendingInvitesCount },
    { count: pendingApprovalsCount },
    { count: totalUsers },
    { count: totalChapters },
    { count: totalCompanies }
  ] = await Promise.all([
    supabase.from('RecruiterAccess').select('*', { count: 'exact', head: true })
      .is('acceptedAt', null)
      .is('revokedAt', null)
      .gt('inviteExpiresAt', new Date().toISOString()),

    supabase.from('StudentProfile').select('*', { count: 'exact', head: true })
      .is('approvedById', null)
      .eq('isFilled', true),

    supabase.from('User').select('*', { count: 'exact', head: true }),
    supabase.from('Chapter').select('*', { count: 'exact', head: true }),
    supabase.from('Company').select('*', { count: 'exact', head: true })
  ])

  return {
    pendingInvites: pendingInvitesCount || 0,
    pendingApprovals: pendingApprovalsCount || 0,
    totalUsers: totalUsers || 0,
    totalChapters: totalChapters || 0,
    totalCompanies: totalCompanies || 0
  }
}
