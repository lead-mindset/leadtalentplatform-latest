import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


interface ProfileFormData {
    full_name: string
    phone: string
    lead_chapter: string
    career: string
    graduationYear: number
    skills: string[]
    linkedin_url?: string
    consentRecruiterVisibility: boolean
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.id || !user?.email) {
            console.error('NO AUTH USER IN API', user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        for (const [key, value] of formData.entries()) {
            console.log(key, value)
        }
        const data: ProfileFormData = {
            full_name: JSON.parse(formData.get('full_name') as string),
            phone: JSON.parse(formData.get('phone') as string),
            lead_chapter: JSON.parse(formData.get('lead_chapter') as string),
            career: JSON.parse(formData.get('career') as string),
            graduationYear: JSON.parse(formData.get('graduationYear') as string),
            skills: JSON.parse(formData.get('skills') as string),
            linkedin_url: JSON.parse(formData.get('linkedin_url') as string),
            consentRecruiterVisibility: JSON.parse(
                formData.get('consentRecruiterVisibility') as string
            ),
        }

        const resume = formData.get('resume') as File | null
        const now = new Date().toISOString()

        const [userResult, profileResult] = await Promise.all([
            supabase
                .from('User')
                .upsert({
                    id: user.id,
                    email: user.email!,
                    name: data.full_name,
                    phone: data.phone,
                    chapterId: data.lead_chapter,
                    updatedAt: now,
                })
                .eq('id', user.id),

            supabase
                .from('StudentProfile')
                .upsert({
                    userId: user.id,
                    major: data.career,
                    graduationYear: data.graduationYear,
                    linkedinUrl: data.linkedin_url,
                    skills: data.skills,
                    consentRecruiterVisibility: data.consentRecruiterVisibility,
                    consentDate: data.consentRecruiterVisibility ? now : null,
                    updatedAt: now,
                })
        ])

        if (userResult.error) {
            return NextResponse.json({ error: userResult.error.message }, { status: 400 })
        }

        if (profileResult.error) {
            return NextResponse.json({ error: profileResult.error.message }, { status: 400 })
        }

        if (resume) {
            const filePath = `${user.id}/${crypto.randomUUID()}.pdf`

            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, resume, {
                    contentType: 'application/pdf',
                    upsert: false,
                })

            if (uploadError) {
                return NextResponse.json({ error: uploadError.message }, { status: 400 })
            }

            const { data: publicUrl } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath)

            const { error: resumeError } = await supabase
                .from('Resume')
                .insert({
                    studentId: user.id,
                    fileUrl: publicUrl.publicUrl,
                    fileName: resume.name,
                    fileSize: resume.size,
                })

            if (resumeError) {
                return NextResponse.json({ error: resumeError.message }, { status: 400 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}