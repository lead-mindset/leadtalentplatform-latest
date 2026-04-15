import { getStudentById, isStudentSaved } from '@/lib/actions/company/get-data'
import { requireRecruiter } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  GraduationCap,
  Mail,
  Phone,
  Linkedin,
  ArrowLeft,
  Calendar,
} from 'lucide-react'
import { Link } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { SaveStudentButton } from '../../_components/save-student-button'
import NextLink from 'next/link'

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  const { supabase, user } = await requireRecruiter()

  const [student, saved] = await Promise.all([
    getStudentById(supabase, id),
    isStudentSaved(supabase, user.id, id),
  ])

  if (!student) notFound()
  const resolvedStudent = student ?? notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/company/browse">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{resolvedStudent.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{resolvedStudent.email}</span>
            </div>
            {resolvedStudent.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{resolvedStudent.phone}</span>
              </div>
            )}
          </div>
        </div>
        <SaveStudentButton
          studentId={resolvedStudent.id}
          studentName={resolvedStudent.name}
          initialSaved={saved}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resolvedStudent.StudentProfile?.major && (
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{resolvedStudent.StudentProfile.major}</p>
                  <p className="text-sm text-muted-foreground">Major</p>
                </div>
              </div>
            )}

            {resolvedStudent.StudentProfile?.graduationYear && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    Class of {resolvedStudent.StudentProfile.graduationYear}
                  </p>
                  <p className="text-sm text-muted-foreground">Expected Graduation</p>
                </div>
              </div>
            )}

            {resolvedStudent.Chapter && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{resolvedStudent.Chapter.name}</p>
                  <p className="text-sm text-muted-foreground">{resolvedStudent.Chapter.university}</p>
                  {(resolvedStudent.Chapter.city || resolvedStudent.Chapter.region) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[resolvedStudent.Chapter.city, resolvedStudent.Chapter.region]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Technical and professional skills</CardDescription>
          </CardHeader>
          <CardContent>
            {resolvedStudent.StudentProfile?.skills && resolvedStudent.StudentProfile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resolvedStudent.StudentProfile.skills.map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills listed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {resolvedStudent.StudentProfile?.linkedinUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Professional Links</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="gap-2">
              <NextLink
                href={resolvedStudent.StudentProfile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4" />
                View LinkedIn Profile
              </NextLink>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Reach out to this student</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${resolvedStudent.email}`} className="text-sm text-primary hover:underline">
              {resolvedStudent.email}
            </a>
          </div>
          {resolvedStudent.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${resolvedStudent.phone}`} className="text-sm text-primary hover:underline">
                {resolvedStudent.phone}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
