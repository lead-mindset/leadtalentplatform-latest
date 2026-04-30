'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import type { MemberFilterStatus } from '../page'

export function MembersTabs({ currentStatus }: { currentStatus: MemberFilterStatus }) {
  const router = useRouter()

  const handleTabChange = (value: string) => {
    router.push(`/chapter/members?status=${value}`)
  }

  return (
    <Tabs value={currentStatus} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="rejected">Rejected</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}