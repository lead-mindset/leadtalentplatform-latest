import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { isValidLocale, routing } from "@/i18n/routing";

export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  const siteUrl = new URL(request.url).origin;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const localeFromPath = pathname.split("/")[1];
  const locale = isValidLocale(localeFromPath)
    ? localeFromPath
    : routing.defaultLocale;

  console.log("[confirm] params:", { token_hash: token_hash?.slice(0, 20), type, locale });

  if (!token_hash || !type) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error?error=Missing+token_hash+or+type`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  console.log("[confirm] verifyOtp error:", error ?? "none");

  if (error) {
    return NextResponse.redirect(
      `${siteUrl}/${locale}/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  // User is authenticated — route based on role
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error?error=No+user+after+verify`);
  }

  const { data: userData } = await supabase
    .from("user")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userData) {
    return NextResponse.redirect(`${siteUrl}/${locale}/onboarding`);
  }

  const role = userData.role ?? "member";

  if (role === "member" || role === "editor") {
    const { data: profile } = await supabase
      .from("person_profile")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.redirect(`${siteUrl}/${locale}/onboarding`);
    }
    return NextResponse.redirect(`${siteUrl}/${locale}/student/profile`);
  }

  if (role === "recruiter") {
    return NextResponse.redirect(`${siteUrl}/${locale}/company`);
  }

  if (role === "admin") {
    return NextResponse.redirect(`${siteUrl}/${locale}/admin`);
  }

  return NextResponse.redirect(`${siteUrl}/${locale}/auth/error?error=Unknown+role`);
}
