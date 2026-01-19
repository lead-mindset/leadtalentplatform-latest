import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Onboarding from "@/components/onboarding";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("StudentProfile")
    .select("isFilled")
    .eq("userId", user.id)
    .single();

  if (profile?.isFilled) {
    redirect("/");
  }

  return (
      <Onboarding/>
  );
}