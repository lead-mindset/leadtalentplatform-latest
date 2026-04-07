import { requireRecruiter } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import Link from 'next/link'
import {
  getSavedStatus,
  getTalentPool,
  getTalentPoolFilterOptions,
} from '@/lib/actions/recruiter/talent-pool'
import { TalentPoolFilters } from './talent-pool-filters'
import { StudentCard } from './student-card'

type RecruiterBrowsePageProps = {
  searchParams: Promise<{
    q?: string
    year?: string
    chapter?: string
    skills?: string
    page?: string
  }>
}

export default async function RecruiterBrowsePage({ searchParams }: RecruiterBrowsePageProps) {
  await requireRecruiter()
  const params = await searchParams
  const currentPage = Math.max(1, Number(params.page ?? '1') || 1)
  const selectedSkills = (params.skills ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  const [pool, options] = await Promise.all([
    getTalentPool(
      {
        query: params.q,
        chapterId: params.chapter,
        graduationYear: params.year ? Number(params.year) : undefined,
        skills: selectedSkills,
      },
      { page: currentPage, pageSize: 12 }
    ),
    getTalentPoolFilterOptions(),
  ])

  const savedIds = await getSavedStatus(pool.students.map(student => student.id))
  const savedSet = new Set(savedIds)

  const pageParams = new URLSearchParams()
  if (params.q) pageParams.set('q', params.q)
  if (params.year) pageParams.set('year', params.year)
  if (params.chapter) pageParams.set('chapter', params.chapter)
  if (params.skills) pageParams.set('skills', params.skills)

  const previousHref = (() => {
    const next = new URLSearchParams(pageParams.toString())
    next.set('page', String(Math.max(1, currentPage - 1)))
    return `?${next.toString()}`
  })()

  const nextHref = (() => {
    const next = new URLSearchParams(pageParams.toString())
    next.set('page', String(currentPage + 1))
    return `?${next.toString()}`
  })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talent Pool</h1>
        <p className="text-muted-foreground mt-1">
          Browse approved, recruiter-visible student profiles.
        </p>
      </div>

      <TalentPoolFilters
        years={options.years}
        chapters={options.chapters}
        current={{
          q: params.q,
          year: params.year,
          chapter: params.chapter,
          skills: selectedSkills,
        }}
      />

      {pool.students.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 opacity-50 mb-3" />
            <p className="font-medium">No students match these filters.</p>
            <p className="text-sm text-muted-foreground mt-1">Try broadening your search.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pool.students.map(student => {
              const currentBrowsePath = `/recruiter/browse${pageParams.toString() ? `?${pageParams.toString()}` : ''}`
              const profileHref = `/recruiter/${student.id}?returnTo=${encodeURIComponent(currentBrowsePath)}`
              return (
                <StudentCard
                  key={student.id}
                  student={student}
                  isSaved={savedSet.has(student.id)}
                  profileHref={profileHref}
                />
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {pool.page} of {Math.max(pool.totalPages, 1)} ({pool.total} total students)
            </p>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" disabled={pool.page <= 1}>
                <Link href={previousHref}>Previous</Link>
              </Button>
              <Button asChild variant="outline" size="sm" disabled={!pool.hasNextPage}>
                <Link href={nextHref}>Next</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
