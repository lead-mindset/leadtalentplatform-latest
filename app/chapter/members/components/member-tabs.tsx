'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'

export function MembersTabs({ currentStatus }: { currentStatus: string }) {
  const router = useRouter()

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      router.push('/chapter/members')
    } else {
      router.push(`/chapter/members?status=${value}`)
    }
  }

  return (
    <Tabs value={currentStatus} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-4 lg:w-150">
        <TabsTrigger value="all">All Members</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
        <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}