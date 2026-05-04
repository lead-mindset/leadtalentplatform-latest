'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import type { MemberFilterStatus } from '../page'

export type MemberStatusCounts = Record<MemberFilterStatus, number>

const tabLabels: Record<MemberFilterStatus, string> = {
  pending: 'Pending',
  active: 'Approved',
  rejected: 'Rejected',
  alumni: 'Alumni',
}

const badgeVariants: Record<MemberFilterStatus, 'warning' | 'success' | 'destructive' | 'neutral'> = {
  pending: 'warning',
  active: 'success',
  rejected: 'destructive',
  alumni: 'neutral',
}

export function MembersTabs({
  currentStatus,
  counts,
}: {
  currentStatus: MemberFilterStatus
  counts: MemberStatusCounts
}) {
  const router = useRouter()

  const handleTabChange = (value: string) => {
    router.push(`/chapter/members?status=${value}`)
  }

  return (
    <Tabs value={currentStatus} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4 lg:w-auto">
        {(Object.keys(tabLabels) as MemberFilterStatus[]).map((status) => (
          <TabsTrigger key={status} value={status} className="gap-2">
            {tabLabels[status]}
            <Badge variant={badgeVariants[status]} size="sm">
              {counts[status]}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
