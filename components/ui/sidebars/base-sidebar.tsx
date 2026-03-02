'use client'

import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter 
} from '@/components/ui/sidebar'
import { LogoutButton } from '@/components/logout-button'
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
    <Sidebar className="border-r">
      <SidebarHeader className="border-b">
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

      <SidebarFooter className="border-t p-4">
        <LogoutButton className="w-full" />
      </SidebarFooter>
    </Sidebar>
  )
}