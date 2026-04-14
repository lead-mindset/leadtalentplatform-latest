import { Ban, CalendarCheck, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { RegistrationStatus } from '@/lib/types'

interface RegistrationStatusBadgeProps {
  status: RegistrationStatus
  showIcon?: boolean
  size?: 'sm' | 'md'
}

const statusConfig: Record<
  RegistrationStatus,
  {
    label: string
    variant: 'secondary' | 'outline' | 'destructive'
    icon: typeof Clock
  }
> = {
  registered: {
    label: 'Registered',
    variant: 'secondary',
    icon: CheckCircle,
  },
  pending_review: {
    label: 'Under Review',
    variant: 'outline',
    icon: Clock,
  },
  rejected: {
    label: 'Not Selected',
    variant: 'destructive',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline',
    icon: Ban,
  },
  attended: {
    label: 'Attended',
    variant: 'secondary',
    icon: CalendarCheck,
  },
}

export function RegistrationStatusBadge({
  status,
  showIcon = true,
  size = 'md',
}: RegistrationStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm')}
    >
      {showIcon ? <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} /> : null}
      {config.label}
    </Badge>
  )
}
