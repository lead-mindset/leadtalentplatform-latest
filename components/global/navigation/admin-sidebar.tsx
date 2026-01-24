'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Users,
  Building2,
  Building,
  Mail,
  Activity,
  Settings,
  ShieldCheck
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

const adminNav = [
  { 
    name: 'Overview', 
    href: '/admin', 
    icon: LayoutDashboard,
    description: 'System dashboard'
  },
  { 
    name: 'Chapters', 
    href: '/admin/chapters', 
    icon: Building2,
    description: 'Manage chapters',
    showCount: 'totalChapters'
  },
  { 
    name: 'Users', 
    href: '/admin/users', 
    icon: Users,
    description: 'Manage users',
    showCount: 'totalUsers'
  },
  { 
    name: 'Companies', 
    href: '/admin/companies', 
    icon: Building,
    description: 'Manage companies',
    showCount: 'totalCompanies'
  },
  { 
    name: 'Invites', 
    href: '/admin/invites', 
    icon: Mail,
    description: 'Recruiter invites',
    showIndicator: 'pendingInvites'
  },
  { 
    name: 'Activity', 
    href: '/admin/activity', 
    icon: Activity,
    description: 'System audit log'
  },
]

interface AdminStats {
  pendingInvites: number
  pendingApprovals: number
  totalUsers: number
  totalChapters: number
  totalCompanies: number
}

interface AdminSidebarProps {
  user: {
    name: string | null
    email: string | null
    role: string
  }
  stats: AdminStats
}

export function AdminSidebar({ user, stats }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="mt-4">
        <Link href="/" className="flex items-center font-bold gap-2 px-2 mb-4">
          <img src="/leadl2.svg" alt="LEAD" width={32} height={32} />
          LEAD
        </Link>
        <div className="px-2 space-y-1">
          <p className="text-xs text-muted-foreground">Admin Panel</p>
          <p className="font-semibold text-lg">{user.name || 'Administrator'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <div className="pt-2">
            <Badge variant="default" className="text-xs gap-1">
              <ShieldCheck className="h-3 w-3" />
              Administrator
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => {
                const Icon = item.icon
                const isActive = item.href === '/admin' 
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)
                
                const indicatorCount = item.showIndicator 
                  ? stats[item.showIndicator as keyof AdminStats]
                  : 0
                
                const displayCount = item.showCount
                  ? stats[item.showCount as keyof AdminStats]
                  : null
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} className="relative">
                        <Icon />
                        <span className="flex-1">{item.name}</span>
                        
                        {displayCount !== null && displayCount > 0 && (
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {displayCount}
                          </Badge>
                        )}
                        
                        {item.showIndicator && indicatorCount > 0 && (
                          <div className="ml-auto flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              {indicatorCount}
                            </Badge>
                            <span className="flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin/settings'}>
                  <Link href="/admin/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-semibold">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Chapters</span>
                <span className="font-semibold">{stats.totalChapters}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Companies</span>
                <span className="font-semibold">{stats.totalCompanies}</span>
              </div>
              {stats.pendingApprovals > 0 && (
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="text-orange-600 dark:text-orange-400">Pending Approvals</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {stats.pendingApprovals}
                  </span>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
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