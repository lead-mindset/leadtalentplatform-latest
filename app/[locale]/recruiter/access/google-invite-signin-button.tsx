'use client'

import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

export function GoogleInviteSignInButton({ token }: { token: string }) {
  const locale = useLocale()

  async function signIn() {
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin
    const nextPath = `/recruiter/access?token=${encodeURIComponent(token)}`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${frontendUrl}/${locale}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })
  }

  return (
    <Button className="w-full" onClick={signIn}>
      Continue with Google
    </Button>
  )
}
