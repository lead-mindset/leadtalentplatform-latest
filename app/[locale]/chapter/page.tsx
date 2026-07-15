import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense, cache } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { requireChapterMember } from '@/lib/auth'
import type { MemberWithProfile, RecentActivityMember } from '@/lib/types'
import { getTranslations } from 'next-intl/server'
import {
  getChapterOverviewRoster,
  getMemberStats,
} from '@/lib/actions/chapter/get-data'
import type { ChapterMemberPermissionFlags } from '@/lib/services/chapter.service'
import { getChapterEvents } from '@/lib/actions/events/get-data'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { BoardGuideDialog } from '@/components/board-guide-dialog'
import { BOARD_GUIDES } from '@/lib/board-guides'
import { DashboardPendingCard } from './dashboard-pending-card'
import { MainContainer } from '@/components/global/main-container'
import { ChapterHeader } from './chapter-header'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  variant = 'default',
}: {
  label: string
  value: number
  sub?: string
  icon: React.ElementType
  variant?: 'default' | 'warning' | 'success' | 'info'
}) {
  const iconClass =
    variant === 'warning'
      ? 'text-warning'
      : variant === 'success'
      ? 'text-success'
      : variant === 'info'
      ? 'text-info'
      : 'text-muted-foreground'

  const valueClass =
    variant === 'warning'
      ? 'text-warning'
      : variant === 'success'
      ? 'text-success'
      : 'text-foreground'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-12 rounded bg-muted" />
        <div className="mt-2 h-3 w-28 rounded bg-muted" />
      </CardContent>
    </Card>
  )
}

function PendingInbox({
  members,
  total,
  permissions,
}: {
  members: MemberWithProfile[]
  total: number
  permissions: ChapterMemberPermissionFlags
}) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <Icons.CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="font-medium text-foreground">Todo al dia</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay miembros esperando aprobación
          </p>
        </CardContent>
      </Card>
    )
  }

  const preview = members.slice(0, 3)
  const remaining = total - preview.length

  return (
    <div className="space-y-3">
      {preview.map(member => (
        <DashboardPendingCard
          key={member.id}
          member={member}
          permissions={permissions}
        />
      ))}
      {remaining > 0 && (
        <Button asChild variant="outline" className="w-full">
          <Link href="/chapter/members?status=pending">
            Ver {remaining} postulante{remaining > 1 ? 's' : ''} pendiente{remaining > 1 ? 's' : ''} mas
            <Icons.ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}

function RecentApprovals({ members, t }: { members: RecentActivityMember[]; t: (key: string) => string }) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Los miembros aprobados aparecerán aquí
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {members.map(member => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-md px-2 py-2.5"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{member.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {member.person_profile.major_or_interest ?? 'No major listed'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground ml-3 shrink-0">
            {new Date(member.person_profile.updated_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      ))}
    </div>
  )
}

function QuickLinks({
  pendingCount,
}: {
  pendingCount: number
}) {
  const links = [
    { label: 'Crear evento', href: '/chapter/events/new' },
    { label: 'Gestionar miembros', href: `/chapter/members?status=${pendingCount > 0 ? 'pending' : 'active'}` },
    { label: 'Abrir check-in', href: '/chapter/checkin' },
  ]

  return (
    <div className="space-y-0.5">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors group"
        >
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">{link.label}</span>
          <Icons.ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      ))}
    </div>
  )
}

function EventOpsList({
  events,
}: {
  events: Awaited<ReturnType<typeof getChapterEvents>>
}) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Todavía no hay eventos próximos del capítulo. Crea el primero para abrir registros.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {events.slice(0, 4).map((event) => {
        const capacity = event.capacity
        const registrations = event._count.registrations
        const percentage = capacity && capacity > 0
          ? Math.min(100, Math.round((registrations / capacity) * 100))
          : null

        return (
          <Card key={event.id}>
            <CardContent className="space-y-3 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium leading-5">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.start_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="grid shrink-0 gap-2 sm:flex">
                  <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                      <Link href={`/chapter/events/${event.id}`}>Gestionar</Link>
                  </Button>
                  {event.is_published && (
                    <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                      <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {capacity === null
                  ? `${registrations} registrados`
                  : `${registrations} / ${capacity} registrados`}
              </p>
              {percentage !== null && (
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const getUpcomingChapterEvents = cache(async function getUpcomingChapterEvents() {
  const events = await getChapterEvents()
  const now = new Date()

  return events.filter((event) => new Date(event.end_at) >= now)
})

async function UpcomingEventsStatCard() {
  const upcomingEvents = await getUpcomingChapterEvents()

  return (
    <StatCard
      label="Eventos próximos"
      value={upcomingEvents.length}
      sub="Listos para operar"
      icon={Icons.UserCheck}
      variant="success"
    />
  )
}

function EventOpsListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(2)].map((_, index) => (
        <Card key={index}>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-4 w-44 rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted" />
              </div>
              <div className="h-8 w-24 rounded bg-muted" />
            </div>
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="h-2 rounded-full bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function UpcomingEventOps() {
  const upcomingEvents = await getUpcomingChapterEvents()

  return <EventOpsList events={upcomingEvents} />
}

async function ChapterContent() {
  const { supabase, user, chapter_id } = await requireChapterMember()

  const { data: chapter } = await supabase
    .from('chapter')
    .select('id, name, university')
    .eq('id', chapter_id)
    .maybeSingle()

  if (!chapter) {
    return (
      <Card className="max-w-md mx-auto mt-20">
        <CardHeader>
          <CardTitle>Sin capítulo asignado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No tienes un capítulo asignado. Contacta a una persona administradora.
          </p>
        </CardContent>
      </Card>
    )
  }

  const overviewRoster = await getChapterOverviewRoster(chapter_id, 4)
  const allMembers = overviewRoster?.members ?? []
  const recentActivity = overviewRoster?.recentActivity ?? []
  const memberPermissions = overviewRoster?.permissions ?? null
  const tCareers = await getTranslations('careers')

  const stats = getMemberStats(allMembers)
  const approvalRate =
    stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

  const pending_members = allMembers.filter(
    m => m.person_profile && m.chapter_membership?.status === 'pending'
  )

  const eboardRoleLevel = await ChapterPermissionService.getEboardRoleLevel(supabase, user.id, chapter_id)

  return (
    <MainContainer className="py-8 space-y-8">
      <ChapterHeader
        roleLevel={eboardRoleLevel}
        title="Resumen del capítulo"
        subtitle={`${chapter?.name} - ${chapter?.university}`}
      >
        {eboardRoleLevel && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {BOARD_GUIDES[eboardRoleLevel]?.roleOverview}
          </p>
        )}
      </ChapterHeader>

      {stats.total === 0 && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="font-medium">Tu capítulo todavía no tiene miembros.</p>
            <p className="text-sm text-muted-foreground">
              Comparte las indicaciones de postulación para que estudiantes completen su perfil y aparezcan aquí.
            </p>
            <Button asChild variant="outline">
              <Link href="/chapter/members">Gestionar miembros</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Miembros"
          value={stats.total}
          sub="En tu capítulo"
          icon={Icons.Users}
        />
        <StatCard
          label="Pendientes"
          value={stats.pending}
          sub="Necesitan revisión"
          icon={Icons.Clock}
          variant="warning"
        />
        <Suspense fallback={<StatCardSkeleton label="Eventos próximos" icon={Icons.UserCheck} />}>
          <UpcomingEventsStatCard />
        </Suspense>
        <StatCard
          label="Tasa de aprobación"
          value={approvalRate}
          sub="Porcentaje de miembros aprobados"
          icon={Icons.TrendingUp}
          variant="info"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {stats.pending > 0 && (
            <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Aprobaciones pendientes</h2>
                    <p className="text-sm text-muted-foreground">
                      {stats.pending} miembro{stats.pending > 1 ? 's' : ''} esperando tu decisión
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.pending > 3 && (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/chapter/members?status=pending">
                          <span className="flex items-center">
                            Ver todo
                            <Icons.ChevronRight className="ml-1 h-4 w-4" />
                          </span>
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                      <Link href="/chapter/members">
                        Ir a miembros
                        <Icons.ChevronRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

              <PendingInbox
                members={pending_members}
                total={stats.pending}
                permissions={memberPermissions ?? {
                  canViewApproved: false,
                  canViewAlumni: false,
                  canViewMemberContact: false,
                  canViewApplicants: false,
                  canViewRejected: false,
                  canViewInactive: false,
                  canManageApplications: false,
                  canRevokeMembers: false,
                  canAssignEboard: false,
                }}
              />
            </>
          )}

          <div className="space-y-2">
            <h2 className="text-base font-semibold">Eventos próximos</h2>
            <p className="text-sm text-muted-foreground">Monitorea el volumen de registros antes del evento.</p>
          </div>
          <Suspense fallback={<EventOpsListSkeleton />}>
            <UpcomingEventOps />
          </Suspense>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Aprobaciones recientes</CardTitle>
                <Button asChild variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                  <Link href="/chapter/members?status=approved">Ver todo</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <RecentApprovals members={recentActivity as RecentActivityMember[]} t={tCareers} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Accesos rapidos</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <QuickLinks pendingCount={stats.pending} />
            </CardContent>
          </Card>

          {eboardRoleLevel && (
            <BoardGuideDialog roleLevel={eboardRoleLevel}>
              <Card variant="interactive">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Guia de JD</CardTitle>
                    <Icons.BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>
                    Manual, FAQ y contacto para tu rol en junta directiva
                  </CardDescription>
                </CardHeader>
              </Card>
            </BoardGuideDialog>
          )}
        </div>
      </div>
    </MainContainer>
  )
}

function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-52 bg-muted rounded-md" />
        <div className="h-4 w-72 bg-muted rounded-md mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted rounded mb-2" />
              <div className="h-3 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-36 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><div className="h-4 w-28 bg-muted rounded" /></CardHeader>
            <CardContent className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ChapterOverviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChapterContent />
    </Suspense>
  )
}
