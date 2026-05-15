import { logger } from '@/lib/logger'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import { CompanyService } from '@/lib/services/company.service'
import type { StudentForRecruiter } from '@/lib/types'

export type TalentPoolFilters = {
  query?: string
  graduation_year?: number
  chapter_id?: string
  skills?: string[]
}

export type TalentPoolPagination = {
  page?: number
  pageSize?: number
}

export type TalentPoolStudent = {
  id: string
  name: string
  email: string
  chapter: { name: string; university: string } | null
  graduation_year: number | null
  major: string | null
  skills: string[]
  updated_at: string
}

type InviteAcceptanceAccess = {
  id: string
  recruiter_email: string
  accepted_at: string | null
  accepted_by_user_id: string | null
  invite_expires_at: string | null
  revoked_at: string | null
  company_id: string
}

function parsePagination(pagination?: TalentPoolPagination) {
  const page = Math.max(1, pagination?.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, pagination?.pageSize ?? 12))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { page, pageSize, from, to }
}

function mapVisibleStudentToTalentPoolStudent(student: StudentForRecruiter): TalentPoolStudent | null {
  const profile = student.person_profile
  if (!profile) return null

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    chapter: student.chapter
      ? {
          name: student.chapter.name,
          university: student.chapter.university,
        }
      : null,
    graduation_year: profile.graduation_year,
    major: profile.major_or_interest,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    updated_at: profile.updated_at,
  }
}

export const RecruiterService = {
  async getTalentPool(
    supabase: SupabaseClient<Database>,
    filters: TalentPoolFilters,
    pagination?: TalentPoolPagination
  ) {
    const { page, pageSize, from, to } = parsePagination(pagination)

    const visibleStudents = await CompanyService.searchStudents(supabase, {
      query: filters.query,
      graduation_year: filters.graduation_year,
      chapter_id: filters.chapter_id,
    })

    const students = visibleStudents
      .map(mapVisibleStudentToTalentPoolStudent)
      .filter((student): student is TalentPoolStudent => student !== null)
      .filter((student) => {
        if (!filters.skills || filters.skills.length === 0) return true
        return filters.skills.every((skill) => student.skills.includes(skill))
      })

    const total = students.length
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
    const paginatedStudents = students.slice(from, to + 1)

    return {
      students: paginatedStudents,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
    }
  },

  async getSavedStudents(
    supabase: SupabaseClient<Database>,
    recruiterId: string,
    filters: TalentPoolFilters,
    pagination?: TalentPoolPagination
  ) {
    const { page, pageSize } = parsePagination(pagination)
    const query = filters.query?.trim().toLowerCase()
    const savedRows = await CompanyService.getSavedStudents(supabase, recruiterId)
    const savedChapterIdsByStudentId = new Map(
      savedRows.map((saved) => [saved.student_id, saved.student.person_profile?.chapter_id ?? null])
    )

    const students = savedRows
      .map((saved) => mapVisibleStudentToTalentPoolStudent(saved.student))
      .filter((student): student is TalentPoolStudent => student !== null)
      .filter((student) => !query || student.name.toLowerCase().includes(query))
      .filter((student) => !filters.graduation_year || student.graduation_year === filters.graduation_year)
      .filter((student) => !filters.chapter_id || savedChapterIdsByStudentId.get(student.id) === filters.chapter_id)
      .filter((student) => {
        if (!filters.skills || filters.skills.length === 0) return true
        return filters.skills.every((skill) => student.skills.includes(skill))
      })

    const total = students.length
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
    const paginatedStudents = students.slice((page - 1) * pageSize, page * pageSize)

    return {
      students: paginatedStudents,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
    }
  },

  async getTalentPoolFilterOptions(supabase: SupabaseClient<Database>) {
    const visibleStudents = await CompanyService.getVisibleStudents(supabase)
    const years = Array.from(
      new Set(
        visibleStudents
          .map((student) => student.person_profile?.graduation_year ?? null)
          .filter((year): year is number => !!year)
      )
    ).sort((a, b) => a - b)

    const chaptersById = new Map<string, { id: string; name: string }>()
    for (const student of visibleStudents) {
      const chapter = student.chapter
      if (chapter?.id && chapter?.name && !chaptersById.has(chapter.id)) {
        chaptersById.set(chapter.id, { id: chapter.id, name: chapter.name })
      }
    }

    const chapters = Array.from(chaptersById.values()).sort((a, b) => a.name.localeCompare(b.name))
    return { years, chapters }
  },

  async getSavedStatus(
    supabase: SupabaseClient<Database>,
    recruiterId: string,
    studentIds: string[]
  ) {
    if (studentIds.length === 0) return []

    const { data, error } = await supabase
      .from('saved_student')
      .select('student_id')
      .eq('recruiter_id', recruiterId)
      .in('student_id', studentIds)

    if (error) {
      logger.error({ context: 'recruiter/talent-pool', error: error }, 'getSavedStatus error')
      return []
    }

    return (data ?? []).map((row: { student_id: string }) => row.student_id)
  },

  async getStudentProfile(
    supabase: SupabaseClient<Database>,
    studentId: string
  ): Promise<{
    id: string
    name: string
    email: string
    chapter: { name: string; university: string } | null
    graduation_year: number | null
    major: string | null
    skills: string[]
    linkedin_url: string | null
    portfolio_url: string | null
    resume: {
      file_name: string
      file_url: string
      uploaded_at: string
    } | null
  } | null> {
    const student = await CompanyService.getStudentById(supabase, studentId)
    if (!student) return null
    if (!student.person_profile) return null

    const { data: resume, error } = await supabase
      .from('resume')
      .select('file_name, file_url, uploaded_at')
      .eq('student_id', studentId)
      .maybeSingle<{ file_name: string; file_url: string; uploaded_at: string }>()

    if (error) {
      logger.error({ context: 'RecruiterService.getStudentProfile', error }, 'resume load error')
    }

    return {
      id: student.id,
      name: student.name ?? '',
      email: student.email,
      chapter: student.chapter ? { name: student.chapter.name, university: student.chapter.university } : null,
      graduation_year: student.person_profile.graduation_year ?? null,
      major: student.person_profile.major_or_interest ?? null,
      skills: Array.isArray(student.person_profile.skills) ? student.person_profile.skills : [],
      linkedin_url: student.person_profile.linkedin_url ?? null,
      portfolio_url: student.person_profile.portfolio_url ?? null,
      resume: resume
        ? {
            file_name: resume.file_name,
            file_url: resume.file_url,
            uploaded_at: resume.uploaded_at,
          }
        : null,
    }
  },

  async downloadResume(
    supabase: SupabaseClient<Database>,
    recruiterId: string,
    studentId: string,
    fileUrl: string
  ): Promise<{ success: true; url: string } | { success: false; error: string }> {
    const student = await this.getStudentProfile(supabase, studentId)
    if (!student) {
      return { success: false, error: 'Profile not found or unavailable.' }
    }

    const marker = '/storage/v1/object/public/resumes/'
    const markerIndex = fileUrl.indexOf(marker)
    if (markerIndex < 0) {
      return { success: false, error: 'Invalid resume file path.' }
    }

    const storagePath = decodeURIComponent(fileUrl.slice(markerIndex + marker.length))

    const { data: signedData, error: signedError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, 60 * 5)

    if (signedError || !signedData?.signedUrl) {
      logger.error({ context: 'RecruiterService.downloadResume', error: signedError }, 'createSignedUrl error')
      return { success: false, error: 'Failed to generate download URL.' }
    }

    const { error: logError } = await supabase.from('resume_download_log').insert({
      recruiter_id: recruiterId,
      student_id: studentId,
      downloaded_at: new Date().toISOString(),
    })

    if (logError) {
      logger.error({ context: 'RecruiterService.downloadResume', error: logError }, 'ResumeDownloadLog insert error')
      return { success: false, error: 'Failed to log resume download.' }
    }

    return { success: true, url: signedData.signedUrl }
  },

  async validateInviteToken(
    supabase: SupabaseClient<Database>,
    token: string
  ): Promise<
    | {
        valid: true
        access: InviteAcceptanceAccess
      }
    | { valid: false; error: string; code: 'invalid' | 'expired' | 'revoked' }
  > {
    const normalized = token.trim()
    if (!normalized) {
      return {
        valid: false,
        code: 'invalid',
        error: "This invite link isn't valid. Contact your LEAD representative.",
      }
    }

    const { data, error } = await supabase
      .from('recruiter_access')
      .select('id, recruiter_email, accepted_at, accepted_by_user_id, invite_expires_at, revoked_at, company_id')
      .eq('invite_token', normalized)
      .maybeSingle()

    if (error || !data) {
      return {
        valid: false,
        code: 'invalid',
        error: "This invite link isn't valid. Contact your LEAD representative.",
      }
    }

    if (data.revoked_at) {
      return {
        valid: false,
        code: 'revoked',
        error: "This invite link isn't valid. Contact your LEAD representative.",
      }
    }

    if (data.invite_expires_at && new Date(data.invite_expires_at).getTime() <= Date.now()) {
      return {
        valid: false,
        code: 'expired',
        error:
          'This invite link has expired. Reach out to support@leadtalentplatform.com to request a new one.',
      }
    }

    return {
      valid: true,
      access: {
        id: data.id,
        recruiter_email: data.recruiter_email,
        accepted_at: data.accepted_at,
        accepted_by_user_id: data.accepted_by_user_id,
        invite_expires_at: data.invite_expires_at,
        revoked_at: data.revoked_at,
        company_id: data.company_id,
      },
    }
  },

  async acceptInvite(
    supabase: SupabaseClient<Database>,
    userId: string,
    token: string,
    authEmail: string,
    authName: string
  ): Promise<{ success: true } | { success: false; error: string }> {
    const validation = await this.validateInviteToken(supabase, token)
    if (!validation.valid) return { success: false, error: validation.error }

    const invitedEmail = validation.access.recruiter_email.toLowerCase()
    if (authEmail.toLowerCase() !== invitedEmail) {
      return {
        success: false,
        error: `This invite was sent to ${validation.access.recruiter_email}. Please sign in with that email address.`,
      }
    }

    const now = new Date().toISOString()

    if (validation.access.accepted_at && validation.access.accepted_by_user_id !== userId) {
      return {
        success: false,
        error: 'This invite has already been accepted by another account.',
      }
    }

    if (!validation.access.accepted_at) {
      const { error: updateInviteError } = await supabase
        .from('recruiter_access')
        .update({
          accepted_at: now,
          accepted_by_user_id: userId,
          is_active: true,
        })
        .eq('id', validation.access.id)

      if (updateInviteError) {
        logger.error({ context: 'RecruiterService.acceptInvite', error: updateInviteError }, 'update error')
        return { success: false, error: 'Failed to accept invite.' }
      }
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('user')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (existingUserError) {
      logger.error({ context: 'RecruiterService.acceptInvite', error: existingUserError }, 'existing user lookup error')
      return { success: false, error: 'Failed to accept invite.' }
    }

    if (existingUser) {
      const { error: roleError } = await supabase
        .from('user')
        .update({ role: 'recruiter', updated_at: now })
        .eq('id', userId)

      if (roleError) {
        logger.error({ context: 'RecruiterService.acceptInvite', error: roleError }, 'role update error')
        return { success: false, error: 'Failed to accept invite.' }
      }
    } else {
      const { error: createUserError } = await supabase.from('user').insert({
        id: userId,
        email: authEmail,
        name: authName,
        role: 'recruiter',
        phone: null,
        created_at: now,
        updated_at: now,
        deactivated_at: null,
      })
      if (createUserError) {
        logger.error({ context: 'RecruiterService.acceptInvite', error: createUserError }, 'user insert error')
        return { success: false, error: 'Failed to accept invite.' }
      }
    }

    return { success: true }
  },
}
