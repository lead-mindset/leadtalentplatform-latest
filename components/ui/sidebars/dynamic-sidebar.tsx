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
import { useTranslations } from 'next-intl'

interface DynamicSidebarProps {
  user: {
    name: string
    email: string
    role: string
  }
  hasPendingApprovals?: boolean
}

interface NavItemConfig {
  nameKey: string
  href: string
  icon: React.ComponentType<any>
  showPingKey?: 'hasPendingApprovals'
}

const studentNavConfig: NavItemConfig[] = [
  { nameKey: 'profileNav', href: '/student/profile', icon: User },
  { nameKey: 'resumeNav', href: '/student/resume', icon: FileText },
]

const chapterNavConfig: NavItemConfig[] = [
  { nameKey: 'overview', href: '/chapter', icon: LayoutDashboard },
  { nameKey: 'members', href: '/chapter/members', icon: Users, showPingKey: 'hasPendingApprovals' },
]

export function DynamicSidebar({ user, hasPendingApprovals = false }: DynamicSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('sidebar')

  const isEditor = user.role === 'editor'

  const studentNav = studentNavConfig.map(item => ({
    name: t(item.nameKey),
    href: item.href,
    icon: item.icon,
    showPingKey: item.showPingKey
  }))

  const chapterNav = chapterNavConfig.map(item => ({
    name: t(item.nameKey),
    href: item.href,
    icon: item.icon,
    showPingKey: item.showPingKey
  }))

  return (
    <BaseSidebar
      userName={user.name}
      userEmail={user.email}
      userRole={isEditor ? t('chapterEditor') : t('member')}
    >
      <SidebarGroup>
        <SidebarGroupLabel>{t('myProfile')}</SidebarGroupLabel>
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
          <SidebarGroupLabel>{t('chapterManagement')}</SidebarGroupLabel>
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