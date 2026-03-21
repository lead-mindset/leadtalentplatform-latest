'use client'

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useLocale } from 'next-intl'

export default function GoogleButton() {
  const locale = useLocale();
  
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
redirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${locale}/auth/callback`,
      },
    })
  }

  return (
    <Button
      onClick={signInWithGoogle}
      variant="outline"
      className="w-full"
    >
      Continue with Google
    </Button>
  )
}