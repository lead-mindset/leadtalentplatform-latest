import QRCode from 'qrcode'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMyRegistrations } from '@/lib/actions/events/get-data'
import { CancelRegistrationDialog } from '@/components/events/cancel-registration-dialog'
import { ScrollToHighlightedEvent } from '@/components/events/scroll-to-highlighted-event'
import { RegistrationStatusBadge } from '@/components/events/registration-status-badge'
import type { RegistrationStatus } from '@/lib/types'
import { Link } from '@/i18n/routing'
import { Icons } from '@/components/ui/icons'
import { MainContainer } from '@/components/global/main-container'

type RegistrationWithEvent = Awaited<ReturnType<typeof getMyRegistrations>>[number]

type EventRegistrationCardProps = {
  registration: RegistrationWithEvent
  showQr: boolean
  qrDataUrl: string | null
}

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

function formatRelativeTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return d.toLocaleDateString()
}

function EventRegistrationCard({
  registration,
  showQr,
  qrDataUrl,
}: EventRegistrationCardProps) {
  const event = registration.event
  const isRejected = registration.status === 'rejected'
  const isPending = registration.status === 'pending_review'

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all md-card" variant="md">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base group-hover:text-primary transition-colors">{event?.title ?? 'Event'}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {event?.start_at ? formatDateTime(event.start_at) : ''}
            </p>
            {event?.location ? (
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Icons.MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            ) : null}
          </div>
          <RegistrationStatusBadge status={registration.status as RegistrationStatus} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showQr && registration.status === 'registered' && qrDataUrl ? (
          <div className="border-t pt-4">
            <div className="flex items-center justify-center rounded-xl border bg-background p-4">
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
        ) : null}

        {isPending ? (
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-sm">
              Your application is under review. You'll receive an email when a decision is made.
            </p>
          </div>
        ) : null}

        {isRejected ? (
          <div className="rounded-lg border bg-muted/60 p-3">
            <p className="text-sm text-muted-foreground">Not selected for this event.</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="w-full sm:flex-1">
            <Link href={`/events/${registration.event_id}`}>Event details</Link>
          </Button>
          {registration.status === 'registered' && !registration.checked_in_at ? (
            <CancelRegistrationDialog
              registrationId={registration.id}
              eventTitle={event?.title ?? 'this event'}
              triggerClassName="w-full sm:flex-1"
            />
          ) : null}
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

  const qrEntries = await Promise.all(
    registrations.map(async (registration) => {
      if (registration.status !== 'registered' || !registration.qr_token) {
        return [registration.id, null] as const
      }

      const qrDataUrl = await QRCode.toDataURL(registration.qr_token, {
        margin: 1,
        width: 240
      })

      return [registration.id, qrDataUrl] as const
    })
  )

  const qrByRegistrationId = new Map(qrEntries)

  const upcomingRegistrations = registrations.filter(
    (registration) =>
      (registration.status === 'registered' || registration.status === 'attended') &&
      registration.event?.start_at &&
      new Date(registration.event.start_at) > new Date()
  )

  const pendingRegistrations = registrations.filter(
    (registration) => registration.status === 'pending_review'
  )

  const pastRegistrations = registrations.filter(
    (registration) =>
      (registration.status === 'attended' || registration.status === 'rejected') &&
      registration.event?.start_at &&
      new Date(registration.event.start_at) < new Date()
  )

  const cancelledRegistrations = registrations.filter(
    (registration) => registration.status === 'cancelled'
  )
  
  const recentActivity = [...registrations]
    .sort((a, b) => {
      const dateA = (a as any).created_at ? new Date((a as any).created_at) : new Date(a.event?.start_at || 0)
      const dateB = (b as any).created_at ? new Date((b as any).created_at) : new Date(b.event?.start_at || 0)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 5)

  const nextEventRegistration = upcomingRegistrations.length > 0 ? upcomingRegistrations[0] : null;
  const remainingUpcomingRegistrations = upcomingRegistrations.slice(1);

  return (
    <MainContainer className="py-8 space-y-12 pb-32">
      <ScrollToHighlightedEvent eventId={highlightEventId} />

      {/* Hero Section */}
      <header className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground font-headline mb-4">My Events</h1>
        <p className="text-muted-foreground text-lg font-light max-w-3xl lg:mx-0 mx-auto">
          Ready to participate? Manage your registrations and access QR codes for event check-in.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Content */}
        <div className="col-span-1 xl:col-span-8 space-y-8">
          
          {/* Bento Card: Discover New Events */}
          <Link href="/events" className="block">
            <section className="bg-card/50 rounded-xl p-8 border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icons.Compass className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-headline font-bold mb-2">Discover New Events</h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Browse our catalog of upcoming workshops, recruitment fairs, and mixers to boost your career.
              </p>
              <div className="flex gap-4">
                <span className="px-4 py-2 bg-background rounded-full text-xs font-medium text-muted-foreground border uppercase tracking-wider">Workshops</span>
                <span className="px-4 py-2 bg-background rounded-full text-xs font-medium text-muted-foreground border uppercase tracking-wider">Networking</span>
              </div>
            </section>
          </Link>

          {/* Primary Action Event Card */}
          {nextEventRegistration && (
            <div className="group relative rounded-2xl overflow-hidden shadow-2xl border bg-card transition-all hover:shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-background opacity-80 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
              
              <div className="relative p-8 sm:p-10 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
                <div className="space-y-5 flex-1">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold tracking-[0.2em] uppercase rounded-full border border-primary/20 backdrop-blur-md">
                    Next Up
                  </span>
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold font-headline mb-3 text-foreground group-hover:text-primary transition-colors">
                      {nextEventRegistration.event?.title}
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-muted-foreground text-sm font-medium">
                      {nextEventRegistration.event?.start_at && (
                        <span className="flex items-center gap-2">
                          <Icons.Calendar className="w-4 h-4 text-primary" />
                          {formatDateTime(nextEventRegistration.event.start_at)}
                        </span>
                      )}
                      {nextEventRegistration.event?.location && (
                        <span className="flex items-center gap-2">
                          <Icons.MapPin className="w-4 h-4 text-primary" />
                          {nextEventRegistration.event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <Button asChild className="rounded-full px-8 shadow-lg font-bold tracking-wide">
                      <Link href={`/events/${nextEventRegistration.event_id}`}>View Details</Link>
                    </Button>
                    {!nextEventRegistration.checked_in_at && (
                      <CancelRegistrationDialog
                        registrationId={nextEventRegistration.id}
                        eventTitle={nextEventRegistration.event?.title ?? 'this event'}
                        triggerClassName="rounded-full"
                      />
                    )}
                  </div>
                </div>
                
                {qrByRegistrationId.get(nextEventRegistration.id) && (
                  <div className="shrink-0 bg-white p-4 rounded-2xl shadow-xl md:rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 mx-auto md:mx-0">
                    <Image
                      src={qrByRegistrationId.get(nextEventRegistration.id)!}
                      alt="Event check-in QR code"
                      width={180}
                      height={180}
                      className="w-40 h-40 md:w-48 md:h-48"
                      unoptimized
                    />
                    <p className="text-center text-[10px] font-bold text-[#02041a] uppercase tracking-widest mt-3">Ready to Scan</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Streamlined Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="group transition-all hover:bg-muted/50 border-muted/60 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-4">Total Registered</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-headline font-bold text-foreground">{registrations.length}</span>
                  </div>
                </div>
                <Icons.Ticket className="w-10 h-10 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
              </CardContent>
            </Card>
            
            <Card className="group transition-all hover:bg-muted/50 border-muted/60 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-4">Upcoming</p>
                  <div className="flex flex-col gap-1">
                    <span className="text-4xl font-headline font-bold text-success">{upcomingRegistrations.length}</span>
                  </div>
                </div>
                <Icons.Calendar className="w-10 h-10 text-muted-foreground/20 group-hover:text-success/40 transition-colors" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="bg-muted/50 w-full sm:w-auto overflow-x-auto flex justify-start rounded-full p-1">
              <TabsTrigger value="upcoming" className="rounded-full px-6">Upcoming ({remainingUpcomingRegistrations.length})</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-full px-6">Pending ({pendingRegistrations.length})</TabsTrigger>
              <TabsTrigger value="past" className="rounded-full px-6">Past ({pastRegistrations.length})</TabsTrigger>
              {cancelledRegistrations.length > 0 && (
                <TabsTrigger value="cancelled" className="rounded-full px-6">Cancelled ({cancelledRegistrations.length})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {remainingUpcomingRegistrations.length === 0 ? (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Icons.Calendar className="mx-auto mb-4 h-12 w-12 opacity-50 text-primary" />
                    <p className="text-lg font-medium text-foreground">No other upcoming events</p>
                    <p className="mt-2 text-sm">You haven't registered for any other upcoming events yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {remainingUpcomingRegistrations.map((registration) => (
                    <div key={registration.id} id={`event-reg-${registration.event_id}`} className="scroll-mt-24">
                      <EventRegistrationCard
                        registration={registration}
                        showQr
                        qrDataUrl={qrByRegistrationId.get(registration.id) ?? null}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingRegistrations.length === 0 ? (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Icons.Clock className="mx-auto mb-4 h-12 w-12 opacity-50 text-warning" />
                    <p className="text-lg font-medium text-foreground">No pending applications</p>
                    <p className="mt-2 text-sm">Your applications will appear here while editors review them.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingRegistrations.map((registration) => (
                    <EventRegistrationCard
                      key={registration.id}
                      registration={registration}
                      showQr={false}
                      qrDataUrl={null}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastRegistrations.length === 0 ? (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Icons.Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="text-lg font-medium text-foreground">No past events</p>
                    <p className="mt-2 text-sm">Events you've attended will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pastRegistrations.map((registration) => (
                    <EventRegistrationCard
                      key={registration.id}
                      registration={registration}
                      showQr={registration.status === 'attended'}
                      qrDataUrl={qrByRegistrationId.get(registration.id) ?? null}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {cancelledRegistrations.length > 0 && (
              <TabsContent value="cancelled" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {cancelledRegistrations.map((registration) => (
                    <EventRegistrationCard
                      key={registration.id}
                      registration={registration}
                      showQr={false}
                      qrDataUrl={null}
                    />
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Content */}
        <div className="col-span-1 xl:col-span-4 space-y-8">
          
          {/* Pro-Tips Section */}
          <section className="bg-card rounded-xl p-6 border-l-4 border-primary shadow-lg shadow-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <Icons.Lightbulb className="text-primary w-6 h-6" />
              <h3 className="font-headline font-bold text-lg">Pro-Tips</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <Icons.CheckCircle2 className="text-primary w-5 h-5 shrink-0" />
                <span className="text-sm text-foreground">Have your QR code ready for a seamless check-in.</span>
              </li>
              <li className="flex gap-3">
                <Icons.CheckCircle2 className="text-primary w-5 h-5 shrink-0" />
                <span className="text-sm text-foreground">Arrive 15 minutes early to secure good seating.</span>
              </li>
              <li className="flex gap-3">
                <Icons.CheckCircle2 className="text-primary w-5 h-5 shrink-0" />
                <span className="text-sm text-foreground">Network with peers and speakers after the session.</span>
              </li>
              <li className="flex gap-3">
                <Icons.CheckCircle2 className="text-primary w-5 h-5 shrink-0" />
                <span className="text-sm text-foreground">Keep your profile updated for tailored event suggestions.</span>
              </li>
            </ul>
          </section>

          {/* Quick Resources Section */}
          <section className="bg-card rounded-xl p-6 border">
            <div className="flex items-center gap-3 mb-6">
              <Icons.BookOpen className="text-primary w-6 h-6" />
              <h3 className="font-headline font-bold text-lg">Quick Resources</h3>
            </div>
            <div className="space-y-3">
              <Link className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors rounded-xl group" href="/events">
                <div className="flex items-center gap-3">
                  <Icons.Calendar className="text-muted-foreground group-hover:text-primary w-5 h-5" />
                  <span className="text-sm font-semibold">Event Calendar</span>
                </div>
                <Icons.ExternalLink className="text-muted-foreground text-sm w-4 h-4" />
              </Link>
              <Link className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors rounded-xl group" href="#">
                <div className="flex items-center gap-3">
                  <Icons.Map className="text-muted-foreground group-hover:text-primary w-5 h-5" />
                  <span className="text-sm font-semibold">Campus Map</span>
                </div>
                <Icons.ExternalLink className="text-muted-foreground text-sm w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Motivational Card */}
          <section className="bg-gradient-to-br from-primary to-primary/60 rounded-xl p-6 text-white shadow-xl shadow-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                <Icons.TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-headline font-bold mb-2">Build Your Network</h4>
                <p className="text-sm text-white/90 leading-relaxed">
                  Attending events increases your professional connections by <span className="font-bold text-white">40%</span>. Join the next event and expand your horizon.
                </p>
              </div>
            </div>
          </section>

          {/* Recent Activity Timeline */}
          <Card className="bg-card/50 backdrop-blur-sm border-muted/60 p-6 sm:p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-headline font-bold text-foreground">Recent Activity</h3>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold text-muted-foreground hover:text-primary tracking-widest uppercase h-auto py-1">
                Overview
              </Button>
            </div>
            
            {recentActivity.length > 0 ? (
              <div className="relative space-y-8 pl-6 border-l border-border/50">
                {recentActivity.map((activity, idx) => (
                  <div key={activity.id} className="relative group">
                    <span className={`absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-background z-10 ${
                      idx === 0 ? 'bg-primary ring-primary/20' : 'bg-muted-foreground/30'
                    }`}></span>
                    <div>
                      <p className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">
                        {activity.status === 'registered' ? 'Registered for ' : 
                         activity.status === 'pending_review' ? 'Applied to ' :
                         activity.status === 'cancelled' ? 'Cancelled ' :
                         activity.status === 'rejected' ? 'Not selected for ' :
                         activity.status === 'attended' ? 'Attended ' : 'Updated '} 
                        <span className="font-semibold">{activity.event?.title}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1.5 font-light uppercase tracking-wider">
                        {(activity as any).created_at ? formatRelativeTime((activity as any).created_at) : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
            )}
            
            <Button variant="outline" className="w-full rounded-full text-[11px] font-bold tracking-widest text-muted-foreground hover:text-foreground transition-all uppercase">
              View All Actions
            </Button>
          </Card>
          
        </div>
      </div>
    </MainContainer>
  )
}
