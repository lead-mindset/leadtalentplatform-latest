'use client'

import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter 
} from '@/components/ui/sidebar'
import { LogoutButton } from '@/components/auth/logout-button'
import { SidebarUserHeader } from './sidebar-user-header'
import type { ReactNode } from 'react'
import type { Role } from '@/lib/types'
interface BaseSidebarProps {
  userName: string
  userEmail?: string
  userRole?: Role
  memberId?: string
  children: ReactNode
}

export function BaseSidebar({ 
  userName, 
  userEmail, 
  userRole,
  memberId,
  children 
}: BaseSidebarProps) {
  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarUserHeader 
          name={userName}
          email={userEmail}
          role={userRole}
          memberId={memberId}
        />
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {children}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <LogoutButton className="w-full" label="Cerrar sesión" />
      </SidebarFooter>
    </Sidebar>
  )
}
