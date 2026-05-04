import { logger } from '@/lib/logger'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import type { ChapterRow, PersonProfileRow, UserRow } from '@/lib/types'

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

type TalentPoolProfileRow = Pick<
  PersonProfileRow,
  'graduation_year' | 'major_or_interest' | 'skills' | 'updated_at' | 'linkedin_url'
> & {
  chapter_membership: {
    chapter: Pick<ChapterRow, 'name' | 'university'> | Pick<ChapterRow, 'name' | 'university'>[] | null
  }
}

type TalentPoolRow = Pick<UserRow, 'id' | 'name' | 'email'> & {
  person_profile: TalentPoolProfileRow | TalentPoolProfileRow[] | null
}

type SavedTalentPoolRow = {
  student: TalentPoolRow | TalentPoolRow[] | null
}

type TalentPoolFilterRow = Pick<PersonProfileRow, 'graduation_year'> & {
  chapter_membership: {
    chapter: { id: string; name: string } | { id: string; name: string }[] | null
  }
}

function mapTalentPoolRow(row: TalentPoolRow): TalentPoolStudent | null {
  const profile = Array.isArray(row.person_profile) ? row.person_profile[0] : row.person_profile
  if (!profile) return null

  const chapter = Array.isArray(profile.chapter_membership.chapter)
    ? profile.chapter_membership.chapter[0]
    : profile.chapter_membership.chapter

  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email,
    chapter: chapter
      ? {
          name: chapter.name,
          university: chapter.university,
        }
      : null,
    graduation_year: profile.graduation_year ?? null,
    major: profile.major_or_interest ?? null,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    updated_at: profile.updated_at,
  }
}

function parsePagination(pagination?: TalentPoolPagination) {
  const page = Math.max(1, pagination?.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, pagination?.pageSize ?? 12))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { page, pageSize, from, to }
}

export const RecruiterService = {
  async getTalentPool(
    supabase: SupabaseClient<Database>,
    filters: TalentPoolFilters,
    pagination?: TalentPoolPagination
  ) {
    const { page, pageSize, from, to } = parsePagination(pagination)

    let query = supabase
      .from('user')
      .select(
        `
        id, name, email,
        person_profile!user_id!inner (
          graduation_year, major_or_interest, skills, updated_at, is_recruiter_visible,
          chapter_membership!user_id!inner (
            status,
            chapter_id,
            chapter (name, university)
          )
        )
        `,
        { count: 'exact' }
      )
      .eq('role', 'member')
      .eq('person_profile.is_recruiter_visible', true)
      .eq('person_profile.chapter_membership.status', 'approved')
      .order('updated_at', { ascending: false, referencedTable: 'person_profile' })
      .range(from, to)

    if (filters.query?.trim()) {
      query = query.ilike('name', `%${filters.query.trim()}%`)
    }

    if (filters.graduation_year) {
      query = query.eq('person_profile.graduation_year', filters.graduation_year)
    }

    if (filters.chapter_id) {
      query = query.eq('person_profile.chapter_membership.chapter_id', filters.chapter_id)
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.contains('person_profile.skills', filters.skills)
    }

    const { data, error, count } = await query
    if (error) {
      logger.error({ context: 'recruiter/talent-pool', error: error }, 'getTalentPool error')
      return {
        students: [] as TalentPoolStudent[],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        hasNextPage: false,
      }
    }

    const students = ((data ?? []) as unknown as TalentPoolRow[])
      .map(mapTalentPoolRow)
      .filter((student): student is TalentPoolStudent => student !== null)

    const total = count ?? 0
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)

    return {
      students,
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
    const { page, pageSize, from, to } = parsePagination(pagination)

    let query = supabase
      .from('saved_student')
      .select(
        `
        student_id,
        student:user!saved_student_student_id_fkey (
          id, name, email,
          person_profile!user_id!inner (
            graduation_year, major_or_interest, skills, updated_at, is_recruiter_visible,
            chapter_membership!user_id!inner (
              status,
              chapter_id,
              chapter (name, university)
            )
          )
        )
        `,
        { count: 'exact' }
      )
      .eq('recruiter_id', recruiterId)
      .eq('student.person_profile.is_recruiter_visible', true)
      .eq('student.person_profile.chapter_membership.status', 'approved')
      .order('saved_at', { ascending: false })
      .range(from, to)

    if (filters.query?.trim()) {
      query = query.ilike('student.name', `%${filters.query.trim()}%`)
    }

    if (filters.graduation_year) {
      query = query.eq('student.person_profile.graduation_year', filters.graduation_year)
    }

    if (filters.chapter_id) {
      query = query.eq('student.person_profile.chapter_membership.chapter_id', filters.chapter_id)
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.contains('student.person_profile.skills', filters.skills)
    }

    const { data, error, count } = await query
    if (error) {
      logger.error({ context: 'recruiter/talent-pool', error: error }, 'getSavedStudents error')
      return {
        students: [] as TalentPoolStudent[],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        hasNextPage: false,
      }
    }

    const students = ((data ?? []) as unknown as SavedTalentPoolRow[])
      .map((row) => {
        const user = Array.isArray(row.student) ? row.student[0] : row.student
        return user ? mapTalentPoolRow(user) : null
      })
      .filter((student): student is TalentPoolStudent => student !== null)

    const total = count ?? 0
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)

    return {
      students,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
    }
  },

  async getTalentPoolFilterOptions(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
      .from('person_profile')
      .select(
        `
        graduation_year,
        chapter_membership!inner (
          chapter_id,
          status,
          chapter (id, name)
        )
        `
      )
      .eq('is_recruiter_visible', true)
      .eq('chapter_membership.status', 'approved')

    if (error) {
      logger.error({ context: 'recruiter/talent-pool', error: error }, 'getTalentPoolFilterOptions error')
      return { years: [] as number[], chapters: [] as Array<{ id: string; name: string }> }
    }

    const filterRows = (data ?? []) as unknown as TalentPoolFilterRow[]
    const years = Array.from(
      new Set(filterRows.map((row) => row.graduation_year).filter((year): year is number => !!year))
    ).sort((a, b) => a - b)

    const chaptersById = new Map<string, { id: string; name: string }>()
    for (const row of filterRows) {
      const chapter = Array.isArray(row.chapter_membership.chapter)
        ? row.chapter_membership.chapter[0]
        : row.chapter_membership.chapter
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
    resume: {
      file_name: string
      file_url: string
      uploaded_at: string
    } | null
  } | null> {
    const { data, error } = await supabase
      .from('user')
      .select(
        `
        id, name, email,
        person_profile!user_id!inner (
          major_or_interest, graduation_year, skills, linkedin_url, is_recruiter_visible,
          chapter_membership!user_id!inner (
            status,
            chapter_id,
            chapter (name, university)
          )
        ),
        resume!left (
          file_name, file_url, uploaded_at
        )
        `
      )
      .eq('id', studentId)
      .eq('role', 'member')
      .eq('person_profile.is_recruiter_visible', true)
      .eq('person_profile.chapter_membership.status', 'approved')
      .maybeSingle()

    if (error || !data) {
      if (error) logger.error({ context: 'RecruiterService.getStudentProfile', error: error }, 'error')
      return null
    }

    const student = data as unknown as TalentPoolRow & {
      resume: { file_name: string; file_url: string; uploaded_at: string } | { file_name: string; file_url: string; uploaded_at: string }[] | null
    }
    const profile = Array.isArray(student.person_profile) ? student.person_profile[0] : student.person_profile
    if (!profile) return null
    const chapter = Array.isArray(profile.chapter_membership.chapter) ? profile.chapter_membership.chapter[0] : profile.chapter_membership.chapter
    const resume = Array.isArray(student.resume) ? student.resume[0] : student.resume

    return {
      id: student.id,
      name: student.name ?? '',
      email: student.email,
      chapter: chapter ? { name: chapter.name, university: chapter.university } : null,
      graduation_year: profile.graduation_year ?? null,
      major: profile.major_or_interest ?? null,
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
  },

  async downloadResume(
    supabase: SupabaseClient<Database>,
    recruiterId: string,
    studentId: string,
    fileUrl: string
  ): Promise<{ success: true; url: string } | { success: false; error: string }> {
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
        access: {
          id: string
          recruiter_email: string
          accepted_at: string | null
          accepted_by_user_id: string | null
          invite_expires_at: string | null
          revoked_at: string | null
          company_id: string
        }
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

    if (validation.access.accepted_at) {
      return { success: true }
    }

    const now = new Date().toISOString()

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
