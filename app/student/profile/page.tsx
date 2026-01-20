import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import ProfileUpdateForm from "./components/profile-update-form";
import type { ProfileData } from "@/lib/memberschema";

async function ProfileData() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("User")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: profileData } = await supabase
    .from("StudentProfile")
    .select("*")
    .eq("userId", user!.id)
    .single();

  const combinedData: ProfileData = {
    id: userData!.id,
    full_name: userData!.name || '',
    phone: userData!.phone || '',
    lead_chapter: userData!.chapterId || '',
    career: profileData!.major || '',
    graduationYear: profileData!.graduationYear || 0,
    skills: profileData!.skills || [],
    linkedin_url: profileData!.linkedinUrl || '',
    consentRecruiterVisibility: profileData!.consentRecruiterVisibility || false,
  };

  return <ProfileUpdateForm initialData={combinedData} />;
}

export default function ProfilePage() {
  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Suspense fallback={<div>Loading profile...</div>}>
        <ProfileData />
      </Suspense>
    </div>
  );
}