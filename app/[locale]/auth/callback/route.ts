import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function resolveLocalizedNextPath(nextPath: string | null, locale: string) {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return `/${locale}/onboarding`
  }

  if (nextPath === `/${locale}` || nextPath.startsWith(`/${locale}/`)) {
    return nextPath
  }

  return `/${locale}${nextPath}`
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get('code')
  const localeMatch = requestUrl.pathname.match(/^\/([a-z]{2})\//)
  const locale = localeMatch?.[1] ?? 'es'
  const next = resolveLocalizedNextPath(searchParams.get('next'), locale)

  // Redirect back to the same origin the OAuth flow started from so the
  // session cookie set by exchangeCodeForSession is honored. On Vercel
  // previews the request origin is a unique deployment URL that never
  // matches a configured FRONTEND_URL; using the request origin keeps the
  // cookie on-origin and avoids bouncing to a different deployment.
  const baseUrl = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/${locale}/auth/error?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
    return NextResponse.redirect(`${baseUrl}/${locale}/auth/error?error=exchange_failed`)
  }

  return NextResponse.redirect(`${baseUrl}${next}`)
}
