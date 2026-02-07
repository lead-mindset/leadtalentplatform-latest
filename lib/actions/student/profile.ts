'use server'

import { requireUser } from "@/lib/auth"
import { createProfileUpdateSchema } from "@/lib/memberschema"
import { createServiceClient } from "@/lib/supabase/server-service"
import { revalidatePath } from "next/cache"
import { getTranslations } from 'next-intl/server'

export async function getProfileData() {
  const { user } = await requireUser()
  const supabase = createServiceClient()

  const { data: profileData, error: profileError } = await supabase
    .from("StudentProfile")
    .select("*")
    .eq("userId", user.id)
    .single()

  if (profileError) {
    throw new Error("User profile not found")
  }

  return {
    id: user.id,
    full_name: user.name,
    phone: user.phone || '',
    lead_chapter: profileData.chapterId || '',
    career: profileData.major || '',
    graduationYear: profileData.graduationYear || 0,
    skills: profileData.skills || [],
    linkedin_url: profileData.linkedinUrl || '',
    consentRecruiterVisibility: profileData.consentRecruiterVisibility || false,
    emailNotificationsEnabled: profileData.emailNotificationsEnabled ?? true,

  }
}

export async function getResume(studentId: string) {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("Resume")
      .select("*")
      .eq("studentId", studentId)
      .order("uploadedAt", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching resume:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching resume:", error)
    return null
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const { user } = await requireUser()
    const supabase = createServiceClient()

    const t = await getTranslations()
    const profileUpdateSchema = createProfileUpdateSchema(t)

    const resume = formData.get("resume") as File | null

    const profileData = {
      full_name: formData.get("full_name")?.toString() || "",
      phone: formData.get("phone")?.toString() || "",
      lead_chapter: formData.get("lead_chapter")?.toString() || "",
      career: formData.get("career")?.toString() || "",
      graduationYear: Number(formData.get("graduationYear") ?? 0),
      skills: JSON.parse(formData.get("skills")?.toString() || "[]"),
      linkedin_url: formData.get("linkedin_url")?.toString() || "",
      consentRecruiterVisibility: formData.get("consentRecruiterVisibility") === "true",
      emailNotificationsEnabled: formData.get("emailNotificationsEnabled") === "true",

      resume_pdf: resume || undefined,
    }

    // Validate with translated schema
    const parsed = profileUpdateSchema.safeParse(profileData)
    if (!parsed.success) {
      console.error("Validation errors:", parsed.error)
      return {
        success: false,
        error: "Validation failed",
        details: parsed.error
      }
    }

    const data = parsed.data
    const now = new Date().toISOString()

    const { error: userUpdateError } = await supabase
      .from("User")
      .update({
        name: data.full_name,
        phone: data.phone,
        updatedAt: now,
      })
      .eq("id", user.id)

    if (userUpdateError) {
      console.error("User update error:", userUpdateError)
      return { success: false, error: userUpdateError.message }
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
          emailNotificationsEnabled: data.emailNotificationsEnabled,
          updatedAt: now,
          chapterId: data.lead_chapter,
        },
        { onConflict: "userId" }
      )

    if (profileError) {
      console.error("Profile update error:", profileError)
      return { success: false, error: profileError.message }
    }

    if (data.resume_pdf) {
      if (data.resume_pdf.type !== "application/pdf") {
        return { success: false, error: "Only PDF resumes are allowed" }
      }

      if (data.resume_pdf.size > 10 * 1024 * 1024) {
        return { success: false, error: "PDF must be smaller than 10MB" }
      }

      const filePath = `${user.id}/${crypto.randomUUID()}.pdf`

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, data.resume_pdf, {
          contentType: "application/pdf",
          upsert: false,
        })

      if (uploadError) {
        console.error("Resume upload error:", uploadError)
        return { success: false, error: uploadError.message }
      }

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath)

      const { error: resumeInsertError } = await supabase
        .from("Resume")
        .upsert(
          {
            studentId: user.id,
            fileUrl: publicUrl,
            fileName: data.resume_pdf.name,
            fileSize: data.resume_pdf.size,
            uploadedAt: now,
          },
          { onConflict: 'studentId' }
        )

      if (resumeInsertError) {
        console.error("Resume insert error:", resumeInsertError)
        return { success: false, error: resumeInsertError.message }
      }
    }

    revalidatePath('/student/profile')

    return {
      success: true,
      message: "Profile updated successfully",
    }
  } catch (error: any) {
    console.error("Profile update error:", error)
    return {
      success: false,
      error: error.message || "Internal server error",
    }
  }
}