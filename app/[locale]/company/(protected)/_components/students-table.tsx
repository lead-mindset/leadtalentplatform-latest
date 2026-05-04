'use client'

import { useState, useTransition } from 'react'
import type { StudentForRecruiter } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Heart, Building2, GraduationCap, Loader2 } from 'lucide-react'
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
        toast.success(result.isSaved ? `${studentName} saved` : `${studentName} removed from saved`)
      }
    })
  }

  return (
    <Button
      variant={isSaved ? 'default' : 'outline'}
      size="sm"
      className="gap-1"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Heart className={cn('h-3 w-3', isSaved && 'fill-current')} />
      )}
    </Button>
  )
}

export function StudentsTable({ students, savedStudentIds = [] }: StudentsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-left p-3 font-medium text-sm">Student</TableHead>
            <TableHead className="text-left p-3 font-medium text-sm">Major</TableHead>
            <TableHead className="text-left p-3 font-medium text-sm">Graduation</TableHead>
            <TableHead className="text-left p-3 font-medium text-sm">Chapter</TableHead>
            <TableHead className="text-left p-3 font-medium text-sm">Skills</TableHead>
            <TableHead className="text-right p-3 font-medium text-sm">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id} className="last:border-0">
              <TableCell className="p-3">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
              </TableCell>
              <TableCell className="p-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {student.person_profile?.major_or_interest || 'Not specified'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-3">
                <span className="text-sm">
                  {student.person_profile?.graduation_year
                    ? `Class of ${student.person_profile.graduation_year}`
                    : 'N/A'}
                </span>
              </TableCell>
              <TableCell className="p-3">
                {student.chapter ? (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{student.chapter.name}</p>
                      <p className="text-muted-foreground text-xs">{student.chapter.university}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No chapter</span>
                )}
              </TableCell>
              <TableCell className="p-3">
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
              <TableCell className="p-3 text-right">
                <div className="flex justify-end gap-2">
                  <SaveButton
                    studentId={student.id}
                    initialSaved={savedStudentIds.includes(student.id)}
                    studentName={student.name}
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/company/students/${student.id}`}>View</Link>
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
