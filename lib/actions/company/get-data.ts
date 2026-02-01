import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type {
  RecruiterUser,
  StudentForRecruiter,
  StudentForRecruiterRaw,
  SavedStudent,
  CompanyStats,
} from '@/lib/types';

function normalizeStudents(
  students: StudentForRecruiterRaw[]
): StudentForRecruiter[] {
  return students.map((student) => ({
    ...student,
    Chapter: student.Chapter[0] ?? null,
    StudentProfile: student.StudentProfile[0] ?? null,
  }));
}

export async function getVisibleStudents(
  supabase: SupabaseClient
): Promise<StudentForRecruiter[]> {
  const { data, error } = await supabase
    .from('User')
    .select(`
      id, email, name, phone, chapterId, createdAt,
      Chapter (name, university, city, region),
      StudentProfile!StudentProfile_userId_fkey (
        major, graduationYear, linkedinUrl, skills,
        isRecruiterVisible, isFilled, updatedAt
      )
    `)
    .eq('role', 'member')
    .order('createdAt', { ascending: false });

  if (error || !data) return [];

  const normalized = normalizeStudents(data as StudentForRecruiterRaw[]);

  return normalized.filter(
    (s) => s.StudentProfile?.isRecruiterVisible === true &&
           s.StudentProfile?.isFilled === true
  );
}

export async function getStudentById(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentForRecruiter | null> {
  const { data, error } = await supabase
    .from('User')
    .select(`
      id, email, name, phone, chapterId, createdAt,
      Chapter (name, university, city, region),
      StudentProfile!StudentProfile_userId_fkey (
        major, graduationYear, linkedinUrl, skills,
        isRecruiterVisible, isFilled, updatedAt
      )
    `)
    .eq('id', studentId)
    .eq('role', 'member')
    .single();

  if (error || !data) return null;

  const normalized = normalizeStudents([data as StudentForRecruiterRaw]);
  const student = normalized[0];

  if (student?.StudentProfile?.isRecruiterVisible !== true ||
      student?.StudentProfile?.isFilled !== true) return null;

  return student;
}

export async function getSavedStudents(
  supabase: SupabaseClient,
  userId: string
): Promise<SavedStudent[]> {
  const { data, error } = await supabase
    .from('SavedStudent')
    .select(`
      id, acceptedByUserId, studentId, savedAt, notes,
      Student:User!SavedStudent_studentId_fkey (
        id, email, name, phone, chapterId, createdAt,
        Chapter (name, university, city, region),
        StudentProfile!StudentProfile_userId_fkey (
          major, graduationYear, linkedinUrl, skills,
          isRecruiterVisible, isFilled, updatedAt
        )
      )
    `)
    .eq('acceptedByUserId', userId)
    .order('savedAt', { ascending: false });

  if (error || !data) return [];

  return data.map((saved: any) => {
    const studentData = Array.isArray(saved.Student)
      ? saved.Student[0]
      : saved.Student;

    return {
      ...saved,
      Student: {
        ...studentData,
        Chapter: Array.isArray(studentData?.Chapter)
          ? studentData.Chapter[0] ?? null
          : studentData?.Chapter ?? null,
        StudentProfile: Array.isArray(studentData?.StudentProfile)
          ? studentData.StudentProfile[0] ?? null
          : studentData?.StudentProfile ?? null,
      },
    };
  });
}

export async function toggleSaveStudent(
  supabase: SupabaseClient,
  userId: string,
  studentId: string
): Promise<{ success: boolean; isSaved: boolean }> {
  const { data: existing } = await supabase
    .from('SavedStudent')
    .select('id')
    .eq('acceptedByUserId', userId)
    .eq('studentId', studentId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('SavedStudent')
      .delete()
      .eq('id', existing.id);

    return { success: !error, isSaved: false };
  } else {
    const { error } = await supabase.from('SavedStudent').insert({
      acceptedByUserId: userId,
      studentId,
      savedAt: new Date().toISOString(),
    });

    return { success: !error, isSaved: true };
  }
}

export async function getCompanyStats(
  supabase: SupabaseClient,
  userId: string
): Promise<CompanyStats> {
  const [visibleStudents, savedStudents] = await Promise.all([
    getVisibleStudents(supabase),
    getSavedStudents(supabase, userId),
  ]);

  return {
    totalStudents: visibleStudents.length,
    savedStudents: savedStudents.length,
    recentViews: 0,
  };
}



