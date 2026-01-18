import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fullMemberSchema2 } from "@/lib/memberschema";
import { createServiceClient } from "@/lib/supabase/server-service";

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
  try {
    const authSupabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const formData = await req.formData();

    const resume = formData.get("resume") as File | null;

    const profileData = {
      full_name: formData.get("full_name")?.toString() || "",
      phone: formData.get("phone")?.toString() || "",
      lead_chapter: formData.get("lead_chapter")?.toString() || undefined,
      career: formData.get("career")?.toString() || "",
      graduationYear: Number(formData.get("graduationYear") ?? 0),
      skills: JSON.parse(formData.get("skills")?.toString() || "[]"),
      linkedin_url: formData.get("linkedin_url")?.toString() || "",
      consentRecruiterVisibility: formData.get("consentRecruiterVisibility") === "true",
    };
    console.log("Parsed form data:", profileData);

    const parsed = fullMemberSchema2.safeParse(profileData);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }
    const data = parsed.data;
    const now = new Date().toISOString();

    const { error: userUpdateError } = await supabase
      .from("User")
      .update({
        name: data.full_name,
        phone: data.phone,
        chapterId: data.lead_chapter,
        updatedAt: now,
      })
      .eq("id", user.id);

    if (userUpdateError) throw userUpdateError;

    const { error: profileError } = await supabase
      .from("StudentProfile")
      .upsert(
        {
          userId: user.id,
          major: data.career,
          graduationYear: data.graduationYear,
          skills: data.skills,
          linkedinUrl: data.linkedin_url,
          consentRecruiterVisibility: data.consentRecruiterVisibility,
          consentDate: data.consentRecruiterVisibility ? now : null,
          updatedAt: now,
        },
        { onConflict: "userId" }
      );

    if (profileError) throw profileError;

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
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from("resumes").getPublicUrl(filePath)
        .data.publicUrl;

      const { error: resumeInsertError } = await supabase.from("Resume").insert({
        studentId: user.id,
        fileUrl: publicUrl,
        fileName: resume.name,
        fileSize: resume.size,
        uploadedAt: now,
      });

      if (resumeInsertError) throw resumeInsertError;
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}