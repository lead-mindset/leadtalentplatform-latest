'use server'

import { requireRecruiter } from '@/lib/auth'
import type { SupabaseClient } from '@supabase/supabase-js'

type RecruiterStudentProfile = {
  id: string
  name: string
  email: string
  chapter: { name: string; university: string } | null
  graduationYear: number | null
  major: string | null
  skills: string[]
  linkedinUrl: string | null
  resume: {
    fileName: string
    fileUrl: string
    uploadedAt: string
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
    .from('User')
    .select(
      `
      id, name, email,
      StudentProfile!inner (
        major, graduationYear, skills, linkedinUrl, isRecruiterVisible, approvalStatus, chapterId,
        Chapter:Chapter!StudentProfile_chapterId_fkey (name, university)
      ),
      Resume!left (
        fileName, fileUrl, uploadedAt
      )
      `
    )
    .eq('id', studentId)
    .eq('role', 'member')
    .eq('StudentProfile.isRecruiterVisible', true)
    .eq('StudentProfile.approvalStatus', 'approved')
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
    graduationYear: profile.graduationYear ?? null,
    major: profile.major ?? null,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    linkedinUrl: profile.linkedinUrl ?? null,
    resume: resume
      ? {
          fileName: resume.fileName,
          fileUrl: resume.fileUrl,
          uploadedAt: resume.uploadedAt,
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

  if (!student?.resume?.fileUrl) {
    return { success: false, error: 'Resume not available.' }
  }

  const storagePath = extractResumeStoragePath(student.resume.fileUrl)
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

  const { error: logError } = await supabase.from('ResumeDownloadLog').insert({
    recruiterId: user.id,
    studentId,
    downloadedAt: new Date().toISOString(),
  })

  if (logError) {
    console.error('[recruiter/student-profile] ResumeDownloadLog insert error:', logError)
    return { success: false, error: 'Failed to log resume download.' }
  }

  return { success: true, url: signedData.signedUrl }
}
