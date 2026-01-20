import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Fetch a specific student (for admin/recruiter view)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const studentId = params.id

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

    // 4. Fetch student data
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select(`
        *,
        chapter:Chapter(
          id,
          name,
          university,
          city,
          region
        )
      `)
      .eq('id', studentId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // 5. Fetch student profile
    const { data: profileData, error: profileError } = await supabase
      .from('StudentProfile')
      .select('*')
      .eq('userId', studentId)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      )
    }

    // 6. Check if student is visible to recruiters
    if (dbUser.role === 'recruiter') {
      if (!profileData.consentRecruiterVisibility || !profileData.isRecruiterVisible) {
        return NextResponse.json(
          { error: 'This student profile is not visible' },
          { status: 403 }
        )
      }
    }

    // 7. Fetch resume (most recent)
    const { data: resume } = await supabase
      .from('Resume')
      .select('*')
      .eq('studentId', studentId)
      .order('uploadedAt', { ascending: false })
      .limit(1)
      .single()

    // 8. Combine data
    const studentData = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      chapter: userData.chapter,
      profile: {
        major: profileData.major,
        graduationYear: profileData.graduationYear,
        linkedinUrl: profileData.linkedinUrl,
        skills: profileData.skills,
        consentRecruiterVisibility: profileData.consentRecruiterVisibility,
        isRecruiterVisible: profileData.isRecruiterVisible,
        approvedById: profileData.approvedById,
        updatedAt: profileData.updatedAt,
      },
      resume: resume || null,
    }

    return NextResponse.json(studentData)

  } catch (error) {
    console.error('Unexpected error fetching student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update student (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const studentId = params.id

  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify user is admin
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // 3. Get update data
    const body = await req.json()
    const {
      name,
      phone,
      chapterId,
      major,
      graduationYear,
      linkedinUrl,
      skills,
      isRecruiterVisible,
    } = body

    const now = new Date().toISOString()

    // 4. Update User table
    if (name || phone || chapterId) {
      const userUpdates: any = { updatedAt: now }
      if (name) userUpdates.name = name
      if (phone) userUpdates.phone = phone
      if (chapterId) userUpdates.chapterId = chapterId

      const { error: userError } = await supabase
        .from('User')
        .update(userUpdates)
        .eq('id', studentId)

      if (userError) {
        console.error('Failed to update user:', userError)
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        )
      }
    }

    // 5. Update StudentProfile table
    if (major || graduationYear || linkedinUrl || skills || isRecruiterVisible !== undefined) {
      const profileUpdates: any = { updatedAt: now }
      if (major) profileUpdates.major = major
      if (graduationYear) profileUpdates.graduationYear = graduationYear
      if (linkedinUrl) profileUpdates.linkedinUrl = linkedinUrl
      if (skills) profileUpdates.skills = skills
      if (isRecruiterVisible !== undefined) profileUpdates.isRecruiterVisible = isRecruiterVisible

      const { error: profileError } = await supabase
        .from('StudentProfile')
        .update(profileUpdates)
        .eq('userId', studentId)

      if (profileError) {
        console.error('Failed to update profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
    })

  } catch (error) {
    console.error('Unexpected error updating student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete student (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const studentId = params.id

  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify user is admin
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // 3. Delete resumes from storage first
    const { data: resumes } = await supabase
      .from('Resume')
      .select('fileUrl')
      .eq('studentId', studentId)

    if (resumes && resumes.length > 0) {
      // Extract file paths from URLs and delete from storage
      for (const resume of resumes) {
        const filePath = resume.fileUrl.split('/resumes/')[1]
        if (filePath) {
          await supabase.storage.from('resumes').remove([filePath])
        }
      }
    }

    // 4. Delete Resume records (will cascade or handle manually)
    await supabase.from('Resume').delete().eq('studentId', studentId)

    // 5. Delete StudentProfile
    await supabase.from('StudentProfile').delete().eq('userId', studentId)

    // 6. Delete User (this should cascade or be handled based on your DB constraints)
    const { error: deleteError } = await supabase
      .from('User')
      .delete()
      .eq('id', studentId)

    if (deleteError) {
      console.error('Failed to delete user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete student' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    })

  } catch (error) {
    console.error('Unexpected error deleting student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}