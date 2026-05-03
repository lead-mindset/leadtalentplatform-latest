import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import ProfileUpdateForm from "./components/profile-update-form";
import type { ProfileData } from "@/lib/memberschema";
import { PersonProfileService } from "@/lib/services/person-profile.service";
import Loading from "./loading";

async function ProfileData() {
  const { supabase, user } = await requireUser();

  const profileData = await PersonProfileService.getBasicProfile(supabase, user.id);

  const { data: membership, error: membershipError } = await supabase
    .from("chapter_membership")
    .select("chapter_id, member_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("Failed to fetch chapter membership:", membershipError);
  }

  const combinedData: ProfileData = {
    id: user.id,
    full_name: user.name || '',
    phone: user.phone || '',
    gender: (profileData?.gender as "man" | "woman" | "non_binary" | "prefer_not_to_say" | undefined) || undefined,
    lead_chapter: membership?.chapter_id || '',
    career: profileData?.majorOrInterest || '',
    graduation_year: profileData?.graduationYear || 0,
    skills: profileData?.skills || [],
    linkedin_url: profileData?.linkedinUrl || '',
    consentRecruiterVisibility: profileData?.isRecruiterVisible || false,
    emailNotificationsEnabled: true,
    memberId: membership?.member_id || null,
    approvalStatus: membership?.status || 'pending',
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
