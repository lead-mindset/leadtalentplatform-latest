import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from '@/lib/supabase/proxy';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/student', '/company', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.includes(route)
  );

  const intlResponse = intlMiddleware(request);

  if (isProtectedRoute) {
    const supabaseResponse = await updateSession(request);

    if (supabaseResponse.status === 307 || supabaseResponse.status === 308) {
      const redirectLocation = supabaseResponse.headers.get('location');

      if (redirectLocation) {
        const redirectUrl = new URL(redirectLocation, process.env.NEXT_PUBLIC_FRONTEND_URL)

        const localeMatch = pathname.match(/^\/(en|es)\//);
        const locale = localeMatch?.[1] || routing.defaultLocale;

        if (!redirectUrl.pathname.match(/^\/(en|es)\//)) {
          redirectUrl.pathname = `/${locale}${redirectUrl.pathname}`;
        }

        const response = NextResponse.redirect(redirectUrl);

        supabaseResponse.headers.forEach((value, key) => {
          if (key.toLowerCase() === 'set-cookie') {
            response.headers.append(key, value);
          }
        });

        return response;
      }
    }

    const response = intlResponse.status === 307 || intlResponse.status === 308
      ? NextResponse.redirect(
        new URL(intlResponse.headers.get('location') || '', request.url)
      )
      : NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

    supabaseResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        response.headers.append(key, value);
      }
    });

    intlResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie' && !response.headers.has(key)) {
        response.headers.set(key, value);
      }
    });

    return response;
  }

  return intlResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};