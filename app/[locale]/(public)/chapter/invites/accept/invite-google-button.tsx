'use client'

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { getAuthErrorKey } from '@/lib/auth-errors'

type Props = {
  returnPath: string
}

export function InviteGoogleButton({ returnPath }: Props) {
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const signInWithGoogle = async () => {
    setIsLoading(true)
    setError(null)

    const redirectTo = `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(returnPath)}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (error) {
      setError(getAuthErrorKey(error))
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={signInWithGoogle}
        variant="outline"
        className="w-full"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? 'Conectando con Google…' : 'Continuar con Google'}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
