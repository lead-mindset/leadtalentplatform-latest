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
    .select(
      `
      id, email, name, role, chapterId, phone, createdAt, updatedAt,
      RecruiterAccess!RecruiterAccess_recruiterId_fkey (
        id, recruiterId, companyId, isActive, grantedById,
        acceptedByUserId, grantedAt, acceptedAt, revokedAt,
        inviteExpiresAt, recruiterEmail
      ),
      Company:RecruiterAccess!RecruiterAccess_recruiterId_fkey (
        id, name, createdat, createdbyid
      )
    `
    )
    .eq('id', authUser.id)
    .eq('role', 'recruiter')
    .single();

  if (error || !userData) {
    console.error('Recruiter fetch error:', error);
    redirect('/auth/login');
  }

  const activeAccess = Array.isArray(userData.RecruiterAccess)
    ? userData.RecruiterAccess.find((a: any) => a.isActive)
    : null;

  if (!activeAccess) {
    redirect('/company/onboard');
  }

  const user: RecruiterUser = {
    ...userData,
    RecruiterAccess: Array.isArray(userData.RecruiterAccess)
      ? userData.RecruiterAccess
      : [],
    Company: Array.isArray(userData.Company)
      ? userData.Company[0] ?? null
      : userData.Company ?? null,
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
    .select(
      `
      id, email, name, phone, chapterId, createdAt,
      Chapter (name, university, city, region),
      StudentProfile!StudentProfile_userId_fkey (
        major, graduationYear, linkedinUrl, skills,
        isRecruiterVisible, updatedAt
      )
    `
    )
    .eq('role', 'member')
    .order('createdAt', { ascending: false });

  if (error || !data) {
    console.error('Failed to fetch students:', error);
    return [];
  }

  const normalized = normalizeStudents(data as StudentForRecruiterRaw[]);
  
  return normalized.filter(
    (s) => s.StudentProfile?.isRecruiterVisible === true
  );
}

export async function getStudentById(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentForRecruiter | null> {
  const { data, error } = await supabase
    .from('User')
    .select(
      `
      id, email, name, phone, chapterId, createdAt,
      Chapter (name, university, city, region),
      StudentProfile!StudentProfile_userId_fkey (
        major, graduationYear, linkedinUrl, skills,
        isRecruiterVisible, updatedAt
      )
    `
    )
    .eq('id', studentId)
    .eq('role', 'member')
    .single();

  if (error || !data) {
    console.error('Failed to fetch student:', error);
    return null;
  }

  const normalized = normalizeStudents([data as StudentForRecruiterRaw]);
  const student = normalized[0];

  if (student?.StudentProfile?.isRecruiterVisible !== true) {
    return null;
  }

  return student;
}

export async function getSavedStudents(
  supabase: SupabaseClient,
  recruiterId: string
): Promise<SavedStudent[]> {
  const { data, error } = await supabase
    .from('SavedStudent')
    .select(
      `
      id, recruiterId, studentId, savedAt, notes,
      Student:User!SavedStudent_studentId_fkey (
        id, email, name, phone, chapterId, createdAt,
        Chapter (name, university, city, region),
        StudentProfile!StudentProfile_userId_fkey (
          major, graduationYear, linkedinUrl, skills,
          isRecruiterVisible, updatedAt
        )
      )
    `
    )
    .eq('recruiterId', recruiterId)
    .order('savedAt', { ascending: false });

  if (error || !data) {
    console.error('Failed to fetch saved students:', error);
    return [];
  }

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
  recruiterId: string,
  studentId: string
): Promise<{ success: boolean; isSaved: boolean }> {
  const { data: existing } = await supabase
    .from('SavedStudent')
    .select('id')
    .eq('recruiterId', recruiterId)
    .eq('studentId', studentId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('SavedStudent')
      .delete()
      .eq('id', existing.id);

    return { success: !error, isSaved: false };
  } else {
    const { error } = await supabase.from('SavedStudent').insert({
      recruiterId,
      studentId,
      savedAt: new Date().toISOString(),
    });

    return { success: !error, isSaved: true };
  }
}

export async function getCompanyStats(
  supabase: SupabaseClient,
  recruiterId: string
): Promise<CompanyStats> {
  const [visibleStudents, savedStudents] = await Promise.all([
    getVisibleStudents(supabase),
    getSavedStudents(supabase, recruiterId),
  ]);

  return {
    totalStudents: visibleStudents.length,
    savedStudents: savedStudents.length,
    recentViews: 0, 
  };
}

export async function acceptInvite(
  supabase: SupabaseClient,
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: invite, error: fetchError } = await supabase
    .from('RecruiterAccess')
    .select('*')
    .eq('id', token)
    .is('acceptedAt', null)
    .is('revokedAt', null)
    .single();

  if (fetchError || !invite) {
    return { success: false, error: 'Invite not found or already used' };
  }

  if (
    invite.inviteExpiresAt &&
    new Date(invite.inviteExpiresAt) < new Date()
  ) {
    return { success: false, error: 'Invite has expired' };
  }

  const { error: updateError } = await supabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: userId,
      isActive: true,
    })
    .eq('id', token);

  if (updateError) {
    return { success: false, error: 'Failed to accept invite' };
  }

  return { success: true };
}