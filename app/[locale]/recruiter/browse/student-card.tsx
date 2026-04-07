import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { RecruiterSaveStudentButton } from './recruiter-save-student-button'
import type { TalentPoolStudent } from '@/lib/actions/recruiter/talent-pool'
import Link from 'next/link'

type StudentCardProps = {
  student: TalentPoolStudent
  isSaved: boolean
  profileHref: string
  onSavedChange?: (isSaved: boolean) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function StudentCard({ student, isSaved, profileHref, onSavedChange }: StudentCardProps) {
  const updatedLabel = new Date(student.updatedAt).toLocaleDateString()

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold leading-tight">{student.name}</p>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
        </div>
        <RecruiterSaveStudentButton
          studentId={student.id}
          studentName={student.name}
          initialSaved={isSaved}
          onSavedChange={onSavedChange}
        />
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">University: </span>
          {student.chapter?.university ?? 'Not specified'}
        </p>
        <p>
          <span className="text-muted-foreground">Chapter: </span>
          {student.chapter?.name ?? 'Not specified'}
        </p>
        <p>
          <span className="text-muted-foreground">Graduation: </span>
          {student.graduationYear ? `Class of ${student.graduationYear}` : 'Not specified'}
        </p>
        <div className="flex flex-wrap gap-1">
          {student.skills.slice(0, 3).map(skill => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
          {student.skills.length > 3 && <Badge variant="outline">+{student.skills.length - 3}</Badge>}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Last updated {updatedLabel}</span>
        <Button asChild variant="outline" size="sm">
          <Link href={profileHref}>View profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
