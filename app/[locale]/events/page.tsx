import { Suspense } from 'react'
import Image from 'next/image'
import { Calendar, MapPin, Users, Clock, Search, Plus, Mail } from 'lucide-react'
import { getPublishedEvents } from '@/lib/actions/events/get-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Link } from '@/i18n/routing'
import { Navbar } from '../(public)/_components/navbar'

export const metadata = {
  title: 'Events',
  description: 'Browse upcoming LEAD events and register online.',
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
  })
}

function formatTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function groupEventsByDate(events: any[]) {
  const grouped: { [date: string]: any[] } = {}
  
  events.forEach(event => {
    const date = new Date(event.startAt).toDateString()
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(event)
  })
  
  return grouped
}

function EventTypeBadge({ eventType }: { eventType: string }) {
  const label =
    eventType === 'online' ? 'Online' : eventType === 'hybrid' ? 'Hybrid' : 'In-person'
  return <Badge variant="outline">{label}</Badge>
}

async function EventsContent() {
  const events = await getPublishedEvents()
  const groupedEvents = groupEventsByDate(events)

  return (
    <main className="min-h-screen">
      <div className="bg-background border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Events</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Discover and join events in your community
              </p>
            </div>
            {/* <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search events..." 
                  className="pl-10"
                />
              </div>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div> */}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 sm:pb-16 pt-4 sm:pt-6">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-8 lg:space-y-12">
            {Object.keys(groupedEvents).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No events are published yet.
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                  <div key={date} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                      <h2 className="text-lg font-medium text-muted-foreground">
                        {formatDate(date)}
                      </h2>
                    </div>
                    
                    <div className="space-y-4 sm:space-y-6">
                      {dateEvents.map((event, index) => (
                        <div key={event.id} className="flex gap-4 sm:gap-6">
                          <div className="flex flex-col items-center hidden sm:flex">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></div>
                            {index < dateEvents.length - 1 && (
                              <div className="w-px h-16 bg-border"></div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border-border border bg-card hover:bg-accent/50 transition-colors">
                              <div className="flex-shrink-0">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatTime(event.startAt)}</span>
                                </div>
                              </div>
                              
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h3 className="font-medium text-base leading-tight">
                                    {event.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-sm text-muted-foreground">
                                    {event.CreatedBy?.name && (
                                      <span>{event.CreatedBy.name}</span>
                                    )}
                                    {event.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate max-w-32 sm:max-w-none">{event.location}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      <span>{event._count.registrations} attending</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <EventTypeBadge eventType={event.eventType} />
                                  <Button asChild variant="ghost" size="sm">
                                    <Link href={`/events/${event.id}`} className="text-xs font-medium">
                                      View details →
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6 lg:space-y-8">
            {/* <div className="space-y-4">
              <h3 className="font-medium text-lg">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                Get notified about new events in San Diego
              </p>
              <div className="space-y-3">
                <Input placeholder="Enter your email" />
                <Button size="lg" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div> */}

            <div className="space-y-4">
              <h3 className="font-medium text-lg">Event Locations</h3>
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function EventsPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="p-8">Loading...</div>}>
        <EventsContent />
      </Suspense>
    </>
  )
}
