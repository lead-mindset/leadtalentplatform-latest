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
}

export function StudentNavigation({ 
  userRole, 
  has_pending_approvals 
}: StudentNavigationProps) {
  const isEditor = userRole === 'editor'

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-sidebar-foreground font-medium">My Profile</SidebarGroupLabel>
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

      {isEditor && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-medium">Chapter Management</SidebarGroupLabel>
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