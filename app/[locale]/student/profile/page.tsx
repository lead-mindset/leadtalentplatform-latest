import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import ProfileUpdateForm from "./components/profile-update-form";
import type { ProfileData } from "@/lib/memberschema";
import type { StudentProfileRow } from "@/lib/types";
import Loading from "./loading";

async function ProfileData() {
  const { supabase, user } = await requireUser();

  const { data: profileData, error: profileError } = await supabase
    .from("student_profile")
    .select(
    "user_id, chapter_id, major, graduation_year, skills, linkedin_url, consent_recruiter_visibility, email_notifications_enabled, member_id, approval_status, gender"
    )
    .eq("user_id", user.id)
    .maybeSingle<StudentProfileRow>();

  if (profileError) {
    console.error("Failed to fetch student profile:", profileError);
  }

  const combinedData: ProfileData = {
    id: user.id,
    full_name: user.name || '',
    phone: user.phone || '',
    gender: (profileData?.gender || (user as any).gender) as any,
    lead_chapter: profileData?.chapter_id || '',
    career: profileData?.major || '',
    graduation_year: profileData?.graduation_year || 0,
    skills: profileData?.skills || [],
    linkedin_url: profileData?.linkedin_url || '',
    consentRecruiterVisibility: profileData?.consent_recruiter_visibility || false,
    emailNotificationsEnabled: profileData?.email_notifications_enabled ?? true,
    memberId: profileData?.member_id || null,
    approvalStatus: profileData?.approval_status || 'pending',
  };

  return (
    <ProfileUpdateForm initialData={combinedData} />
  );
}

export default function ProfilePage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-lg">Manage your personal information and professional details</p>
      </div>
      <Suspense fallback={<Loading />}>
        <ProfileData />
      </Suspense>
    </div>
  );
}
