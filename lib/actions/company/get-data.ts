import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  StudentForRecruiter,
  SavedStudent,
  CompanyStats,
} from '@/lib/types';

export async function getVisibleStudents(
  supabase: SupabaseClient
): Promise<StudentForRecruiter[]> {
  const { data, error } = await supabase
    .from('User')
    .select(`
      id, email, name, phone, createdAt,
      StudentProfile!StudentProfile_userId_fkey (
        major, graduationYear, linkedinUrl, skills,
        isRecruiterVisible, isFilled, updatedAt, chapterId,
        Chapter:Chapter!StudentProfile_chapterId_fkey (
          name, university, city, region
        )
      )
    `)
    .eq('role', 'member')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[getVisibleStudents] Error:', error);
    return [];
  }
  if (!data) return [];

  // Transform the data to match StudentForRecruiter type
  const transformed: StudentForRecruiter[] = [];
  
  for (const user of data) {
    const profile = Array.isArray(user.StudentProfile)
      ? user.StudentProfile[0]
      : user.StudentProfile;

    if (!profile) continue;

    const chapter = Array.isArray(profile.Chapter)
      ? profile.Chapter[0]
      : profile.Chapter;

    transformed.push({
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
    });
  }

  // Filter for students that are visible to recruiters
  return transformed.filter(
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
      id, email, name, phone, createdAt,
      StudentProfile!StudentProfile_userId_fkey (
        major, graduationYear, linkedinUrl, skills,
        isRecruiterVisible, isFilled, updatedAt, chapterId,
        Chapter:Chapter!StudentProfile_chapterId_fkey (
          name, university, city, region
        )
      )
    `)
    .eq('id', studentId)
    .eq('role', 'member')
    .single();

  if (error) {
    console.error('[getStudentById] Error:', error);
    return null;
  }

  if (!data) return null;

  const profile = Array.isArray(data.StudentProfile)
    ? data.StudentProfile[0]
    : data.StudentProfile;

  if (!profile) return null;

  const chapter = Array.isArray(profile.Chapter)
    ? profile.Chapter[0]
    : profile.Chapter;

  const student: StudentForRecruiter = {
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    createdAt: data.createdAt,
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
  };

  if (student.StudentProfile?.isRecruiterVisible !== true ||
      student.StudentProfile?.isFilled !== true) {
    return null;
  }

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
    .eq('acceptedByUserId', userId)
    .order('savedAt', { ascending: false });

  if (error) {
    console.error('[getSavedStudents] Error:', error);
    return [];
  }

  if (!data) return [];

  return data.map((saved: any) => {
    const studentData = Array.isArray(saved.Student)
      ? saved.Student[0]
      : saved.Student;

    const profile = studentData?.StudentProfile
      ? Array.isArray(studentData.StudentProfile)
        ? studentData.StudentProfile[0]
        : studentData.StudentProfile
      : null;

    const chapter = profile?.Chapter
      ? Array.isArray(profile.Chapter)
        ? profile.Chapter[0]
        : profile.Chapter
      : null;

    return {
      id: saved.id,
      acceptedByUserId: saved.acceptedByUserId,
      studentId: saved.studentId,
      savedAt: saved.savedAt,
      notes: saved.notes,
      Student: {
        id: studentData?.id,
        email: studentData?.email,
        name: studentData?.name,
        phone: studentData?.phone,
        createdAt: studentData?.createdAt,
        Chapter: chapter,
        StudentProfile: profile ? {
          major: profile.major,
          graduationYear: profile.graduationYear,
          linkedinUrl: profile.linkedinUrl,
          skills: profile.skills,
          isRecruiterVisible: profile.isRecruiterVisible,
          isFilled: profile.isFilled,
          updatedAt: profile.updatedAt,
          chapterId: profile.chapterId,
        } : null,
      },
    };
  });
}

export async function toggleSaveStudent(
  supabase: SupabaseClient,
  userId: string,
  studentId: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  // Check if student is already saved
  const { data: existing, error: checkError } = await supabase
    .from('SavedStudent')
    .select('id')
    .eq('acceptedByUserId', userId)
    .eq('studentId', studentId)
    .maybeSingle();

  if (checkError) {
    console.error('[toggleSaveStudent] Check error:', checkError);
    return { success: false, isSaved: false, error: 'Failed to check save status' };
  }
  if (existing) {
    // Student is saved, so unsave them
    const { error: deleteError } = await supabase
      .from('SavedStudent')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      console.error('[toggleSaveStudent] Delete error:', deleteError);
      return { success: false, isSaved: true, error: 'Failed to unsave student' };
    }
    return { success: true, isSaved: false };
  } else {
    // Student is not saved, so save them
    const { error: insertError } = await supabase
      .from('SavedStudent')
      .insert({
        acceptedByUserId: userId,
        studentId,
        savedAt: new Date().toISOString(),
        notes: null,
      });
    if (insertError) {
      console.error('[toggleSaveStudent] Insert error:', insertError);
      return { success: false, isSaved: false, error: 'Failed to save student' };
    }
    return { success: true, isSaved: true };
  }
}

export async function updateSavedStudentNotes(
  supabase: SupabaseClient,
  userId: string,
  studentId: string,
  notes: string | null
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('SavedStudent')
    .update({ notes })
    .eq('acceptedByUserId', userId)
    .eq('studentId', studentId);

  if (error) {
    console.error('[updateSavedStudentNotes] Error:', error);
    return { success: false, error: 'Failed to update notes' };
  }

  return { success: true };
}

export async function isStudentSaved(
  supabase: SupabaseClient,
  userId: string,
  studentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('SavedStudent')
    .select('id')
    .eq('acceptedByUserId', userId)
    .eq('studentId', studentId)
    .maybeSingle();

  if (error) {
    console.error('[isStudentSaved] Error:', error);
    return false;
  }
  return !!data;
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
    recentViews: 0, // Implement if you add a StudentView table
  };
}

export async function searchStudents(
  supabase: SupabaseClient,
  filters: {
    major?: string;
    graduationYear?: number;
    skills?: string[];
    university?: string;
    city?: string;
  }
): Promise<StudentForRecruiter[]> {
  const { data, error } = await supabase
    .from('User')
    .select(`
      id, email, name, phone, createdAt,
      StudentProfile!StudentProfile_userId_fkey (
        major, graduationYear, linkedinUrl, skills,
        isRecruiterVisible, isFilled, updatedAt, chapterId,
        Chapter:Chapter!StudentProfile_chapterId_fkey (
          name, university, city, region
        )
      )
    `)
    .eq('role', 'member')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[searchStudents] Error:', error);
    return [];
  }

  if (!data) return [];

  const transformed: StudentForRecruiter[] = [];
  
  for (const user of data) {
    const profile = Array.isArray(user.StudentProfile)
      ? user.StudentProfile[0]
      : user.StudentProfile;

    if (!profile) continue;

    const chapter = Array.isArray(profile.Chapter)
      ? profile.Chapter[0]
      : profile.Chapter;

    transformed.push({
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
    });
  }

  // Filter visible students
  let results = transformed.filter(
    (s) => s.StudentProfile?.isRecruiterVisible === true &&
           s.StudentProfile?.isFilled === true
  );

  // Apply client-side filters
  if (filters.major) {
    results = results.filter((s) => 
      s.StudentProfile?.major.toLowerCase().includes(filters.major!.toLowerCase())
    );
  }

  if (filters.graduationYear) {
    results = results.filter((s) => 
      s.StudentProfile?.graduationYear === filters.graduationYear
    );
  }

  if (filters.skills && filters.skills.length > 0) {
    results = results.filter((s) => {
      const studentSkills = s.StudentProfile?.skills || [];
      return filters.skills!.some(skill => 
        studentSkills.some(ss => 
          ss.toLowerCase().includes(skill.toLowerCase())
        )
      );
    });
  }

  if (filters.university) {
    results = results.filter((s) => 
      s.Chapter?.university.toLowerCase().includes(filters.university!.toLowerCase())
    );
  }

  if (filters.city) {
    results = results.filter((s) => 
      s.Chapter?.city?.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }

  return results;
}

export async function getStudentsByChapter(
  supabase: SupabaseClient,
  chapterId: string
): Promise<StudentForRecruiter[]> {
  const { data, error } = await supabase
    .from('User')
    .select(`
      id, email, name, phone, createdAt,
      StudentProfile!StudentProfile_userId_fkey (
        major, graduationYear, linkedinUrl, skills,
        isRecruiterVisible, isFilled, updatedAt, chapterId,
        Chapter:Chapter!StudentProfile_chapterId_fkey (
          name, university, city, region
        )
      )
    `)
    .eq('role', 'member')
    .eq('StudentProfile.chapterId', chapterId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[getStudentsByChapter] Error:', error);
    return [];
  }

  if (!data) return [];

  const transformed: StudentForRecruiter[] = [];
  
  for (const user of data) {
    const profile = Array.isArray(user.StudentProfile)
      ? user.StudentProfile[0]
      : user.StudentProfile;

    if (!profile) continue;

    const chapter = Array.isArray(profile.Chapter)
      ? profile.Chapter[0]
      : profile.Chapter;

    transformed.push({
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
    });
  }

  return transformed.filter(
    (s) => s.StudentProfile?.isRecruiterVisible === true &&
           s.StudentProfile?.isFilled === true
  );
}