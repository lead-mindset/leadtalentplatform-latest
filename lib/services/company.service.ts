import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import type {
  ChapterRow,
  CompanyStats,
  SavedStudent,
  SavedStudentRow,
  StudentForRecruiter,
  StudentProfileRow,
  UserRow,
} from '@/lib/types'

// ───────────────────────────────────────────────────────────────
// Shared select string — keeps both query functions consistent
// ───────────────────────────────────────────────────────────────

const STUDENT_SELECT = `
  id, email, name, phone, created_at,
  student_profile!user_id!inner (
    major, graduation_year, linkedin_url, skills,
    is_recruiter_visible, is_filled, updated_at, chapter_id,
    chapter:chapter!student_profile_chapter_id_fkey (
      name, university, city, region
    )
  )
`

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

export type StudentProfileRecruiterRow = Pick<
  StudentProfileRow,
  'major' | 'graduation_year' | 'linkedin_url' | 'skills' | 'is_recruiter_visible' | 'is_filled' | 'updated_at' | 'chapter_id'
> & {
  chapter: Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'> | Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'>[] | null
}

export type RecruiterStudentRow = Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'created_at'> & {
  student_profile: StudentProfileRecruiterRow | StudentProfileRecruiterRow[] | null
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
  const profile = Array.isArray(user.student_profile)
    ? user.student_profile[0]
    : user.student_profile

  if (!profile) return null

  const chapter = Array.isArray(profile.chapter)
    ? profile.chapter[0]
    : profile.chapter

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    phone: user.phone,
    created_at: user.created_at,
    chapter: chapter ?? null,
    student_profile: {
      major: profile.major,
      graduation_year: profile.graduation_year,
      linkedin_url: profile.linkedin_url,
      skills: profile.skills,
      is_recruiter_visible: profile.is_recruiter_visible,
      is_filled: profile.is_filled,
      updated_at: profile.updated_at,
      chapter_id: profile.chapter_id,
    },
  }
}

// ───────────────────────────────────────────────────────────────
// Service
// ───────────────────────────────────────────────────────────────

export const CompanyService = {
  /**
   * Returns all students visible to recruiters.
   * Filters by role in ['member', 'editor'] AND isRecruiterVisible=true at the DB level.
   */
  async getVisibleStudents(
    supabase: SupabaseClient<Database>
  ): Promise<StudentForRecruiter[]> {
    const { data, error } = await supabase
      .from('user')
      .select(STUDENT_SELECT)
      .in('role', ['member', 'editor'])
      .eq('student_profile.is_recruiter_visible', true)
      .eq('student_profile.is_filled', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getVisibleStudents] Error:', error)
      return []
    }

    const rows = (data ?? []) as RecruiterStudentRow[]

    return rows
      .map(mapStudentRow)
      .filter((s): s is StudentForRecruiter =>
        s !== null &&
        s.student_profile?.is_recruiter_visible === true &&
        s.student_profile?.is_filled === true
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
      .in('role', ['member', 'editor'])
      .eq('student_profile.is_recruiter_visible', true)
      .eq('student_profile.is_filled', true)
      .single()

    if (error) {
      console.error('[getStudentById] Error:', error)
      return null
    }

    if (!data) return null

    const student = mapStudentRow(data)

    if (
      !student ||
      student.student_profile?.is_recruiter_visible !== true ||
      student.student_profile?.is_filled !== true
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
          student_profile!user_id!inner (
            major, graduation_year, linkedin_url, skills,
            is_recruiter_visible, is_filled, updated_at, chapter_id,
            chapter:chapter!student_profile_chapter_id_fkey (
              name, university, city, region
            )
          )
        )
      `)
      .eq('recruiter_id', userId)
      .order('saved_at', { ascending: false })

    if (error) {
      console.error('[getSavedStudents] Error:', error)
      return []
    }

    if (!data) return []

    return (data as SavedStudentWithUserRow[])
      .map((saved) => {
        const studentData = Array.isArray(saved.student)
          ? saved.student[0]
          : saved.student

        if (!studentData) {
          return null
        }

        const profile = studentData?.student_profile
          ? Array.isArray(studentData.student_profile)
            ? studentData.student_profile[0]
            : studentData.student_profile
          : null

        const chapter = profile?.chapter
          ? Array.isArray(profile.chapter)
            ? profile.chapter[0]
            : profile.chapter
          : null

        return {
          id: saved.id,
          recruiter_id: saved.recruiter_id,
          student_id: saved.student_id,
          saved_at: saved.saved_at,
          notes: saved.notes,
          student: {
            id: studentData.id,
            email: studentData.email,
            name: studentData.name ?? '',
            phone: studentData.phone,
            created_at: studentData.created_at,
            chapter: chapter ?? null,
            student_profile: profile
              ? {
                  major: profile.major,
                  graduation_year: profile.graduation_year,
                  linkedin_url: profile.linkedin_url,
                  skills: profile.skills,
                  is_recruiter_visible: profile.is_recruiter_visible,
                  is_filled: profile.is_filled,
                  updated_at: profile.updated_at,
                  chapter_id: profile.chapter_id,
                }
              : null,
          },
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
      console.error('[getSavedStudentIds] Error:', error)
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
        .from('student_profile')
        .select('user_id', { count: 'exact', head: true })
        .eq('is_recruiter_visible', true)
        .eq('is_filled', true),
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
      .eq('role', 'member')
      .eq('student_profile.is_recruiter_visible', true)
      .eq('student_profile.is_filled', true)
      .order('created_at', { ascending: false })

    // Name/email search pushed to DB
    if (filters.query) {
      query = query.or(
        `name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`
      )
    }

    if (filters.major) {
      query = query.ilike('student_profile.major', `%${filters.major.trim()}%`)
    }

    if (filters.graduation_year) {
      query = query.eq('student_profile.graduation_year', filters.graduation_year)
    }

    if (filters.chapter_id) {
      query = query.eq('student_profile.chapter_id', filters.chapter_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('[searchStudents] Error:', error)
      return []
    }

    const rows = (data ?? []) as RecruiterStudentRow[]

    return rows
      .map(mapStudentRow)
      .filter((s): s is StudentForRecruiter =>
        s !== null &&
        s.student_profile?.is_recruiter_visible === true &&
        s.student_profile?.is_filled === true
      )
  },

  async toggleSaveStudent(
    supabase: SupabaseClient<Database>,
    userId: string,
    studentId: string
  ): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
    const student = await this.getStudentById(supabase, studentId)
    if (!student) {
      return { success: false, isSaved: false, error: 'Student is not available to recruiters.' }
    }

    const { data: existing, error: checkError } = await supabase
      .from('saved_student')
      .select('id')
      .eq('recruiter_id', userId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (checkError) {
      console.error('[toggleSaveStudent] Check error:', checkError)
      return { success: false, isSaved: false, error: 'Failed to check save status' }
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from('saved_student')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        console.error('[toggleSaveStudent] Delete error:', deleteError)
        return { success: false, isSaved: true, error: 'Failed to unsave student' }
      }
      return { success: true, isSaved: false }
    } else {
      const { error: insertError } = await supabase
        .from('saved_student')
        .insert({
          recruiter_id: userId,
          student_id: studentId,
          saved_at: new Date().toISOString(),
          notes: null,
        })

      if (insertError) {
        console.error('[toggleSaveStudent] Insert error:', insertError)
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
      console.error('[isStudentSaved] Error:', error)
      return false
    }
    return !!data
  },

  // ───────────────────────────────────────────────────────────────
  // Profile actions
  // ───────────────────────────────────────────────────────────────

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
      console.error('[CompanyService.getValidatedRecruiterInvite] Database error:', error)
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
      console.error('[CompanyService.getInviteCompany] Company fetch error:', error)
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
