import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, GraduationCap, Linkedin, Mail, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStudentProfileForRecruiter } from '@/lib/actions/recruiter/student-profile'
import { DownloadResumeButton } from './download-resume-button'

type RecruiterStudentProfilePageProps = {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ returnTo?: string }>
}

function getBackHref(returnTo?: string) {
  if (!returnTo) return '/recruiter/browse'
  try {
    const decoded = decodeURIComponent(returnTo)
    const isAllowed =
      decoded.startsWith('/recruiter/browse') || decoded.startsWith('/recruiter/saved')
    return isAllowed ? decoded : '/recruiter/browse'
  } catch {
    return '/recruiter/browse'
  }
}

export default async function RecruiterStudentProfilePage({
  params,
  searchParams,
}: RecruiterStudentProfilePageProps) {
  const [{ studentId }, { returnTo }] = await Promise.all([params, searchParams])
  const student = await getStudentProfileForRecruiter(studentId)

  if (!student) notFound()

  const backHref = getBackHref(returnTo)

  return (
    <div className="space-y-6 max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to talent pool
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">{student.name}</h1>
        <p className="text-muted-foreground">{student.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Academic Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{student.chapter?.name ?? 'No chapter specified'}</p>
                <p className="text-muted-foreground">{student.chapter?.university ?? 'No university specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              {student.graduationYear ? `Class of ${student.graduationYear}` : 'Graduation year not specified'}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              {student.major ?? 'Major not specified'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links & Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.linkedinUrl ? (
              <Button asChild variant="outline" className="w-full">
                <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-4 w-4" />
                  View LinkedIn
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">No LinkedIn profile provided.</p>
            )}

            {student.resume ? (
              <DownloadResumeButton studentId={student.id} />
            ) : (
              <p className="text-sm text-muted-foreground">No resume uploaded.</p>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${student.email}`} className="hover:underline">
                {student.email}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {student.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {student.skills.map(skill => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No skills listed.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
