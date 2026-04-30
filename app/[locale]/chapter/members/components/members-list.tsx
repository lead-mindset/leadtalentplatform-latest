'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import MemberCard from './member-card'
import type { MemberWithProfile } from '@/lib/types'
import type { MemberFilterStatus } from '../page'
import { approveMembersBulk } from '@/lib/actions/chapter/check-students'

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

  const selectableMembers = useMemo(
    () => members.filter((member) => member.student_profile?.approval_status === 'pending' && member.student_profile?.is_filled),
    [members]
  )

  const allSelected = selectableMembers.length > 0 && selectedUserIds.length === selectableMembers.length

  function onToggle(memberId: string, checked: boolean) {
    setSelectedUserIds((current) =>
      checked ? [...new Set([...current, memberId])] : current.filter((id) => id !== memberId)
    )
  }

  function onToggleAll() {
    if (allSelected) {
      setSelectedUserIds([])
      return
    }
    setSelectedUserIds(selectableMembers.map((member) => member.id))
  }

  async function onBulkApprove() {
    if (selectedUserIds.length === 0) return

    setIsSubmitting(true)
    try {
      const result = await approveMembersBulk(selectedUserIds)
      if ('error' in result) {
        toast.error(result.error || 'Failed to bulk approve members')
        return
      }

      toast.success(
        result.skipped > 0
          ? `${result.count} approved, ${result.skipped} skipped`
          : `${result.count} members approved`
      )
      setSelectedUserIds([])
      router.refresh()
    } catch {
      toast.error('Unexpected error while bulk approving members')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {status === 'pending' && selectableMembers.length > 0 && (
        <div className="rounded-lg border p-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-pending"
              checked={allSelected}
              onCheckedChange={onToggleAll}
            />
            <label htmlFor="select-all-pending" className="text-sm">
              Select all pending members ({selectableMembers.length})
            </label>
          </div>
          <Button disabled={isSubmitting || selectedUserIds.length === 0} onClick={onBulkApprove}>
            Approve selected ({selectedUserIds.length})
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            showSelector={status === 'pending' && member.student_profile?.approval_status === 'pending' && member.student_profile?.is_filled}
            selected={selectedUserIds.includes(member.id)}
            onSelectChange={(checked) => onToggle(member.id, checked)}
          />
        ))}
      </div>
    </div>
  )
}
