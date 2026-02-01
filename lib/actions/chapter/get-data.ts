
import { createClient } from '@/lib/supabase/server'
import type { MemberWithProfile } from '@/lib/types'


export async function getChapterMembers(
  chapterId: string
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('User')
    .select(`
      id,
      email,
      name,
      phone,
      role,
      createdAt,
      updatedAt,
      StudentProfile:StudentProfile!StudentProfile_userId_fkey (
        userId,
        major,
        graduationYear,
        linkedinUrl,
        skills,
        consentRecruiterVisibility,
        isRecruiterVisible,
        approvedById,
        isFilled,
        updatedAt,
        createdAt,
        consentDate,
        chapterId
      ),
      Chapter:StudentProfile!StudentProfile_userId_fkey (
        Chapter!inner (
          id,
          name,
          university,
          city,
          region,
          createdAt,
          updatedAt
        )
      )
    `)
    .eq('StudentProfile.chapterId', chapterId)
    .in('role', ['member', 'editor'])
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[getChapterMembers] Error:', error)
    return []
  }

  if (!data) return []

  return data.map(member => {
    const studentProfile = Array.isArray(member.StudentProfile)
      ? member.StudentProfile[0] ?? null
      : member.StudentProfile ?? null
    let chapter = null
    if (member.Chapter && Array.isArray(member.Chapter)) {
      const chapterWrapper = member.Chapter[0]
      if (chapterWrapper?.Chapter) {
        chapter = Array.isArray(chapterWrapper.Chapter)
          ? chapterWrapper.Chapter[0] ?? null
          : chapterWrapper.Chapter ?? null
      }
    }

    return {
      id: member.id,
      email: member.email,
      name: member.name,
      phone: member.phone,
      role: member.role,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      StudentProfile: studentProfile,
      Chapter: chapter
    }
  }) as MemberWithProfile[]
}


export async function getChapterMembersAlt(
  chapterId: string
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  // Start from StudentProfile since that's where chapterId lives
  const { data, error } = await supabase
    .from('StudentProfile')
    .select(`
      userId,
      major,
      graduationYear,
      linkedinUrl,
      skills,
      consentRecruiterVisibility,
      isRecruiterVisible,
      approvedById,
      isFilled,
      updatedAt,
      createdAt,
      consentDate,
      chapterId,
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
    `)
    .eq('chapterId', chapterId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[getChapterMembersAlt] Error:', error)
    return []
  }

  if (!data) return []

  return data.map(profile => {
    const user = Array.isArray(profile.User) ? profile.User[0] : profile.User
    const chapter = Array.isArray(profile.Chapter) ? profile.Chapter[0] : profile.Chapter

    return {
      id: user?.id ?? '',
      email: user?.email ?? '',
      name: user?.name ?? '',
      phone: user?.phone ?? null,
      role: user?.role ?? 'member',
      createdAt: user?.createdAt ?? '',
      updatedAt: user?.updatedAt ?? '',
      StudentProfile: {
        userId: profile.userId,
        major: profile.major,
        graduationYear: profile.graduationYear,
        linkedinUrl: profile.linkedinUrl,
        skills: profile.skills,
        consentRecruiterVisibility: profile.consentRecruiterVisibility,
        isRecruiterVisible: profile.isRecruiterVisible,
        approvedById: profile.approvedById,
        isFilled: profile.isFilled,
        updatedAt: profile.updatedAt,
        createdAt: profile.createdAt,
        consentDate: profile.consentDate,
        chapterId: profile.chapterId
      },
      Chapter: chapter
    }
  }) as MemberWithProfile[]
}

export function getMemberStats(members: MemberWithProfile[]) {
  const pending = members.filter(
    m => m.StudentProfile?.isFilled && m.StudentProfile?.approvedById === null
  )
  const approved = members.filter(m => m.StudentProfile?.approvedById !== null)
  const incomplete = members.filter(m => !m.StudentProfile?.isFilled)

  return {
    total: members.length,
    pending: pending.length,
    approved: approved.length,
    incomplete: incomplete.length,
    pendingMembers: pending,
    approvedMembers: approved,
    completeProfiles: members.filter(m => m.StudentProfile?.isFilled).length,
    visibleToRecruiters: members.filter(m => m.StudentProfile?.isRecruiterVisible).length
  }
}

export async function getRecentChapterActivity(
  chapterId: string,
  limit: number = 5
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('StudentProfile')
    .select(`
      userId,
      major,
      graduationYear,
      linkedinUrl,
      skills,
      consentRecruiterVisibility,
      isRecruiterVisible,
      approvedById,
      isFilled,
      updatedAt,
      createdAt,
      consentDate,
      chapterId,
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
    `)
    .eq('chapterId', chapterId)
    .eq('isFilled', true)
    .order('updatedAt', { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error('[getRecentChapterActivity] Error:', error)
    return []
  }

  // Transform to MemberWithProfile format
  return data.map(profile => {
    const user = Array.isArray(profile.User) ? profile.User[0] : profile.User
    const chapter = Array.isArray(profile.Chapter) ? profile.Chapter[0] : profile.Chapter

    return {
      id: user?.id ?? '',
      email: user?.email ?? '',
      name: user?.name ?? '',
      phone: user?.phone ?? null,
      role: user?.role ?? 'member',
      createdAt: user?.createdAt ?? '',
      updatedAt: user?.updatedAt ?? '',
      StudentProfile: {
        userId: profile.userId,
        major: profile.major,
        graduationYear: profile.graduationYear,
        linkedinUrl: profile.linkedinUrl,
        skills: profile.skills,
        consentRecruiterVisibility: profile.consentRecruiterVisibility,
        isRecruiterVisible: profile.isRecruiterVisible,
        approvedById: profile.approvedById,
        isFilled: profile.isFilled,
        updatedAt: profile.updatedAt,
        createdAt: profile.createdAt,
        consentDate: profile.consentDate,
        chapterId: profile.chapterId
      },
      Chapter: chapter
    }
  }) as MemberWithProfile[]
}