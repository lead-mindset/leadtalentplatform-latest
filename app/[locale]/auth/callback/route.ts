import { createClient } from '@/lib/supabase/server'
import { getConfiguredAppUrl } from '@/lib/app-url'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const localeMatch = new URL(request.url).pathname.match(/^\/([a-z]{2})\//)
  const locale = localeMatch?.[1] ?? 'es'
  const next = searchParams.get('next') ?? `/${locale}/onboarding`
  const baseUrl = getConfiguredAppUrl().replace(/\/+$/, '')

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
