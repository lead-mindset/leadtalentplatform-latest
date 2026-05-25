'use client'

import { CalendarPlus, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getGoogleCalendarUrl,
  getIcsContent,
  getIcsFileName,
  type CalendarEventInput,
} from '@/lib/events/calendar'

type EventCalendarActionsProps = {
  event: CalendarEventInput
  layout?: 'inline' | 'stack'
  className?: string
  buttonClassName?: string
  googleLabel?: string
  showDownload?: boolean
}

function getEventWithAbsoluteUrl(event: CalendarEventInput): CalendarEventInput {
  if (event.detailUrl.startsWith('http')) return event
  if (typeof window === 'undefined') return event
  return {
    ...event,
    detailUrl: `${window.location.origin}${event.detailUrl.startsWith('/') ? '' : '/'}${event.detailUrl}`,
  }
}

export function EventCalendarActions({
  event,
  layout = 'inline',
  className,
  buttonClassName,
  googleLabel = 'Google Calendar',
  showDownload = true,
}: EventCalendarActionsProps) {
  const resolvedEvent = getEventWithAbsoluteUrl(event)

  function openGoogleCalendar() {
    window.open(getGoogleCalendarUrl(resolvedEvent), '_blank', 'noopener,noreferrer')
  }

  function downloadIcs() {
    try {
      const blob = new Blob([getIcsContent(resolvedEvent)], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = getIcsFileName(resolvedEvent.title)
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      toast.success('Archivo de calendario descargado')
    } catch {
      toast.error('No se pudo crear el archivo de calendario')
    }
  }

  return (
    <div
      className={cn(
        'gap-2',
        layout === 'stack' ? 'grid' : 'flex flex-col sm:flex-row',
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        className={cn(layout === 'stack' && 'w-full', buttonClassName)}
        onClick={openGoogleCalendar}
      >
        <CalendarPlus className="h-4 w-4" />
        {googleLabel}
      </Button>
      {showDownload ? (
        <Button
          type="button"
          variant="outline"
          className={cn(layout === 'stack' && 'w-full', buttonClassName)}
          onClick={downloadIcs}
        >
          <Download className="h-4 w-4" />
          Descargar .ics
        </Button>
      ) : null}
    </div>
  )
}
