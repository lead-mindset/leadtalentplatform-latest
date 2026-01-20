import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/']
const AUTH_ROUTES = ['/auth/login', '/auth/signup']
const PROTECTED_ROUTES = ['/profile', '/dashboard', '/settings'] // Add more as needed

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )


  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  console.log(user)

  if (!user) {
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isOnboardingRoute = pathname.startsWith('/onboarding')

    if (isProtectedRoute || isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }
  const { data: profile } = await supabase
    .from('StudentProfile')
    .select('isFilled')
    .eq('userId', user.id)
    .single()

  const hasCompletedOnboarding = profile?.isFilled === true

  if (!hasCompletedOnboarding && 
      !pathname.startsWith('/onboarding') && 
      pathname !== '/auth/logout') {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  if (hasCompletedOnboarding && pathname === '/onboarding') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
