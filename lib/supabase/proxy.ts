import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { routing } from "@/i18n/routing";

const PUBLIC_ROUTES = ['/', '/login', '/auth', '/company/onboard', '/company/login', '/chapter/invites/accept'];

export function isPublicRoute(pathname: string): boolean {
  // Remove locale prefix if present (e.g., /en/auth/login -> /auth/login)
  const pathWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/';

  return PUBLIC_ROUTES.some(route =>
    pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );
}

export async function updateSession(request: NextRequest) {
  if (!hasEnvVars) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) console.error('Failed to get user:', error);


    const pathname = request.nextUrl.pathname;
    const isProtected = !isPublicRoute(pathname);

    if (!user && isProtected) {
      const localeMatch = pathname.match(/^\/(en|es)/);
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
      const redirectUrl = new URL(`/${locale}/auth/login`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    return supabaseResponse;
  }
}
