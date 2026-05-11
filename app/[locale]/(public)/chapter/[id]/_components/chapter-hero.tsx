'use client'

import { ArrowRight, CalendarDays, MapPin, Share2, Sparkles } from 'lucide-react'
import { MainContainer } from '@/components/global/main-container'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import type { PublicChapterProfile } from '@/lib/services/chapter-profile.service'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ChapterHero({ profile }: { profile: PublicChapterProfile }) {
  const { chapter } = profile
  const location = [chapter.city, chapter.region].filter(Boolean).join(', ')
  const initials = getInitials(chapter.name)

  return (
    <section className="border-b bg-muted/25">
      <MainContainer className="grid gap-8 pb-10 pt-8 md:grid-cols-[1fr_20rem] md:items-end md:pb-12 md:pt-12">
        <div className="max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-background">
              Official LEAD Chapter
            </Badge>
            {location ? (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border bg-card text-2xl font-semibold shadow-sm sm:h-24 sm:w-24">
              {initials}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {chapter.name}
              </h1>
              <p className="text-base text-muted-foreground md:text-lg">
                {chapter.university}
              </p>
            </div>
          </div>

          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Explore events, community activity, and ways to get closer to this LEAD chapter.
            Start with an upcoming event or express interest in joining the chapter community.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#chapter-events"
              className={cn(buttonVariants({ variant: 'default' }), 'justify-between gap-2 sm:justify-center')}
            >
              View events
              <CalendarDays className="h-4 w-4" />
            </a>
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: 'outline' }), 'justify-between gap-2 sm:justify-center')}
            >
              Join or express interest
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Start here
          </div>
          <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Meet the chapter through upcoming events, student-led programs, and community
              opportunities.
            </p>
            <p>
              If this chapter feels close to your goals, start by expressing interest or joining an
              event.
            </p>
          </div>
          {chapter.instagram_url ? (
            <a
              href={chapter.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Share2 className="h-4 w-4" />
              Follow chapter updates
            </a>
          ) : null}
        </aside>
      </MainContainer>
    </section>
  )
}
