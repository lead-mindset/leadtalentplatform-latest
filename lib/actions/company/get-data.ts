import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ChapterRow,
  CompanyStats,
  Database,
  SavedStudent,
  SavedStudentRow,
  StudentForRecruiter,
  StudentProfileRow,
  UserRow,
} from '@/lib/types'

// Shared select string — keeps both query functions consistent
const STUDENT_SELECT = `
  id, email, name, phone, created_at,
  StudentProfile!inner (
    major, graduation_year, linkedin_url, skills,
    is_recruiter_visible, is_filled, updated_at, chapter_id,
    Chapter:Chapter!StudentProfile_chapter_id_fkey (
      name, university, city, region
    )
  )
`

type StudentProfileRecruiterRow = Pick<
StudentProfileRow,
  'major' | 'graduation_year' | 'linkedin_url' | 'skills' | 'is_recruiter_visible' | 'is_filled' | 'updated_at' | 'chapter_id'
> & {
  Chapter: Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'> | Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'>[] | null
}

type RecruiterStudentRow = Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'created_at'> & {
  StudentProfile: StudentProfileRecruiterRow | StudentProfileRecruiterRow[] | null
}

type SavedStudentWithUserRow = SavedStudentRow & {
  Student: RecruiterStudentRow | RecruiterStudentRow[] | null
}

function mapStudentRow(user: RecruiterStudentRow): StudentForRecruiter | null {
  const profile = Array.isArray(user.StudentProfile)
    ? user.StudentProfile[0]
    : user.StudentProfile

  if (!profile) return null

  const chapter = Array.isArray(profile.Chapter)
    ? profile.Chapter[0]
    : profile.Chapter

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    created_at: user.created_at,
    Chapter: chapter ?? null,
    StudentProfile: {
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

/**
 * Returns all students visible to recruiters.
 * Filters by role in ['member', 'editor'] AND isRecruiterVisible=true at the DB level.
 */
export async function getVisibleStudents(
  supabase: SupabaseClient<Database>
): Promise<StudentForRecruiter[]> {
  const { data, error } = await supabase
    .from('user')
    .select(STUDENT_SELECT)
    .in('role', ['member', 'editor'])
    .eq('StudentProfile.is_recruiter_visible', true)
    .eq('StudentProfile.is_filled', true)
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
      s.StudentProfile?.is_recruiter_visible === true &&
      s.StudentProfile?.is_filled === true
    )
}

/**
 * Returns a single student by ID, only if they are visible to recruiters.
 */
export async function getStudentById(
  supabase: SupabaseClient<Database>,
  studentId: string
): Promise<StudentForRecruiter | null> {
  const { data, error } = await supabase
    .from('user')
.select(STUDENT_SELECT)
    .eq('id', studentId)
    .in('role', ['member', 'editor'])
    .eq('StudentProfile.is_recruiter_visible', true)
    .eq('StudentProfile.is_filled', true)
    .single()

  if (error) {
    console.error('[getStudentById] Error:', error)
    return null
  }

  if (!data) return null

  const student = mapStudentRow(data)

  if (
    !student ||
    student.StudentProfile?.is_recruiter_visible !== true ||
    student.StudentProfile?.is_filled !== true
  ) {
    return null
  }

  return student
}

/**
 * Returns saved students for a recruiter.
 */
export async function getSavedStudents(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SavedStudent[]> {
  const { data, error } = await supabase
    .from('saved_student')
    .select(`
      id, recruiter_id, student_id, saved_at, notes,
      Student:User!SavedStudent_student_id_fkey (
        id, email, name, phone, created_at,
        StudentProfile!inner (
          major, graduation_year, linkedin_url, skills,
          is_recruiter_visible, is_filled, updated_at, chapter_id,
          Chapter:Chapter!StudentProfile_chapter_id_fkey (
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
    const studentData = Array.isArray(saved.Student)
      ? saved.Student[0]
      : saved.Student

    if (!studentData) {
      return null
    }

    const profile = studentData?.StudentProfile
      ? Array.isArray(studentData.StudentProfile)
        ? studentData.StudentProfile[0]
        : studentData.StudentProfile
      : null

    const chapter = profile?.Chapter
      ? Array.isArray(profile.Chapter)
        ? profile.Chapter[0]
        : profile.Chapter
      : null

    return {
      id: saved.id,
recruiter_id: saved.recruiter_id,
      student_id: saved.student_id,
      saved_at: saved.saved_at,
      notes: saved.notes,
      Student: {
        id: studentData.id,
        email: studentData.email,
        name: studentData.name,
        phone: studentData.phone,
        created_at: studentData.created_at,
        Chapter: chapter ?? null,
        StudentProfile: profile
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
}

/**
 * Returns saved student IDs for a recruiter — lightweight, for checking save state.
 */
export async function getSavedStudentIds(
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
}

/**
 * Company stats using a count query — does not fetch full student records.
 */
export async function getCompanyStats(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CompanyStats> {
  const [{ count: totalStudents }, savedStudents] = await Promise.all([
    supabase
.from('student_profile')
      .select('user_id', { count: 'exact', head: true })
      .eq('is_recruiter_visible', true)
      .eq('is_filled', true),
    getSavedStudents(supabase, userId),
  ])

  return {
    totalStudents: totalStudents ?? 0,
    savedStudents: savedStudents.length,
    recentViews: 0,
  }
}

/**
 * Searches students with filters pushed to the database where possible.
 * Client-side fallback only for skills (array containment via Supabase is limited).
 */
export async function searchStudents(
  supabase: SupabaseClient<Database>,
  filters: {
    query?: string
    major?: string
    graduationYear?: number
    chapterId?: string
  }
): Promise<StudentForRecruiter[]> {
  let query = supabase
    .from('user')
    .select(STUDENT_SELECT)
    .eq('role', 'member')
    .eq('StudentProfile.is_recruiter_visible', true)
    .eq('StudentProfile.is_filled', true)
.order('created_at', { ascending: false })

  // Name/email search pushed to DB
  if (filters.query) {
    query = query.or(
      `name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`
    )
  }

  if (filters.major) {
    query = query.ilike('StudentProfile.major', `%${filters.major.trim()}%`)
  }

if (filters.graduationYear) {
    query = query.eq('StudentProfile.graduation_year', filters.graduationYear)
  }

  if (filters.chapterId) {
    query = query.eq('StudentProfile.chapter_id', filters.chapterId)
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
s.StudentProfile?.is_recruiter_visible === true &&
      s.StudentProfile?.is_filled === true
    )
}

export async function toggleSaveStudent(
  supabase: SupabaseClient<Database>,
  userId: string,
  studentId: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  const student = await getStudentById(supabase, studentId)
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
}

export async function isStudentSaved(
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
}
