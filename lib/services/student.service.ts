import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.generated';

/**
 * Service Layer: Student Domain
 *
 * All student profile operations — read, update, and resume upload —
 * are encapsulated here to keep Server Actions thin and testable.
 *
 * Design decisions:
 * - updateProfile performs a multi-table upsert (user + student_profile)
 *   because profile data is split across two tables for role-based access.
 * - Resume uploads go to Supabase Storage ('resumes' bucket) and metadata
 *   is tracked in the `resume` table for recruiter visibility controls.
 * - All methods accept a SupabaseClient instance to remain framework-agnostic
 *   and enable easy mocking in unit tests.
 */

export type UpdateProfileParams = {
  userId: string;
  fullName: string;
  phone: string;
  career: string;
  gender?: string;
  graduationYear: number;
  skills: string[];
  linkedinUrl: string;
  consentRecruiterVisibility: boolean;
  emailNotificationsEnabled: boolean;
  chapterId: string;
  resumePdf?: File;
};

export const StudentService = {
  async getProfile(supabase: SupabaseClient<Database>, userId: string) {
    const { data: profile, error } = await supabase
      .from('student_profile')
      .select(
        'user_id, chapter_id, major, graduation_year, skills, linkedin_url, consent_recruiter_visibility, email_notifications_enabled, gender, member_id, approval_status'
      )
      .eq('user_id', userId)
      .single();

    if (error) throw new Error('Student profile not found');
    return profile;
  },

  async updateProfile(supabase: SupabaseClient<Database>, params: UpdateProfileParams) {
    const now = new Date().toISOString();

    // 1. Update User Record
    const { error: userError } = await supabase
      .from('user')
      .update({
        name: params.fullName,
        phone: params.phone,
        updated_at: now,
      })
      .eq('id', params.userId);

    if (userError) throw userError;

    // 2. Upsert Student Profile
    const { error: profileError } = await supabase.from('student_profile').upsert(
      {
        user_id: params.userId,
        major: params.career,
        gender: params.gender,
        graduation_year: params.graduationYear,
        skills: params.skills,
        linkedin_url: params.linkedinUrl,
        consent_recruiter_visibility: params.consentRecruiterVisibility,
        consent_date: params.consentRecruiterVisibility ? now : null,
        email_notifications_enabled: params.emailNotificationsEnabled,
        updated_at: now,
        chapter_id: params.chapterId,
      },
      { onConflict: 'user_id' }
    );

    if (profileError) throw profileError;

    // 3. Handle Resume if provided
    if (params.resumePdf) {
      await this.uploadResume(supabase, params.userId, params.resumePdf);
    }

    return { success: true };
  },

  async getResume(supabase: SupabaseClient<Database>, userId: string) {
    const { data: resume, error } = await supabase
      .from('resume')
      .select('student_id, file_url, file_name, file_size, uploaded_at')
      .eq('student_id', userId)
      .single();

    if (error) return null;
    return resume;
  },

  async uploadResume(supabase: SupabaseClient<Database>, userId: string, file: File) {
    const now = new Date().toISOString();
    const filePath = `${userId}/${crypto.randomUUID()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('resumes').getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('resume').upsert(
      {
        student_id: userId,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_at: now,
      },
      { onConflict: 'student_id' }
    );

    if (dbError) throw dbError;
    return publicUrl;
  },
};
