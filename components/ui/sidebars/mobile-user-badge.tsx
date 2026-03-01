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
import { LogoutButton } from '@/components/logout-button'
import { LogOut } from 'lucide-react'
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
            <Badge variant="secondary" className="text-xs font-mono">
              #{memberId}
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
            <p className="text-xs font-mono text-muted-foreground mt-0.5">#{memberId}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <LogOut className="h-4 w-4" />
            <LogoutButton />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}