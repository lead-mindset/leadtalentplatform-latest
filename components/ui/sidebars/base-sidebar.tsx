'use client'

import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from "../sidebar"
import { LogoutButton } from "../../logout-button"
import { Badge } from "../badge"

interface BaseSidebarProps {
  userName: string
  userEmail?: string
  userRole?: string
  children: React.ReactNode
}

export default function BaseSidebar({ userName, userEmail, userRole, children }: BaseSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sidebar-foreground">{userName}</p>
          {userEmail && (
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          )}
          {userRole && (
            <Badge variant='secondary' className="text-xs">
              {userRole}
            </Badge>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {children}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border mt-auto">
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}