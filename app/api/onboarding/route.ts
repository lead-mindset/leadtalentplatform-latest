import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fullMemberSchema } from '@/lib/memberschema';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.id || !user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const resume = formData.get('resume') as File | null;

        const profileData = {
            full_name: formData.get('full_name')?.toString() || '',
            phone: formData.get('phone')?.toString() || '',
            career: formData.get('career')?.toString() || '',
            lead_chapter: formData.get('lead_chapter')?.toString(), // undefined if empty
            graduationYear: Number(formData.get('graduationYear')) || undefined,
            skills: JSON.parse(formData.get('skills')?.toString() || '[]'),
            linkedin_url: formData.get('linkedin_url')?.toString() || '',
            consentRecruiterVisibility: formData.get('consentRecruiterVisibility') === 'true',
        };

        const parsed = fullMemberSchema.safeParse(profileData);

        if (!parsed.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: parsed.error
            }, { status: 400 });
        }

        const data = parsed.data;

        const now = new Date().toISOString();

        const { data: userResult, error: userError } = await supabase
            .from('User')
            .upsert({
                id: user.id,
                email: user.email!,
                name: data.full_name,
                phone: data.phone,
                chapterId: data.lead_chapter,
                updatedAt: now,
            })
            .eq('id', user.id);

        console.log('User upsert result:', userResult, userError);
        if (userError) {
            return NextResponse.json({ error: userError.message }, { status: 400 });
        }

        const { data: existingUser } = await supabase
            .from('User')
            .select('*')
            .eq('id', user.id)
            .single();
        console.log('Existing User row before StudentProfile upsert:', existingUser);

        if (!existingUser) {
            return NextResponse.json({ error: 'User row does not exist for StudentProfile insert' }, { status: 400 });
        }

        const { data: profileResult, error: profileError } = await supabase
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
            });

        console.log('StudentProfile upsert result:', profileResult, profileError);
        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 400 });
        }

        const { data: authCheck } = await supabase.rpc('get_auth_uid');
        console.log('AUTH UID BEFORE RESUME INSERT:', authCheck);


        if (resume) {
            if (resume.type !== "application/pdf") {
                return NextResponse.json(
                    { error: "Only PDF resumes are allowed" },
                    { status: 400 }
                );
            }

            const filePath = `${user.id}/${crypto.randomUUID()}.pdf`;

            const { error: uploadError } = await supabase.storage
                .from("resumes")
                .upload(filePath, resume, {
                    contentType: "application/pdf",
                    upsert: true,
                });

            if (uploadError) {
                return NextResponse.json({ error: uploadError.message }, { status: 400 });
            }

            const { data: publicUrlData, error: urlError } = supabase.storage
                .from("resumes")
                .getPublicUrl(filePath);

            if (urlError) {
                return NextResponse.json({ error: urlError.message }, { status: 400 });
            }

            const fileUrl = publicUrlData.publicUrl;

            const { error: resumeDbError } = await supabase
                .from("Resume")
                .insert({
                    studentId: user.id,
                    fileUrl,
                    fileName: resume.name,
                    fileSize: resume.size,
                    uploadedAt: now,
                });

            if (resumeDbError) {
                return NextResponse.json({ error: resumeDbError.message }, { status: 400 });
            }

            console.log("Resume uploaded successfully:", fileUrl);
        }


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
