import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Edit3, IdCard, Users } from 'lucide-react'
import { MainContainer } from '@/components/global/main-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { requireUser } from '@/lib/auth'
import {
  StudentDashboardService,
  type StudentActivationDashboard,
  type StudentDashboardChapterOption,
} from '@/lib/services/student-dashboard.service'
import { ChapterApplicationCard } from './_components/chapter-application-card'

type ParticipantApplicationCardProps = {
  dashboard: StudentActivationDashboard
  chapterOptions: StudentDashboardChapterOption[]
}

const STATUS_CONTENT = {
  participant: {
    badge: 'Participant',
    title: 'You are set up as a LEAD participant.',
    body: 'You can browse public events now. If you are part of a chapter or want to join one, send a chapter request for review.',
    badgeVariant: 'info' as const,
    icon: Users,
  },
  pending: {
    badge: 'Pending review',
    title: 'Your chapter membership is pending review.',
    body: 'Chapter editors can review your request. While you wait, you can keep your profile updated and register for public events.',
    badgeVariant: 'warning' as const,
    icon: Clock3,
  },
  official_member: {
    badge: 'Official member',
    title: 'You are an official LEAD member.',
    body: 'Your approved chapter membership is active. Your member ID is only shown after approval.',
    badgeVariant: 'success' as const,
    icon: CheckCircle2,
  },
  alumni: {
    badge: 'Alumni',
    title: 'You are listed as LEAD alumni.',
    body: 'Your chapter history is preserved. You can still keep your profile current and participate in relevant events.',
    badgeVariant: 'secondary' as const,
    icon: IdCard,
  },
}

function formatPosition(position: string | null) {
  if (!position) return 'Member'
  return position
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function ProfileReadinessCard({ dashboard }: { dashboard: StudentActivationDashboard }) {
  const profile = dashboard.profile

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Edit3 className="h-5 w-5 text-primary" />
          Profile readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          {dashboard.hasProfile
            ? 'Your basic profile is ready for event registration and chapter review.'
            : 'Complete your basic profile before applying to a chapter or registering for events.'}
        </p>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="font-semibold text-foreground">University</p>
            <p className="mt-1 text-muted-foreground">{profile?.university ?? 'Not added yet'}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="font-semibold text-foreground">Focus</p>
            <p className="mt-1 text-muted-foreground">
              {profile?.major_or_interest ?? 'Not added yet'}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/student/profile">Edit profile</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function MembershipDetailsCard({ dashboard }: { dashboard: StudentActivationDashboard }) {
  const membership = dashboard.membership

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IdCard className="h-5 w-5 text-primary" />
          Chapter status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {membership ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
              <p className="font-semibold text-foreground">
                {membership.chapter?.name ?? membership.chapter_id}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {membership.chapter?.university ?? 'Chapter details'}
              </p>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                <p className="font-semibold text-foreground">Position</p>
                <p className="mt-1 text-muted-foreground">{formatPosition(membership.position)}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                <p className="font-semibold text-foreground">Member ID</p>
                <p className="mt-1 text-muted-foreground">
                  {dashboard.status === 'official_member' && membership.member_id
                    ? membership.member_id
                    : 'Available after approval'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            You do not have a chapter request yet. Applying creates a pending request for editors to
            review.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ParticipantApplicationCard({ dashboard, chapterOptions }: ParticipantApplicationCardProps) {
  if (dashboard.status !== 'participant') return null

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Join a chapter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Send one chapter request when you are ready. It will stay pending until the chapter team
          reviews it.
        </p>
        {dashboard.hasProfile ? (
          <ChapterApplicationCard chapters={chapterOptions} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-warning">
              Finish your profile first so reviewers have the basics.
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/student/profile">Complete profile</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PrimaryActions({ dashboard }: { dashboard: StudentActivationDashboard }) {
  const actions =
    dashboard.status === 'official_member'
      ? [
          { href: '/student/events', label: 'View my events', icon: CalendarDays },
          { href: '/student/profile', label: 'Edit profile', icon: Edit3 },
        ]
      : [
          { href: '/events', label: 'Browse events', icon: CalendarDays },
          { href: '/student/events', label: 'My events', icon: IdCard },
          { href: '/student/profile', label: 'Edit profile', icon: Edit3 },
        ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Button
            key={action.href}
            asChild
            variant={action.href === '/events' ? 'default' : 'outline'}
            className="h-12 w-full justify-between rounded-lg px-4"
          >
            <Link href={action.href}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {action.label}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )
      })}
    </div>
  )
}

export default async function StudentDashboard() {
  const { supabase, user } = await requireUser()
  const dashboard = await StudentDashboardService.getActivationDashboard(supabase, user.id)
  const chapterOptions =
    dashboard.status === 'participant'
      ? await StudentDashboardService.getChapterApplicationOptions(supabase)
      : []
  const content = STATUS_CONTENT[dashboard.status]
  const StatusIcon = content.icon

  return (
    <MainContainer maxWidth="7xl" className="space-y-6 py-6 pb-24 sm:py-8">
      <section className="space-y-4">
        <Badge variant={content.badgeVariant} size="lg">
          {content.badge}
        </Badge>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Welcome{user.name ? `, ${user.name}` : ''}
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">{content.body}</p>
          </div>
          <PrimaryActions dashboard={dashboard} />
        </div>
      </section>

      <Card className="rounded-lg">
        <CardContent className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <StatusIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{content.title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {dashboard.membership?.chapter?.name
                ? `${dashboard.membership.chapter.name} - ${dashboard.membership.chapter.university}`
                : 'Your event and chapter activity will appear here as you use the platform.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <ParticipantApplicationCard dashboard={dashboard} chapterOptions={chapterOptions} />
          <ProfileReadinessCard dashboard={dashboard} />
        </div>
        <MembershipDetailsCard dashboard={dashboard} />
      </div>
    </MainContainer>
  )
}
