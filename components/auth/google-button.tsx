'use client'

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useLocale, useTranslations } from 'next-intl'

export function GoogleButton() {
  const locale = useLocale();
  const t = useTranslations('auth');

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`
      },
    })
  }

  return (
    <Button
      onClick={signInWithGoogle}
      variant="outline"
      className="w-full"
    >
      {t('continueWithGoogle')}
    </Button>
  )
}
