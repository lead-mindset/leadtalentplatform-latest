'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Clock, Users, CheckCircle, ArrowRight, Building, HelpCircle, ExternalLink, Flag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EventRegistrationCheckout } from '@/components/events/event-registration-checkout'
import { ApplyModal } from '@/components/events/apply-modal'
import { applyForEvent } from '@/lib/actions/events/register'
import type { EventWithDetails } from '@/lib/types'
import { MainContainer } from '@/components/global/main-container'

type MyRegistration = {
  id: string
  status: 'registered' | 'pending_review' | 'rejected' | 'cancelled' | 'attended'
  checkedInAt: string | null
} | null

function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function getMonthShort(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'M'
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return months[d.getMonth()]
}

function getDayNum(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '00'
  return d.getDate().toString()
}

function formatTimeOnly(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`
}

function getEventStatus(start_at: string, end_at: string): { status: string; message: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  const now = Date.now()
  const start = new Date(start_at).getTime()
  const end = new Date(end_at).getTime()
  
  if (now < start) {
    return { status: 'Registration Open', message: 'Registration is open for this upcoming event.', variant: 'default' }
  } else if (now >= start && now <= end) {
    return { status: 'Live Now', message: 'This event is currently in progress.', variant: 'secondary' }
  } else {
    return { status: 'Past Event', message: 'This event has concluded.', variant: 'outline' }
  }
}

export function EventContent({
  event,
  myRegistration,
  isLoggedIn,
}: {
  event: EventWithDetails | null
  myRegistration: MyRegistration
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!event) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16 pt-28">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Event not found.
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const eventStatus = getEventStatus(event.start_at, event.end_at)
  const registrationClosed = eventStatus.status !== 'Registration Open'

  const isApplicationRequired = event.access_model === 'application'
  const isPending = myRegistration?.status === 'pending_review'
  const isRejected = myRegistration?.status === 'rejected'
  const isRegistered = myRegistration?.status === 'registered'
  const isCancelled = myRegistration?.status === 'cancelled'

  const handlePrimaryAction = () => {
    if (isApplicationRequired) {
      setShowApplyModal(true)
    }
  }

  const handleApplyConfirm = async () => {
    setIsSubmitting(true)
    try {
      await applyForEvent(event.id)
      router.refresh()
      setShowApplyModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const registeredCount = event._count.registrations
  const ownerChapterLabel = event.Chapter ? event.Chapter.name : 'Global'
  const collaborators = event.EventChapter?.map((ec: any) => ec.Chapter).filter(Boolean) || []

  const heroImageSrc = event.cover_image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCPkIXdCnOC4xM_keP1HVTc8Nn_asHtEtsE3T3mkN8Dr3QDObO6BA_ppVqlJIOjEtv0dKqF4KMU1-fhBVeeVu3IXJeHu8VndjHef3GU9_jWWTgMaM292D6UJYbE5a_U0cvkFDiDGhTFm8THZlrg838_CIZKgIu5YgUAX7YVP9gXTVeR__XeheoSuPRYMbn2NDMzbAW30OW15MOIUgace6VZNCZ51xoLDKKL7SXJmeoAjaoD8u32pDMrs3HiE7HRqw5Cps0fVyH8KRJU"

  return (
    <MainContainer className="pt-12 pb-24 bg-background flex-1 overflow-x-hidden">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

        <div className="lg:col-span-4 space-y-8">

          <div className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-muted">
            {event.cover_image ? (
              <Image 
                src={heroImageSrc} 
                alt={event.title || 'Event Cover'} 
                fill 
                className="object-cover"
                priority
              />
            ) : (
              <img 
                src={heroImageSrc} 
                alt="Event Hero Fallback" 
                className="absolute inset-0 w-full h-full object-cover" 
              />
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-muted-foreground mb-4 pl-2">Hosted By</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <Building className="text-primary w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground leading-tight">{ownerChapterLabel}</p>
                </div>
              </div>

              {collaborators.map((chapter: any) => (
                <div key={chapter.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shrink-0">
                    <Building className="text-secondary w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground leading-tight">{chapter.name}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex flex-col gap-3 pl-2">
              <button className="text-sm text-muted-foreground hover:text-foreground text-left font-medium transition-colors flex items-center gap-2">
                Contact the Host
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground text-left font-medium transition-colors flex items-center gap-2">
                Report Event
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-10 lg:pt-4">

          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-foreground mb-4">
              {event.title || 'Untitled Event'}
            </h1>
          </div>

          <div className="flex flex-col gap-6">

            <div className="flex items-start gap-4">
              <div className="bg-card border border-border p-2 rounded-xl text-center min-w-[3.5rem] shadow-sm flex flex-col items-center justify-center shrink-0">
                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{getMonthShort(event.start_at)}</div>
                <div className="text-lg font-black text-foreground">{getDayNum(event.start_at)}</div>
              </div>
              <div className="flex flex-col justify-center py-1">
                <div className="font-bold text-lg text-foreground leading-tight">{formatDateTime(event.start_at)}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {formatTimeOnly(event.start_at)} - {formatTimeOnly(event.end_at)}
                </div>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-4">
                <div className="p-2 shrink-0 min-w-[3.5rem] flex justify-center">
                  <MapPin className="text-muted-foreground w-6 h-6" />
                </div>
                <div className="flex flex-col justify-center py-1">
                  <div className="font-bold text-lg text-foreground leading-tight">{event.location}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {event.location_address || 'Address details unavailable'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-border rounded-[1.5rem] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-foreground">Registration</h3>
            </div>
            
            <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-4 mb-6">
              {eventStatus.status === 'Registration Open' ? (
                <div className="bg-primary/20 p-2 rounded-lg"><Calendar className="text-primary w-5 h-5" /></div>
              ) : (
                <div className="bg-muted-foreground/20 p-2 rounded-lg"><Calendar className="text-muted-foreground w-5 h-5" /></div>
              )}
              <div>
                <p className="font-bold text-sm">{eventStatus.status}</p>
                <p className="text-xs text-muted-foreground">{eventStatus.message}</p>
              </div>
            </div>

            <div>
              {!isApplicationRequired ? (
                <>
                  {eventStatus.status === 'Registration Open' && (
                    <p className="text-sm font-medium mb-4 text-foreground">Welcome! To join the event, please register below.</p>
                  )}
                  <EventRegistrationCheckout
                    eventId={event.id}
                    eventTitle={event.title}
                    isLoggedIn={isLoggedIn}
                    loginUrl={`/auth/login?next=/events/${event.id}`}
                    registrationClosed={registrationClosed}
                    isRegistered={isRegistered}
                    hadCancelledRegistration={isCancelled}
                    canCancel={
                      myRegistration?.status === 'registered' &&
                      !myRegistration.checkedInAt &&
                      !registrationClosed
                    }
                    registrationId={myRegistration?.id ?? null}
                    capacity={event.capacity}
                    registeredCount={registeredCount}
                  />
                </>
              ) : (
                <div className="space-y-4">
                  {isPending ? (
                    <div className="rounded-xl border bg-muted p-4 text-center">
                      <p className="text-sm text-foreground">
                        Your application is under review. You'll receive an email when a decision is made.
                      </p>
                    </div>
                  ) : null}

                  {isRejected ? (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center">
                      <p className="text-sm font-medium text-destructive">Not selected for this event.</p>
                    </div>
                  ) : null}

                  {isRegistered ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-center">
                      <p className="text-sm font-medium text-foreground">
                        You're registered for this event. Check your email for QR code details.
                      </p>
                    </div>
                  ) : isPending ? (
                    null
                  ) : (
                    <Button
                      size="lg"
                      onClick={handlePrimaryAction}
                      disabled={isSubmitting || registrationClosed}
                      className="w-full py-6 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:scale-[1.02] transition-transform"
                    >
                      {isSubmitting ? 'Processing...' : 'Apply Now'}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <h3 className="text-base font-bold text-foreground mb-4">About Event</h3>
            <div className="text-muted-foreground leading-relaxed md:text-lg space-y-4">
              {event.description ? (
                <p className="whitespace-pre-wrap">{event.description}</p>
              ) : (
                <p>No description available for this event.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {isApplicationRequired ? (
        <ApplyModal
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
          eventTitle={event.title}
          applicationFormUrl={event.application_form_url || ''}
          onConfirm={handleApplyConfirm}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </MainContainer>
  )
}
