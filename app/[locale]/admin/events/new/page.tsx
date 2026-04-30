import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminEventForm } from '../_components/admin-event-form'
import { getChapters } from '@/lib/actions/admin/create-chapter'

export default async function NewAdminEventPage() {
  const chaptersRes = await getChapters()
  const chapters = 'chapters' in chaptersRes ? chaptersRes.chapters : []

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Event</h1>
          <p className="text-muted-foreground mt-1">Create a global or chapter event.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/events">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEventForm mode="create" chapters={chapters} />
        </CardContent>
      </Card>
    </div>
  )
}

