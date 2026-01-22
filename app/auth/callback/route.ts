import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from('User')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData) {
          const role = userData.role

          if (role === 'student' || role === 'editor') {
            const { data: profile } = await supabase
              .from('StudentProfile')
              .select('isFilled')
              .eq('userId', user.id)
              .single()

            if (!profile || !profile.isFilled) {
              next = '/onboarding'
            } else {
              next = '/student/dashboard'
            }
          } 
          else if (role === 'representative') {
            next = '/company/dashboard'
          }
          else if (role === 'admin') {
            next = '/admin/'
          }
        }
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
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}