import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: List students (for company dashboard talent pool)
export async function GET(req: NextRequest) {
  const supabase = await createClient()

  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify user is recruiter or admin
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!dbUser || (dbUser.role !== 'recruiter' && dbUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. If recruiter, verify they have active access
    if (dbUser.role === 'recruiter') {
      const { data: access } = await supabase
        .from('RecruiterAccess')
        .select('isActive, revokedAt')
        .eq('acceptedByUserId', user.id)
        .single()

      if (!access || !access.isActive || access.revokedAt) {
        return NextResponse.json(
          { error: 'You do not have active recruiter access' },
          { status: 403 }
        )
      }
    }

    // 4. Get query parameters for filtering
    const { searchParams } = new URL(req.url)
    const major = searchParams.get('major')
    const gradYear = searchParams.get('gradYear')
    const skills = searchParams.get('skills')?.split(',')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 5. Build query for students
    let query = supabase
      .from('StudentProfile')
      .select(`
        *,
        user:User!inner(
          id,
          name,
          email,
          chapterId,
          chapter:Chapter(name, university)
        ),
        resume:Resume(
          id,
          fileUrl,
          fileName,
          uploadedAt
        )
      `, { count: 'exact' })
      .eq('consentRecruiterVisibility', true)
      .eq('isRecruiterVisible', true)
      .eq('isFilled', true)

    // 6. Apply filters
    if (major) {
      query = query.ilike('major', `%${major}%`)
    }

    if (gradYear) {
      query = query.eq('graduationYear', parseInt(gradYear))
    }

    if (skills && skills.length > 0) {
      query = query.contains('skills', skills)
    }

    // 7. Apply pagination and ordering
    query = query
      .order('updatedAt', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: students, error, count } = await query

    if (error) {
      console.error('Failed to fetch students:', error)
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    // 8. Return results with pagination metadata
    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    console.error('Unexpected error fetching students:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}