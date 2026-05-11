'use client'

import { ChapterHero } from './chapter-hero'
import { ChapterEvents } from './chapter-events'
import { ChapterTeam } from './chapter-team'
import { ChapterSidebar } from './chapter-sidebar'
import { ChapterFooter } from './chapter-footer'
import type { PublicChapterProfile } from '@/lib/services/chapter-profile.service'

interface ChapterPortalContentProps {
  profile: PublicChapterProfile
}

export function ChapterPortalContent({ profile }: ChapterPortalContentProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <ChapterHero profile={profile} />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-12">
        <div className="space-y-12 lg:col-span-8">
          <ChapterEvents events={profile.events} />
          <ChapterTeam members={profile.teamPreview} />
        </div>

        <div className="space-y-6 lg:col-span-4">
          <ChapterSidebar profile={profile} />
        </div>
      </section>

      <ChapterFooter chapter={profile.chapter} />
    </main>
  )
}
