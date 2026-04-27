import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import type { ChapterRow, StudentProfileRow, UserRow } from '@/lib/types'

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
  StudentProfileRow,
  'graduation_year' | 'major' | 'skills' | 'updated_at'
> & {
  chapter: Pick<ChapterRow, 'name' | 'university'> | Pick<ChapterRow, 'name' | 'university'>[] | null
}

type TalentPoolRow = Pick<UserRow, 'id' | 'name' | 'email'> & {
  student_profile: TalentPoolProfileRow | TalentPoolProfileRow[] | null
}

type SavedTalentPoolRow = {
  student: TalentPoolRow | TalentPoolRow[] | null
}

type TalentPoolFilterRow = Pick<StudentProfileRow, 'graduation_year'> & {
  chapter: { id: string; name: string } | { id: string; name: string }[] | null
}

function mapTalentPoolRow(row: TalentPoolRow): TalentPoolStudent | null {
  const profile = Array.isArray(row.student_profile) ? row.student_profile[0] : row.student_profile
  if (!profile) return null

  const chapter = Array.isArray(profile.chapter) ? profile.chapter[0] : profile.chapter

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
    major: profile.major ?? null,
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
        student_profile!user_id!inner (
          graduation_year, major, skills, updated_at, chapter_id, is_recruiter_visible, approval_status,
          chapter:chapter!student_profile_chapter_id_fkey (name, university)
        )
        `,
        { count: 'exact' }
      )
      .eq('role', 'member')
      .eq('student_profile.is_recruiter_visible', true)
      .eq('student_profile.approval_status', 'approved')
      .order('updated_at', { ascending: false, referencedTable: 'student_profile' })
      .range(from, to)

    if (filters.query?.trim()) {
      query = query.ilike('name', `%${filters.query.trim()}%`)
    }

    if (filters.graduation_year) {
      query = query.eq('student_profile.graduation_year', filters.graduation_year)
    }

    if (filters.chapter_id) {
      query = query.eq('student_profile.chapter_id', filters.chapter_id)
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.contains('student_profile.skills', filters.skills)
    }

    const { data, error, count } = await query
    if (error) {
      console.error('[recruiter/talent-pool] getTalentPool error:', error)
      return {
        students: [] as TalentPoolStudent[],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        hasNextPage: false,
      }
    }

    const students = ((data ?? []) as TalentPoolRow[])
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
          student_profile!user_id!inner (
            graduation_year, major, skills, updated_at, chapter_id, is_recruiter_visible, approval_status,
            chapter:chapter!student_profile_chapter_id_fkey (name, university)
          )
        )
        `,
        { count: 'exact' }
      )
      .eq('recruiter_id', recruiterId)
      .eq('student.student_profile.is_recruiter_visible', true)
      .eq('student.student_profile.approval_status', 'approved')
      .order('saved_at', { ascending: false })
      .range(from, to)

    if (filters.query?.trim()) {
      query = query.ilike('student.name', `%${filters.query.trim()}%`)
    }

    if (filters.graduation_year) {
      query = query.eq('student.student_profile.graduation_year', filters.graduation_year)
    }

    if (filters.chapter_id) {
      query = query.eq('student.student_profile.chapter_id', filters.chapter_id)
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.contains('student.student_profile.skills', filters.skills)
    }

    const { data, error, count } = await query
    if (error) {
      console.error('[recruiter/talent-pool] getSavedStudents error:', error)
      return {
        students: [] as TalentPoolStudent[],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        hasNextPage: false,
      }
    }

    const students = ((data ?? []) as SavedTalentPoolRow[])
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
      .from('student_profile')
      .select(
        `
        graduation_year, chapter_id,
        chapter:chapter!student_profile_chapter_id_fkey (id, name)
        `
      )
      .eq('is_recruiter_visible', true)
      .eq('approval_status', 'approved')

    if (error) {
      console.error('[recruiter/talent-pool] getTalentPoolFilterOptions error:', error)
      return { years: [] as number[], chapters: [] as Array<{ id: string; name: string }> }
    }

    const filterRows = (data ?? []) as TalentPoolFilterRow[]
    const years = Array.from(
      new Set(filterRows.map((row) => row.graduation_year).filter((year): year is number => !!year))
    ).sort((a, b) => a - b)

    const chaptersById = new Map<string, { id: string; name: string }>()
    for (const row of filterRows) {
      const chapter = Array.isArray(row.chapter) ? row.chapter[0] : row.chapter
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
      console.error('[recruiter/talent-pool] getSavedStatus error:', error)
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
      if (error) console.error('[RecruiterService.getStudentProfile] error:', error)
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
      console.error('[RecruiterService.downloadResume] createSignedUrl error:', signedError)
      return { success: false, error: 'Failed to generate download URL.' }
    }

    const { error: logError } = await supabase.from('resume_download_log').insert({
      recruiter_id: recruiterId,
      student_id: studentId,
      downloaded_at: new Date().toISOString(),
    })

    if (logError) {
      console.error('[RecruiterService.downloadResume] ResumeDownloadLog insert error:', logError)
      return { success: false, error: 'Failed to log resume download.' }
    }

    return { success: true, url: signedData.signedUrl }
  },
}
