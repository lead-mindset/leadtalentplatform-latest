'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Mail, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export function InviteEmailSignInButton({
  email,
  token,
}: {
  email: string
  token: string
}) {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setLoading(true)
    setError('')

    const nextPath = `/recruiter/access?token=${encodeURIComponent(token)}`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Login link sent
        </div>
        <p className="text-sm text-muted-foreground">
          We emailed a secure sign-in link to <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={signIn} disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Send login link to {email}
          </span>
        )}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
