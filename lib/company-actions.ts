import { createClient } from './supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createServiceClient } from './supabase/server-service';
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

export async function acceptInvite(formData: {
  inviteToken: string
  name: string
}) {
  const serviceSupabase = createServiceClient()

  // 1. Validate invite
  const { data: invite, error: inviteError } = await serviceSupabase
    .from('RecruiterAccess')
    .select('*')
    .eq('inviteToken', formData.inviteToken)
    .maybeSingle()

  if (!invite || inviteError) {
    return { success: false, error: 'Invalid invite token' }
  }
  
  if (invite.revokedAt) {
    return { success: false, error: 'Invite has been revoked' }
  }
  if (invite.acceptedAt) {
    return { success: false, error: 'Invite already accepted' }
  }

  // 2. Check if user already exists
  const { data: existingUser } = await serviceSupabase
    .from('User')
    .select('id')
    .eq('email', invite.recruiterEmail)
    .maybeSingle()

  let userId: string

  if (existingUser) {
    userId = existingUser.id
    
    await serviceSupabase
      .from('User')
      .update({ 
        name: formData.name,
        updatedAt: new Date().toISOString() 
      })
      .eq('id', userId)

    console.log('[acceptInvite] Using existing user:', userId)
  } else {
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: invite.recruiterEmail,
      email_confirm: true,
    })

    if (!authData.user || authError) {
      console.error('[acceptInvite] Auth creation failed:', authError)
      return { success: false, error: 'Failed to create account' }
    }

    userId = authData.user.id

    const { error: profileError } = await serviceSupabase
      .from('User')
      .insert({
        id: userId,
        email: invite.recruiterEmail,
        role: 'recruiter',
        name: formData.name,
      })

    if (profileError) {
      console.error('[acceptInvite] Profile creation failed:', profileError)
      return { success: false, error: 'Failed to create profile' }
    }
    
    console.log('[acceptInvite] Created new recruiter:', userId)
  }

  // 3. Activate the invite
  const { error: updateError } = await serviceSupabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: userId,
      isActive: true,
    })
    .eq('id', invite.id)

  if (updateError) {
    console.error('[acceptInvite] Activation failed:', updateError)
    return { success: false, error: 'Failed to activate access' }
  }

  console.log('[acceptInvite] Activated RecruiterAccess for:', invite.recruiterEmail)

  // 4. Send OTP for login - USE SERVICE CLIENT
  const { error: otpError } = await serviceSupabase.auth.signInWithOtp({
    email: invite.recruiterEmail,
    options: {
      emailRedirectTo: `${process.env.FRONTEND_URL}/auth/confirm?next=/company/dashboard`,
    }
  })
  
  if (otpError) {
    console.error('[acceptInvite] OTP send failed:', otpError)
    return { 
      success: true,
      warning: 'Account created! Please use the login page to access your dashboard.',
      recruiterEmail: invite.recruiterEmail
    }
  }

  return { 
    success: true,
    message: 'Check your email for a login link',
    recruiterEmail: invite.recruiterEmail
  }
}


export async function validateInviteToken(inviteToken: string) {
  console.log('--- validateInviteToken START ---')
  console.log('Token received:', inviteToken)

  const supabase = createServiceClient() 

  const { data: invite, error } = await supabase
    .from('RecruiterAccess')
    .select('*')
    .match({ inviteToken })
    .maybeSingle()

  console.log('Supabase invite data:', invite, 'error:', error)

  if (error) {
    console.error('[validateInviteToken] Database error:', error)
    return { success: false, error: 'Database error: ' + error.message }
  }

  if (!invite) {
    console.warn('[validateInviteToken] Token not found in database:', inviteToken)
    return { success: false, error: 'Invalid invite token' }
  }

  if (invite.revokedAt) return { success: false, error: 'Invite revoked' }
  if (invite.acceptedAt) return { success: false, error: 'Invite already accepted' }

  console.log('[validateInviteToken] Invite row found:', invite)

  let company = null
  if (invite.companyId) {
    const { data: companyData, error: companyError } = await supabase
      .from('Company')
      .select('id, name')
      .eq('id', invite.companyId)
      .maybeSingle()

    if (companyError) console.error('[validateInviteToken] Company fetch error:', companyError)
    company = companyData
    console.log('[validateInviteToken] Company row fetched:', company)
  }

  return {
    success: true,
    data: {
      companyId: company?.id ?? invite.companyId,
      companyName: company?.name ?? null,
      recruiterEmail: invite.recruiterEmail,
      inviteId: invite.id,
    },
  }
}