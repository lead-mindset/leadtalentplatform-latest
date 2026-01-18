import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fullMemberSchema } from "@/lib/memberschema";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData, error: userDataError } = await supabase
    .from("User")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: profileData, error: profileError } = await supabase
    .from("StudentProfile")
    .select("*")
    .eq("userId", user.id)
    .single();

  if (userDataError || profileError) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const combinedData = {
    ...userData,
    ...profileData,
  };

  return NextResponse.json(combinedData);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = fullMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const { error: userUpdateError } = await supabase
      .from("User")
      .update({
        name: data.full_name,
        phone: data.phone,
        chapterId: data.lead_chapter,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (userUpdateError) throw userUpdateError;

    const { error: profileError } = await supabase
      .from("StudentProfile")
      .upsert({
        userId: user.id,
        major: data.career,
        graduationYear: data.graduationYear,
        skills: data.skills,
        linkedinUrl: data.linkedin_url,
        consentRecruiterVisibility: data.consentRecruiterVisibility,
        consentDate: data.consentRecruiterVisibility ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      }, {
        onConflict: 'userId'
      });

    if (profileError) throw profileError;

    if (data.resume_pdf) {
      console.log('Resume upload not yet implemented');
    }

    return NextResponse.json({ 
      success: true,
      message: "Profile updated successfully" 
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: error.message || "Failed to update profile" 
    }, { status: 500 });
  }
}