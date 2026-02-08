import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface SidebarUserHeaderProps {
  name: string
  email?: string
  role?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function SidebarUserHeader({ name, email, role }: SidebarUserHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b p-4">
      <Avatar className="h-10 w-10 border-2 border-primary/20">
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground truncate">
          {name}
        </p>
        
        {email && (
          <p className="text-xs text-muted-foreground truncate">
            {email}
          </p>
        )}
        
        {role && (
          <Badge variant="secondary" className="text-xs">
            {role}
          </Badge>
        )}
      </div>
    </div>
  )
}