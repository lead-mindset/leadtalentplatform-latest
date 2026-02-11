'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, GraduationCap, Briefcase, Shield, Edit3 } from 'lucide-react'

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
    <Tabs value={currentRole} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">All</span>
        </TabsTrigger>
        <TabsTrigger value="members" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span className="hidden sm:inline">Members</span>
        </TabsTrigger>
        <TabsTrigger value="editors" className="flex items-center gap-2">
          <Edit3 className="h-4 w-4" />
          <span className="hidden sm:inline">Editors</span>
        </TabsTrigger>
        <TabsTrigger value="recruiters" className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          <span className="hidden sm:inline">Recruiters</span>
        </TabsTrigger>
        <TabsTrigger value="admins" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Admins</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}