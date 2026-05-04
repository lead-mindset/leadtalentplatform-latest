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
          Cancel registration
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel registration?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel your registration for {eventTitle}. Your QR code will stop being valid
            and your spot may open for another participant.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Keep my spot</AlertDialogCancel>
          <form action={cancelRegistration} className="inline">
            <input type="hidden" name="registrationId" value={registrationId} />
            {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
            <Button type="submit" variant="destructive">
              Cancel registration
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
