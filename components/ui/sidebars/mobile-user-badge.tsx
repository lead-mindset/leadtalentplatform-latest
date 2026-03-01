import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface MobileUserBadgeProps {
  name: string
  memberId?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function MobileUserBadge({ name, memberId }: MobileUserBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      {memberId && (
        <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
          #{memberId}
        </Badge>
      )}
      <Avatar className="h-8 w-8 border-2 border-primary/20">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}