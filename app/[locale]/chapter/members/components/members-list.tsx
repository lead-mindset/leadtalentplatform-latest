'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Icons } from '@/components/ui/icons'
import MemberCard from './member-card'
import type { MemberWithProfile } from '@/lib/types'
import type { MemberFilterStatus } from '../page'
import { approveMembersBulk } from '@/lib/actions/chapter/check-students'

type Feedback = {
  type: 'success' | 'error'
  title: string
  message?: string
} | null

export function MembersList({
  members,
  status,
}: {
  members: MemberWithProfile[]
  status: MemberFilterStatus
}) {
  const router = useRouter()
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const selectableMembers = useMemo(
    () => members.filter((member) => member.chapter_membership?.status === 'pending' && member.person_profile),
    [members]
  )

  const allSelected = selectableMembers.length > 0 && selectedUserIds.length === selectableMembers.length

  function onToggle(memberId: string, checked: boolean) {
    setSelectedUserIds((current) =>
      checked ? [...new Set([...current, memberId])] : current.filter((id) => id !== memberId)
    )
  }

  function onToggleAll() {
    setFeedback(null)
    if (allSelected) {
      setSelectedUserIds([])
      return
    }
    setSelectedUserIds(selectableMembers.map((member) => member.id))
  }

  async function onBulkApprove() {
    if (selectedUserIds.length === 0) return

    setFeedback(null)
    setIsSubmitting(true)
    try {
      const result = await approveMembersBulk(selectedUserIds)
      if ('error' in result) {
        const message = result.error || 'Failed to bulk approve members'
        toast.error(message)
        setFeedback({ type: 'error', title: 'Bulk approval failed', message })
        return
      }

      const skippedMessage =
        result.skipped > 0
          ? `${result.skipped} selected member${result.skipped === 1 ? ' was' : 's were'} skipped because they were no longer eligible.`
          : undefined

      toast.success(
        result.skipped > 0
          ? `${result.count} approved, ${result.skipped} skipped`
          : `${result.count} members approved`
      )
      setFeedback({
        type: 'success',
        title: `${result.count} member${result.count === 1 ? '' : 's'} approved`,
        message: skippedMessage || 'Selected pending members were approved.',
      })
      setSelectedUserIds([])
      router.refresh()
    } catch {
      const message = 'Unexpected error while bulk approving members'
      toast.error(message)
      setFeedback({ type: 'error', title: 'Bulk approval failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {status === 'pending' && selectableMembers.length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all-pending"
                checked={allSelected}
                onCheckedChange={onToggleAll}
              />
              <label htmlFor="select-all-pending" className="text-sm font-medium">
                {selectedUserIds.length} selected
                <span className="ml-1 text-muted-foreground">of {selectableMembers.length} eligible pending</span>
              </label>
            </div>
            <Button disabled={isSubmitting || selectedUserIds.length === 0} onClick={onBulkApprove}>
              {isSubmitting ? (
                <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Approve selected
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Bulk approval only includes pending applicants with completed basic profiles. Same-chapter authorization remains enforced by the service.
          </p>
        </div>
      )}

      {feedback ? (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          {feedback.type === 'error' ? (
            <Icons.AlertCircle className="h-4 w-4" />
          ) : (
            <Icons.CheckCircle2 className="h-4 w-4" />
          )}
          <AlertTitle>{feedback.title}</AlertTitle>
          {feedback.message ? <AlertDescription>{feedback.message}</AlertDescription> : null}
        </Alert>
      ) : null}

      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            showSelector={status === 'pending' && member.chapter_membership?.status === 'pending' && Boolean(member.person_profile)}
            selected={selectedUserIds.includes(member.id)}
            onSelectChange={(checked) => onToggle(member.id, checked)}
          />
        ))}
      </div>
    </div>
  )
}
