'use client'

import { ChapterHero } from './chapter-hero'
import { ChapterEvents } from './chapter-events'
import { ChapterTeam } from './chapter-team'
import { ChapterSidebar } from './chapter-sidebar'
import { ChapterFooter } from './chapter-footer'

interface ChapterData {
  id: string
  name: string
  university: string
  city: string | null
  region: string | null
  instagram_url: string | null
  latitude: number | null
  longitude: number | null
}

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

interface MemberData {
  user_id: string
  major: string
  member_id: string | null
  user: { name: string | null; email: string } | { name: string | null; email: string }[]
}

interface ChapterPortalContentProps {
  chapter: ChapterData
  events: EventData[]
  members: MemberData[]
  member_count: number
  pastEventsCount: number
}

export function ChapterPortalContent({
  chapter,
  events,
  members,
  member_count,
  pastEventsCount,
}: ChapterPortalContentProps) {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <ChapterHero chapter={chapter} member_count={member_count} />

      {/* Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-12">
          <ChapterEvents events={events} />
          <ChapterTeam members={members} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          <ChapterSidebar
            chapter={chapter}
            member_count={member_count}
            pastEventsCount={pastEventsCount}
            upcomingEventsCount={events.length}
          />
        </div>
      </section>

      {/* Footer */}
      <ChapterFooter chapter={chapter} />
    </main>
  )
}
