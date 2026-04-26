'use server';

import { requireUser } from '@/lib/auth';
import { createProfileUpdateSchema } from '@/lib/memberschema';
import { createServiceClient } from '@/lib/supabase/server-service';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { StudentService } from '@/lib/services/student.service';

export async function getCurrentUserResume() {
  const { user } = await requireUser();
  const supabase = createServiceClient();

  try {
    const resume = await StudentService.getResume(supabase, user.id);
    return resume;
  } catch (error) {
    console.error('Resume fetch error:', error);
    return null;
  }
}

export async function getProfileData() {
  const { user } = await requireUser();
  const supabase = createServiceClient();

  try {
    const profileData = await StudentService.getProfile(supabase, user.id);

    return {
      id: user.id,
      full_name: user.name,
      phone: user.phone || '',
      gender: profileData.gender ?? undefined,
      lead_chapter: profileData.chapter_id || '',
      career: profileData.major || '',
      graduation_year: profileData.graduation_year || 0,
      skills: profileData.skills || [],
      linkedin_url: profileData.linkedin_url || '',
      consent_recruiter_visibility: profileData.consent_recruiter_visibility || false,
      email_notifications_enabled: profileData.email_notifications_enabled ?? true,
    };
  } catch (error) {
    throw new Error('User profile not found');
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const { user } = await requireUser();
    const supabase = createServiceClient();
    const t = await getTranslations();
    const profileUpdateSchema = createProfileUpdateSchema(t);

    const resume = formData.get('resume') as File | null;

    const rawData = {
      full_name: formData.get('full_name')?.toString() || '',
      phone: formData.get('phone')?.toString() || '',
      gender: formData.get('gender')?.toString() || undefined,
      lead_chapter: formData.get('lead_chapter')?.toString() || '',
      career: formData.get('career')?.toString() || '',
      graduation_year: Number(formData.get('graduation_year') ?? 0),
      skills: JSON.parse(formData.get('skills')?.toString() || '[]'),
      linkedin_url: formData.get('linkedin_url')?.toString() || '',
      consent_recruiter_visibility: formData.get('consent_recruiter_visibility') === 'true',
      email_notifications_enabled: formData.get('email_notifications_enabled') === 'true',
      resume_pdf: resume || undefined,
    };

    const parsed = profileUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: 'Validation failed', details: parsed.error };
    }

    const data = parsed.data;

    await StudentService.updateProfile(supabase, {
      userId: user.id,
      fullName: data.full_name,
      phone: data.phone,
      career: data.career,
      gender: data.gender,
      graduation_year: data.graduation_year,
      skills: data.skills,
      linkedinUrl: data.linkedin_url,
      consentRecruiterVisibility: data.consent_recruiter_visibility,
      emailNotificationsEnabled: data.email_notifications_enabled,
      chapter_id: data.lead_chapter,
      resumePdf: data.resume_pdf,
    });

    revalidatePath('/student/profile');

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error: unknown) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}
