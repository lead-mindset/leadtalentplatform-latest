'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { toggleSaveStudent } from '@/lib/actions/company/get-data'
import type { ChapterRow, StudentProfileRow, UserRow } from '@/lib/types'

export type TalentPoolFilters = {
  query?: string
  graduationYear?: number
  chapterId?: string
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
  graduationYear: number | null
  major: string | null
  skills: string[]
  updated_at: string
}

type TalentPoolProfileRow = Pick<
  StudentProfileRow,
  'graduation_year' | 'major' | 'skills' | 'updated_at'
> & {
  Chapter: Pick<ChapterRow, 'name' | 'university'> | Pick<ChapterRow, 'name' | 'university'>[] | null
}

type TalentPoolRow = Pick<UserRow, 'id' | 'name' | 'email'> & {
  StudentProfile: TalentPoolProfileRow | TalentPoolProfileRow[] | null
}

type SavedTalentPoolRow = {
  Student: TalentPoolRow | TalentPoolRow[] | null
}

type TalentPoolFilterRow = Pick<StudentProfileRow, 'graduationYear'> & {
  Chapter: { id: string; name: string } | { id: string; name: string }[] | null
}

function mapTalentPoolRow(row: TalentPoolRow): TalentPoolStudent | null {
  const profile = Array.isArray(row.StudentProfile) ? row.StudentProfile[0] : row.StudentProfile
  if (!profile) return null

  const chapter = Array.isArray(profile.Chapter) ? profile.Chapter[0] : profile.Chapter

  return {
    id: row.id,
    name: row.name,
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

export async function getTalentPool(filters: TalentPoolFilters, pagination?: TalentPoolPagination) {
  const supabase = await createClient()
  const { page, pageSize, from, to } = parsePagination(pagination)

  let query = supabase
    .from('user')
    .select(
      `
      id, name, email,
      StudentProfile!inner (
graduation_year, major, skills, updated_at, chapter_id, is_recruiter_visible, approval_status,
         Chapter:Chapter!StudentProfile_chapter_id_fkey (name, university)
       )
       `,
      { count: 'exact' }
    )
    .eq('role', 'member')
    .eq('StudentProfile.is_recruiter_visible', true)
    .eq('StudentProfile.approval_status', 'approved')
    .order('updated_at', { ascending: false, referencedTable: 'StudentProfile' })
    .range(from, to)

  if (filters.query?.trim()) {
    query = query.ilike('name', `%${filters.query.trim()}%`)
  }

  if (filters.graduationYear) {
    query = query.eq('StudentProfile.graduation_year', filters.graduationYear)
  }

  if (filters.chapterId) {
    query = query.eq('StudentProfile.chapter_id', filters.chapterId)
  }

  if (filters.skills && filters.skills.length > 0) {
    query = query.contains('StudentProfile.skills', filters.skills)
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
}

export async function getSavedStudents(filters: TalentPoolFilters, pagination?: TalentPoolPagination) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return {
      students: [] as TalentPoolStudent[],
      total: 0,
      page: 1,
      pageSize: pagination?.pageSize ?? 12,
      totalPages: 0,
      hasNextPage: false,
    }
  }

  const { page, pageSize, from, to } = parsePagination(pagination)

  let query = supabase
    .from('saved_student')
    .select(
      `
      student_id,
      Student:User!SavedStudent_student_id_fkey (
        id, name, email,
        StudentProfile!inner (
          graduation_year, major, skills, updated_at, chapter_id, is_recruiter_visible, approval_status,
          Chapter:Chapter!StudentProfile_chapter_id_fkey (name, university)
        )
      )
      `,
      { count: 'exact' }
    )
    .eq('recruiter_id', authUser.id)
    .eq('Student.StudentProfile.is_recruiter_visible', true)
    .eq('Student.StudentProfile.approval_status', 'approved')
    .order('saved_at', { ascending: false })
    .range(from, to)

  if (filters.query?.trim()) {
    query = query.ilike('Student.name', `%${filters.query.trim()}%`)
  }

  if (filters.graduationYear) {
    query = query.eq('Student.StudentProfile.graduation_year', filters.graduationYear)
  }

  if (filters.chapterId) {
    query = query.eq('Student.StudentProfile.chapter_id', filters.chapterId)
  }

  if (filters.skills && filters.skills.length > 0) {
    query = query.contains('Student.StudentProfile.skills', filters.skills)
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
      const user = Array.isArray(row.Student) ? row.Student[0] : row.Student
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
}

export async function getTalentPoolFilterOptions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_profile')
    .select(
      `
      graduation_year, chapter_id,
      Chapter:Chapter!StudentProfile_chapter_id_fkey (id, name)
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
    const chapter = Array.isArray(row.Chapter) ? row.Chapter[0] : row.Chapter
    if (chapter?.id && chapter?.name && !chaptersById.has(chapter.id)) {
      chaptersById.set(chapter.id, { id: chapter.id, name: chapter.name })
    }
  }

  const chapters = Array.from(chaptersById.values()).sort((a, b) => a.name.localeCompare(b.name))
  return { years, chapters }
}

export async function getSavedStatus(studentIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser || studentIds.length === 0) return []

  const { data, error } = await supabase
    .from('saved_student')
    .select('student_id')
    .eq('recruiter_id', authUser.id)
    .in('student_id', studentIds)

  if (error) {
    console.error('[recruiter/talent-pool] getSavedStatus error:', error)
    return []
  }

  return (data ?? []).map((row: { student_id: string }) => row.student_id)
}

export async function saveStudent(studentId: string, notes?: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return { success: false, error: 'Not authenticated.' }

  const result = await toggleSaveStudent(supabase, authUser.id, studentId)
  if (!result.success || !result.isSaved) {
    return { success: false, error: result.error ?? 'Failed to save student.' }
  }

  revalidatePath('/recruiter/browse')
  revalidatePath('/company/browse')
  return { success: true }
}

export async function unsaveStudent(studentId: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return { success: false, error: 'Not authenticated.' }

  const result = await toggleSaveStudent(supabase, authUser.id, studentId)
  if (!result.success || result.isSaved) {
    return { success: false, error: result.error ?? 'Failed to remove saved student.' }
  }

  revalidatePath('/recruiter/browse')
  revalidatePath('/company/browse')
  return { success: true }
}
