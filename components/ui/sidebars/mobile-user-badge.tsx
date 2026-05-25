'use client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoutButton } from '@/components/auth/logout-button'
import { Icons } from '@/components/ui/icons'
import { getInitials } from '@/lib/utils'

interface MobileUserBadgeProps {
  name: string
  memberId?: string
}

export function MobileUserBadge({ name, memberId }: MobileUserBadgeProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 outline-none">
          {memberId && (
            <Badge variant="secondary" className="text-xs font-mono bg-primary/10 text-primary border-primary/20">
              ID: {memberId}
            </Badge>
          )}
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[180px]">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{name}</p>
          {memberId && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">ID de miembro:</span>
              <span className="text-xs font-mono text-primary font-semibold">{memberId}</span>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <Icons.LogOut className="mr-2 h-4 w-4" />
            <LogoutButton label="Cerrar sesión" />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
