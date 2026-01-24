'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  User, 
  FileText, 
  Users, 
  Activity, 
  Building, 
  LayoutDashboard,
  Settings
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { LogoutButton } from '@/components/logout-button'
import { Badge } from '@/components/ui/badge'

const studentNav = [
  { name: 'Profile', href: '/student/profile', icon: User },
  { name: 'Resume', href: '/student/resume', icon: FileText },
  { name: 'Settings', href: '/student/settings', icon: Settings },
]

const chapterNav = [
  { name: 'Overview', href: '/chapter', icon: LayoutDashboard },
  { name: 'Members', href: '/chapter/members', icon: Users, showIndicator: true },
  { name: 'Activity', href: '/chapter/activity', icon: Activity },
  { name: 'Settings', href: '/chapter/settings', icon: Settings },
]

interface Chapter {
  name: string
  university: string
}

interface DynamicSidebarProps {
  user: {
    name: string | null
    email: string | null
    role: string
    Chapter?: Chapter | null
  }
  hasPendingApprovals?: boolean
}

export function DynamicSidebar({ user, hasPendingApprovals = false }: DynamicSidebarProps) {
  const pathname = usePathname()
  const isEditor = user.role === 'editor'

  return (
    <Sidebar>
      <SidebarHeader className="mt-4">
        <Link href="/" className="flex items-center font-bold gap-2 px-2 mb-4">
          <img src="/leadl2.svg" alt="LEAD" width={32} height={32} />
          LEAD
        </Link>
        <div className="px-2 space-y-1">
          <p className="text-xs text-muted-foreground">Welcome back,</p>
          <p className="font-semibold text-lg">{user.name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {user.Chapter && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Building className="h-3 w-3" />
              {user.Chapter.name}
            </p>
          )}
          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              {isEditor ? 'Chapter Editor' : 'Member'}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Profile</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studentNav.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isEditor && (
          <SidebarGroup>
            <SidebarGroupLabel>Chapter Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chapterNav.map((item) => {
                  const Icon = item.icon
                  const isActive = item.href === '/chapter' 
                    ? pathname === '/chapter'
                    : pathname.startsWith(item.href)
                  
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href} className="relative">
                          <Icon />
                          <span>{item.name}</span>
                          {item.showIndicator && hasPendingApprovals && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2">
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <LogoutButton />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}