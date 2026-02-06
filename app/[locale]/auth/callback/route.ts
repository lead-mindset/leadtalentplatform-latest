import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {routing} from '@/i18n/routing';

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
    return NextResponse.redirect(`${origin}/${locale}/auth/error`)
  }

  const supabase = await createClient()

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/${locale}/auth/error`)
  }

  const { data: { user }, error: userFetchError } =
    await supabase.auth.getUser()

  if (!user || userFetchError) {
    return NextResponse.redirect(`${origin}/${locale}/auth/error`)
  }

  const { data: userData, error: userError } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (userError) {
    return NextResponse.redirect(`${origin}/${locale}/auth/error`)
  }

  if (!userData) {
    return NextResponse.redirect(`${origin}/${locale}/onboarding`)
  }

  const role = userData.role ?? 'member'

  if (role === 'member' || role === 'editor') {
    const { data: profile, error: profileError } = await supabase
      .from('StudentProfile')
      .select('isFilled')
      .eq('userId', user.id)
      .maybeSingle()

    if (!profile || profileError || !profile.isFilled) {
      next = `/${locale}/onboarding`
    } else {
      next = `/${locale}/student/profile`
    }
  } else if (role === 'recruiter') {
    next = `/${locale}/company`
  } else if (role === 'admin') {
    next = `/${locale}/admin`
  } else {
    return NextResponse.redirect(`${origin}/${locale}/auth/error`)
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    return NextResponse.redirect(`${origin}${next}`)
  }
}
