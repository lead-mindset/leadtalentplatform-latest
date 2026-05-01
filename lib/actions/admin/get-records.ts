import { createClient } from '@/lib/supabase/server'
import { AdminService } from '@/lib/services/admin.records'
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
  return AdminService.gerAdminDashboardStats( supabase)
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
export async function getSystemStats() {
  const supabase = await createClient()
  return AdminService.getSystemStats(supabase)
}
export async function getRecentActivity() {
  const supabase = await createClient()
  return AdminService.getRecentActivity(supabase)
}
export async function getChapters() {
  const supabase = await createClient()
  return AdminService.getChapters(supabase)
}
export async function getChapterMembers(chapter_ id: string) {
  const supabase = await createClient()
  return AdminService.getChapterMembers(supabase, chapter_id)
}
export async function getChapterMemberCount(chapter_ id: string) {
  const supabase = await createClient()
  return AdminService.getChapterMemberCount(supabase, chapter_id)
}
export function normalizeUserWithDetails(users: UserWithDetailsRaw[]) {
  return AdminService.normalizeUserWithDetails(users)
}
export async function getUsers() {
  const supabase = await createClient()
  return AdminService.getUsers(supabase)
}
export async function getActivityLog() {
  const supabase = await createClient()
  return AdminService.getActivityLog(supabase)
}
export async function getCompanies() {
  const supabase = await createClient()
  return AdminService.getCompanies(supabase)
}
export function normalizeRecruiterInvites(invites: Parameters<typeof AdminService.normalizeRecruiterInvites>[0]) {
  return AdminService.normalizeRecruiterInvites(invites)
}
export async function getInvites() {
  const supabase = await createClient()
  return AdminService.getInvites(supabase)
}
export async function getUserById(id: string) {
  const supabase = await createClient()
  return AdminService.getUserById(supabase, id)
}
export async function getChapterById(id: string) {
  const supabase = await createClient()
  return AdminService.getChapterById(supabase, id)
}