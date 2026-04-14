import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { isValidLocale, routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL!

export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const localeFromPath = pathname.split("/")[1];
  const locale = isValidLocale(localeFromPath)
    ? localeFromPath
    : routing.defaultLocale;

  console.log("[confirm] params:", { token_hash: token_hash?.slice(0, 20), type, locale });

  if (!token_hash || !type) {
    return NextResponse.redirect(`${SITE_URL}/${locale}/auth/error?error=Missing+token_hash+or+type`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  console.log("[confirm] verifyOtp error:", error ?? "none");

  if (error) {
    return NextResponse.redirect(
      `${SITE_URL}/${locale}/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  // User is authenticated — route based on role
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${SITE_URL}/${locale}/auth/error?error=No+user+after+verify`);
  }

  const { data: userData } = await supabase
    .from("User")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userData) {
    return NextResponse.redirect(`${SITE_URL}/${locale}/onboarding`);
  }

  const role = userData.role ?? "member";

  if (role === "member" || role === "editor") {
    const { data: profile } = await supabase
      .from("StudentProfile")
      .select("isFilled")
      .eq("userId", user.id)
      .maybeSingle();

    if (!profile?.isFilled) {
      return NextResponse.redirect(`${SITE_URL}/${locale}/onboarding`);
    }
    return NextResponse.redirect(`${SITE_URL}/${locale}/student/profile`);
  }

  if (role === "recruiter") {
    return NextResponse.redirect(`${SITE_URL}/${locale}/company`);
  }

  if (role === "admin") {
    return NextResponse.redirect(`${SITE_URL}/${locale}/admin`);
  }

  return NextResponse.redirect(`${SITE_URL}/${locale}/auth/error?error=Unknown+role`);
}
