import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  
  // Security: Ensure 'next' parameter doesn't redirect to external sites
  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('Error fetching user role:', userError)
          return NextResponse.redirect(`${origin}/auth/error`)
        }

        if (userData) {
          const role = userData.role

          // Handle student and editor roles
          if (role === 'student' || role === 'editor') {
            const { data: profile, error: profileError } = await supabase
              .from('StudentProfile')
              .select('isFilled')
              .eq('userId', user.id)
              .single()

            // If profile doesn't exist or not filled, send to onboarding
            if (profileError || !profile || !profile.isFilled) {
              next = '/onboarding'
            } else {
              next = '/student/profile'  // More specific redirect
            }
          } 
          // Handle company representative role
          else if (role === 'representative') {
            next = '/company'
          }
          // Handle admin role
          else if (role === 'admin') {
            next = '/admin'
          }
          // Handle unknown/invalid role
          else {
            console.error('Unknown role:', role)
            return NextResponse.redirect(`${origin}/auth/error`)
          }
        } else {
          // No user data found
          console.error('No user data found in User table')
          return NextResponse.redirect(`${origin}/auth/error`)
        }
      } else {
        // No user found after session exchange
        console.error('No user found after session exchange')
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      // Handle redirect based on environment
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      // Session exchange failed
      console.error('Auth session exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/error`)
    }
  }

  // No code parameter provided
  console.error('No code parameter in callback')
  return NextResponse.redirect(`${origin}/auth/error`)
}