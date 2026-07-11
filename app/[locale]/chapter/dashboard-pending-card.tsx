'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { approveMember } from '@/lib/actions/chapter/check-students'
import type { MemberWithProfile } from '@/lib/types'
import type { ChapterMemberPermissionFlags } from '@/lib/services/chapter.service'

export function DashboardPendingCard({
  member,
}: {
  member: MemberWithProfile
  permissions: ChapterMemberPermissionFlags
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const profile = member.person_profile

  function submitApprove() {
    startTransition(async () => {
      const result = await approveMember(member.id)
      if (result.success) {
        toast.success(`${member.name ?? member.email} aprobado`)
        router.refresh()
      } else {
        toast.error(result.error || 'Error al aprobar')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">{member.name ?? 'Sin nombre'}</p>
        <p className="text-xs text-muted-foreground">
          {profile?.major_or_interest}
          {profile?.linkedin_url ? (
            <> · <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a></>
          ) : null}
        </p>
      </div>
      <Button
        size="sm"
        onClick={submitApprove}
        disabled={isPending}
        className="bg-success text-success-foreground hover:bg-success/90 shrink-0"
      >
        {isPending ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        )}
        Aprobar
      </Button>
    </div>
  )
}
