'use client'

import BaseSidebar from './base-sidebar'
import { NavItem } from './nav-item'
import {
  SidebarMenu,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '../sidebar'
import { usePathname } from 'next/navigation'
import { User, FileText, Users, LayoutDashboard } from 'lucide-react'
import type { ChapterRow } from '@/lib/types'

interface DynamicSidebarProps {
  user: {
    name: string
    email?: string
    role: string
    Chapter?: ChapterRow | null
  }
  hasPendingApprovals?: boolean
}

interface NavItemConfig {
  name: string
  href: string
  icon: React.ComponentType<any>
  showPingKey?: 'hasPendingApprovals'
}

const studentNav: NavItemConfig[] = [
  { name: 'Profile', href: '/student/profile', icon: User },
  { name: 'Resume', href: '/student/resume', icon: FileText },
]

const chapterNav: NavItemConfig[] = [
  { name: 'Overview', href: '/chapter', icon: LayoutDashboard },
  { name: 'Members', href: '/chapter/members', icon: Users, showPingKey: 'hasPendingApprovals' },
]

export function DynamicSidebar({ user, hasPendingApprovals = false }: DynamicSidebarProps) {
  const pathname = usePathname()

  const isEditor = user.role === 'editor'

  return (
    <BaseSidebar
      userName={user.name}
      userEmail={user.email}
      userRole={isEditor ? 'Chapter Editor' : 'Member'}
    >
      <SidebarGroup>
        <SidebarGroupLabel>My Profile</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {studentNav.map(item => (
              <NavItem
                key={item.name}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {isEditor && (
        <SidebarGroup>
          <SidebarGroupLabel>Chapter Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chapterNav.map(item => (
                <NavItem
                  key={item.name}
                  {...item}
                  isActive={
                    item.href === '/chapter'
                      ? pathname === '/chapter'
                      : pathname.startsWith(item.href)
                  }
                  showPing={item.showPingKey === 'hasPendingApprovals' && hasPendingApprovals}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </BaseSidebar>
  )
}
