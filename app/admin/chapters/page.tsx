import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Suspense } from 'react'
import { Building2, Users, Plus, MapPin } from 'lucide-react'
import { getChapters } from '@/lib/actions/admin/get-data'

async function ChaptersList() {
  const chapters = await getChapters()

  if (chapters.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No chapters yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first chapter to get started
          </p>
          <Button asChild>
            <Link href="/admin/chapters/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Chapter
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {chapters.map((chapter) => (
        <Card key={chapter.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{chapter.name}</CardTitle>
                <CardDescription>{chapter.university}</CardDescription>
              </div>
              <Badge variant="secondary">
                {chapter._count?.users || 0} members
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {(chapter.city || chapter.region) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>
                  {[chapter.city, chapter.region].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/admin/chapters/${chapter.id}`}>
                  View Details
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/chapters/${chapter.id}/members`}>
                  <Users className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-3/4 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AdminChaptersPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chapters</h1>
          <p className="text-muted-foreground mt-2">
            Manage LEAD chapters and their settings
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/chapters/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Chapter
          </Link>
        </Button>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ChaptersList />
      </Suspense>
    </div>
  )
}