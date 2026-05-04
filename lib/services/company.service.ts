import { logger } from '@/lib/logger'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import type {
  ChapterRow,
  CompanyRow,
  CompanyStats,
  PersonProfileRow,
  RecruiterAccessRow,
  SavedStudent,
  SavedStudentRow,
  StudentForRecruiter,
  UserRow,
} from '@/lib/types'

const TALENT_UNAVAILABLE_ERROR = 'Profile not found or unavailable.'

// ───────────────────────────────────────────────────────────────
// Shared select string — keeps both query functions consistent
// ───────────────────────────────────────────────────────────────

const STUDENT_SELECT = `
  id, email, name, phone, created_at,
  person_profile!user_id!inner (
    major_or_interest, graduation_year, linkedin_url, skills,
    is_recruiter_visible, updated_at,
    chapter_membership!user_id!inner (
      chapter_id,
      status,
      chapter (
        name, university, city, region
      )
    )
  )
`

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

export type RecruiterProfileRow = Pick<
  PersonProfileRow,
  'major_or_interest' | 'graduation_year' | 'linkedin_url' | 'skills' | 'is_recruiter_visible' | 'updated_at'
> & {
  chapter_membership: {
    chapter_id: string
    status: string | null
    chapter: Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'> | Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'>[] | null
  } | Array<{
    chapter_id: string
    status: string | null
    chapter: Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'> | Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'>[] | null
  }>
}

export type RecruiterStudentRow = Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'created_at'> & {
  person_profile: RecruiterProfileRow | RecruiterProfileRow[] | null
}

export type SavedStudentWithUserRow = SavedStudentRow & {
  student: RecruiterStudentRow | RecruiterStudentRow[] | null
}

export type ProfileActionResult =
  | { success: true; message?: string }
  | { success: false; error: string }

export type RecruiterAccessWithCompany = {
  id: string
  company_id: string
  is_active: boolean
  accepted_at: string | null
  company: { id: string; name: string; created_at: string; created_by_id: string }[]
}

export type AccessWithCompany = {
  id: string
  company_id: string
  is_active: boolean
  accepted_at: string | null
  granted_at: string
  revoked_at: string | null
  company: { id: string; name: string; created_at: string; created_by_id: string }[]
}

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

function mapStudentRow(user: RecruiterStudentRow): StudentForRecruiter | null {
  const profile = Array.isArray(user.person_profile)
    ? user.person_profile[0]
    : user.person_profile

  if (!profile) return null

  const membership = Array.isArray(profile.chapter_membership)
    ? profile.chapter_membership[0]
    : profile.chapter_membership

  if (!membership) return null
  if (profile.is_recruiter_visible !== true) return null
  if (membership.status !== 'approved') return null

  const chapter = Array.isArray(membership.chapter)
    ? membership.chapter[0]
    : membership.chapter

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    phone: user.phone,
    created_at: user.created_at,
    chapter: chapter ?? null,
    person_profile: {
      chapter_id: membership.chapter_id,
      major_or_interest: profile.major_or_interest,
      graduation_year: profile.graduation_year,
      linkedin_url: profile.linkedin_url,
      skills: profile.skills,
      is_recruiter_visible: profile.is_recruiter_visible,
      updated_at: profile.updated_at,
    },
  }
}

// ───────────────────────────────────────────────────────────────
// Service
// ───────────────────────────────────────────────────────────────

export const CompanyService = {
  /**
   * Returns all talent visible to company representatives.
   * Eligibility is explicit profile opt-in plus approved chapter membership;
   * app role does not define company talent visibility.
   */
  async getVisibleStudents(
    supabase: SupabaseClient<Database>
  ): Promise<StudentForRecruiter[]> {
    const { data, error } = await supabase
      .from('user')
      .select(STUDENT_SELECT)
      .eq('person_profile.is_recruiter_visible', true)
      .eq('person_profile.chapter_membership.status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error({ context: 'getVisibleStudents', error: error }, 'Error')
      return []
    }

    const rows = (data ?? []) as unknown as RecruiterStudentRow[]

    return rows
      .map(mapStudentRow)
      .filter((s): s is StudentForRecruiter =>
        s !== null &&
        s.person_profile?.is_recruiter_visible === true
      )
  },

  /**
   * Returns a single student by ID, only if they are visible to recruiters.
   */
  async getStudentById(
    supabase: SupabaseClient<Database>,
    studentId: string
  ): Promise<StudentForRecruiter | null> {
    const { data, error } = await supabase
      .from('user')
      .select(STUDENT_SELECT)
      .eq('id', studentId)
      .eq('person_profile.is_recruiter_visible', true)
      .eq('person_profile.chapter_membership.status', 'approved')
      .single()

    if (error) {
      logger.error({ context: 'getStudentById', error: error }, 'Error')
      return null
    }

    if (!data) return null

    const student = mapStudentRow(data as unknown as RecruiterStudentRow)

    if (
      !student ||
      student.person_profile?.is_recruiter_visible !== true
    ) {
      return null
    }

    return student
  },

  /**
   * Returns saved students for a recruiter.
   */
  async getSavedStudents(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<SavedStudent[]> {
    const { data, error } = await supabase
      .from('saved_student')
      .select(`
        id, recruiter_id, student_id, saved_at, notes,
        student:user!saved_student_student_id_fkey (
          id, email, name, phone, created_at,
          person_profile!user_id!inner (
            major_or_interest, graduation_year, linkedin_url, skills,
            is_recruiter_visible, updated_at,
            chapter_membership!user_id!inner (
              chapter_id,
              status,
              chapter (
                name, university, city, region
              )
            )
          )
        )
      `)
      .eq('recruiter_id', userId)
      .eq('student.person_profile.is_recruiter_visible', true)
      .eq('student.person_profile.chapter_membership.status', 'approved')
      .order('saved_at', { ascending: false })

    if (error) {
      logger.error({ context: 'getSavedStudents', error: error }, 'Error')
      return []
    }

    if (!data) return []

    return (data as unknown as SavedStudentWithUserRow[])
      .map((saved): SavedStudent | null => {
        const studentData = Array.isArray(saved.student)
          ? saved.student[0]
          : saved.student

        if (!studentData) {
          return null
        }

        const student = mapStudentRow(studentData)
        if (!student) return null

        return {
          id: saved.id,
          recruiter_id: saved.recruiter_id,
          student_id: saved.student_id,
          saved_at: saved.saved_at,
          notes: saved.notes,
          student,
        }
      })
      .filter((saved): saved is SavedStudent => saved !== null)
  },

  /**
   * Returns saved student IDs for a recruiter — lightweight, for checking save state.
   */
  async getSavedStudentIds(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from('saved_student')
      .select('student_id')
      .eq('recruiter_id', userId)

    if (error) {
      logger.error({ context: 'getSavedStudentIds', error: error }, 'Error')
      return []
    }

    return (data ?? []).map((row: Pick<SavedStudentRow, 'student_id'>) => row.student_id)
  },

  /**
   * Company stats using a count query — does not fetch full student records.
   */
  async getCompanyStats(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<CompanyStats> {
    const [{ count: total_students }, saved_students] = await Promise.all([
      supabase
        .from('user')
        .select(`
          id,
          person_profile!user_id!inner (
            user_id,
            chapter_membership!user_id!inner (status)
          )
        `, { count: 'exact', head: true })
        .eq('person_profile.is_recruiter_visible', true)
        .eq('person_profile.chapter_membership.status', 'approved'),
      this.getSavedStudents(supabase, userId),
    ])

    return {
      total_students: total_students ?? 0,
      saved_students: saved_students.length,
      recent_views: 0,
    }
  },

  /**
   * Searches students with filters pushed to the database where possible.
   * Client-side fallback only for skills (array containment via Supabase is limited).
   */
  async searchStudents(
    supabase: SupabaseClient<Database>,
    filters: {
      query?: string
      major?: string
      graduation_year?: number
      chapter_id?: string
    }
  ): Promise<StudentForRecruiter[]> {
    let query = supabase
      .from('user')
      .select(STUDENT_SELECT)
      .eq('person_profile.is_recruiter_visible', true)
      .eq('person_profile.chapter_membership.status', 'approved')
      .order('created_at', { ascending: false })

    // Name/email search pushed to DB
    if (filters.query) {
      query = query.or(
        `name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`
      )
    }

    if (filters.major) {
      query = query.ilike('person_profile.major_or_interest', `%${filters.major.trim()}%`)
    }

    if (filters.graduation_year) {
      query = query.eq('person_profile.graduation_year', filters.graduation_year)
    }

    if (filters.chapter_id) {
      query = query.eq('person_profile.chapter_membership.chapter_id', filters.chapter_id)
    }

    const { data, error } = await query

    if (error) {
      logger.error({ context: 'searchStudents', error: error }, 'Error')
      return []
    }

    const rows = (data ?? []) as unknown as RecruiterStudentRow[]

    return rows
      .map(mapStudentRow)
      .filter((s): s is StudentForRecruiter =>
        s !== null &&
        s.person_profile?.is_recruiter_visible === true
      )
  },

  async toggleSaveStudent(
    supabase: SupabaseClient<Database>,
    userId: string,
    studentId: string
  ): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
    const { data: existing, error: checkError } = await supabase
      .from('saved_student')
      .select('id')
      .eq('recruiter_id', userId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (checkError) {
      logger.error({ context: 'toggleSaveStudent', error: checkError }, 'Check error')
      return { success: false, isSaved: false, error: 'Failed to check save status' }
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from('saved_student')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        logger.error({ context: 'toggleSaveStudent', error: deleteError }, 'Delete error')
        return { success: false, isSaved: true, error: 'Failed to unsave student' }
      }
      return { success: true, isSaved: false }
    } else {
      const student = await this.getStudentById(supabase, studentId)
      if (!student) {
        return { success: false, isSaved: false, error: TALENT_UNAVAILABLE_ERROR }
      }

      const { error: insertError } = await supabase
        .from('saved_student')
        .insert({
          recruiter_id: userId,
          student_id: studentId,
          saved_at: new Date().toISOString(),
          notes: null,
        })

      if (insertError) {
        logger.error({ context: 'toggleSaveStudent', error: insertError }, 'Insert error')
        return { success: false, isSaved: false, error: 'Failed to save student' }
      }
      return { success: true, isSaved: true }
    }
  },

  async isStudentSaved(
    supabase: SupabaseClient<Database>,
    userId: string,
    studentId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('saved_student')
      .select('id')
      .eq('recruiter_id', userId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (error) {
      logger.error({ context: 'isStudentSaved', error: error }, 'Error')
      return false
    }
    return !!data
  },

  // ───────────────────────────────────────────────────────────────
  // Profile actions
  // ───────────────────────────────────────────────────────────────

  async getTalentResumeMetadata(
    supabase: SupabaseClient<Database>,
    studentId: string
  ): Promise<{ file_name: string | null; uploaded_at: string | null } | null> {
    const student = await this.getStudentById(supabase, studentId)
    if (!student) return null

    const { data: resume, error } = await supabase
      .from('resume')
      .select('file_name, uploaded_at')
      .eq('student_id', studentId)
      .maybeSingle<{ file_name: string | null; uploaded_at: string | null }>()

    if (error) {
      logger.error({ context: 'getTalentResumeMetadata', error }, 'Resume metadata fetch error')
      return null
    }

    return resume ?? null
  },

  async createResumeDownloadUrl(
    supabase: SupabaseClient<Database>,
    recruiterId: string,
    studentId: string
  ): Promise<{ success: true; url: string } | { success: false; error: string }> {
    const student = await this.getStudentById(supabase, studentId)
    if (!student) {
      return { success: false, error: TALENT_UNAVAILABLE_ERROR }
    }

    const { data: resume, error: resumeError } = await supabase
      .from('resume')
      .select('file_url')
      .eq('student_id', studentId)
      .maybeSingle<{ file_url: string | null }>()

    if (resumeError || !resume?.file_url) {
      if (resumeError) logger.error({ context: 'createResumeDownloadUrl', error: resumeError }, 'Resume fetch error')
      return { success: false, error: 'Resume not available.' }
    }

    const marker = '/storage/v1/object/public/resumes/'
    const markerIndex = resume.file_url.indexOf(marker)
    if (markerIndex < 0) {
      return { success: false, error: 'Invalid resume file path.' }
    }

    const storagePath = decodeURIComponent(resume.file_url.slice(markerIndex + marker.length))
    const { data: signedData, error: signedError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, 60 * 5)

    if (signedError || !signedData?.signedUrl) {
      logger.error({ context: 'createResumeDownloadUrl', error: signedError }, 'createSignedUrl error')
      return { success: false, error: 'Failed to generate download URL.' }
    }

    const { error: logError } = await supabase.from('resume_download_log').insert({
      recruiter_id: recruiterId,
      student_id: studentId,
      downloaded_at: new Date().toISOString(),
    })

    if (logError) {
      logger.error({ context: 'createResumeDownloadUrl', error: logError }, 'ResumeDownloadLog insert error')
      return { success: false, error: 'Failed to log resume download.' }
    }

    return { success: true, url: signedData.signedUrl }
  },

  async updateProfile(
    supabase: SupabaseClient<Database>,
    userId: string,
    formData: {
      name?: string
      phone?: string
    }
  ): Promise<ProfileActionResult> {
    const userUpdates: {
      name?: string
      phone?: string
      updated_at: string
    } = {
      updated_at: new Date().toISOString()
    }

    if (formData.name) userUpdates.name = formData.name
    if (formData.phone !== undefined) userUpdates.phone = formData.phone

    const { error: userError } = await supabase
      .from('user')
      .update(userUpdates)
      .eq('id', userId)

    if (userError) {
      return { success: false, error: 'Failed to update profile information' }
    }

    return { success: true, message: 'Profile updated successfully' }
  },

  async getRecruiterProfile(
    supabase: SupabaseClient<Database>,
    userId: string
  ) {
    const { data: recruiterAccess, error: accessError } = await supabase
      .from('recruiter_access')
      .select(`
        id,
        company_id,
        is_active,
        accepted_at,
        Company!inner (id, name, created_at, created_by_id)
      `)
      .eq('accepted_by_user_id', userId)
      .eq('is_active', true)
      .is('revoked_at', null)
      .maybeSingle<RecruiterAccessWithCompany>()

    if (accessError) {
      return { success: false as const, error: 'Failed to load recruiter access.' }
    }

    const company = recruiterAccess?.company?.[0] ?? null

    return {
      success: true as const,
      data: {
        company,
        accessInfo: recruiterAccess ? {
          access_id: recruiterAccess.id,
          accepted_at: recruiterAccess.accepted_at,
        } : null,
      },
    }
  },

  async getValidatedRecruiterInvite(
    supabase: SupabaseClient<Database>,
    inviteToken: string
  ): Promise<
    | { success: true; invite: RecruiterAccessRow }
    | { success: false; error: string }
  > {
    const INVITE_SELECT =
      'id, recruiter_email, is_active, granted_at, granted_by_id, invite_token, invite_expires_at, accepted_at, accepted_by_user_id, company_id, revoked_at, revoked_by_id'

    const { data: invite, error } = await supabase
      .from('recruiter_access')
      .select(INVITE_SELECT)
      .eq('invite_token', inviteToken)
      .maybeSingle<RecruiterAccessRow>()

    if (error) {
      logger.error({ context: 'CompanyService.getValidatedRecruiterInvite', error: error }, 'Database error')
      return { success: false, error: `Database error: ${error.message}` }
    }

    if (!invite) {
      return { success: false, error: 'Invalid invite token' }
    }

    if (invite.revoked_at) {
      return { success: false, error: 'This invitation has been revoked' }
    }

    if (invite.accepted_at) {
      return { success: false, error: 'This invitation has already been accepted' }
    }

    if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) {
      return { success: false, error: 'This invitation has expired. Please contact your administrator.' }
    }

    return { success: true, invite }
  },

  async getInviteCompany(
    supabase: SupabaseClient<Database>,
    companyId: string
  ): Promise<Pick<CompanyRow, 'id' | 'name'> | null> {
    const { data: company, error } = await supabase
      .from('company')
      .select('id, name')
      .eq('id', companyId)
      .maybeSingle<Pick<CompanyRow, 'id' | 'name'>>()

    if (error) {
      logger.error({ context: 'CompanyService.getInviteCompany', error: error }, 'Company fetch error')
      return null
    }

    return company
  },

  async getRecruiterCompanies(
    supabase: SupabaseClient<Database>,
    userId: string
  ) {
    const { data: allAccess, error } = await supabase
      .from('recruiter_access')
      .select(`
        id,
        company_id,
        is_active,
        accepted_at,
        granted_at,
        revoked_at,
        Company!inner (id, name, created_at, created_by_id)
      `)
      .eq('accepted_by_user_id', userId)
      .order('accepted_at', { ascending: false })

    if (error) {
      return { success: false as const, error: 'Failed to fetch companies' }
    }

    const companies = (allAccess as unknown as AccessWithCompany[]).map(access => ({
      accessId: access.id,
      companyId: access.company_id,
      companyName: access.company[0]?.name ?? 'Unknown',
      isActive: access.is_active,
      accepted_at: access.accepted_at,
      granted_at: access.granted_at,
      revoked_at: access.revoked_at,
      company: access.company[0] ?? null
    }))

    return {
      success: true as const,
      data: {
        activeCompany: companies.find(c => c.isActive && !c.revoked_at) ?? null,
        allCompanies: companies
      }
    }
  },
}
