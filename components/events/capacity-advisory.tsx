import { Icons } from '@/components/ui/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface CapacityAdvisoryProps {
  status: 'at_capacity' | 'over_capacity'
  className?: string
}

export function CapacityAdvisory({ status, className }: CapacityAdvisoryProps) {
  const isOverCapacity = status === 'over_capacity'
  
  return (
    <Alert className={cn(
      "border-amber-500/50 bg-amber-500/10",
      className
    )}>
      <Icons.AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-700 dark:text-amber-400">
        {isOverCapacity ? 'Over Capacity' : 'At Capacity'}
      </AlertTitle>
      <AlertDescription className="text-amber-600/90 dark:text-amber-400/90">
        This event is {isOverCapacity ? 'over' : 'at'} capacity. Approvals are still allowed — 
        not all registered attendees may show up.
      </AlertDescription>
    </Alert>
  )
}
