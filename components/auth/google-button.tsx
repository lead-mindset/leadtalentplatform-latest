'use client'

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { getAuthErrorKey } from '@/lib/auth-errors'

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  if (value.startsWith('/auth/')) return null
  return value
}

export function GoogleButton() {
  const locale = useLocale();
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const signInWithGoogle = async () => {
    setIsLoading(true)
    setError(null)

    const nextPath = getSafeNextPath(searchParams.get('next'))
    const redirectTo = `${window.location.origin}/${locale}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (error) {
      setError(t(getAuthErrorKey(error)))
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
        {isLoading ? t('signingIn') : t('continueWithGoogle')}
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
