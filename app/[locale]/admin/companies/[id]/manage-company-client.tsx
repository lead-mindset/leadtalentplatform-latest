'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  generateInviteToken,
  resendInvite,
  revokeAccess,
  type CompanyDetail,
} from '@/lib/actions/admin/companies'
import { useRouter } from 'next/navigation'

type Props = {
  company: CompanyDetail
}

export function ManageCompanyClient({ company }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [expiry, setExpiry] = useState<'7' | '30' | 'never'>('7')

  const active = company.recruiters.filter((r) => r.is_active && !r.revoked_at)
  const pending = company.recruiters.filter((r) => !r.accepted_at && !r.revoked_at)

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success('Invite link copied.')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Invite Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Recruiter Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="recruiter@company.com" />
          </div>
          <div className="space-y-2">
            <Label>Expiry</Label>
            <div className="flex gap-2">
              {(['7', '30', 'never'] as const).map((value) => (
                <Button
                  key={value}
                  variant={expiry === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExpiry(value)}
                >
                  {value === 'never' ? 'Never' : `${value} days`}
                </Button>
              ))}
            </div>
          </div>
          <Button
            disabled={isPending || !email.trim()}
            onClick={() => {
              startTransition(async () => {
                const result = await generateInviteToken(
                  company.id,
                  email,
                  expiry === 'never' ? null : Number(expiry) as 7 | 30
                )
                if (!result.success || !result.inviteLink) {
                  toast.error(!result.success ? result.error ?? 'Failed' : 'Failed')
                  return
                }
                await copy(result.inviteLink)
                setEmail('')
                router.refresh()
              })
            }}
          >
            Generate + Copy Invite Link
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Recruiters ({active.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active recruiters.</p>
          ) : (
            active.map((row) => (
              <div key={row.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <p className="font-medium">{row.recruiter_email}</p>
                  <p className="text-xs text-muted-foreground">Accepted {row.accepted_at ? new Date(row.accepted_at).toLocaleDateString() : '—'}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await revokeAccess(row.id)
                      if (!result.success) {
                        toast.error(result.error)
                        return
                      }
                      toast.success('Access revoked.')
                      router.refresh()
                    })
                  }
                >
                  Revoke
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invites ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invites.</p>
          ) : (
            pending.map((row) => (
              <div key={row.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <p className="font-medium">{row.recruiter_email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">
                      {row.invite_expires_at ? `Expires ${new Date(row.invite_expires_at).toLocaleDateString()}` : 'No expiry'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await resendInvite(row.id)
                        if (!result.success || !result.inviteLink) {
                          toast.error(!result.success ? result.error ?? 'Failed' : 'Failed')
                          return
                        }
                        await copy(result.inviteLink)
                        router.refresh()
                      })
                    }
                  >
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await revokeAccess(row.id)
                        if (!result.success) {
                          toast.error(result.error)
                          return
                        }
                        toast.success('Invite revoked.')
                        router.refresh()
                      })
                    }
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}