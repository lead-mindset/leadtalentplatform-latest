import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Suspense } from 'react'
import { Icons } from '@/components/ui/icons'
import { requireChapterMember } from '@/lib/auth'
import type { MemberWithProfile, RecentActivityMember } from '@/lib/types'
import { getChapterMembers, getMemberStats, getRecentChapterActivity } from '@/lib/actions/chapter/get-data'
import { getChapterEvents } from '@/lib/actions/events/get-data'
import MemberCard from './members/components/member-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import {
  PathwayCheckInService,
  type ChapterAggregateTrend,
  type ChapterPathwayInsights,
} from '@/lib/services/pathway-check-in.service'

const INSIGHT_LABELS: Record<string, string> = {
  explore_career_paths: 'Explorar caminos de carrera',
  build_technical_experience: 'Construir experiencia tecnica',
  prepare_for_opportunities: 'Prepararse para oportunidades',
  find_community_mentorship: 'Encontrar comunidad y mentoria',
  start_leading: 'Empezar a liderar',
  dont_know_where_to_start: 'No saben por donde empezar',
  need_more_experience: 'Necesitan mas experiencia',
  need_people_to_guide_me: 'Necesitan guia y mentoria',
  need_career_prep: 'Necesitan preparacion profesional',
  explorer: 'Explorer',
  builder: 'Builder',
  leader: 'Leader',
  candidate: 'Candidate',
  emerging_professional: 'Emerging Professional',
  career_exploration: 'Career exploration',
  technical_experience: 'Technical experience',
  opportunity_readiness: 'Opportunity readiness',
  community_mentorship: 'Community and mentorship',
  leadership: 'Leadership',
}

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

function PendingInbox({
  members,
  total,
}: {
  members: MemberWithProfile[]
  total: number
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
            No hay miembros esperando aprobacion
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
        <MemberCard
          key={member.id}
          member={member}

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

function RecentApprovals({ members }: { members: RecentActivityMember[] }) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Los miembros aprobados apareceran aqui
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {members.map(member => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-md px-2 py-2.5 hover:bg-accent transition-colors"
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

function InsightTrendList({
  title,
  items,
}: {
  title: string
  items: ChapterAggregateTrend[]
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item.value} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-muted-foreground">
                {INSIGHT_LABELS[item.value] ?? item.value}
              </span>
              <span className="rounded-md bg-background px-2 py-1 text-xs font-semibold text-foreground">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Todavia no hay suficientes senales.</p>
      )}
    </div>
  )
}

function PathwayInsightsCard({ insights }: { insights: ChapterPathwayInsights }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icons.TrendingUp className="h-4 w-4 text-primary" />
          Senales de crecimiento del capitulo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Vista agregada para planear mejor. No muestra respuestas individuales ni contenido privado
          de Growth Reflections.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="text-xs font-medium text-muted-foreground">Check-Ins completados</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {insights.completedCheckIns}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {insights.completionRate}% de miembros aprobados
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="text-xs font-medium text-muted-foreground">Reflections completadas</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {insights.completedReflections}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Aprendizajes convertidos en claridad</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="text-xs font-medium text-muted-foreground">Proof items creados</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {insights.proofItemsCreated}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Evidencia de crecimiento privada</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InsightTrendList title="Necesidades mas comunes" items={insights.topNeeds} />
          <InsightTrendList title="Blockers mas comunes" items={insights.topBlockers} />
          <InsightTrendList title="Growth stages" items={insights.growthStages} />
          <InsightTrendList title="Primary focus" items={insights.primaryFocuses} />
        </div>
      </CardContent>
    </Card>
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
          Todavia no hay eventos proximos del chapter. Crea el primero para abrir registros.
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
            <CardContent className="py-4 space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium truncate">{event.title}</p>
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

async function ChapterContent() {
  const { supabase, chapter_id } = await requireChapterMember()

  const { data: chapter } = await supabase
    .from('chapter')
    .select('id, name, university')
    .eq('id', chapter_id)
    .maybeSingle()

  if (!chapter) {
    return (
      <Card className="max-w-md mx-auto mt-20">
        <CardHeader>
          <CardTitle>Sin chapter asignado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No tienes un chapter asignado. Contacta a una persona administradora.
          </p>
        </CardContent>
      </Card>
    )
  }

  const [allMembers, recentActivity, chapterEvents, pathwayInsights] = await Promise.all([
    getChapterMembers(chapter_id),
    getRecentChapterActivity(chapter_id, 4),
    getChapterEvents(),
    PathwayCheckInService.getChapterAggregateInsights(supabase, chapter_id),
  ])

  const stats = getMemberStats(allMembers)
  const approvalRate =
    stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

  const pending_members = allMembers.filter(
    m => m.person_profile && m.chapter_membership?.status === 'pending'
  )
  const upcomingEventsCount = chapterEvents.filter((event) => new Date(event.end_at) >= new Date()).length

  return (
    <MainContainer className="w-full max-w-full py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ label: 'Resumen', href: '/chapter' }]} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Resumen del chapter</h1>
          <p className="max-w-2xl text-muted-foreground">
            {chapter?.name} - {chapter?.university}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/chapter/events/new">
              <Icons.Plus className="mr-2 h-4 w-4" />
              Crear evento
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/chapter/events">Gestionar eventos</Link>
          </Button>
        </div>
      </div>

      {stats.total === 0 && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="font-medium">Tu chapter todavia no tiene miembros.</p>
            <p className="text-sm text-muted-foreground">
              Comparte las indicaciones de postulacion para que estudiantes completen su perfil y aparezcan aqui.
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
          sub="En tu chapter"
          icon={Icons.Users}
        />
        <StatCard
          label="Pendientes"
          value={stats.pending}
          sub="Necesitan revision"
          icon={Icons.Clock}
          variant="warning"
        />
        <StatCard
          label="Eventos proximos"
          value={upcomingEventsCount}
          sub="Listos para operar"
          icon={Icons.UserCheck}
          variant="success"
        />
        <StatCard
          label="Tasa de aprobacion"
          value={approvalRate}
          sub="Porcentaje de miembros aprobados"
          icon={Icons.TrendingUp}
          variant="info"
        />
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <PathwayInsightsCard insights={pathwayInsights} />

          {stats.pending > 0 && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">Aprobaciones pendientes</h2>
                  <p className="text-sm text-muted-foreground">
                    {stats.pending} miembro{stats.pending > 1 ? 's' : ''} esperando tu decision
                  </p>
                </div>
                {stats.pending > 3 && (
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href="/chapter/members?status=pending">
                      <span className="flex items-center">
                        Ver todo
                        <Icons.ChevronRight className="ml-1 h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                )}
              </div>

              <PendingInbox
                members={pending_members}
                total={stats.pending}
              />
            </>
          )}

          <div className="space-y-2">
            <h2 className="text-base font-semibold">Eventos proximos</h2>
            <p className="text-sm text-muted-foreground">Monitorea el volumen de registros antes del evento.</p>
          </div>
          <EventOpsList events={chapterEvents.filter((event) => new Date(event.end_at) >= new Date())} />
        </div>

        <div className="min-w-0 space-y-4">
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
              <RecentApprovals members={recentActivity as RecentActivityMember[]} />
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
