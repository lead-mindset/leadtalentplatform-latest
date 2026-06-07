import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import ProfileUpdateForm from "./components/profile-update-form";
import type { ProfileData } from "@/lib/memberschema";
import { PersonProfileService } from "@/lib/services/person-profile.service";
import Loading from "./loading";
import { MainContainer } from "@/components/global/main-container";
import { PageHeader } from "@/components/ui/page-header";

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
    portfolio_url: profileData?.portfolioUrl || '',
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
    <MainContainer maxWidth="7xl" className="space-y-6 py-6 pb-24 sm:py-8">
      <PageHeader
        eyebrow="Mi LEAD"
        title="Mi perfil"
        description="Gestiona los datos reutilizables de tu perfil. La membresía de capítulo y el estado de miembro se manejan por separado."
      />
      <div className="max-w-3xl">
        <Suspense fallback={<Loading />}>
          <ProfileData />
        </Suspense>
      </div>
    </MainContainer>
  );
}
