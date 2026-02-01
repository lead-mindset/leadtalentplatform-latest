'use client'

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

export default function GoogleButton() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Button
      onClick={signInWithGoogle}
      variant="outline"
      className="flex items-center justify-center gap-2"
    >
      Continue with Google
    </Button>
  )
}