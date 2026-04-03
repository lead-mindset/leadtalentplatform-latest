'use client'

import { useState, useTransition } from 'react'
import type { StudentForRecruiter } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Building2, GraduationCap, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toggleSaveStudentAction } from '@/lib/actions/company/toggle-save'
import { toast } from 'sonner'

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
        <Heart className={`h-3 w-3 ${isSaved ? 'fill-current' : ''}`} />
      )}
    </Button>
  )
}

export function StudentsTable({ students, savedStudentIds = [] }: StudentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium text-sm">Student</th>
            <th className="text-left p-3 font-medium text-sm">Major</th>
            <th className="text-left p-3 font-medium text-sm">Graduation</th>
            <th className="text-left p-3 font-medium text-sm">Chapter</th>
            <th className="text-left p-3 font-medium text-sm">Skills</th>
            <th className="text-right p-3 font-medium text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="p-3">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {student.StudentProfile?.major || 'Not specified'}
                  </span>
                </div>
              </td>
              <td className="p-3">
                <span className="text-sm">
                  {student.StudentProfile?.graduationYear
                    ? `Class of ${student.StudentProfile.graduationYear}`
                    : 'N/A'}
                </span>
              </td>
              <td className="p-3">
                {student.Chapter ? (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{student.Chapter.name}</p>
                      <p className="text-muted-foreground text-xs">{student.Chapter.university}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No chapter</span>
                )}
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {student.StudentProfile?.skills?.slice(0, 3).map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {(student.StudentProfile?.skills?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(student.StudentProfile?.skills?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-3 text-right">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}