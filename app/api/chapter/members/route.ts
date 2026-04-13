import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const transformedMembers = members.map((member: any) => ({
    id: member.userId,
    userId: member.userId,
    name: member.User.name,
    email: member.User.email,
    major: member.major,
    graduationYear: member.graduationYear,
    approvalStatus: member.approvalStatus,
    memberId: member.memberId,
    createdAt: member.createdAt,
    chapterId: member.chapterId,
  }))

  return NextResponse.json(transformedMembers)
}
