import { createClient } from '@/lib/supabase/server'
import type { ChapterRow, MemberWithProfile, StudentProfileRow, UserRow } from '@/lib/types'

const PROFILE_SELECT = `
  user_id,
  major,
  graduation_year,
  linkedin_url,
  skills,
  consent_recruiter_visibility,
  is_recruiter_visible,
  approved_by_id,
  approval_status,
  is_filled,
  updated_at,
  created_at,
  consent_date,
  chapter_id,
  email_notifications_enabled,
  gender,
  member_id,
  Chapter:chapter_id (
    id,
    name,
    university,
    city,
    region,
    created_at,
    updated_at
  )
`

type ChapterProfileRow = Pick<
StudentProfileRow,
  | 'user_id'
  | 'major'
  | 'graduation_year'
  | 'linkedin_url'
  | 'skills'
  | 'consent_recruiter_visibility'
  | 'is_recruiter_visible'
  | 'approved_by_id'
  | 'approval_status'
  | 'is_filled'
  | 'updated_at'
  | 'created_at'
  | 'consent_date'
  | 'chapter_id'
  | 'email_notifications_enabled'
  | 'gender'
  | 'member_id'
> & {
User:
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'created_at' | 'updated_at' | 'deactivated_at'>
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'created_at' | 'updated_at' | 'deactivated_at'>[]
  Chapter: ChapterRow | ChapterRow[] | null
}

function mapProfile(profile: ChapterProfileRow): MemberWithProfile | null {
  const user = Array.isArray(profile.User) ? profile.User[0] : profile.User
  const chapter = Array.isArray(profile.Chapter) ? profile.Chapter[0] : profile.Chapter

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    role: user.role,
created_at: user.created_at,
    updated_at: user.updated_at,
    deactivated_at: user.deactivated_at,
StudentProfile: {
      user_id: profile.user_id,
      major: profile.major,
      graduation_year: profile.graduation_year,
      linkedin_url: profile.linkedin_url,
      skills: profile.skills,
      consent_recruiter_visibility: profile.consent_recruiter_visibility,
      is_recruiter_visible: profile.is_recruiter_visible,
      approved_by_id: profile.approved_by_id,
      approval_status: profile.approval_status,
      is_filled: profile.is_filled,
      updated_at: profile.updated_at,
      created_at: profile.created_at,
      consent_date: profile.consent_date,
      chapter_id: profile.chapter_id,
      email_notifications_enabled: profile.email_notifications_enabled,
      gender: profile.gender,
      member_id: profile.member_id,
    },
    Chapter: chapter ?? null,
  }
}


export async function getChapterMembers(
  chapterId: string
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('student_profile')
    .select(PROFILE_SELECT)
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getChapterMembers] Error:', error)
    return []
  }

  const rows = (data ?? []) as ChapterProfileRow[]

  return rows
    .map(mapProfile)
    .filter((m): m is MemberWithProfile => m !== null)
    .filter((member: MemberWithProfile) => member.role === 'member' || member.role === 'editor')
}


export function getMemberStats(members: MemberWithProfile[]) {
  const incomplete = members.filter((member: MemberWithProfile) => !member.StudentProfile?.is_filled)
  const pending = members.filter(
    (member: MemberWithProfile) => member.StudentProfile?.is_filled && member.StudentProfile?.approval_status === 'pending'
  )
  const approved = members.filter(
    (member: MemberWithProfile) => member.StudentProfile?.approval_status === 'approved'
  )
  const rejected = members.filter(
    (member: MemberWithProfile) => member.StudentProfile?.approval_status === 'rejected'
  )

  return {
    total: members.length,
    incomplete: incomplete.length,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
    pendingMembers: pending,
    approvedMembers: approved,
    rejectedMembers: rejected,
    completeProfiles: members.filter((member: MemberWithProfile) => member.StudentProfile?.is_filled).length,
    visibleToRecruiters: members.filter((member: MemberWithProfile) => member.StudentProfile?.is_recruiter_visible).length,
  }
}


export async function getRecentChapterActivity(
  chapterId: string,
  limit: number = 5
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('student_profile')
    .select(PROFILE_SELECT)
    .eq('chapter_id', chapterId)
    .eq('approval_status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error('[getRecentChapterActivity] Error:', error)
    return []
  }

  return (data as ChapterProfileRow[])
    .map(mapProfile)
    .filter((m): m is MemberWithProfile => m !== null)
}
