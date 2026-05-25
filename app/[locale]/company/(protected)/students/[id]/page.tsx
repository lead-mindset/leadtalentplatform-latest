import { getStudentById, getTalentResumeMetadata, isStudentSaved } from '@/lib/actions/company/get-data'
import { requireRecruiter } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  Linkedin,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { SaveStudentButton } from '../../_components/save-student-button'
import { ResumeAccessButton } from '../../_components/resume-access-button'
import NextLink from 'next/link'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  const { supabase, user } = await requireRecruiter()

  const [student, saved, resume] = await Promise.all([
    getStudentById(supabase, id),
    isStudentSaved(supabase, user.id, id),
    getTalentResumeMetadata(supabase, id),
  ])

  if (!student) notFound()
  const resolvedStudent = student ?? notFound()
  const skills = resolvedStudent.person_profile?.skills ?? []
  const profileUpdatedAt = resolvedStudent.person_profile?.updated_at
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(resolvedStudent.person_profile.updated_at)
      )
    : null
  const resumeUploadedAt = resume?.uploaded_at
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(resume.uploaded_at)
      )
    : null

  return (
    <MainContainer className="max-w-6xl space-y-6 py-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/company/browse">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse Talent
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-6 py-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <PageHeader
              eyebrow="Visible LEAD profile"
              title={resolvedStudent.name}
              description={
                <span className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {resolvedStudent.email}
                </span>
                {resolvedStudent.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {resolvedStudent.phone}
                  </span>
                )}
                </span>
              }
              className="border-b-0 pb-0"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Focus</p>
                <p className="mt-1 font-semibold">
                  {resolvedStudent.person_profile?.major_or_interest ?? 'Not listed'}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Graduation</p>
                <p className="mt-1 font-semibold">
                  {resolvedStudent.person_profile?.graduation_year ?? 'Not listed'}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resume</p>
                <p className="mt-1 font-semibold">{resume ? 'Available' : 'Not uploaded'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Company access verified
            </div>
            <p className="text-sm text-muted-foreground">
              This profile is visible because the member opted in and has approved chapter membership.
            </p>
            <div className="flex flex-col gap-2">
              <SaveStudentButton
                studentId={resolvedStudent.id}
                studentName={resolvedStudent.name}
                initialSaved={saved}
              />
              {resume && <ResumeAccessButton profileId={resolvedStudent.id} />}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Chapter Context</CardTitle>
            <CardDescription>Membership context for company review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resolvedStudent.chapter && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{resolvedStudent.chapter.name}</p>
                  <p className="text-sm text-muted-foreground">{resolvedStudent.chapter.university}</p>
                  {(resolvedStudent.chapter.city || resolvedStudent.chapter.region) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[resolvedStudent.chapter.city, resolvedStudent.chapter.region]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-medium">Approved chapter member</p>
                <p className="text-sm text-muted-foreground">
                  Invisible or ineligible profiles are excluded before this page renders.
                </p>
              </div>
            </div>
            {profileUpdatedAt && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{profileUpdatedAt}</p>
                  <p className="text-sm text-muted-foreground">Profile last updated</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Technical and professional signals.</CardDescription>
          </CardHeader>
          <CardContent>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, i: number) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Links and Resume</CardTitle>
            <CardDescription>External materials available for company review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolvedStudent.person_profile?.linkedin_url ? (
              <Button asChild variant="outline" className="gap-2">
                <NextLink
                  href={resolvedStudent.person_profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                  <ExternalLink className="h-3.5 w-3.5" />
                </NextLink>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">No LinkedIn profile listed.</p>
            )}
            {resolvedStudent.person_profile?.portfolio_url ? (
              <Button asChild variant="outline" className="gap-2">
                <NextLink
                  href={resolvedStudent.person_profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe2 className="h-4 w-4" />
                  Portfolio
                  <ExternalLink className="h-3.5 w-3.5" />
                </NextLink>
              </Button>
            ) : null}
            {resume ? (
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{resume.file_name ?? 'Resume available'}</p>
                    <p className="text-sm text-muted-foreground">
                      {resumeUploadedAt ? `Uploaded ${resumeUploadedAt}` : 'Signed access opens in a new tab.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No resume is available for this profile.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Use direct contact only for relevant follow-up.</CardDescription>
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
            <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
              Saved status stays synced with Browse Talent and Saved Talent.
            </div>
          </CardContent>
        </Card>
      </div>
    </MainContainer>
  )
}
