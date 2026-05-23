import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing';
import { resolvePostAuthRedirectPath } from '@/lib/auth-redirects'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> | { locale: string } }
) {
  const { searchParams, pathname } = new URL(request.url)
  const siteUrl = new URL(request.url).origin
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  
  const resolvedParams = await Promise.resolve(params);
  const localeFromPath = pathname.split('/')[1];
  const locale =
    resolvedParams?.locale ||
    ((routing.locales as readonly string[]).includes(localeFromPath)
      ? localeFromPath
      : routing.defaultLocale)

  if (!next.startsWith('/')) {
    next = '/'
  }

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error`)
  }

  const { data: { user }, error: userFetchError } = await supabase.auth.getUser()

  if (!user || userFetchError) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error`)
  }

  if (!user.user_metadata?.locale) {
    await supabase.auth.updateUser({ data: { locale } })
  }

  if (next && next !== '/') {
    return NextResponse.redirect(`${siteUrl}/${locale}${next}`)
  }

  const { data: userData } = await supabase
    .from('user')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

const { data: profile } = await supabase
      .from('person_profile')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

  const redirectPath = await resolvePostAuthRedirectPath(supabase, {
    userId: user.id,
    hasProfile: Boolean(profile),
    role: userData?.role,
  })

  return NextResponse.redirect(`${siteUrl}/${locale}${redirectPath}`)
}
