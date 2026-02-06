'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { approveMember, rejectMember } from '@/lib/actions/chapter/check-students'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ApprovalButtonsProps {
  userId: string
  currentUserId: string
  isApproved: boolean
}

export function ApprovalButtons({ userId, currentUserId, isApproved }: ApprovalButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setIsLoading(true)
    try {
      const result = await approveMember(userId, currentUserId)
      
      if (result.success) {
        toast.success('Member approved successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to approve member')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReject() {
    setIsLoading(true)
    try {
      const result = await rejectMember(userId, currentUserId)
      
      if (result.success) {
        toast.success('Member approval revoked')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to revoke approval')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-3">
      {!isApproved ? (
        <Button 
          onClick={handleApprove} 
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Approve Member
        </Button>
      ) : (
        <Button 
          onClick={handleReject} 
          disabled={isLoading}
          variant="outline"
          className="flex-1"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          Revoke Approval
        </Button>
      )}
    </div>
  )
}