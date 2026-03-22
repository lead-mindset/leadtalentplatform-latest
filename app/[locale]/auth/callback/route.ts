import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL!

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> | { locale: string } }
) {
  const { searchParams, origin, pathname } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  
  const resolvedParams = await Promise.resolve(params);
  const localeFromPath = pathname.split('/')[1];
  const locale = resolvedParams?.locale || (routing.locales.includes(localeFromPath as any) ? localeFromPath : routing.defaultLocale);

  if (!next.startsWith('/')) {
    next = '/'
  }

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/${locale}/auth/error`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${SITE_URL}/${locale}/auth/error`)
  }

  const { data: { user }, error: userFetchError } = await supabase.auth.getUser()

  if (!user || userFetchError) {
    return NextResponse.redirect(`${SITE_URL}/${locale}/auth/error`)
  }

  if (!user.user_metadata?.locale) {
    await supabase.auth.updateUser({ data: { locale } })
  }

  const { data: userData } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!userData) {
    return NextResponse.redirect(`${SITE_URL}/${locale}/onboarding`)
  }

  const role = userData.role ?? 'member'

  if (role === 'member' || role === 'editor') {
    const { data: profile } = await supabase
      .from('StudentProfile')
      .select('isFilled')
      .eq('userId', user.id)
      .maybeSingle()

    if (!profile?.isFilled) {
      return NextResponse.redirect(`${SITE_URL}/${locale}/onboarding`)
    }
    return NextResponse.redirect(`${SITE_URL}/${locale}/student/profile`)
  }

  if (role === 'recruiter') return NextResponse.redirect(`${SITE_URL}/${locale}/company`)
  if (role === 'admin') return NextResponse.redirect(`${SITE_URL}/${locale}/admin`)

  return NextResponse.redirect(`${SITE_URL}/${locale}/auth/error`)
}