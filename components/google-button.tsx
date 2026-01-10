'use client'

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
    <button
      onClick={signInWithGoogle}
      className="flex items-center justify-center gap-2 rounded-md border px-4 py-2 hover:bg-gray-100"
    >
      Continue with Google
    </button>
  )
}
