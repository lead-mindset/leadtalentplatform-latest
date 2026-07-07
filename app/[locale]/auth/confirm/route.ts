import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { isValidLocale, routing } from "@/i18n/routing";
import { logger } from "@/lib/logger";

function getSafeNextPath(value: string | null, locale: string) {
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//")) return null;
    if (decoded === `/${locale}` || decoded.startsWith(`/${locale}/`)) {
      return decoded;
    }
    if (decoded.startsWith("/") && !decoded.startsWith("/auth/")) {
      return `/${locale}${decoded}`;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  const siteUrl = new URL(request.url).origin;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const localeFromPath = pathname.split("/")[1];
  const locale = isValidLocale(localeFromPath)
    ? localeFromPath
    : routing.defaultLocale;

  logger.info(
    {
      context: "auth/confirm",
      hasTokenHash: Boolean(token_hash),
      hasType: Boolean(type),
      type: type ?? "missing",
      locale,
    },
    "Auth confirmation request received"
  );

  if (!token_hash || !type) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error?error=Missing+token_hash+or+type`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    logger.warn(
      {
        context: "auth/confirm",
        type,
        locale,
        errorName: error.name,
        status: "status" in error ? error.status : undefined,
        code: "code" in error ? error.code : undefined,
      },
      "Auth confirmation verification failed"
    );
  }

  if (error) {
    return NextResponse.redirect(
      `${siteUrl}/${locale}/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error?error=No+user+after+verify`);
  }

  const safeNext = getSafeNextPath(searchParams.get("next"), locale);
  if (safeNext) {
    return NextResponse.redirect(`${siteUrl}${safeNext}`);
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
      .maybeSingle();

    if (!profile) {
      return NextResponse.redirect(`${siteUrl}/${locale}/onboarding`);
    }
    return NextResponse.redirect(`${siteUrl}/${locale}/student/profile`);
  }

  if (role === "recruiter") {
    return NextResponse.redirect(`${siteUrl}/${locale}/company/dashboard`);
  }

  if (role === "admin") {
    return NextResponse.redirect(`${siteUrl}/${locale}/admin`);
  }

  return NextResponse.redirect(`${siteUrl}/${locale}/auth/error?error=Unknown+role`);
}
