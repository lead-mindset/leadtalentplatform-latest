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
    .from("student_profile")
    .select(
      "user_id, chapter_id, major, graduation_year, skills, linkedin_url, consent_recruiter_visibility, email_notifications_enabled, gender, member_id, approval_status"
    )
    .eq("user_id", user.id)
    .single()

  if (profileError) {
    throw new Error("User profile not found")
  }

  return {
    id: user.id,
    full_name: user.name,
    phone: user.phone || '',
    gender: profileData.gender ?? undefined,
    lead_chapter: profileData.chapter_id || '',
    career: profileData.major || '',
    graduation_year: profileData.graduation_year || 0,
    skills: profileData.skills || [],
    linkedin_url: profileData.linkedin_url || '',
    consent_recruiter_visibility: profileData.consent_recruiter_visibility || false,
    email_notifications_enabled: profileData.email_notifications_enabled ?? true,

  }
}

export async function getCurrentUserResume() {
  try {
    const { supabase, user } = await requireUser()

    const { data, error } = await supabase
      .from("resume")
      .select("id, student_id, file_url, file_name, file_size, uploaded_at")
      .eq("student_id", user.id)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching resume:", error)
      return null
    }

    return data
  } catch (error) {
    if (error instanceof Error && error.message.includes('cookies')) {
      return null
    }
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
      gender: formData.get("gender")?.toString() || undefined,
      lead_chapter: formData.get("lead_chapter")?.toString() || "",
      career: formData.get("career")?.toString() || "",
      graduation_year: Number(formData.get("graduation_year") ?? 0),
      skills: JSON.parse(formData.get("skills")?.toString() || "[]"),
      linkedin_url: formData.get("linkedin_url")?.toString() || "",
      consent_recruiter_visibility: formData.get("consent_recruiter_visibility") === "true",
      email_notifications_enabled: formData.get("email_notifications_enabled") === "true",

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
      .from("user")
      .update({
        name: data.full_name,
        phone: data.phone,
        updated_at: now,
      })
      .eq("id", user.id)

    if (userUpdateError) {
      console.error("User update error:", userUpdateError)
      return { success: false, error: userUpdateError.message }
    }

    const { error: profileError } = await supabase
      .from("student_profile")
      .upsert(
        {
          user_id: user.id,
          major: data.career,
          gender: data.gender,
          graduation_year: data.graduation_year,
          skills: data.skills,
          linkedin_url: data.linkedin_url,
          consent_recruiter_visibility: data.consent_recruiter_visibility,
          consent_date: data.consent_recruiter_visibility ? now : null,
          email_notifications_enabled: data.email_notifications_enabled,
          updated_at: now,
          chapter_id: data.lead_chapter,
        },
        { onConflict: "user_id" }
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
        .from("resume")
        .upsert(
          {
            student_id: user.id,
            file_url: publicUrl,
            file_name: data.resume_pdf.name,
            file_size: data.resume_pdf.size,
            uploaded_at: now,
          },
          { onConflict: 'student_id' }
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
  } catch (error: unknown) {
    console.error("Profile update error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    }
  }
}
