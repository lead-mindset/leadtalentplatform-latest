'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  updatedAt: string
}

function mapTalentPoolRow(row: any): TalentPoolStudent | null {
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
    graduationYear: profile.graduationYear ?? null,
    major: profile.major ?? null,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    updatedAt: profile.updatedAt,
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
    .from('User')
    .select(
      `
      id, name, email,
      StudentProfile!inner (
        graduationYear, major, skills, updatedAt, chapterId, isRecruiterVisible, approvalStatus,
        Chapter:Chapter!StudentProfile_chapterId_fkey (name, university)
      )
      `,
      { count: 'exact' }
    )
    .eq('role', 'member')
    .eq('StudentProfile.isRecruiterVisible', true)
    .eq('StudentProfile.approvalStatus', 'approved')
    .order('updatedAt', { ascending: false, referencedTable: 'StudentProfile' })
    .range(from, to)

  if (filters.query?.trim()) {
    query = query.ilike('name', `%${filters.query.trim()}%`)
  }

  if (filters.graduationYear) {
    query = query.eq('StudentProfile.graduationYear', filters.graduationYear)
  }

  if (filters.chapterId) {
    query = query.eq('StudentProfile.chapterId', filters.chapterId)
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

  const students = (data ?? [])
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
    .from('SavedStudent')
    .select(
      `
      studentId,
      Student:User!SavedStudent_studentId_fkey (
        id, name, email,
        StudentProfile!inner (
          graduationYear, major, skills, updatedAt, chapterId, isRecruiterVisible, approvalStatus,
          Chapter:Chapter!StudentProfile_chapterId_fkey (name, university)
        )
      )
      `,
      { count: 'exact' }
    )
    .eq('acceptedByUserId', authUser.id)
    .eq('Student.StudentProfile.isRecruiterVisible', true)
    .eq('Student.StudentProfile.approvalStatus', 'approved')
    .order('savedAt', { ascending: false })
    .range(from, to)

  if (filters.query?.trim()) {
    query = query.ilike('Student.name', `%${filters.query.trim()}%`)
  }

  if (filters.graduationYear) {
    query = query.eq('Student.StudentProfile.graduationYear', filters.graduationYear)
  }

  if (filters.chapterId) {
    query = query.eq('Student.StudentProfile.chapterId', filters.chapterId)
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

  const students = (data ?? [])
    .map(row => {
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
    .from('StudentProfile')
    .select(
      `
      graduationYear, chapterId,
      Chapter:Chapter!StudentProfile_chapterId_fkey (id, name)
      `
    )
    .eq('isRecruiterVisible', true)
    .eq('approvalStatus', 'approved')

  if (error) {
    console.error('[recruiter/talent-pool] getTalentPoolFilterOptions error:', error)
    return { years: [] as number[], chapters: [] as Array<{ id: string; name: string }> }
  }

  const years = Array.from(
    new Set((data ?? []).map(row => row.graduationYear).filter((year): year is number => !!year))
  ).sort((a, b) => a - b)

  const chaptersById = new Map<string, { id: string; name: string }>()
  for (const row of data ?? []) {
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
    .from('SavedStudent')
    .select('studentId')
    .eq('acceptedByUserId', authUser.id)
    .in('studentId', studentIds)

  if (error) {
    console.error('[recruiter/talent-pool] getSavedStatus error:', error)
    return []
  }

  return (data ?? []).map(row => row.studentId)
}

export async function saveStudent(studentId: string, notes?: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase.from('SavedStudent').insert({
    acceptedByUserId: authUser.id,
    studentId,
    savedAt: new Date().toISOString(),
    notes: notes?.trim() || null,
  })

  if (error) {
    console.error('[recruiter/talent-pool] saveStudent error:', error)
    return { success: false, error: 'Failed to save student.' }
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

  const { error } = await supabase
    .from('SavedStudent')
    .delete()
    .eq('acceptedByUserId', authUser.id)
    .eq('studentId', studentId)

  if (error) {
    console.error('[recruiter/talent-pool] unsaveStudent error:', error)
    return { success: false, error: 'Failed to remove saved student.' }
  }

  revalidatePath('/recruiter/browse')
  revalidatePath('/company/browse')
  return { success: true }
}
