'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { approveMember, rejectMember } from '@/app/lib/actions/chapter/check-students'

export function ApproveMemberButton({ 
  userId, 
  editorId,
  userName 
}: { 
  userId: string
  editorId: string
  userName: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveMember(userId, editorId)
      
      if (result.success) {
        toast.success(`${userName} has been approved!`)
      } else {
        toast.error(result.error || 'Failed to approve member')
      }
    })
  }

  return (
    <Button
      onClick={handleApprove}
      disabled={isPending}
      className="flex-1"
      variant="default"
    >
      <CheckCircle2 className="h-4 w-4 mr-2" />
      {isPending ? 'Approving...' : 'Approve'}
    </Button>
  )
}

export function RejectMemberButton({ 
  userId,
  userName 
}: { 
  userId: string
  userName: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectMember(userId)
      
      if (result.success) {
        toast.success(`${userName}'s profile has been reset`)
      } else {
        toast.error(result.error || 'Failed to reject member')
      }
    })
  }

  return (
    <Button
      onClick={handleReject}
      disabled={isPending}
      className="flex-1"
      variant="outline"
    >
      <XCircle className="h-4 w-4 mr-2" />
      {isPending ? 'Rejecting...' : 'Reject'}
    </Button>
  )
}