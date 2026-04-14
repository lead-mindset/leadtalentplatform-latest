import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApprovalStatus } from '@/lib/types'

type ChapterMembersProfileRow = {
  userId: string
  major: string
  graduationYear: number
  approvalStatus: ApprovalStatus
  memberId: string | null
  createdAt: string
  chapterId: string
  User: {
    id: string
    name: string
    email: string
    createdAt: string
  } | {
    id: string
    name: string
    email: string
    createdAt: string
  }[]
}

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('StudentProfile')
    .select('chapterId')
    .eq('userId', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'No chapter found' }, { status: 404 })
  }

  const { data: members, error } = await supabase
    .from('StudentProfile')
    .select(`
      userId,
      major,
      graduationYear,
      approvalStatus,
      memberId,
      createdAt,
      chapterId,
      User:userId (
        id,
        name,
        email,
        createdAt
      )
    `)
    .eq('chapterId', profile.chapterId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }

  const transformedMembers = (members ?? []).map((member: ChapterMembersProfileRow) => {
    const linkedUser = Array.isArray(member.User) ? member.User[0] : member.User

    return {
    id: member.userId,
    userId: member.userId,
    name: linkedUser?.name ?? '',
    email: linkedUser?.email ?? '',
    major: member.major,
    graduationYear: member.graduationYear,
    approvalStatus: member.approvalStatus,
    memberId: member.memberId,
    createdAt: member.createdAt,
    chapterId: member.chapterId,
    }
  })

  return NextResponse.json(transformedMembers)
}
