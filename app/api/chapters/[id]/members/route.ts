import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireChapterEditorOrAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  chapterId: string
) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error("Unauthorized")
  }

  const { data: dbUser } = await supabase
    .from('User')
    .select('role, chapterId')
    .eq('id', user.id)
    .single()

  if (dbUser?.role === 'admin') {
    return { user, isAdmin: true }
  }

  if (dbUser?.role === 'chapter_editor' && dbUser.chapterId === chapterId) {
    return { user, isAdmin: false }
  }

  throw new Error("Forbidden")
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const chapterId = params.id

  try {
    await requireChapterEditorOrAdmin(supabase, chapterId)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // 'all', 'pending', 'approved'

    let query = supabase
      .from('User')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        createdAt,
        StudentProfile (
          userId,
          major,
          graduationYear,
          linkedinUrl,
          skills,
          consentRecruiterVisibility,
          isRecruiterVisible,
          approvedById,
          isFilled,
          updatedAt
        )
      `)
      .eq('chapterId', chapterId)

    if (status === 'pending') {
      query = query.is('StudentProfile.approvedById', null)
    } else if (status === 'approved') {
      query = query.not('StudentProfile.approvedById', 'is', null)
    }

    const { data: members, error } = await query.order('createdAt', { ascending: false })

    if (error) {
      console.error('Failed to fetch chapter members:', error)
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      )
    }

    return NextResponse.json({ members })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Chapter editor or admin access required' }, { status: 403 })
      }
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}