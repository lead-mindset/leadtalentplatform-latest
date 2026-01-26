import { createClient } from './supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type {
  RecruiterUser,
  StudentForRecruiter,
  StudentForRecruiterRaw,
  SavedStudent,
  CompanyStats,
} from './types';

export async function requireRecruiter(): Promise<{
  supabase: SupabaseClient;
  user: RecruiterUser;
}> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect('/auth/login');

  const { data: userData, error } = await supabase
    .from('User')
    .select(`
      id, email, name, role, chapterId, phone, createdAt, updatedAt
    `)
    .eq('id', authUser.id)
    .eq('role', 'recruiter')
    .single();

  if (error || !userData) redirect('/auth/login');

  const { data: activeAccess } = await supabase
    .from('RecruiterAccess')
    .select(`
      id, companyId, isActive, grantedById,
      acceptedByUserId, grantedAt, acceptedAt, revokedAt,
      inviteExpiresAt, recruiterEmail,
      Company (id, name, createdat, createdbyid)
    `)
    .eq('acceptedByUserId', authUser.id)
    .eq('isActive', true)
    .is('revokedAt', null)
    .maybeSingle();

  if (!activeAccess) redirect('/company/onboard');

  const { data: allAccess } = await supabase
    .from('RecruiterAccess')
    .select(`
      id, companyId, isActive, grantedById,
      acceptedByUserId, grantedAt, acceptedAt, revokedAt,
      inviteExpiresAt, recruiterEmail
    `)
    .eq('acceptedByUserId', authUser.id);

  const user: RecruiterUser = {
    ...userData,
    RecruiterAccess: allAccess || [],
    Company: Array.isArray(activeAccess.Company)
      ? activeAccess.Company[0] ?? null
      : activeAccess.Company ?? null,
  };

  return { supabase, user };
}

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

export async function acceptInvite(
  supabase: SupabaseClient,
  inviteId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: invite, error: fetchError } = await supabase
    .from('RecruiterAccess')
    .select('*')
    .eq('id', inviteId)
    .is('acceptedAt', null)
    .is('revokedAt', null)
    .single();

  if (fetchError || !invite) return { success: false, error: 'Invite not found or already used' };

  if (invite.inviteExpiresAt && new Date(invite.inviteExpiresAt) < new Date())
    return { success: false, error: 'Invite has expired' };

  const { error: updateError } = await supabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: userId,
      isActive: true,
    })
    .eq('id', inviteId);

  if (updateError) return { success: false, error: 'Failed to accept invite' };

  return { success: true };
}
