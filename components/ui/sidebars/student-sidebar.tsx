'use client'

import { SidebarNavItem } from './nav-item'
import {
  SidebarMenu,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import { STUDENT_NAV, CHAPTER_NAV } from '@/lib/nav-config'

interface StudentNavigationProps {
  userRole: string
  has_pending_approvals: boolean
  canManageChapter?: boolean
}

export function StudentNavigation({ 
  userRole, 
  has_pending_approvals,
  canManageChapter = userRole === 'editor',
}: StudentNavigationProps) {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-sidebar-foreground font-medium">Navegación</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {STUDENT_NAV.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {canManageChapter && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-medium">Gestión de capítulo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CHAPTER_NAV.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  showPing={item.id === 'overview' && has_pending_approvals}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}
