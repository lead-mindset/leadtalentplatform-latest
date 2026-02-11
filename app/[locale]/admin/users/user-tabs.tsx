'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter, useSearchParams } from 'next/navigation'

type UserRole = 'all' | 'members' | 'editors' | 'recruiters' | 'admins'

interface UserTabsProps {
  currentRole: UserRole
}

export function UserTabs({ currentRole }: UserTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('role')
    } else {
      params.set('role', value)
    }
    router.push(`/admin/users?${params.toString()}`)
  }

  return (
    <Tabs value={currentRole} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="all">All Users</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="editors">Editors</TabsTrigger>
        <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
        <TabsTrigger value="admins">Admins</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}