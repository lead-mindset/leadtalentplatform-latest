import Link from 'next/link'
import type { ElementType } from 'react'
import { Suspense } from 'react'
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getAdminDashboardStats,
  getChapterActivityList,
  getPendingRecruiterRequests,
  getRecentJoins,
  getSystemStats,
} from '@/lib/actions/admin/get-data'
import { formatLeadDate } from '@/lib/utils/date-format'

function formatDate(value: string | null) {
  return formatLeadDate(value, 'Sin actividad')
}

function StatTile({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: number | string
  helper: string
  icon: ElementType
  tone?: 'neutral' | 'attention' | 'success'
}) {
  const toneClass =
    tone === 'attention'
      ? 'bg-warning/10 text-warning'
      : tone === 'success'
        ? 'bg-success/10 text-success'
        : 'bg-muted text-muted-foreground'

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  )
}

function QueueRow({
  label,
  value,
  href,
  helper,
}: {
  label: string
  value: number
  href: string
  helper: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={value > 0 ? 'warning' : 'success'}>{value}</Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  )
}

function ManagementLink({
  label,
  href,
  helper,
  icon: Icon,
}: {
  label: string
  href: string
  helper: string
  icon: ElementType
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-sm leading-5 text-muted-foreground">{helper}</p>
      </div>
    </Link>
  )
}

function StatTileSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="w-full">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="mt-3 h-8 w-12 rounded bg-muted" />
        </div>
        <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
      </div>
      <div className="mt-2 h-3 w-32 rounded bg-muted" />
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <StatTileSkeleton key={index} />
      ))}
    </div>
  )
}

function PanelSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Cargando datos recientes de administracion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg border p-3">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="mt-2 h-3 w-56 rounded bg-muted" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

async function AdminStatsSection() {
  const [dashboardStats, systemStats] = await Promise.all([
    getAdminDashboardStats(),
    getSystemStats(),
  ])

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatTile
        label="Usuarios"
        value={systemStats.total_users}
        helper="Cuentas en la plataforma"
        icon={Users}
      />
      <StatTile
        label="Capitulos"
        value={systemStats.total_chapters}
        helper={`${dashboardStats.active_chapters} con miembros`}
        icon={Building2}
      />
      <StatTile
        label="Empresas"
        value={systemStats.total_companies}
        helper="Acceso controlado por invitacion"
        icon={Building2}
      />
      <StatTile
        label="Eventos"
        value={dashboardStats.events_this_month}
        helper="Inician este mes"
        icon={CalendarDays}
      />
      <StatTile
        label="Aprobaciones"
        value={dashboardStats.pending_chapter_approvals}
        helper="Solicitudes de capitulo"
        icon={Clock}
        tone={dashboardStats.pending_chapter_approvals > 0 ? 'attention' : 'success'}
      />
      <StatTile
        label="Visibilidad empresa"
        value={`${dashboardStats.recruiter_opt_in_rate}%`}
        helper="Perfiles aprobados visibles"
        icon={CheckCircle2}
        tone="success"
      />
    </div>
  )
}

async function AdminQueuesSection() {
  const [chapterActivity, pendingCompanyInvites, systemStats] = await Promise.all([
    getChapterActivityList(),
    getPendingRecruiterRequests(),
    getSystemStats(),
  ])

  const pendingChapterApprovals = chapterActivity.reduce(
    (total, chapter) => total + chapter.pending_approvals,
    0
  )
  const pendingCompanyInviteCount = pendingCompanyInvites.length

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Cola prioritaria</CardTitle>
            <CardDescription>Elementos que requieren seguimiento administrativo o del capitulo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QueueRow
              label="Invitaciones de empresa"
              value={pendingCompanyInviteCount}
              href="/admin/invites"
              helper="Enviadas, no aceptadas o revocadas"
            />
            <QueueRow
              label="Aprobaciones de capitulo"
              value={pendingChapterApprovals}
              href="/admin/chapters"
              helper="Solicitudes de membresia pendientes"
            />
            <QueueRow
              label="Perfiles visibles a empresas"
              value={systemStats.visibleProfiles}
              href="/admin/users"
              helper="Perfiles aprobados con visibilidad activa"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Actividad de capitulos</CardTitle>
            <CardDescription>Miembros, aprobaciones abiertas y actividad reciente de eventos.</CardDescription>
          </CardHeader>
          <CardContent>
            {chapterActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay actividad de capitulos.</p>
            ) : (
              <div className="divide-y">
                {chapterActivity.slice(0, 6).map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{chapter.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {chapter.member_count} miembros {' '}&middot;{' '}{chapter.pending_approvals} pendientes
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-muted-foreground">{formatDate(chapter.last_event_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {pendingCompanyInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acceso de empresas pendiente</CardTitle>
            <CardDescription>Representantes de empresa esperando aceptar acceso.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {pendingCompanyInvites.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-medium">{request.recruiter_email}</p>
                <p className="truncate text-sm text-muted-foreground">{request.company_name ?? 'Empresa sin nombre'}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/invites">Abrir</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  )
}

async function RecentJoinsSection() {
  const recentJoins = await getRecentJoins(8)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Altas recientes</CardTitle>
        <CardDescription>Ultimas cuentas creadas.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentJoins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay altas recientes.</p>
        ) : (
          <div className="divide-y">
            {recentJoins.map((join) => (
              <div key={join.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{join.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{join.email}</p>
                  </div>
                  <Badge variant="outline">{join.role}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {join.chapter_name ?? 'Sin capitulo'} {' '}&middot;{' '}{formatDate(join.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Resumen administrativo</h1>
          <p className="max-w-3xl text-muted-foreground">
            Monitorea colas operativas, cobertura de plataforma y accesos de gestion.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/activity">Actividad</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/invites">Revisar invitaciones</Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <AdminStatsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <PanelSkeleton title="Cola prioritaria" />
            <PanelSkeleton title="Actividad de capitulos" />
          </div>
        }
      >
        <AdminQueuesSection />
      </Suspense>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Gestion</CardTitle>
            <CardDescription>Accesos operativos frecuentes sin navegacion adicional.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ManagementLink label="Usuarios" href="/admin/users" helper="Roles, perfiles y aprobaciones" icon={Users} />
            <ManagementLink label="Capitulos" href="/admin/chapters" helper="Metadata y editores" icon={Building2} />
            <ManagementLink label="Empresas" href="/admin/companies" helper="Organizaciones y acceso" icon={Building2} />
            <ManagementLink label="Eventos" href="/admin/events" helper="Supervision de eventos" icon={CalendarDays} />
            <ManagementLink label="Invitaciones" href="/admin/invites" helper="Acceso por invitacion" icon={Mail} />
            <ManagementLink label="Actividad" href="/admin/activity" helper="Cambios administrativos" icon={Activity} />
          </CardContent>
        </Card>

        <Suspense fallback={<PanelSkeleton title="Altas recientes" />}>
          <RecentJoinsSection />
        </Suspense>
      </div>
    </div>
  )
}
