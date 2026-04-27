'use server'

import { createClient } from '@/lib/supabase/server'
import { createBaseProfileSchema } from '@/lib/memberschema'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { generateUniqueMemberId } from '@/lib/utils/member-id'
import { sendWelcomeEmail } from '@/lib/emails/send-email'
import { StudentService } from '@/lib/services/student.service'

function parseSkills(rawValue: FormDataEntryValue | null): string[] {
    if (typeof rawValue !== 'string' || !rawValue.trim()) {
        return []
    }

    try {
        const parsed = JSON.parse(rawValue)
        return Array.isArray(parsed)
            ? parsed.filter((skill): skill is string => typeof skill === 'string')
            : []
    } catch {
        return []
    }
}

export async function submitOnboarding(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.id || !user?.email) {
            return { error: 'Unauthorized' }
        }

        const t = await getTranslations()
        const baseProfileSchema = createBaseProfileSchema(t)

        const resume = formData.get('resume') as File | null

        const profileData = {
            full_name: formData.get('full_name')?.toString() || '',
            phone: formData.get('phone')?.toString() || '',
            career: formData.get('career')?.toString() || '',
            lead_chapter: formData.get('lead_chapter')?.toString() || '',
            gender: formData.get('gender')?.toString() || '',
            graduation_year: Number(formData.get('graduation_year')) || 0,
            skills: parseSkills(formData.get('skills')),
            linkedin_url: formData.get('linkedin_url')?.toString() || '',
            consent_recruiter_visibility: formData.get('consentRecruiterVisibility') === 'true',
            email_notifications_enabled: formData.get('emailNotificationsEnabled') === 'true',
        }

        const parsed = baseProfileSchema.safeParse(profileData)
        if (!parsed.success) {
            return { error: "Validation failed", details: parsed.error }
        }

        const data = parsed.data

        const result = await StudentService.submitOnboarding(supabase, {
            userId: user.id,
            email: user.email,
            fullName: data.full_name,
            phone: data.phone,
            career: data.career,
            gender: data.gender,
            graduationYear: data.graduation_year,
            skills: data.skills,
            linkedinUrl: data.linkedin_url,
            consentRecruiterVisibility: data.consent_recruiter_visibility,
            emailNotificationsEnabled: data.email_notifications_enabled,
            leadChapter: data.lead_chapter,
            resumePdf: resume && resume.size > 0 ? resume : null,
            generateMemberId: generateUniqueMemberId,
        })

        if (!result.success) {
            return { error: result.error }
        }

        const { data: chapterData, error: chapterError } = await supabase
            .from('chapter')
            .select('name')
            .eq('id', data.lead_chapter)
            .single()

        if (chapterError) {
            return { error: chapterError.message }
        }

        if (chapterData?.name) {
            void sendWelcomeEmail(
                user.email,
                data.full_name,
                chapterData.name,
                'es'
            ).catch(err => console.error('Failed to send welcome email:', err))
        }
    } catch (error) {
        console.error('Onboarding submission error:', error)
        return { error: 'Internal server error' }
    }

    revalidatePath('/student')
    redirect('/student')
}
