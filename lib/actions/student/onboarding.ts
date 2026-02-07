'use server'

import { createClient } from '@/lib/supabase/server'
import { createBaseProfileSchema } from '@/lib/memberschema'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

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
            graduationYear: Number(formData.get('graduationYear')) || 0,
            skills: JSON.parse(formData.get('skills')?.toString() || '[]'),
            linkedin_url: formData.get('linkedin_url')?.toString() || '',
            consentRecruiterVisibility: formData.get('consentRecruiterVisibility') === 'true',
            emailNotificationsEnabled: formData.get('emailNotificationsEnabled') === 'true',
        }

        const parsed = baseProfileSchema.safeParse(profileData)
        if (!parsed.success) {
            return { error: "Validation failed", details: parsed.error }
        }

        const data = parsed.data
        const now = new Date().toISOString()

        // Update User table
        const { error: userError } = await supabase
            .from('User')
            .upsert({
                id: user.id,
                email: user.email,
                name: data.full_name,
                phone: data.phone,
                updatedAt: now,
            })
            .eq('id', user.id)

        if (userError) {
            return { error: userError.message }
        }

        const { data: existingUser } = await supabase
            .from('User')
            .select('id')
            .eq('id', user.id)
            .single()

        if (!existingUser) {
            return { error: 'User row does not exist for StudentProfile insert' }
        }

        const { error: profileError } = await supabase
            .from('StudentProfile')
            .upsert({
                userId: user.id,
                major: data.career,
                graduationYear: data.graduationYear,
                linkedinUrl: data.linkedin_url,
                skills: data.skills,
                consentRecruiterVisibility: data.consentRecruiterVisibility,
                consentDate: data.consentRecruiterVisibility ? now : null,
                emailNotificationsEnabled: data.emailNotificationsEnabled,
                updatedAt: now,
                isFilled: true,
                chapterId: data.lead_chapter,
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
                .from("Resume")
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

    } catch (error) {
        console.error('Onboarding submission error:', error)
        return { error: 'Internal server error' }
    }

    revalidatePath('/student')
    redirect('/student')
}