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
    <Tabs value={currentStatus} onValueChange={handleTabChange} className="w-full pb-3">
      <div className="w-full">
        <TabsList className="grid !h-auto w-full grid-cols-1 gap-1 sm:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
          {visibleStatuses.map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="h-auto min-h-9 min-w-0 gap-2 px-2 py-2 text-xs sm:text-sm"
            >
              {tabLabels[status]}
              <Badge variant="outline" size="sm">
                {counts[status]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="sr-only">
        {visibleStatuses.map((status) => (
          <TabsContent key={status} value={status} forceMount>
            {tabLabels[status]} miembros
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}
