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
      student_profile!user_id!inner (
        major, graduation_year, skills, linkedin_url, is_recruiter_visible, approval_status, chapter_id,
        chapter:chapter!student_profile_chapter_id_fkey (name, university)
      ),
      resume!left (
        file_name, file_url, uploaded_at
      )
      `
    )
    .eq('id', studentId)
    .eq('role', 'member')
    .eq('student_profile.is_recruiter_visible', true)
    .eq('student_profile.approval_status', 'approved')
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[recruiter/student-profile] getStudentProfileForRecruiter error:', error)
    return null
  }

  const profile = Array.isArray(data.student_profile) ? data.student_profile[0] : data.student_profile
  if (!profile) return null
  const chapter = Array.isArray(profile.chapter) ? profile.chapter[0] : profile.chapter
  const resume = Array.isArray(data.resume) ? data.resume[0] : data.resume

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
