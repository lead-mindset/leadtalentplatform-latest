import { getVisibleStudents, getSavedStudentIds } from '@/lib/actions/company/get-data'
import { requireRecruiter } from '@/lib/auth'
import { StudentsTable } from '../_components/students-table'
import { BrowseFilters } from '../_components/browse-filters'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

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

  const [students, savedIds] = await Promise.all([
    getVisibleStudents(supabase),
    getSavedStudentIds(supabase, user.id),
  ])

  let filtered = students

  if (params.q) {
    const q = params.q.toLowerCase()
    filtered = filtered.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.StudentProfile?.major?.toLowerCase().includes(q) ||
        s.StudentProfile?.skills?.some(sk => sk.toLowerCase().includes(q))
    )
  }

  if (params.major && params.major !== 'all') {
    filtered = filtered.filter(s =>
      s.StudentProfile?.major?.toLowerCase().includes(params.major!.toLowerCase())
    )
  }

  if (params.year && params.year !== 'all') {
    const year = parseInt(params.year)
    filtered = filtered.filter(s => s.StudentProfile?.graduationYear === year)
  }

  if (params.chapter && params.chapter !== 'all') {
    filtered = filtered.filter(s => s.StudentProfile?.chapterId === params.chapter)
  }

  const majors = [...new Set(
    students
      .map(s => s.StudentProfile?.major)
      .filter((m): m is string => Boolean(m))
  )].sort()

  const years = [...new Set(
    students
      .map(s => s.StudentProfile?.graduationYear)
      .filter((y): y is number => Boolean(y))
  )].sort()

  const chapters = [...new Map(
    students
      .filter(s => s.StudentProfile?.chapterId && s.Chapter)
      .map(s => [s.StudentProfile!.chapterId, s.Chapter!.name])
  ).entries()]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Students</h1>
        <p className="text-muted-foreground mt-1">
          {filtered.length} student{filtered.length !== 1 ? 's' : ''} available
          {filtered.length !== students.length && ` (${students.length} total)`}
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
    </div>
  )
}