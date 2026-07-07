'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { acceptInvite } from '@/lib/actions/recruiter/access'

export function InviteAcceptButton({
  token,
  userId,
  locale,
}: {
  token: string
  userId: string
  locale: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setLoading(true)
    setError('')

    const result = await acceptInvite(token, userId)

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    window.location.href = `/${locale}/company/dashboard`
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={handleAccept} disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Accepting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Accept Invite
            <ArrowRight className="h-4 w-4" />
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