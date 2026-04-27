import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { getChapterEvents } from '@/lib/actions/events/get-data'
import { EventsTable } from './_components/events-table'
import { Icons } from '@/components/ui/icons'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export default async function ChapterEventsPage() {
  const events = await getChapterEvents()

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/chapter' },
        { label: 'Events' }
      ]} />

      {/* Page Header with Clear Hierarchy */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Chapter Events</h1>
            <p className="text-muted-foreground text-lg">Create and manage your chapter&apos;s events</p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/chapter/events/new">
              <Icons.Plus className="mr-2 h-4 w-4" />
              Create New Event
            </Link>
          </Button>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 border border-border/60">
            <div className="text-2xl font-bold text-foreground">{events.length}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border/60">
            <div className="text-2xl font-bold text-success">
              {events.filter(e => e.is_published).length}
            </div>
            <div className="text-sm text-muted-foreground">Published</div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border/60">
            <div className="text-2xl font-bold text-warning">
              {events.filter(e => !e.is_published && new Date(e.end_at) >= new Date()).length}
            </div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border/60">
            <div className="text-2xl font-bold text-muted-foreground">
              {events.filter(e => new Date(e.end_at) < new Date()).length}
            </div>
            <div className="text-sm text-muted-foreground">Past Events</div>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed border-2 border-border/40">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Icons.Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No events yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your chapter hasn&apos;t hosted any events. Create your first event to start engaging with your community.
            </p>
            <Button asChild size="lg">
              <Link href="/chapter/events/new">
                <Icons.Plus className="mr-2 h-4 w-4" />
                Create Your First Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EventsTable events={events} />
      )}
    </div>
  )
}

