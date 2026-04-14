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
  id, email, name, phone, createdAt,
  StudentProfile!StudentProfile_userId_fkey (
    major, graduationYear, linkedinUrl, skills,
    isRecruiterVisible, isFilled, updatedAt, chapterId,
    Chapter:Chapter!StudentProfile_chapterId_fkey (
      name, university, city, region
    )
  )
`

type StudentProfileRecruiterRow = Pick<
  StudentProfileRow,
  'major' | 'graduationYear' | 'linkedinUrl' | 'skills' | 'isRecruiterVisible' | 'isFilled' | 'updatedAt' | 'chapterId'
> & {
  Chapter: Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'> | Pick<ChapterRow, 'name' | 'university' | 'city' | 'region'>[] | null
}

type RecruiterStudentRow = Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'createdAt'> & {
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
    createdAt: user.createdAt,
    Chapter: chapter ?? null,
    StudentProfile: {
      major: profile.major,
      graduationYear: profile.graduationYear,
      linkedinUrl: profile.linkedinUrl,
      skills: profile.skills,
      isRecruiterVisible: profile.isRecruiterVisible,
      isFilled: profile.isFilled,
      updatedAt: profile.updatedAt,
      chapterId: profile.chapterId,
    },
  }
}

/**
 * Returns all students visible to recruiters.
 * Filters by role=member AND isRecruiterVisible=true at the DB level.
 */
export async function getVisibleStudents(
  supabase: SupabaseClient<Database>
): Promise<StudentForRecruiter[]> {
  const { data, error } = await supabase
    .from('User')
    .select(STUDENT_SELECT)
    .eq('role', 'member')
    .eq('StudentProfile.isRecruiterVisible', true)
    .eq('StudentProfile.isFilled', true)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[getVisibleStudents] Error:', error)
    return []
  }

  const rows = (data ?? []) as RecruiterStudentRow[]

  return rows
    .map(mapStudentRow)
    .filter((s): s is StudentForRecruiter =>
      s !== null &&
      s.StudentProfile?.isRecruiterVisible === true &&
      s.StudentProfile?.isFilled === true
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
    .from('User')
    .select(STUDENT_SELECT)
    .eq('id', studentId)
    .eq('role', 'member')
    .eq('StudentProfile.isRecruiterVisible', true)
    .eq('StudentProfile.isFilled', true)
    .single()

  if (error) {
    console.error('[getStudentById] Error:', error)
    return null
  }

  if (!data) return null

  const student = mapStudentRow(data)

  if (
    !student ||
    student.StudentProfile?.isRecruiterVisible !== true ||
    student.StudentProfile?.isFilled !== true
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
    .from('SavedStudent')
    .select(`
      id, recruiterId, studentId, savedAt, notes,
      Student:User!SavedStudent_studentId_fkey (
        id, email, name, phone, createdAt,
        StudentProfile!StudentProfile_userId_fkey (
          major, graduationYear, linkedinUrl, skills,
          isRecruiterVisible, isFilled, updatedAt, chapterId,
          Chapter:Chapter!StudentProfile_chapterId_fkey (
            name, university, city, region
          )
        )
      )
    `)
    .eq('recruiterId', userId)
    .order('savedAt', { ascending: false })

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
      recruiterId: saved.recruiterId,
      studentId: saved.studentId,
      savedAt: saved.savedAt,
      notes: saved.notes,
      Student: {
        id: studentData.id,
        email: studentData.email,
        name: studentData.name,
        phone: studentData.phone,
        createdAt: studentData.createdAt,
        Chapter: chapter ?? null,
        StudentProfile: profile
          ? {
              major: profile.major,
              graduationYear: profile.graduationYear,
              linkedinUrl: profile.linkedinUrl,
              skills: profile.skills,
              isRecruiterVisible: profile.isRecruiterVisible,
              isFilled: profile.isFilled,
              updatedAt: profile.updatedAt,
              chapterId: profile.chapterId,
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
    .from('SavedStudent')
    .select('studentId')
    .eq('recruiterId', userId)

  if (error) {
    console.error('[getSavedStudentIds] Error:', error)
    return []
  }

  return (data ?? []).map((row: Pick<SavedStudentRow, 'studentId'>) => row.studentId)
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
      .from('StudentProfile')
      .select('userId', { count: 'exact', head: true })
      .eq('isRecruiterVisible', true)
      .eq('isFilled', true),
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
    .from('User')
    .select(STUDENT_SELECT)
    .eq('role', 'member')
    .eq('StudentProfile.isRecruiterVisible', true)
    .eq('StudentProfile.isFilled', true)
    .order('createdAt', { ascending: false })

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
    query = query.eq('StudentProfile.graduationYear', filters.graduationYear)
  }

  if (filters.chapterId) {
    query = query.eq('StudentProfile.chapterId', filters.chapterId)
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
      s.StudentProfile?.isRecruiterVisible === true &&
      s.StudentProfile?.isFilled === true
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
    .from('SavedStudent')
    .select('id')
    .eq('recruiterId', userId)
    .eq('studentId', studentId)
    .maybeSingle()

  if (checkError) {
    console.error('[toggleSaveStudent] Check error:', checkError)
    return { success: false, isSaved: false, error: 'Failed to check save status' }
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from('SavedStudent')
      .delete()
      .eq('id', existing.id)

    if (deleteError) {
      console.error('[toggleSaveStudent] Delete error:', deleteError)
      return { success: false, isSaved: true, error: 'Failed to unsave student' }
    }
    return { success: true, isSaved: false }
  } else {
    const { error: insertError } = await supabase
      .from('SavedStudent')
      .insert({
        recruiterId: userId,
        studentId,
        savedAt: new Date().toISOString(),
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
    .from('SavedStudent')
    .select('id')
    .eq('recruiterId', userId)
    .eq('studentId', studentId)
    .maybeSingle()

  if (error) {
    console.error('[isStudentSaved] Error:', error)
    return false
  }
  return !!data
}
