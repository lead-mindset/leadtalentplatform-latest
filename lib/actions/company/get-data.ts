import type { SupabaseClient } from '@supabase/supabase-js'
import { CompanyService } from '@/lib/services/company.service'
import type {
  CompanyStats,
  Database,
  SavedStudent,
  StudentForRecruiter,
} from '@/lib/types'
import type { CompanyDataResult } from '@/lib/services/company.service'

/**
 * Returns all students visible to recruiters.
 * Filters by role in ['member', 'editor'] AND isRecruiterVisible=true at the DB level.
 */
export async function getVisibleStudents(
  supabase: SupabaseClient<Database>
): Promise<StudentForRecruiter[]> {
  return CompanyService.getVisibleStudents(supabase)
}

export async function getVisibleStudentsResult(
  supabase: SupabaseClient<Database>
): Promise<CompanyDataResult<StudentForRecruiter[]>> {
  return CompanyService.getVisibleStudentsResult(supabase)
}

/**
 * Returns a single student by ID, only if they are visible to recruiters.
 */
export async function getStudentById(
  supabase: SupabaseClient<Database>,
  studentId: string
): Promise<StudentForRecruiter | null> {
  return CompanyService.getStudentById(supabase, studentId)
}

export async function getStudentByIdResult(
  supabase: SupabaseClient<Database>,
  studentId: string
): Promise<CompanyDataResult<StudentForRecruiter | null>> {
  return CompanyService.getStudentByIdResult(supabase, studentId)
}

/**
 * Returns saved students for a recruiter.
 */
export async function getSavedStudents(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SavedStudent[]> {
  return CompanyService.getSavedStudents(supabase, userId)
}

export async function getSavedStudentsResult(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CompanyDataResult<SavedStudent[]>> {
  return CompanyService.getSavedStudentsResult(supabase, userId)
}

/**
 * Returns saved student IDs for a recruiter — lightweight, for checking save state.
 */
export async function getSavedStudentIds(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string[]> {
  return CompanyService.getSavedStudentIds(supabase, userId)
}

/**
 * Company stats using a count query — does not fetch full student records.
 */
export async function getCompanyStats(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CompanyStats> {
  return CompanyService.getCompanyStats(supabase, userId)
}

export async function getCompanyStatsResult(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CompanyDataResult<CompanyStats>> {
  return CompanyService.getCompanyStatsResult(supabase, userId)
}

/**
 * Searches students with filters pushed to the database where possible.
 * Skills, name, and email matching use client-side fallback for OR semantics.
 */
export async function searchStudents(
  supabase: SupabaseClient<Database>,
  filters: {
    query?: string
    major?: string
    graduation_year?: number
    chapter_id?: string
    city?: string
    includeAlumni?: boolean
    hasLinkedIn?: boolean
    hasPortfolio?: boolean
    hasResume?: boolean
    sortBy?: 'created_at' | 'updated_at'
  }
): Promise<StudentForRecruiter[]> {
  return CompanyService.searchStudents(supabase, filters)
}

export async function searchStudentsResult(
  supabase: SupabaseClient<Database>,
  filters: {
    query?: string
    major?: string
    graduation_year?: number
    chapter_id?: string
    city?: string
    includeAlumni?: boolean
    hasLinkedIn?: boolean
    hasPortfolio?: boolean
    hasResume?: boolean
    sortBy?: 'created_at' | 'updated_at'
  }
): Promise<CompanyDataResult<StudentForRecruiter[]>> {
  return CompanyService.searchStudentsResult(supabase, filters)
}

export async function toggleSaveStudent(
  supabase: SupabaseClient<Database>,
  userId: string,
  studentId: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  return CompanyService.toggleSaveStudent(supabase, userId, studentId)
}

export async function isStudentSaved(
  supabase: SupabaseClient<Database>,
  userId: string,
  studentId: string
): Promise<boolean> {
  return CompanyService.isStudentSaved(supabase, userId, studentId)
}

export async function isStudentSavedResult(
  supabase: SupabaseClient<Database>,
  userId: string,
  studentId: string
): Promise<CompanyDataResult<boolean>> {
  return CompanyService.isStudentSavedResult(supabase, userId, studentId)
}

export async function getTalentResumeMetadata(
  supabase: SupabaseClient<Database>,
  studentId: string
): Promise<{ file_name: string | null; uploaded_at: string | null } | null> {
  return CompanyService.getTalentResumeMetadata(supabase, studentId)
}
