import { createClient } from '@/lib/supabase/server'
import { AdminService } from '@/lib/services/admin.service'
import type {
  ActivityItem,
  ChapterRow,
  Company,
  MemberWithProfile,
  RecruiterInvite,
  UserWithDetails,
  UserWithDetailsRaw,
  UserWithFullProfile,
} from '@/lib/types'

export async function getAdminDashboardStats() {
  const supabase = await createClient()
  return AdminService.getAdminDashboardStats(supabase)
}

export async function getChapterActivityList() {
  const supabase = await createClient()
  return AdminService.getChapterActivityList(supabase)
}

export async function getRecentJoins(limit = 10) {
  const supabase = await createClient()
  return AdminService.getRecentJoins(supabase, limit)
}

export async function getPendingRecruiterRequests() {
  const supabase = await createClient()
  return AdminService.getPendingRecruiterRequests(supabase)
}

export async function getCompanyAccessForUser(userId: string, email: string) {
  const supabase = await createClient()
  return AdminService.getCompanyAccessForUser(supabase, { userId, email })
}

export async function getSystemStats() {
  const supabase = await createClient()
  return AdminService.getSystemStats(supabase)
}

export async function getRecentActivity() {
  const supabase = await createClient()
  return AdminService.getRecentActivity(supabase)
}

export async function getChapters(): Promise<Array<ChapterRow & { _count: { users: number } }>> {
  const supabase = await createClient()
  return AdminService.getChapters(supabase)
}

export async function getChapterMembers(chapter_id: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient()
  return AdminService.getChapterMembers(supabase, chapter_id)
}

export async function getChapterMemberCount(chapter_id: string): Promise<number> {
  const supabase = await createClient()
  return AdminService.getChapterMemberCount(supabase, chapter_id)
}

export function normalizeUserWithDetails(
  users: UserWithDetailsRaw[]
): UserWithDetails[] {
  return AdminService.normalizeUserWithDetails(users)
}

export async function getUsers(): Promise<UserWithDetails[]> {
  const supabase = await createClient()
  return AdminService.getUsers(supabase)
}

export async function getActivityLog(): Promise<ActivityItem[]> {
  const supabase = await createClient()
  return AdminService.getActivityLog(supabase)
}

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  return AdminService.getCompanies(supabase)
}

export function normalizeRecruiterInvites(
  invites: Parameters<typeof AdminService.normalizeRecruiterInvites>[0]
): RecruiterInvite[] {
  return AdminService.normalizeRecruiterInvites(invites)
}

export async function getInvites(): Promise<RecruiterInvite[]> {
  const supabase = await createClient()
  return AdminService.getInvites(supabase)
}

export async function getUserById(id: string): Promise<UserWithFullProfile | null> {
  const supabase = await createClient()
  return AdminService.getUserById(supabase, id)
}

export async function getChapterById(id: string): Promise<ChapterRow | null> {
  const supabase = await createClient()
  return AdminService.getChapterById(supabase, id)
}
