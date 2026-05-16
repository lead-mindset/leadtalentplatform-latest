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
    if (!resume) return null;

    return {
      id: resume.id,
      fileName: resume.file_name,
      fileSize: resume.file_size,
      fileUrl: await StudentService.createResumeSignedUrl(supabase, resume.file_url),
      uploadedAt: resume.uploaded_at,
    };
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
      career: profileData.major_or_interest || '',
      graduation_year: profileData.graduation_year || 0,
      skills: profileData.skills || [],
      linkedin_url: profileData.linkedin_url || '',
      portfolio_url: profileData.portfolio_url || '',
      consentRecruiterVisibility: profileData.is_recruiter_visible || false,
      emailNotificationsEnabled: true,
    };
  } catch {
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
      career: formData.get('career')?.toString() || '',
      graduation_year: Number(formData.get('graduation_year') ?? 0),
      skills: JSON.parse(formData.get('skills')?.toString() || '[]'),
      linkedin_url: formData.get('linkedin_url')?.toString() || '',
      portfolio_url: formData.get('portfolio_url')?.toString() || '',
      consentRecruiterVisibility: formData.get('consentRecruiterVisibility') === 'true',
      emailNotificationsEnabled: formData.get('emailNotificationsEnabled') === 'true',
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
      portfolioUrl: data.portfolio_url ?? null,
      consentRecruiterVisibility: data.consentRecruiterVisibility,
      emailNotificationsEnabled: data.emailNotificationsEnabled,
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
