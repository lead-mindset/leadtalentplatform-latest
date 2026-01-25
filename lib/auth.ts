import { createClient } from './supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { ChapterRow } from './types'

export type User = {
  id: string
  email: string
  name: string
  role: string
  chapterId: string | null
  Chapter?: ChapterRow | null
}

export type EditorSidebarStats = {
  hasPendingApprovals: boolean
}

export type AdminSidebarStats = {
  pendingInvites: number
  pendingApprovals: number
  totalUsers: number
  totalChapters: number
  totalCompanies: number
}


export async function requireUser(): Promise<{ supabase: SupabaseClient; user: User }> {
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
    .single()

  if (error || !userData) redirect('/auth/login')

  const user: User = {
    ...userData,
    Chapter: userData.Chapter?.[0] ?? null
  }

  return { supabase, user }
}


export async function requireUserWithRole(role: string): Promise<{ supabase: SupabaseClient; user: User }> {
  const { supabase, user } = await requireUser()

  if (role && user.role !== role) {
    redirect('/auth/login')
  }

  return { supabase, user }
}

export async function getUserWithChapter(
  supabase: SupabaseClient,
  userId: string
): Promise<User> {
  const { data, error } = await supabase
    .from('User')
    .select(`
      id, email, name, role, chapterId,
    Chapter(id, name, university, city, region, createdAt, updatedAt)
    `)
    .eq('id', userId)
    .single()

  if (error || !data) redirect('/auth/login')

  return {
    ...data,
    Chapter: data.Chapter?.[0] ?? null
  }
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
): Promise<AdminSidebarStats> {
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
