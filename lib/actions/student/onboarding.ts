'use server'

import { createClient } from '@/lib/supabase/server'
import { createBaseProfileSchema } from '@/lib/memberschema'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { generateUniqueMemberId } from './generate-member-ids'
import { sendWelcomeEmail } from '@/lib/emails/send-email'

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
            graduation_year: Number(formData.get('graduationYear')) || 0,
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
        const now = new Date().toISOString()

        // Update User table
        const { error: userError } = await supabase
            .from('user')
            .upsert({
                id: user.id,
                email: user.email,
                name: data.full_name,
                phone: data.phone,
                updated_at: now,
            })
            .eq('id', user.id)

        if (userError) {
            return { error: userError.message }
        }

        const { data: existingUser, error: existingUserError } = await supabase
            .from('user')
            .select('id')
            .eq('id', user.id)
            .single()

        if (existingUserError) {
            return { error: existingUserError.message }
        }

        if (!existingUser) {
            return { error: 'User row does not exist for StudentProfile insert' }
        }

        const { data: existingProfile, error: existingProfileError } = await supabase
            .from('student_profile')
.select('member_id')
    .eq('user_id', user.id)
            .maybeSingle()

        if (existingProfileError) {
            return { error: existingProfileError.message }
        }

        const memberId = existingProfile?.memberId ?? await generateUniqueMemberId(supabase)

        const { error: profileError } = await supabase
            .from('student_profile')
            .upsert({
                user_id: user.id,
                major: data.career,
                gender: data.gender,
                graduation_year: data.graduationYear,
                linkedin_url: data.linkedin_url,
                skills: data.skills,
                consent_recruiter_visibility: data.consent_recruiter_visibility,
                consent_date: data.consent_recruiter_visibility ? now : null,
                email_notifications_enabled: data.email_notifications_enabled,
                updated_at: now,
                is_filled: true,
                chapter_id: data.lead_chapter,
                member_id,
            })

        if (profileError) {
            return { error: profileError.message }
        }

        if (resume) {
            if (resume.type !== "application/pdf") {
                return { error: "Only PDF resumes are allowed" }
            }

            if (resume.size > 10 * 1024 * 1024) {
                return { error: "PDF must be smaller than 10MB" }
            }

            const filePath = `${user.id}/${crypto.randomUUID()}.pdf`

            const { error: uploadError } = await supabase.storage
                .from("resumes")
                .upload(filePath, resume, {
                    contentType: "application/pdf",
                    upsert: true,
                })

            if (uploadError) {
                return { error: uploadError.message }
            }

            const { data: publicUrlData } = supabase.storage
                .from("resumes")
                .getPublicUrl(filePath)

            const fileUrl = publicUrlData.publicUrl

            const { error: resumeDbError } = await supabase
                .from("resume")
                .upsert(
                    {
                        studentId: user.id,
                        fileUrl,
                        fileName: resume.name,
                        fileSize: resume.size,
                        uploadedAt: now,
                    },
                    { onConflict: 'studentId' }
                )

            if (resumeDbError) {
                return { error: resumeDbError.message }
            }
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
