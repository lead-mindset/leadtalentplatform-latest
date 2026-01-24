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

  if (dbUser?.role === 'editor' && dbUser.chapterId === chapterId) {
    return { user, isAdmin: false }
  }

  throw new Error("Forbidden")
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const supabase = await createClient()
  const chapterId = params.id
  const memberId = params.memberId

  try {
    const { user } = await requireChapterEditorOrAdmin(supabase, chapterId)

    const { data: member } = await supabase
      .from('User')
      .select('chapterId')
      .eq('id', memberId)
      .single()

    if (!member || member.chapterId !== chapterId) {
      return NextResponse.json(
        { error: 'Member not found in this chapter' },
        { status: 404 }
      )
    }

    const { data: profile } = await supabase
      .from('StudentProfile')
      .select('approvedById')
      .eq('userId', memberId)
      .single()

    if (profile?.approvedById) {
      return NextResponse.json(
        { error: 'Member already approved' },
        { status: 409 }
      )
    }

    const { error: approveError } = await supabase
      .from('StudentProfile')
      .update({
        approvedById: user.id,
        isRecruiterVisible: true, // Make visible to recruiters when approved
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', memberId)

    if (approveError) {
      console.error('Failed to approve member:', approveError)
      return NextResponse.json(
        { error: 'Failed to approve member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member approved successfully',
      approvedById: user.id,
    })

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const supabase = await createClient()
  const chapterId = params.id
  const memberId = params.memberId

  try {
    await requireChapterEditorOrAdmin(supabase, chapterId)

    const { data: member } = await supabase
      .from('User')
      .select('chapterId')
      .eq('id', memberId)
      .single()

    if (!member || member.chapterId !== chapterId) {
      return NextResponse.json(
        { error: 'Member not found in this chapter' },
        { status: 404 }
      )
    }

    const { error: rejectError } = await supabase
      .from('StudentProfile')
      .update({
        approvedById: null,
        isRecruiterVisible: false, // Hide from recruiters when rejected
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', memberId)

    if (rejectError) {
      console.error('Failed to reject member:', rejectError)
      return NextResponse.json(
        { error: 'Failed to reject member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member approval removed',
    })

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
