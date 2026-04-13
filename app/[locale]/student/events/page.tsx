'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMyRegistrations } from '@/lib/actions/events/get-data'
import { CancelRegistrationDialog } from '@/components/events/cancel-registration-dialog'
import { ScrollToHighlightedEvent } from '@/components/events/scroll-to-highlighted-event'
import { RegistrationStatusBadge } from '@/components/events/registration-status-badge'
import QRCode from 'qrcode'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Calendar, Clock, MapPin, QrCode } from 'lucide-react'

function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function EventRegistrationCard({
  registration,
  showQR,
}: {
  registration: any
  showQR: boolean
}) {
  const { event, status, qrToken } = registration
  const isRejected = status === 'rejected'
  const isPending = status === 'pending_review'
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  React.useEffect(() => {
    if (showQR && qrToken) {
      QRCode.toDataURL(qrToken, { margin: 1, width: 240 }).then(setQrDataUrl)
    }
  }, [showQR, qrToken])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{event?.title ?? 'Event'}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {event?.startAt ? formatDateTime(event.startAt) : ''}
            </p>
            {event?.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          <RegistrationStatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showQR && status === 'registered' && qrDataUrl && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-center rounded-xl border bg-white p-4 dark:bg-white">
              <Image
                src={qrDataUrl}
                alt="Event check-in QR code"
                width={240}
                height={240}
                className="h-auto w-auto max-w-full"
                unoptimized
              />
            </div>
          </div>
        )}

        {isPending && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Your application is under review. You'll receive an email when a decision is made.
            </p>
          </div>
        )}

        {isRejected && (
          <div className="bg-neutral-500/10 border border-neutral-500/20 rounded-lg p-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Not selected for this event.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="w-full sm:flex-1">
            <Link href={`/events/${registration.eventId}`}>Event details</Link>
          </Button>
          {status === 'registered' && !registration.checkedInAt && (
            <CancelRegistrationDialog
              registrationId={registration.id}
              eventTitle={event?.title ?? 'this event'}
              triggerClassName="w-full sm:flex-1"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function StudentEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const { event: highlightEventId } = await searchParams
  const registrations = await getMyRegistrations()

  const upcomingRegistrations = registrations.filter(
    r =>
      (r.status === 'registered' || r.status === 'attended') &&
      new Date(r.Event.startAt) > new Date()
  )

  const pendingRegistrations = registrations.filter(
    r => r.status === 'pending_review'
  )

  const pastRegistrations = registrations.filter(
    r =>
      (r.status === 'attended' || r.status === 'rejected') &&
      new Date(r.Event.startAt) < new Date()
  )

  const cancelledRegistrations = registrations.filter(
    r => r.status === 'cancelled'
  )

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <ScrollToHighlightedEvent eventId={highlightEventId} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
          <p className="text-muted-foreground mt-1">
            Your registrations and QR codes for check-in.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/events">Browse events</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingRegistrations.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingRegistrations.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastRegistrations.length})
          </TabsTrigger>
          {cancelledRegistrations.length > 0 && (
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledRegistrations.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingRegistrations.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming events</p>
                <p className="text-sm mt-2">
                  You haven't registered for any upcoming events yet.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/events">Browse Events</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingRegistrations.map(registration => (
                <div
                  key={registration.id}
                  id={`event-reg-${registration.eventId}`}
                  className="scroll-mt-24"
                >
                  <EventRegistrationCard registration={registration} showQR />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingRegistrations.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No applications under review</p>
                <p className="text-sm mt-2">
                  Your applications will appear here while editors review them.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingRegistrations.map(registration => (
                <EventRegistrationCard
                  key={registration.id}
                  registration={registration}
                  showQR={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastRegistrations.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No past events</p>
                <p className="text-sm mt-2">
                  Events you've attended will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastRegistrations.map(registration => (
                <EventRegistrationCard
                  key={registration.id}
                  registration={registration}
                  showQR={registration.status === 'attended'}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {cancelledRegistrations.length > 0 && (
          <TabsContent value="cancelled" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {cancelledRegistrations.map(registration => (
                <EventRegistrationCard
                  key={registration.id}
                  registration={registration}
                  showQR={false}
                />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}