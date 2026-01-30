import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  if (!next.startsWith('/')) {
    next = '/'
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const supabase = await createClient()

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const { data: { user }, error: userFetchError } =
    await supabase.auth.getUser()

  if (!user || userFetchError) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const { data: userData, error: userError } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (userError) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  if (!userData) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  const role = userData.role ?? 'member'

  if (role === 'member' || role === 'editor') {
    const { data: profile, error: profileError } = await supabase
      .from('StudentProfile')
      .select('isFilled')
      .eq('userId', user.id)
      .maybeSingle()

    if (!profile || profileError || !profile.isFilled) {
      next = '/onboarding'
    } else {
      next = '/student/profile'
    }
  } else if (role === 'recruiter') {
    next = '/company'
  } else if (role === 'admin') {
    next = '/admin'
  } else {
    return NextResponse.redirect(`${origin}/auth/error`)
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
