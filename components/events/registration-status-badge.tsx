'use client'

import { Icons } from '@/components/ui/icons'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { RegistrationStatus } from '@/lib/types'

interface RegistrationStatusBadgeProps {
  status: RegistrationStatus
  checkedIn?: boolean
  showIcon?: boolean
  size?: 'sm' | 'md'
}

const statusConfig = {
  pending_review: {
    icon: Icons.Clock,
    label: 'En revisión',
    variant: 'warning',
  },
  registered: {
    icon: Icons.CheckCircle2,
    label: 'Registrado',
    variant: 'secondary',
  },
  attended: {
    icon: Icons.CheckCircle2,
    label: 'Asistio',
    variant: 'success',
  },
  rejected: {
    icon: Icons.XCircle,
    label: 'Rechazado',
    variant: 'destructive',
  },
  cancelled: {
    icon: Icons.X,
    label: 'Cancelado',
    variant: 'destructive',
  },
} satisfies Record<
  RegistrationStatus,
  {
    label: string
    variant: 'secondary' | 'outline' | 'destructive' | 'success' | 'warning'
    icon: typeof Icons.Clock
  }
>

export function RegistrationStatusBadge({
  status,
  checkedIn = false,
  showIcon = true,
  size = 'md',
}: RegistrationStatusBadgeProps) {
  const config = checkedIn
    ? {
        icon: Icons.CheckCircle2,
        label: 'Check-in realizado',
        variant: 'success' as const,
      }
    : statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {showIcon && (
        <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      )}
      {config.label}
    </Badge>
  )
}
