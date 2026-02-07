'use client'

import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from "../sidebar"
import { LogoutButton } from "../../logout-button"
import { Badge } from "../badge"
import { Avatar, AvatarFallback } from "../avatar"

interface BaseSidebarProps {
  userName: string
  userEmail?: string
  userRole?: string
  children: React.ReactNode
}

export default function BaseSidebar({ userName, userEmail, userRole, children }: BaseSidebarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar className="h-full border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-sidebar-primary/20">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {userName}
            </p>
            {userEmail && (
              <p className="text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            )}
            {userRole && (
              <Badge variant='secondary' className="text-xs mt-1">
                {userRole}
              </Badge>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto px-3 py-4">
        {children}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border mt-auto">
        <LogoutButton className="w-full" />
      </SidebarFooter>
    </Sidebar>
  )
}