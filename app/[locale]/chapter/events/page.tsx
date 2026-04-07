import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { getChapterEvents } from '@/lib/actions/events/get-data'
import { EventsTable } from './_components/events-table'

export default async function ChapterEventsPage() {
  const events = await getChapterEvents()

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chapter Events</h1>
          <p className="text-muted-foreground mt-1">Create and manage your chapter’s events.</p>
        </div>
        <Button asChild>
          <Link href="/chapter/events/new">New event</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Your chapter hasn&apos;t hosted an event yet. Create your first one.
          </CardContent>
        </Card>
      ) : (
        <EventsTable events={events} />
      )}
    </div>
  )
}

