import { Suspense } from 'react'
import { ArrowRight, Building2, CalendarDays, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MainContainer } from '@/components/global/main-container'
import { Navbar } from '../(public)/_components/navbar'
import { Link } from '@/i18n/routing'
import { getPublicChapterDirectory } from '@/lib/actions/chapters/get-public-chapter-data'
import type { PublicChapterDirectoryItem } from '@/lib/services/chapter-profile.service'

export const metadata = {
  title: 'Chapters',
  description: 'Explore LEAD chapters by university and location.',
}

const DIRECTORY_COPY = {
  en: {
    badge: 'LEAD chapters',
    heading: 'Find your LEAD chapter',
    subheading:
      'Explore student communities by university, location, and ways to get involved.',
    totalChapters: 'Chapters',
    locationSignal: 'Local student community',
    eventsSignal: 'Events and programs',
    noLocation: 'Location pending',
    quietChapter: 'Chapter profile is being built',
    viewChapter: 'View chapter',
    emptyTitle: 'No public chapters available yet',
    emptyBody:
      'Chapters will appear here once their public profile data is ready for review.',
    loading: 'Loading chapters...',
  },
  es: {
    badge: 'Chapters LEAD',
    heading: 'Encuentra tu chapter LEAD',
    subheading:
      'Explora comunidades estudiantiles por universidad, ubicacion y formas de involucrarte.',
    totalChapters: 'Chapters',
    locationSignal: 'Comunidad estudiantil local',
    eventsSignal: 'Eventos y programas',
    noLocation: 'Ubicacion pendiente',
    quietChapter: 'Perfil del chapter en construccion',
    viewChapter: 'Ver chapter',
    emptyTitle: 'Aun no hay chapters publicos disponibles',
    emptyBody:
      'Los chapters apareceran aqui cuando su informacion publica este lista para revision.',
    loading: 'Cargando chapters...',
  },
} as const

type DirectoryLocale = keyof typeof DIRECTORY_COPY

function resolveLocale(locale?: string): DirectoryLocale {
  return locale === 'en' ? 'en' : 'es'
}

function formatLocation(chapter: PublicChapterDirectoryItem, locale: DirectoryLocale) {
  const location = [chapter.city, chapter.region].filter(Boolean).join(', ')
  return location || DIRECTORY_COPY[locale].noLocation
}

function DirectoryStat({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function ChapterCard({
  chapter,
  locale,
}: {
  chapter: PublicChapterDirectoryItem
  locale: DirectoryLocale
}) {
  const copy = DIRECTORY_COPY[locale]

  return (
    <Card className="group rounded-lg transition-colors hover:border-primary/40">
      <CardContent className="flex h-full flex-col gap-5 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-semibold tracking-tight">
              {chapter.name}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {chapter.university}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{formatLocation(chapter, locale)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="max-w-full justify-start gap-1.5 whitespace-normal">
              <Building2 className="h-3.5 w-3.5" />
              {copy.locationSignal}
            </Badge>
            <Badge variant="outline" className="max-w-full justify-start gap-1.5 whitespace-normal">
              <CalendarDays className="h-3.5 w-3.5" />
              {copy.eventsSignal}
            </Badge>
          </div>
          {!chapter.hasActivity && (
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs">
              {copy.quietChapter}
            </p>
          )}
        </div>

        <Link
          href={`/chapter/${chapter.id}`}
          className="mt-auto inline-flex items-center justify-between rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          {copy.viewChapter}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardContent>
    </Card>
  )
}

async function ChaptersContent({ locale }: { locale: DirectoryLocale }) {
  const copy = DIRECTORY_COPY[locale]
  const directory = await getPublicChapterDirectory()

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <MainContainer className="space-y-8 pb-16 pt-6 md:pb-20 md:pt-12">
        <section className="space-y-5 md:space-y-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge variant="outline" className="w-fit">
                {copy.badge}
              </Badge>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-5xl">
                  {copy.heading}
                </h1>
                <p className="text-base text-muted-foreground md:text-lg">
                  {copy.subheading}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <DirectoryStat label={copy.totalChapters} value={directory.stats.totalChapters} />
            </div>
          </div>
        </section>

        {directory.emptyStates.hasChapters ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {directory.chapters.map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} locale={locale} />
            ))}
          </section>
        ) : (
          <Card className="rounded-lg">
            <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <div>
                <h2 className="font-semibold">{copy.emptyTitle}</h2>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {copy.emptyBody}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </MainContainer>
    </main>
  )
}

type ChaptersPageProps = {
  params: Promise<{ locale: string }>
}

export default async function ChaptersPage({ params }: ChaptersPageProps) {
  const { locale } = await params
  const resolvedLocale = resolveLocale(locale)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            {DIRECTORY_COPY[resolvedLocale].loading}
          </div>
        }
      >
        <ChaptersContent locale={resolvedLocale} />
      </Suspense>
    </div>
  )
}
