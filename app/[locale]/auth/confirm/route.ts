import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  console.log('[confirm] params:', { token_hash: token_hash?.slice(0, 20), type, next });

  if (!token_hash || !type) {
    redirect(`/auth/error?error=Missing+token_hash+or+type`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  console.log('[confirm] verifyOtp result:', {
    error: error ? { message: error.message, status: error.status } : null,
    user: data?.user?.id ?? null,
  });

  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}&status=${error.status}`);
  }

  redirect(next);
}