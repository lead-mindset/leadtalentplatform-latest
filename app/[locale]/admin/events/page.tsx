import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getAllEventsAdmin } from '@/lib/actions/events/get-data'

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminEventsPage() {
  const events = await getAllEventsAdmin()

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage events across all chapters.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">New event</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No events yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((e) => (
            <Card key={e.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{e.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(e.startAt)} · {e.Chapter ? e.Chapter.name : 'Global'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={e.isPublished ? 'secondary' : 'outline'}>
                      {e.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                    {e.capacity !== null && (
                      <Badge variant="outline" className="tabular-nums">
                        {e._count.registrations}/{e.capacity}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                <Button asChild variant="outline">
                  <Link href={`/admin/events/${e.id}`}>Manage</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/chapter/events/${e.id}/checkin`}>Check-in</Link>
                </Button>
                <Button asChild>
                  <Link href={`/events/${e.id}`}>View public</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

