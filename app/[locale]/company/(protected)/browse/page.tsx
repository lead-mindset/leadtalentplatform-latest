import { getSavedStudentIds, searchStudents } from '@/lib/actions/company/get-data'
import { requireRecruiter } from '@/lib/auth'
import { StudentsTable } from '../_components/students-table'
import { BrowseFilters } from '../_components/browse-filters'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { MainContainer } from '@/components/global/main-container'

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string
    major?: string
    year?: string
    chapter?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { supabase, user } = await requireRecruiter()
  const params = await searchParams

const studentFilters = {
    query: params.q,
    major: params.major && params.major !== 'all' ? params.major : undefined,
    graduation_year: params.year && params.year !== 'all' ? Number(params.year) : undefined,
    chapter_id: params.chapter && params.chapter !== 'all' ? params.chapter : undefined,
  }

  const [filtered, savedIds] = await Promise.all([
    searchStudents(supabase, studentFilters),
    getSavedStudentIds(supabase, user.id),
  ])

  const students = filtered

  const majors = [...new Set(
    students
      .map(s => s.person_profile?.major_or_interest)
      .filter((m): m is string => Boolean(m))
  )].sort()

  const years = [...new Set(
    students
      .map(s => s.person_profile?.graduation_year)
      .filter((y): y is number => Boolean(y))
  )].sort()

  const chapters = [...new Map(
    students
      .map((student): [string, string] | null => {
        const chapterId = student.person_profile?.chapter_id
        const chapterName = student.chapter?.name
        return chapterId && chapterName ? [chapterId, chapterName] : null
      })
      .filter((chapter): chapter is [string, string] => chapter !== null)
  ).entries()]

  return (
    <MainContainer className="space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Talent</h1>
        <p className="text-muted-foreground mt-1">
          {filtered.length} profile{filtered.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <BrowseFilters
        majors={majors}
        years={years}
        chapters={chapters}
        currentFilters={{
          q: params.q,
          major: params.major,
          year: params.year,
          chapter: params.chapter,
        }}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 opacity-50 mb-3" />
            <p className="font-medium">No students match your filters</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or clearing filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <StudentsTable students={filtered} savedStudentIds={savedIds} />
      )}
    </MainContainer>
  )
}
