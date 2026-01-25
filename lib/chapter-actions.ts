'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ChapterData, MemberWithProfile, ChapterStats, RecentActivityMember } from './types'
export async function getChapterData(): Promise<ChapterData | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userData, error: userError } = await supabase
    .from('User')
    .select(`
      role,
      chapterId,
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
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    throw new Error('Failed to fetch user data')
  }

  if (userData.role !== 'editor') {
    redirect('/student')
  }

  if (!userData.chapterId) {
    return null
  }

  // Fetch all members with their profiles
  const { data: members, error: membersError } = await supabase
    .from('User')
    .select(`
      id,
      email,
      name,
      phone,
      role,
      createdAt,
      updatedAt,
      chapterId,
      StudentProfile!StudentProfile_userId_fkey (
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
      )
    `)
    .eq('chapterId', userData.chapterId)
    .order('createdAt', { ascending: false })

  if (membersError) {
    console.error('Failed to fetch chapter members:', membersError)
    throw new Error('Failed to fetch chapter members')
  }

  const allMembers: MemberWithProfile[] = (members || []).map(m => ({
    ...m,
    Chapter: null
  }))

  // Calculate statistics
  const pendingMembers = allMembers.filter(m => 
    m.StudentProfile && 
    m.StudentProfile.isFilled === true && 
    m.StudentProfile.approvedById === null
  )
  
  const approvedMembers = allMembers.filter(m => 
    m.StudentProfile && 
    m.StudentProfile.approvedById !== null
  )

  const completeProfiles = allMembers.filter(
    m => m.StudentProfile?.isFilled === true
  ).length

  const visibleToRecruiters = allMembers.filter(
    m => m.StudentProfile?.isRecruiterVisible === true
  ).length

  const totalMembers = allMembers.length
  const pendingCount = pendingMembers.length
  const approvedCount = approvedMembers.length

  const completionRate = totalMembers 
    ? Math.round((completeProfiles / totalMembers) * 100)
    : 0

  const approvalRate = totalMembers
    ? Math.round((approvedCount / totalMembers) * 100)
    : 0

  const stats: ChapterStats = {
    totalMembers,
    pendingCount,
    approvedCount,
    visibleToRecruiters,
    completeProfiles,
    completionRate,
    approvalRate
  }

  // Get recent activity
  const recentActivity: RecentActivityMember[] = approvedMembers
    .filter((m): m is RecentActivityMember => 
      m.StudentProfile !== null && 
      m.StudentProfile.approvedById !== null && 
      !!m.StudentProfile.updatedAt
    )
    .sort((a, b) => {
      const dateA = new Date(a.StudentProfile.updatedAt).getTime()
      const dateB = new Date(b.StudentProfile.updatedAt).getTime()
      return dateB - dateA
    })
    .slice(0, 10)

  const chapterInfo = userData.Chapter as { name: string; university: string } | null

  return {
    chapterId: userData.chapterId,
    chapterName: chapterInfo?.name || 'Unknown Chapter',
    university: chapterInfo?.university || 'Unknown University',
    stats,
    pendingMembers,
    recentActivity
  }
}
