import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server-service'
import { routing } from '@/i18n/routing'
import { resolvePostAuthRedirectPath } from '@/lib/auth-redirects'
import { RecruiterService } from '@/lib/services/recruiter.service'
import { getConfiguredAppUrl } from '@/lib/app-url'

function getSafeNextPath(
 value:string|null,
 locale:string
){
 if(!value) return null

 try {
   const decoded = decodeURIComponent(value)

   if(decoded.startsWith('//')){
     return null
   }

   if(decoded.startsWith('/recruiter/access')){
     return decoded
   }

   if(decoded.startsWith('/auth/')){
     return null
   }

   if(decoded.startsWith('/')){
     return `/${locale}${decoded}`
   }

   return null

 } catch {
   return null
 }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> | { locale: string } }
) {
  const { searchParams, pathname } = new URL(request.url)
  const siteUrl = getConfiguredAppUrl(new URL(request.url).origin)
  const code = searchParams.get('code')

  const resolvedParams = await Promise.resolve(params)
  const localeFromPath = pathname.split('/')[1]
  const locale =
    resolvedParams?.locale ||
    ((routing.locales as readonly string[]).includes(localeFromPath)
      ? localeFromPath
      : routing.defaultLocale)

const safeNext = getSafeNextPath(
  searchParams.get('next'),
  locale
)
  const supabase = await createClient()

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      return NextResponse.redirect(`${siteUrl}/${locale}/auth/error`)
    }
  }

  const { data: { user }, error: userFetchError } = await supabase.auth.getUser()

  if (!user || userFetchError) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error`)
  }

  if (!user.user_metadata?.locale) {
    await supabase.auth.updateUser({ data: { locale } })
  }



if (safeNext?.startsWith('/recruiter/access')) {
  const recruiterToken = new URLSearchParams(
    safeNext.split('?')[1] ?? ''
  ).get('token')

  if (!recruiterToken) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error`)
  }

  const serviceSupabase = createServiceClient()
  const authEmail = user.email?.toLowerCase()?.trim() ?? ''
  const authName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
  const result = await RecruiterService.acceptInvite(
    serviceSupabase,
    user.id,
    recruiterToken,
    authEmail,
    authName
  )

  if (result.success) {
    return NextResponse.redirect(`${siteUrl}/${locale}/company/dashboard`)
  }

  return NextResponse.redirect(
    `${siteUrl}/${locale}/auth/error?error=${encodeURIComponent(result.error)}`
  )
}

  const [{ data: userData, error: userDataError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from('user')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('person_profile')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

  if (userDataError || profileError || !userData?.role) {
    return NextResponse.redirect(`${siteUrl}/${locale}/auth/error`)
  }

  const redirectPath = await resolvePostAuthRedirectPath(supabase, {
    userId: user.id,
    hasProfile: Boolean(profile),
    role: userData?.role,
  })

  return NextResponse.redirect(`${siteUrl}/${locale}${redirectPath}`)
}
