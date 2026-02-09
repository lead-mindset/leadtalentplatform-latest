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
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Administration</SidebarGroupLabel>
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
                showPing={item.id === 'invites' && stats.pendingInvites > 0}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-3 py-2 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Users</span>
              <span className="font-semibold">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chapters</span>
              <span className="font-semibold">{stats.totalChapters}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Companies</span>
              <span className="font-semibold">{stats.totalCompanies}</span>
            </div>
            {stats.pendingApprovals > 0 && (
              <div className="flex justify-between pt-1 border-t border-border">
                <span className="text-chart-2">Pending Approvals</span>
                <span className="font-semibold text-chart-2">
                  {stats.pendingApprovals}
                </span>
              </div>
            )}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}