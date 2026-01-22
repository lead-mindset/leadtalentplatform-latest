import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Fetch student's resume
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: studentId } = await params  // AWAIT params here

  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify user is the student, recruiter, or admin
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is viewing their own resume OR is recruiter/admin
    const isOwnResume = user.id === studentId
    const isRecruiterOrAdmin = dbUser.role === 'recruiter' || dbUser.role === 'admin'

    if (!isOwnResume && !isRecruiterOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. If recruiter, verify active access
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

    // 4. Fetch most recent resume
    const { data: resume, error } = await supabase
      .from('Resume')
      .select('*')
      .eq('studentId', studentId)
      .order('uploadedAt', { ascending: false })
      .limit(1)
      .single()

    if (error || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(resume)

  } catch (error) {
    console.error('Unexpected error fetching resume:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Upload resume (student or admin)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: studentId } = await params  // AWAIT params here

  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify user is the student or admin
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isOwnResume = user.id === studentId
    const isAdmin = dbUser.role === 'admin'

    if (!isOwnResume && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only upload your own resume' },
        { status: 403 }
      )
    }

    // 3. Get file from form data
    const formData = await req.formData()
    const resume = formData.get('resume') as File

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume file is required' },
        { status: 400 }
      )
    }

    if (resume.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // 4. Upload to Supabase Storage
    const filePath = `${studentId}/${crypto.randomUUID()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, resume, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Resume upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload resume' },
        { status: 500 }
      )
    }

    // 5. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath)

    // 6. Insert into Resume table
    const now = new Date().toISOString()

    const { data: resumeRecord, error: insertError } = await supabase
      .from('Resume')
      .insert({
        studentId,
        fileUrl: publicUrl,
        fileName: resume.name,
        fileSize: resume.size,
        uploadedAt: now,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Resume insert error:', insertError)
      
      // Cleanup uploaded file
      await supabase.storage.from('resumes').remove([filePath])
      
      return NextResponse.json(
        { error: 'Failed to save resume record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resume: resumeRecord,
    })

  } catch (error) {
    console.error('Unexpected error uploading resume:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete resume (student or admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: studentId } = await params  // AWAIT params here

  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify user is the student or admin
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isOwnResume = user.id === studentId
    const isAdmin = dbUser.role === 'admin'

    if (!isOwnResume && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own resume' },
        { status: 403 }
      )
    }

    // 3. Get resume ID from query params or body
    const { searchParams } = new URL(req.url)
    const resumeId = searchParams.get('resumeId')

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    // 4. Fetch resume to get file URL
    const { data: resume, error: fetchError } = await supabase
      .from('Resume')
      .select('fileUrl')
      .eq('id', resumeId)
      .eq('studentId', studentId)
      .single()

    if (fetchError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // 5. Extract file path and delete from storage
    const filePath = resume.fileUrl.split('/resumes/')[1]
    
    if (filePath) {
      await supabase.storage.from('resumes').remove([filePath])
    }

    // 6. Delete resume record from database
    const { error: deleteError } = await supabase
      .from('Resume')
      .delete()
      .eq('id', resumeId)

    if (deleteError) {
      console.error('Failed to delete resume record:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete resume' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully',
    })

  } catch (error) {
    console.error('Unexpected error deleting resume:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}