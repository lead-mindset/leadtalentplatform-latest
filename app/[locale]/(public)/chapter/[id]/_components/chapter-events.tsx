'use client'

import Link from 'next/link'

interface EventData {
  id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  location: string | null
  location_name: string | null
  location_city: string | null
  cover_image: string | null
  event_type: string
  capacity: number | null
  event_registration: { count: number }[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
}

function EventCard({ event, featured = false }: { event: EventData; featured?: boolean }) {
  const regCount = event.event_registration?.[0]?.count ?? 0
  const coverUrl = event.cover_image
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${event.cover_image}`
    : null

  if (featured) {
    return (
      <Link
        href={`/events/${event.id}`}
        className="block bg-card rounded-[2rem] overflow-hidden group border border-border/20 hover:border-primary/40 transition-all duration-500 shadow-xl"
      >
        <div className="flex flex-col md:flex-row h-full md:h-72">
          {/* Image */}
          <div className="md:w-2/5 relative overflow-hidden h-48 md:h-full bg-gradient-to-br from-primary/20 to-accent/20">
            {coverUrl ? (
              <img
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                src={coverUrl}
                alt={event.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-muted-foreground/30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
              Featured
            </div>
          </div>
          {/* Content */}
          <div className="md:w-3/5 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 text-accent font-bold text-xs mb-3">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  {formatDate(event.start_at)}
                </span>
                {(event.location_name || event.location_city) && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {event.location_name || event.location_city}
                  </span>
                )}
              </div>
              <h3 className="!text-xl sm:!text-2xl font-extrabold mb-3 leading-tight">{event.title}</h3>
              {event.description && (
                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{event.description}</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{regCount} registered</span>
              </div>
              <span className="bg-primary/10 text-primary px-6 py-2 rounded-full font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                RSVP
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Compact card
  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-card rounded-2xl p-5 border border-border/20 hover:border-primary/30 transition-all duration-300 group"
    >
      <div className="flex items-center gap-4 text-accent font-bold text-[10px] mb-2 uppercase tracking-widest">
        <span>{formatDate(event.start_at)}</span>
        {event.location_name && <span>· {event.location_name}</span>}
      </div>
      <h4 className="!text-base font-bold mb-1 group-hover:text-primary transition-colors">{event.title}</h4>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground">{regCount} registered</span>
        <span className="text-xs text-primary font-bold">View →</span>
      </div>
    </Link>
  )
}

export function ChapterEvents({ events }: { events: EventData[] }) {
  const upcomingCount = events.length

  if (upcomingCount === 0) {
    return (
      <div className="space-y-6">
        <h2 className="!text-2xl sm:!text-3xl font-extrabold tracking-tight">Upcoming Events</h2>
        <div className="bg-card rounded-[2rem] p-10 border border-border/20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="font-semibold text-foreground">No upcoming events</p>
          <p className="text-sm text-muted-foreground mt-1">Check back soon for new events from this chapter.</p>
        </div>
      </div>
    )
  }

  const [featured, ...rest] = events

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="!text-2xl sm:!text-3xl font-extrabold tracking-tight">Upcoming Events</h2>
        <span className="gradient-luminescent px-4 py-1.5 rounded-full text-xs text-white font-bold">
          {upcomingCount} upcoming
        </span>
      </div>

      {/* Featured event */}
      <EventCard event={featured} featured />

      {/* Rest of events */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
