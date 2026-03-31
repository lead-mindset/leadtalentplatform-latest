'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, Mail, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { revokeInvite, resendInvite } from '@/lib/actions/admin/invite-recruiter'

interface InviteActionsProps {
  inviteId: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
}

export function InviteActions({ inviteId, status }: InviteActionsProps) {
  const router = useRouter()
  const [isRevoking, setIsRevoking] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleRevoke = async () => {
    setIsRevoking(true)
    try {
      const result = await revokeInvite(inviteId)
      if (result.success) {
        toast.success('Invite revoked successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to revoke invite')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsRevoking(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      const result = await resendInvite(inviteId)
      if (result.success) {
        toast.success(result.message || 'Invite resent successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to resend invite')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsResending(false)
    }
  }

  if (status === 'revoked') {
    return <span className="text-sm text-muted-foreground">No actions</span>
  }

  if (status === 'accepted') {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isRevoking}>
            {isRevoking && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            <XCircle className="h-3 w-3 mr-1" />
            Revoke Access
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Recruiter Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this recruiter's access? They will
              immediately lose access to student profiles. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleResend}
        disabled={isResending}
      >
        {isResending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        <Mail className="h-3 w-3 mr-1" />
        Resend
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isRevoking}>
            {isRevoking && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            <XCircle className="h-3 w-3 mr-1" />
            Revoke
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this invitation? The link will no longer
              work and the recruiter will not be able to access the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}