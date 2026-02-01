
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
      chapterId,
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
        consentDate
      ),
      Chapter (
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

  if (error || !data) {
    console.error('Failed to fetch chapter members:', error)
    return []
  }
  return data.map(member => ({
    ...member,
    StudentProfile: Array.isArray(member.StudentProfile)
      ? member.StudentProfile[0] ?? null
      : member.StudentProfile ?? null,
    Chapter: Array.isArray(member.Chapter)
      ? member.Chapter[0] ?? null
      : member.Chapter ?? null
  })) as MemberWithProfile[]
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
