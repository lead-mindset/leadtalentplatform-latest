'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, RotateCcw } from 'lucide-react'
import { approveMember, rejectMember, revokeApproval } from '@/lib/actions/chapter/check-students'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

interface MemberActionButtonsProps {
  userId: string
  currentUserId: string
  userName: string
  currentState: 'pending' | 'approved' | 'rejected'
}

export function MemberActionButtons({
  userId,
  currentUserId,
  userName,
  currentState
}: MemberActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const router = useRouter()

  async function handleApprove() {
    setIsLoading(true)
    try {
      const result = await approveMember(userId, currentUserId)
      if (result.success) {
        toast.success(`${userName} approved successfully`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to approve member')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReject() {
    setIsLoading(true)
    try {
      const result = await rejectMember(userId, currentUserId, rejectReason || undefined)
      if (result.success) {
        toast.success(`${userName}'s profile has been rejected`)
        setShowRejectReason(false)
        setRejectReason('')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to reject member')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRevoke() {
    setIsLoading(true)
    try {
      const result = await revokeApproval(userId, currentUserId)
      if (result.success) {
        toast.success(`${userName}'s approval has been revoked`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to revoke approval')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (currentState === 'pending') {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            onClick={handleApprove}
            disabled={isLoading}
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
          <Button
            onClick={() => setShowRejectReason(v => !v)}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
        {showRejectReason && (
          <div className="space-y-2">
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Optional reason (visible to editors only)"
              rows={3}
            />
            <Button
              onClick={handleReject}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirm rejection
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (currentState === 'rejected') {
    return (
      <Button
        onClick={handleRevoke}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="mr-2 h-4 w-4" />
        )}
        Move back to Pending
      </Button>
    )
  }

  return (
    <Button
      onClick={handleRevoke}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <XCircle className="mr-2 h-4 w-4" />
      )}
      Revoke Approval
    </Button>
  )
}