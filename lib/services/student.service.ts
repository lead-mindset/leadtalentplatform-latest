import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.generated';
import { ChapterMembershipService } from '@/lib/services/chapter-membership.service';
import { NewsletterSubscriptionService } from '@/lib/services/newsletter-subscription.service';

/**
 * Service Layer: Student Domain
 *
 * All student profile operations — read, update, and resume upload —
 * are encapsulated here to keep Server Actions thin and testable.
 *
 * Design decisions:
 * - updateProfile performs a multi-table upsert (user + person_profile)
 *   because profile data is split across two tables for role-based access.
 * - Resume uploads go to Supabase Storage ('resumes' bucket) and metadata
 *   is tracked in the `resume` table for recruiter visibility controls.
 * - All methods accept a SupabaseClient instance to remain framework-agnostic
 *   and enable easy mocking in unit tests.
 * - Uses person_profile table (migrated from student_profile in LEAD-002)
 * - Creates chapter_membership entries for chapter association
 */

export type UpdateProfileParams = {
  userId: string;
  fullName: string;
  phone: string;
  career: string;
  gender?: string;
  graduation_year: number;
  skills: string[];
  linkedinUrl: string;
  consentRecruiterVisibility: boolean;
  emailNotificationsEnabled: boolean;
  chapter_id: string;
  resumePdf?: File;
};

export const StudentService = {
  async getProfile(supabase: SupabaseClient<Database>, userId: string) {
    const { data: profile, error } = await supabase
      .from('person_profile')
      .select(
        'user_id, university, major_or_interest, graduation_year, skills, linkedin_url, is_recruiter_visible, gender'
      )
      .eq('user_id', userId)
      .single();

    if (error) throw new Error('Student profile not found');

    const { data: membership } = await supabase
      .from('chapter_membership')
      .select('chapter_id, status, position, member_id, joined_at')
      .eq('user_id', userId)
      .maybeSingle();

    return { ...profile, ...membership };
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

    // 2. Upsert Person Profile
    const { error: profileError } = await supabase.from('person_profile').upsert(
      {
        user_id: params.userId,
        university: params.career,
        major_or_interest: params.career,
        gender: params.gender,
        graduation_year: params.graduation_year,
        skills: params.skills,
        linkedin_url: params.linkedinUrl,
        is_recruiter_visible: params.consentRecruiterVisibility,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    );

    if (profileError) throw profileError;

    // 3. Create explicit chapter application
    const membershipResult = await ChapterMembershipService.applyToChapter(supabase, {
      userId: params.userId,
      chapterId: params.chapter_id,
    });

    if (!membershipResult.success) throw new Error(membershipResult.error);

    // 4. Create newsletter preferences when explicitly opted in.
    if (params.emailNotificationsEnabled) {
      const globalResult = await NewsletterSubscriptionService.subscribeGlobal(supabase, {
        userId: params.userId,
        source: 'onboarding',
      });

      if (!globalResult.success) throw new Error(globalResult.error);

      const chapterResult = await NewsletterSubscriptionService.subscribeToChapter(supabase, {
        userId: params.userId,
        chapterId: params.chapter_id,
        source: 'onboarding',
      });

      if (!chapterResult.success) throw new Error(chapterResult.error);
    }

    // 5. Handle Resume if provided
    if (params.resumePdf) {
      await this.uploadResume(supabase, params.userId, params.resumePdf);
    }

    return { success: true };
  },

  async getResume(supabase: SupabaseClient<Database>, userId: string) {
    const { data: resume, error } = await supabase
      .from('resume')
      .select('id, student_id, file_url, file_name, file_size, uploaded_at')
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
        upsert: true,
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

  async saveResume(
    supabase: SupabaseClient<Database>,
    userId: string,
    file: File
  ): Promise<{ success: true; publicUrl: string } | { success: false; error: string }> {
    try {
      const publicUrl = await this.uploadResume(supabase, userId, file);
      return { success: true, publicUrl };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      return { success: false, error: message };
    }
  },

  async submitOnboarding(
    supabase: SupabaseClient<Database>,
    params: {
      userId: string
      email: string
      fullName: string
      phone: string
      career: string
      gender: string
      graduationYear: number
      skills: string[]
      linkedinUrl: string
      consentRecruiterVisibility: boolean
      emailNotificationsEnabled: boolean
      leadChapter: string
      resumePdf?: File | null
    }
  ): Promise<{ success: true } | { success: false; error: string }> {
    const now = new Date().toISOString()

    // Update User table
    const { error: userError } = await supabase
      .from('user')
      .upsert({
        id: params.userId,
        email: params.email,
        name: params.fullName,
        phone: params.phone,
        updated_at: now,
      })
      .eq('id', params.userId)

    if (userError) {
      return { success: false, error: userError.message }
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('user')
      .select('id')
      .eq('id', params.userId)
      .single()

    if (existingUserError) {
      return { success: false, error: existingUserError.message }
    }

    if (!existingUser) {
      return { success: false, error: 'User row does not exist for StudentProfile insert' }
    }

    const { error: profileError } = await supabase
      .from('person_profile')
      .upsert({
        user_id: params.userId,
        university: params.career,
        major_or_interest: params.career,
        gender: params.gender,
        graduation_year: params.graduationYear,
        linkedin_url: params.linkedinUrl,
        skills: params.skills,
        is_recruiter_visible: params.consentRecruiterVisibility,
        updated_at: now,
      })

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    const membershipResult = await ChapterMembershipService.applyToChapter(supabase, {
      userId: params.userId,
      chapterId: params.leadChapter,
    })

    if (!membershipResult.success) {
      return { success: false, error: membershipResult.error }
    }

    if (params.emailNotificationsEnabled) {
      const globalNewsletterResult = await NewsletterSubscriptionService.subscribeGlobal(supabase, {
        userId: params.userId,
        source: 'onboarding',
      })

      if (!globalNewsletterResult.success) {
        return { success: false, error: globalNewsletterResult.error }
      }

      const chapterNewsletterResult = await NewsletterSubscriptionService.subscribeToChapter(supabase, {
        userId: params.userId,
        chapterId: params.leadChapter,
        source: 'onboarding',
      })

      if (!chapterNewsletterResult.success) {
        return { success: false, error: chapterNewsletterResult.error }
      }
    }

    // Handle resume upload if provided
    if (params.resumePdf) {
      const resumeResult = await this.saveResume(supabase, params.userId, params.resumePdf)
      if (!resumeResult.success) {
        return { success: false, error: resumeResult.error }
      }
    }

    return { success: true }
  },
};
