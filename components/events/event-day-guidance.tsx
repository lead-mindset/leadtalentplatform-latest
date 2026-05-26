import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type EventDayGuidanceProps = {
  compact?: boolean
  className?: string
  showTitle?: boolean
}

const guidance = [
  'Este QR es solo para este evento.',
  'Ten el brillo alto cuando llegues al check-in.',
  'Si el QR falla, el equipo puede buscarte por nombre o correo.',
]

export function EventDayGuidance({ compact = false, className, showTitle = true }: EventDayGuidanceProps) {
  return (
    <div className={cn('rounded-lg border bg-muted/25 p-4', compact && 'p-3', className)}>
      {showTitle ? (
        <p className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
          Basicos para entrar rapido
        </p>
      ) : null}
      <ul className={cn(showTitle && 'mt-3', 'space-y-2 text-muted-foreground', compact ? 'text-xs leading-5' : 'text-sm leading-6')}>
        {guidance.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

