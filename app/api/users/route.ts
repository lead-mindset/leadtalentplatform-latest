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

// GET: List all users (with optional filters)
export async function GET(req: NextRequest) {
  const supabase = await createClient()

  try {
    await requireAdmin(supabase)

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const chapterId = searchParams.get('chapterId')
    const search = searchParams.get('search') // Search by name or email

    let query = supabase
      .from('User')
      .select(`
        *,
        chapter:Chapter(id, name, university),
        studentProfile:StudentProfile(
          major,
          graduationYear,
          consentRecruiterVisibility,
          isRecruiterVisible,
          isFilled
        )
      `)
      .order('createdAt', { ascending: false })

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }

    if (chapterId) {
      query = query.eq('chapterId', chapterId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Failed to fetch users:', error)
      throw error
    }

    return NextResponse.json({ users })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(100),
  role: z.enum(['member', 'editor', 'admin', 'recruiter']),
  chapterId: z.string().optional(),
  phone: z.string().optional(),
})

// POST: Create a new user (admin only)
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  try {
    const admin = await requireAdmin(supabase)

    const body = await req.json()
    const parsed = CreateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Note: This creates a User record, but doesn't create an auth account
    // The user will need to sign up separately or use an invite system
    // This is mainly for admin to pre-populate user records

    const now = new Date().toISOString()

    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert({
        email: data.email,
        name: data.name,
        role: data.role,
        chapterId: data.chapterId,
        phone: data.phone,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create user:', createError)
      
      if (createError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        )
      }

      throw createError
    }

    return NextResponse.json({ 
      success: true,
      user: newUser 
    }, { status: 201 })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}