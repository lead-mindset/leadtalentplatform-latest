import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import ProfileUpdateForm from "./components/profile-update-form";
import type { ProfileData } from "@/lib/memberschema";
import type { StudentProfileRow } from "@/lib/types";
import Loading from "./loading";

async function ProfileData() {
  const { supabase, user } = await requireUser();

  const { data: profileData, error: profileError } = await supabase
    .from("StudentProfile")
    .select(
      "userId, chapterId, major, graduationYear, skills, linkedinUrl, consentRecruiterVisibility, emailNotificationsEnabled, memberId, approvalStatus"
    )
    .eq("userId", user.id)
    .maybeSingle<StudentProfileRow>();

  if (profileError) {
    console.error("Failed to fetch student profile:", profileError);
  }

  const combinedData: ProfileData = {
    id: user.id,
    full_name: user.name || '',
    phone: user.phone || '',
    lead_chapter: profileData?.chapterId || '',
    career: profileData?.major || '',
    graduationYear: profileData?.graduationYear || 0,
    skills: profileData?.skills || [],
    linkedin_url: profileData?.linkedinUrl || '',
    consentRecruiterVisibility: profileData?.consentRecruiterVisibility || false,
    emailNotificationsEnabled: profileData?.emailNotificationsEnabled ?? true,
    memberId: profileData?.memberId || null,
    approvalStatus: profileData?.approvalStatus || 'pending',
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
