'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Icons } from '@/components/ui/icons'
import { registerForEvent, type RegisterForEventState } from '@/lib/actions/events/register'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Link } from '@/i18n/routing'
import { CancelRegistrationDialog } from '@/components/events/cancel-registration-dialog'
import { cn } from '@/lib/utils'

function SubmitButton({ disabled, label }: { disabled?: boolean; label: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? (
        <span className="flex items-center">
          <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Registering...
        </span>
      ) : (
        label
      )}
    </Button>
  )
}

type Props = {
  eventId: string
  eventTitle: string
  isLoggedIn: boolean
  hasBasicProfile: boolean
  loginUrl: string
  onboardingUrl: string
  registrationClosed: boolean
  isRegistered: boolean
  hadCancelledRegistration?: boolean
  canCancel: boolean
  registrationId: string | null
  capacity: number | null
  registeredCount: number
}

export function EventRegistrationCheckout({
  eventId,
  eventTitle,
  isLoggedIn,
  hasBasicProfile,
  loginUrl,
  onboardingUrl,
  registrationClosed,
  isRegistered,
  hadCancelledRegistration = false,
  canCancel,
  registrationId,
  capacity,
  registeredCount,
}: Props) {
  const [state, formAction] = useActionState(registerForEvent, null as RegisterForEventState | null)

  const spotsLeft = capacity !== null ? Math.max(0, capacity - registeredCount) : null
  const isFull = capacity !== null && registeredCount >= capacity
  const showLowSpots = spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && !isRegistered

  const registerDisabled = registrationClosed || isFull || isRegistered || !isLoggedIn || !hasBasicProfile
  const qrHref = `/student/events?event=${eventId}`

  const statusMessages =
    isLoggedIn && !isRegistered ? (
      <>
        {registrationClosed ? (
          <p className="text-sm text-muted-foreground">
            Registration is closed because this event has already started.
          </p>
        ) : isFull ? (
          <p className="text-sm text-muted-foreground">
            This event is full. Someone may cancel, so check back later.
          </p>
        ) : showLowSpots ? (
          <p className="text-sm text-muted-foreground">
            {spotsLeft === 1 ? '1 spot left' : `${spotsLeft} spots left`}
          </p>
        ) : hadCancelledRegistration ? (
          <p className="text-sm text-muted-foreground">
            You cancelled earlier. Register again to get a QR code for check-in.
          </p>
        ) : null}
      </>
    ) : null

  return (
    <div
      className={cn(
        isLoggedIn && !isRegistered && !registrationClosed && !isFull
          ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0'
          : ''
      )}
    >
      {!isLoggedIn ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign in to register and receive your QR code for check-in.
          </p>
          <Button asChild className="w-full">
            <Link href={loginUrl}>Sign in</Link>
          </Button>
        </div>
      ) : !hasBasicProfile ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Complete onboarding once, then use your profile to register for LEAD events.
          </p>
          <Button asChild className="w-full">
            <Link href={onboardingUrl}>Complete onboarding</Link>
          </Button>
          {state?.requiresOnboarding && state.onboardingPath ? (
            <p className="text-xs text-muted-foreground">
              Your profile is still incomplete. Continue to onboarding to finish registration.
            </p>
          ) : null}
        </div>
      ) : isRegistered ? (
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit gap-1.5 pl-2">
            <Icons.CheckCircle2 className="h-4 w-4" />
            Registered
          </Badge>
          {canCancel && registrationId ? (
            <CancelRegistrationDialog registrationId={registrationId} eventTitle={eventTitle} />
          ) : (
            <p className="text-sm text-muted-foreground">Cancellation is not available.</p>
          )}
          <Button asChild className="w-full">
            <Link href={qrHref}>View my QR code</Link>
          </Button>
        </div>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="eventId" value={eventId} />
          {statusMessages}

          <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
            <Checkbox
              name="subscribeToHostChapters"
              value="true"
              defaultChecked
              className="mt-0.5"
            />
            <span className="text-muted-foreground">
              Send me updates from the host and collaborator chapters for this event.
            </span>
          </label>

          <div className="hidden space-y-2 md:block">
            <SubmitButton disabled={registerDisabled} label="Register" />
            {state?.error ? (
              <p
                className={cn(
                  'text-sm',
                  state.capacityExceeded ? 'text-muted-foreground' : 'text-destructive'
                )}
                role="alert"
              >
                {state.error}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              'fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden',
              'supports-backdrop-filter:bg-background/80',
              'shadow-[0_-4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.35)]'
            )}
          >
            {registrationClosed ? (
              <p className="mb-2 text-center text-xs text-muted-foreground">Registration closed</p>
            ) : isFull ? (
              <p className="mb-2 text-center text-xs text-muted-foreground">Event is full</p>
            ) : showLowSpots ? (
              <p className="mb-2 text-center text-xs text-muted-foreground">
                {spotsLeft === 1 ? '1 spot left' : `${spotsLeft} spots left`}
              </p>
            ) : hadCancelledRegistration ? (
              <p className="mb-2 text-center text-xs text-muted-foreground">
                You cancelled earlier. Tap Register to sign up again.
              </p>
            ) : null}

            {state?.error ? (
              <p
                className={cn(
                  'mb-2 text-center text-xs',
                  state.capacityExceeded ? 'text-muted-foreground' : 'text-destructive'
                )}
                role="alert"
              >
                {state.error}
              </p>
            ) : null}

            <SubmitButton disabled={registerDisabled} label="Register" />
          </div>
        </form>
      )}
    </div>
  )
}
