// components/ui/sidebars/mobile-sidebar-content.tsx
'use client'

import { LogoutButton } from "../../logout-button"
import { Badge } from "../badge"
import { Avatar, AvatarFallback } from "../avatar"

interface MobileSidebarContentProps {
  userName: string
  userEmail?: string
  userRole?: string
  children: React.ReactNode
}

export function MobileSidebarContent({ userName, userEmail, userRole, children }: MobileSidebarContentProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-semibold truncate">
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
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {children}
      </div>

      <div className="p-4 border-t mt-auto">
        <LogoutButton className="w-full" />
      </div>
    </div>
  )
}