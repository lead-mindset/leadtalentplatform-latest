'use client'

import { useState, useTransition } from 'react'
import type { StudentForRecruiter } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Heart, Building2, GraduationCap, Loader2, Mail, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toggleSaveStudentAction } from '@/lib/actions/company/toggle-save'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StudentsTableProps {
  students: StudentForRecruiter[]
  savedStudentIds?: string[]
}

function SaveButton({
  studentId,
  initialSaved,
  studentName,
}: {
  studentId: string
  initialSaved: boolean
  studentName: string
}) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      // Optimistic update
      setIsSaved(prev => !prev)

      const result = await toggleSaveStudentAction(studentId, isSaved)

      if (!result.success) {
        // Revert on failure
        setIsSaved(isSaved)
        toast.error(result.error || 'Failed to update save status')
      } else {
        toast.success(result.isSaved ? `${studentName} saved to talent list` : `${studentName} removed from saved talent`)
      }
    })
  }

  return (
    <Button
      variant={isSaved ? 'default' : 'outline'}
      size="sm"
      className="gap-1.5"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isSaved ? `Remove ${studentName} from saved talent` : `Save ${studentName} to saved talent`}
      title={isSaved ? 'Remove from saved talent' : 'Save profile'}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Heart className={cn('h-3 w-3', isSaved && 'fill-current')} />
      )}
      <span className="hidden xl:inline">{isSaved ? 'Saved' : 'Save'}</span>
    </Button>
  )
}

export function StudentsTable({ students, savedStudentIds = [] }: StudentsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="min-w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profile</TableHead>
            <TableHead className="min-w-[210px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chapter</TableHead>
            <TableHead className="min-w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Focus</TableHead>
            <TableHead className="w-[130px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Graduation</TableHead>
            <TableHead className="min-w-[240px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</TableHead>
            <TableHead className="w-[150px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id} className="last:border-0">
              <TableCell className="px-4 py-3 align-top">
                <div className="space-y-1">
                  <p className="font-medium leading-none">{student.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{student.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 align-top">
                {student.chapter ? (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{student.chapter.name}</p>
                      <p className="text-muted-foreground text-xs">{student.chapter.university}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Chapter not listed</span>
                )}
              </TableCell>
              <TableCell className="px-4 py-3 align-top">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {student.person_profile?.major_or_interest || 'Focus not specified'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 align-top">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {student.person_profile?.graduation_year
                      ? student.person_profile.graduation_year
                      : 'Not listed'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 align-top">
                <div className="flex flex-wrap gap-1">
                  {student.person_profile?.skills?.slice(0, 3).map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {(student.person_profile?.skills?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(student.person_profile?.skills?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 text-right align-top">
                <div className="flex justify-end gap-2">
                  <SaveButton
                    studentId={student.id}
                    initialSaved={savedStudentIds.includes(student.id)}
                    studentName={student.name}
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/company/students/${student.id}`}>Profile</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
