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
import { revokeInvite, resendInvite } from '@/lib/admin-invite-actions'

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
        router.refresh()
      } else {
        alert(result.error || 'Failed to revoke invite')
      }
    } catch (error: any) {
      alert(error.message || 'Unexpected error')
    } finally {
      setIsRevoking(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      const result = await resendInvite(inviteId)
      if (result.success) {
        alert(result.message || 'Invite resent successfully')
        router.refresh()
      } else {
        alert(result.error || 'Failed to resend invite')
      }
    } catch (error: any) {
      alert(error.message || 'Unexpected error')
    } finally {
      setIsResending(false)
    }
  }

  // Revoked invites - no actions
  if (status === 'revoked') {
    return <span className="text-sm text-muted-foreground">No actions</span>
  }

  // Accepted invites - only revoke
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
              Are you sure you want to revoke this recruiter's access? 
              They will immediately lose access to the company's student profiles.
              This action cannot be undone.
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

  // Pending or expired invites - can resend or revoke
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
        Resend Invite
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
              Are you sure you want to revoke this invitation? 
              The magic link will no longer work and the recruiter will not be able to access the platform.
              This action cannot be undone.
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
