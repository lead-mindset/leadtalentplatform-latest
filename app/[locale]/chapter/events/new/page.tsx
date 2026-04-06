import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EventForm } from '../_components/event-form'

export default function NewChapterEventPage() {
  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Event</h1>
          <p className="text-muted-foreground mt-1">Create a draft event for your chapter.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/chapter/events">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}

