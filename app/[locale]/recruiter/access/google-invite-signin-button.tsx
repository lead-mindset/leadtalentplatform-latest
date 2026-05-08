'use client'

import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

export function GoogleInviteSignInButton({ token }: { token: string }) {
  const locale = useLocale()

  async function signIn() {
    const nextPath = `/recruiter/access?token=${encodeURIComponent(token)}`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })
  }

  return (
    <Button className="w-full" onClick={signIn}>
      Continue with Google to accept access
    </Button>
  )
}
