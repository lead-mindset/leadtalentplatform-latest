import { RegistrationStatus } from '@/lib/types'
import { Clock, CheckCircle, XCircle, Ban, CalendarCheck } from 'lucide-react'

interface RegistrationStatusBadgeProps {
  status: RegistrationStatus
  showIcon?: boolean
  size?: 'sm' | 'md'
}

const statusConfig: Record<RegistrationStatus, {
  label: string
  color: string
  icon: typeof Clock
}> = {
  registered: {
    label: 'Registered',
    color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    icon: CheckCircle,
  },
  pending_review: {
    label: 'Under Review',
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    icon: Clock,
  },
  rejected: {
    label: 'Not Selected',
    color: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
    icon: Ban,
  },
  attended: {
    label: 'Attended',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    icon: CalendarCheck,
  },
}

export function RegistrationStatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md' 
}: RegistrationStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-sm'

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-medium
      ${sizeClasses}
      ${config.color}
    `}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {config.label}
    </span>
  )
}
