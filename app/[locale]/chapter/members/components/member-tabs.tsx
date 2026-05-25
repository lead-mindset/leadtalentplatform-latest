'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import type { MemberFilterStatus } from '../page'

export type MemberStatusCounts = Record<MemberFilterStatus, number>

const tabLabels: Record<MemberFilterStatus, string> = {
  pending: 'Pendientes',
  active: 'Aprobados',
  rejected: 'Rechazados',
  inactive: 'Inactivos',
  alumni: 'Alumni',
}

const badgeVariants: Record<MemberFilterStatus, 'warning' | 'success' | 'destructive' | 'neutral'> = {
  pending: 'warning',
  active: 'success',
  rejected: 'destructive',
  inactive: 'neutral',
  alumni: 'neutral',
}

export function MembersTabs({
  currentStatus,
  counts,
  visibleStatuses,
}: {
  currentStatus: MemberFilterStatus
  counts: MemberStatusCounts
  visibleStatuses: MemberFilterStatus[]
}) {
  const router = useRouter()

  const handleTabChange = (value: string) => {
    router.push(`/chapter/members?status=${value}`)
  }

  return (
    <Tabs value={currentStatus} onValueChange={handleTabChange} className="w-full">
      <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
        <TabsList className="flex min-w-max justify-start gap-1 sm:w-full sm:min-w-0">
          {visibleStatuses.map((status) => (
            <TabsTrigger key={status} value={status} className="flex-none gap-2 sm:flex-1">
              {tabLabels[status]}
              <Badge variant={badgeVariants[status]} size="sm">
                {counts[status]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="sr-only">
        {visibleStatuses.map((status) => (
          <TabsContent key={status} value={status} forceMount>
            {tabLabels[status]} members
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}
