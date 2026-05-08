'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { cancelRegistration } from '@/lib/actions/events/cancel-registration'

type Props = {
  registrationId: string
  eventId?: string
  eventTitle: string
  triggerClassName?: string
}

export function CancelRegistrationDialog({
  registrationId,
  eventId,
  eventTitle,
  triggerClassName,
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" className={triggerClassName ?? 'w-full'}>
          Cancelar registro
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar registro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto cancelara tu registro para {eventTitle}. Tu codigo QR dejara de ser valido
            y tu cupo podria abrirse para otro participante.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Mantener mi cupo</AlertDialogCancel>
          <form action={cancelRegistration} className="inline">
            <input type="hidden" name="registrationId" value={registrationId} />
            {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
            <Button type="submit" variant="destructive">
              Cancelar registro
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
