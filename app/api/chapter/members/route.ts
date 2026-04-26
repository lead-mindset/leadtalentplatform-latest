import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApprovalStatus } from '@/lib/types'

type ChapterMembersProfileRow = {
  user_id: string
  major: string
  graduation_year: number
  approval_status: ApprovalStatus
  member_id: string | null
  created_at: string
  chapter_id: string
  User: {
    id: string
    name: string
    email: string
    created_at: string
  } | {
    id: string
    name: string
    email: string
    created_at: string
  }[]
}

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('student_profile')
    .select('chapter_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'No chapter found' }, { status: 404 })
  }

  const { data: members, error } = await supabase
    .from('student_profile')
    .select(`
      user_id,
      major,
      graduation_year,
      approval_status,
      member_id,
      created_at,
      chapter_id,
      User:user_id (
        id,
        name,
        email,
        created_at
      )
    `)
    .eq('chapter_id', profile.chapter_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }

  const transformedMembers = (members ?? []).map((member: ChapterMembersProfileRow) => {
    const linkedUser = Array.isArray(member.user) ? member.user[0] : member.user

return {
      id: member.user_id,
      user_id: member.user_id,
      name: linkedUser?.name ?? '',
      email: linkedUser?.email ?? '',
      major: member.major,
      graduation_year: member.graduation_year,
      approval_status: member.approval_status,
      member_id: member.member_id,
      created_at: member.created_at,
      chapter_id: member.chapter_id,
    }
  })

  return NextResponse.json(transformedMembers)
}
