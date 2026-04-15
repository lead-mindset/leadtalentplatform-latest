'use client'

import { SidebarNavItem } from './nav-item'
import {
  SidebarMenu,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import { ADMIN_NAV } from '@/lib/nav-config'
import type { AdminStats } from '@/lib/types'

interface AdminNavigationProps {
  stats: AdminStats
}

export function AdminNavigation({ stats }: AdminNavigationProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground font-medium">Administration</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {ADMIN_NAV.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              exact={item.id === 'overview'}
              badge={
                item.id === 'chapters' ? stats.totalChapters :
                item.id === 'users' ? stats.totalUsers :
                item.id === 'companies' ? stats.totalCompanies :
                undefined
              }
              showPing={
                (item.id === 'invites' && stats.pendingInvites > 0) ||
                (item.id === 'users' && stats.pendingApprovals > 0)
              }
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}