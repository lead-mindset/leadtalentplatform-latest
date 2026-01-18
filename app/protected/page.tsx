import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import ProfileUpdateForm from "./profile-update-form";

async function ProfileData() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect("/auth/login");
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

  if (userDataError) {
    console.error("Error fetching user:", userDataError);
  }

  if (profileError) {
    console.error("Error fetching profile:", profileError);
  }

  const combinedData = {
      id: userData?.id,          

    full_name: userData?.name || '',
    phone: userData?.phone || '',
    lead_chapter: userData?.chapterId || undefined,
    
    career: profileData?.major || '',
    graduationYear: profileData?.graduationYear || undefined,
    skills: profileData?.skills || [],
    linkedin_url: profileData?.linkedinUrl || '',
    consentRecruiterVisibility: profileData?.consentRecruiterVisibility || false,
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