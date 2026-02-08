'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar'

import { STUDENT_NAV, CHAPTER_NAV } from '@/lib/types'
import { USER_ROLES } from '@/lib/types'
import { SidebarNavItem } from './nav-item'
interface StudentNavigationProps {
  userRole: string
  hasPendingApprovals?: boolean
}

function isPathActive(pathname: string, href: string): boolean {
  if (href === '/chapter') return pathname === '/chapter'
  return pathname.startsWith(href)
}

export function StudentNavigation({ 
  userRole, 
  hasPendingApprovals = false 
}: StudentNavigationProps) {
  const pathname = usePathname()
  const t = useTranslations('sidebar')
  
  const isEditor = userRole === USER_ROLES.EDITOR

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>{t('myProfile')}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {STUDENT_NAV.map(({ nameKey, href, icon }) => (
              <SidebarNavItem
                key={href}
                href={href}
                icon={icon}
                label={t(nameKey)}
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
              {CHAPTER_NAV.map(({ nameKey, href, icon, showPingOn }) => (
                <SidebarNavItem
                  key={href}
                  href={href}
                  icon={icon}
                  label={t(nameKey)}
                  showPing={showPingOn === 'hasPendingApprovals' && hasPendingApprovals}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}