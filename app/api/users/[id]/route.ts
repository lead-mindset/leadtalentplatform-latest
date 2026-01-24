import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error("Unauthorized")
  }

  const { data: dbUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbUser?.role !== 'admin') {
    throw new Error("Forbidden")
  }

  return user
}

// GET: Fetch a specific user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const userId = params.id

  try {
    await requireAdmin(supabase)

    const { data: user, error } = await supabase
      .from('User')
      .select(`
        *,
        chapter:Chapter(id, name, university, city),
        studentProfile:StudentProfile(
          major,
          graduationYear,
          linkedinUrl,
          skills,
          consentRecruiterVisibility,
          consentDate,
          isRecruiterVisible,
          approvedById,
          isFilled,
          createdAt,
          updatedAt
        ),
        resumes:Resume(
          id,
          fileUrl,
          fileName,
          fileSize,
          uploadedAt
        )
      `)
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to fetch user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['member', 'editor', 'admin', 'recruiter']).optional(),
  chapterId: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
})

// PATCH: Update a user (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const userId = params.id

  try {
    await requireAdmin(supabase)

    const body = await req.json()
    const parsed = UpdateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .single()

    if (findError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update user:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a user (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const userId = params.id

  try {
    await requireAdmin(supabase)

    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .single()

    if (findError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (cascade will handle related records based on your DB constraints)
    const { error: deleteError } = await supabase
      .from('User')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Failed to delete user:', deleteError)
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
