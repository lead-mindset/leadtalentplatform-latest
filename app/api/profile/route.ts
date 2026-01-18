import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/memberschema";
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
    id: userData.id,
    full_name: userData.name || '',
    phone: userData.phone || '',
    lead_chapter: userData.chapterId || '',
    career: profileData.major || '',
    graduationYear: profileData.graduationYear || 0,
    skills: profileData.skills || [],
    linkedin_url: profileData.linkedinUrl || '',
    consentRecruiterVisibility: profileData.consentRecruiterVisibility || false,
  };

  return NextResponse.json(combinedData);
}

export async function PATCH(req: NextRequest) {
  try {
        console.log("profileUpdateSchema exists?", !!profileUpdateSchema);
    console.log("profileUpdateSchema type:", typeof profileUpdateSchema);

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
      lead_chapter: formData.get("lead_chapter")?.toString() || "",
      career: formData.get("career")?.toString() || "",
      graduationYear: Number(formData.get("graduationYear") ?? 0),
      skills: JSON.parse(formData.get("skills")?.toString() || "[]"),
      linkedin_url: formData.get("linkedin_url")?.toString() || "",
      consentRecruiterVisibility: formData.get("consentRecruiterVisibility") === "true",
      resume_pdf: resume || undefined,
    };
    
    console.log("Parsed form data:", profileData);

    const parsed = profileUpdateSchema.safeParse(profileData);
    if (!parsed.success) {
      console.error("Validation errors:", parsed.error);
      return NextResponse.json({ 
        error: "Validation failed",
        details: parsed.error 
      }, { status: 400 });
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

    if (userUpdateError) {
      console.error("User update error:", userUpdateError);
      throw userUpdateError;
    }

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

    if (profileError) {
      console.error("Profile update error:", profileError);
      throw profileError;
    }

    if (data.resume_pdf) {
      const filePath = `${user.id}/${crypto.randomUUID()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, data.resume_pdf, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("Resume upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      const { error: resumeInsertError } = await supabase.from("Resume").insert({
        studentId: user.id,
        fileUrl: publicUrl,
        fileName: data.resume_pdf.name,
        fileSize: data.resume_pdf.size,
        uploadedAt: now,
      });

      if (resumeInsertError) {
        console.error("Resume insert error:", resumeInsertError);
        throw resumeInsertError;
      }
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