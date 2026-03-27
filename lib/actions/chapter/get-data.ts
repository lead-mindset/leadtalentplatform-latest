import { createClient } from '@/lib/supabase/server'
import type { MemberWithProfile } from '@/lib/types'

const PROFILE_SELECT = `
  userId,
  major,
  graduationYear,
  linkedinUrl,
  skills,
  consentRecruiterVisibility,
  isRecruiterVisible,
  approvedById,
  approvalStatus,
  isFilled,
  updatedAt,
  createdAt,
  consentDate,
  chapterId,
  emailNotificationsEnabled,
  gender,
  User:User!StudentProfile_userId_fkey (
    id,
    email,
    name,
    phone,
    role,
    createdAt,
    updatedAt
  ),
  Chapter:Chapter!StudentProfile_chapterId_fkey (
    id,
    name,
    university,
    city,
    region,
    createdAt,
    updatedAt
  )
`

function mapProfile(profile: any): MemberWithProfile | null {
  const user = Array.isArray(profile.User) ? profile.User[0] : profile.User
  const chapter = Array.isArray(profile.Chapter) ? profile.Chapter[0] : profile.Chapter

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    StudentProfile: {
      userId: profile.userId,
      major: profile.major,
      graduationYear: profile.graduationYear,
      linkedinUrl: profile.linkedinUrl,
      skills: profile.skills,
      consentRecruiterVisibility: profile.consentRecruiterVisibility,
      isRecruiterVisible: profile.isRecruiterVisible,
      approvedById: profile.approvedById,
      approvalStatus: profile.approvalStatus,
      isFilled: profile.isFilled,
      updatedAt: profile.updatedAt,
      createdAt: profile.createdAt,
      consentDate: profile.consentDate,
      chapterId: profile.chapterId,
      emailNotificationsEnabled: profile.emailNotificationsEnabled,
      gender: profile.gender,
    },
    Chapter: chapter ?? null,
  }
}


export async function getChapterMembers(
  chapterId: string
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('StudentProfile')
    .select(PROFILE_SELECT)
    .eq('chapterId', chapterId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[getChapterMembers] Error:', error)
    return []
  }

  if (!data) return []

  return data
    .map(mapProfile)
    .filter((m): m is MemberWithProfile => m !== null)
    .filter(m => m.role === 'member' || m.role === 'editor')
}


export function getMemberStats(members: MemberWithProfile[]) {
  const incomplete = members.filter(m => !m.StudentProfile?.isFilled)
  const pending = members.filter(
    m => m.StudentProfile?.isFilled && m.StudentProfile?.approvalStatus === 'pending'
  )
  const approved = members.filter(
    m => m.StudentProfile?.approvalStatus === 'approved'
  )
  const rejected = members.filter(
    m => m.StudentProfile?.approvalStatus === 'rejected'
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
    completeProfiles: members.filter(m => m.StudentProfile?.isFilled).length,
    visibleToRecruiters: members.filter(m => m.StudentProfile?.isRecruiterVisible).length,
  }
}


export async function getRecentChapterActivity(
  chapterId: string,
  limit: number = 5
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('StudentProfile')
    .select(PROFILE_SELECT)
    .eq('chapterId', chapterId)
    .eq('approvalStatus', 'approved')
    .order('updatedAt', { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error('[getRecentChapterActivity] Error:', error)
    return []
  }

  return data
    .map(mapProfile)
    .filter((m): m is MemberWithProfile => m !== null)
}