import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Onboarding from "@/components/onboarding";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return JSON.stringify(data.claims, null, 2);
}

export default function ProtectedPage() {
  return (
        <Onboarding/>
  );
}
