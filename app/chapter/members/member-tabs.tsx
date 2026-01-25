'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter, useSearchParams } from 'next/navigation'

export function MembersTabs({ 
  defaultValue, 
  children 
}: { 
  defaultValue: string
  children: React.ReactNode 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || 'all'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('status')
    } else {
      params.set('status', value)
    }
    router.push(`/chapter/members?${params.toString()}`)
  }

  return (
    <Tabs value={currentStatus} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="all">All Members</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
        <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
      </TabsList>
      <TabsContent value={currentStatus}>
        {children}
      </TabsContent>
    </Tabs>
  )
}