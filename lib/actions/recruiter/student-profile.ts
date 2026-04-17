'use server'

import { requireRecruiter } from '@/lib/auth'
import type { SupabaseClient } from '@supabase/supabase-js'

type RecruiterStudentProfile = {
  id: string
  name: string
  email: string
  chapter: { name: string; university: string } | null
  graduation_year: number | null
  major: string | null
  skills: string[]
  linkedin_url: string | null
  resume: {
    file_name: string
    file_url: string
    uploaded_at: string
  } | null
}

function extractResumeStoragePath(fileUrl: string) {
  const marker = '/storage/v1/object/public/resumes/'
  const markerIndex = fileUrl.indexOf(marker)
  if (markerIndex < 0) return null

  return decodeURIComponent(fileUrl.slice(markerIndex + marker.length))
}

async function getStudentProfile(
  supabase: SupabaseClient,
  studentId: string
): Promise<RecruiterStudentProfile | null> {
  const { data, error } = await supabase
    .from('user')
    .select(
      `
      id, name, email,
      StudentProfile!inner (
        major, graduation_year, skills, linkedin_url, is_recruiter_visible, approval_status, chapter_id,
        Chapter:Chapter!StudentProfile_chapter_id_fkey (name, university)
      ),
      Resume!left (
        file_name, file_url, uploaded_at
      )
      `
    )
    .eq('id', studentId)
    .eq('role', 'member')
    .eq('StudentProfile.is_recruiter_visible', true)
    .eq('StudentProfile.approval_status', 'approved')
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[recruiter/student-profile] getStudentProfileForRecruiter error:', error)
    return null
  }

  const profile = Array.isArray(data.StudentProfile) ? data.StudentProfile[0] : data.StudentProfile
  if (!profile) return null
  const chapter = Array.isArray(profile.Chapter) ? profile.Chapter[0] : profile.Chapter
  const resume = Array.isArray(data.Resume) ? data.Resume[0] : data.Resume

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    chapter: chapter ? { name: chapter.name, university: chapter.university } : null,
    graduation_year: profile.graduation_year ?? null,
    major: profile.major ?? null,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    linkedin_url: profile.linkedin_url ?? null,
    resume: resume
      ? {
          file_name: resume.file_name,
          file_url: resume.file_url,
          uploaded_at: resume.uploaded_at,
        }
      : null,
  }
}

export async function getStudentProfileForRecruiter(studentId: string): Promise<RecruiterStudentProfile | null> {
  const { supabase } = await requireRecruiter()
  return getStudentProfile(supabase, studentId)
}

export async function downloadResume(studentId: string) {
  const { supabase, user } = await requireRecruiter()
  const student = await getStudentProfile(supabase, studentId)

  if (!student?.resume?.file_url) {
    return { success: false, error: 'Resume not available.' }
  }

  const storagePath = extractResumeStoragePath(student.resume.file_url)
  if (!storagePath) {
    return { success: false, error: 'Invalid resume file path.' }
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from('resumes')
    .createSignedUrl(storagePath, 60 * 5)

  if (signedError || !signedData?.signedUrl) {
    console.error('[recruiter/student-profile] createSignedUrl error:', signedError)
    return { success: false, error: 'Failed to generate download URL.' }
  }

  const { error: logError } = await supabase.from('resume_download_log').insert({
    recruiter_id: user.id,
    student_id,
    downloaded_at: new Date().toISOString(),
  })

  if (logError) {
    console.error('[recruiter/student-profile] ResumeDownloadLog insert error:', logError)
    return { success: false, error: 'Failed to log resume download.' }
  }

  return { success: true, url: signedData.signedUrl }
}
