import { createClient } from '@/lib/supabase/server'
import { ChapterService } from '@/lib/services/chapter.service'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chapterId = await ChapterService.getStudentChapterId(supabase, user.id)
  if (!chapterId) {
    return NextResponse.json({ error: 'No chapter found' }, { status: 404 })
  }

  const members = await ChapterService.getChapterMembers(supabase, chapterId)

  return NextResponse.json(
    members.map((member) => ({
      id: member.id,
      user_id: member.id,
      name: member.name ?? '',
      email: member.email,
      major: member.person_profile?.major_or_interest ?? '',
      graduation_year: member.person_profile?.graduation_year ?? null,
      approval_status: member.chapter_membership?.status ?? null,
      position: member.chapter_membership?.position ?? null,
      member_id: member.chapter_membership?.member_id ?? null,
      created_at: member.created_at,
      chapter_id: member.chapter_membership?.chapter_id ?? chapterId,
    }))
  )
}
