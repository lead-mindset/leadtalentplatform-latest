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
import {
  LayoutDashboard,
  Users,
  Building,
  Building2,
  Mail,
  Activity,
  Settings,
} from 'lucide-react'
import type { AdminSidebarProps } from '@/lib/types'
import type { NavItemConfig } from '@/lib/types'

const adminNav: NavItemConfig[] = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard, description: 'System dashboard' },
  { name: 'Chapters', href: '/admin/chapters', icon: Building2, showCountKey: 'totalChapters' },
  { name: 'Users', href: '/admin/users', icon: Users, showCountKey: 'totalUsers' },
  { name: 'Companies', href: '/admin/companies', icon: Building, showCountKey: 'totalCompanies' },
  { name: 'Invites', href: '/admin/invites', icon: Mail, showIndicatorKey: 'pendingInvites' },
  { name: 'Activity', href: '/admin/activity', icon: Activity },
]

export function AdminSidebar({ user, stats }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <BaseSidebar userName={user.name} userEmail={user.email} userRole="Administrator">
      <SidebarGroup>
        <SidebarGroupLabel>Administration</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {adminNav.map(item => (
              <NavItem
                key={item.name}
                name={item.name}
                href={item.href}
                icon={item.icon}
                isActive={
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href)
                }
                badgeCount={
                  item.showCountKey ? stats[item.showCountKey] : undefined
                }
                showPing={
                  item.showIndicatorKey ? (stats[item.showIndicatorKey] ?? 0) > 0 : false
                }
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
    </BaseSidebar>
  )
}