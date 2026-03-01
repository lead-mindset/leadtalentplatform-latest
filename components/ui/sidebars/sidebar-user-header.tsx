import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import type { Role } from '@/lib/types'

interface SidebarUserHeaderProps {
  name: string
  email?: string
  role?: Role
  memberId?: string
}

const ROLE_LABELS: Record<Role, string> = {
  member:    'Member',
  editor:    'Chapter Editor',
  admin:     'Admin',
  recruiter: 'Recruiter',
}

export function SidebarUserHeader({ name, email, role, memberId }: SidebarUserHeaderProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-sidebar-border">
          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
            {name}
          </p>
          {email && (
            <p className="text-xs text-sidebar-foreground/50 truncate mt-0.5">
              {email}
            </p>
          )}
          {role && (
            <p className="text-xs text-sidebar-foreground/40 truncate mt-0.5">
              {ROLE_LABELS[role]}
            </p>
          )}
        </div>
      </div>

      {memberId && (
        <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-2">
          <span className="text-xs text-sidebar-foreground/50 shrink-0">Lead ID</span>
          <span className="text-xs font-mono font-semibold text-sidebar-foreground ml-auto tracking-wide">
            #{memberId}
          </span>
        </div>
      )}
    </div>
  )
}