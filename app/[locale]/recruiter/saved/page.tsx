import Link from 'next/link'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { requireRecruiter } from '@/lib/auth'
import { getSavedStudents } from '@/lib/actions/recruiter/talent-pool'
import { SavedStudentsGrid } from './saved-students-grid'

type RecruiterSavedPageProps = {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function RecruiterSavedPage({ searchParams }: RecruiterSavedPageProps) {
  await requireRecruiter()
  const params = await searchParams
  const currentPage = Math.max(1, Number(params.page ?? '1') || 1)

  const saved = await getSavedStudents({}, { page: currentPage, pageSize: 12 })

  const previousHref = `?page=${Math.max(1, currentPage - 1)}`
  const nextHref = `?page=${currentPage + 1}`
  const returnToBase = `/recruiter/saved?page=${currentPage}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saved Students</h1>
        <p className="text-muted-foreground mt-1">
          Keep track of candidates you want to revisit.
        </p>
      </div>

      {saved.students.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Icons.Heart className="mx-auto h-12 w-12 opacity-50 mb-3" />
            <p className="font-medium">You haven&apos;t saved any students yet.</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Browse the talent pool to find candidates.
            </p>
            <Button asChild>
              <Link href="/recruiter/browse">
                <Icons.Users className="h-4 w-4" />
                Browse talent pool
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <SavedStudentsGrid initialStudents={saved.students} returnToBase={returnToBase} />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {saved.page} of {Math.max(saved.totalPages, 1)} ({saved.total} saved students)
            </p>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" disabled={saved.page <= 1}>
                <Link href={previousHref}>Previous</Link>
              </Button>
              <Button asChild variant="outline" size="sm" disabled={!saved.hasNextPage}>
                <Link href={nextHref}>Next</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
