import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'
import { Icons } from '@/components/ui/icons'
import { FundingStatusBadge } from '@/components/funding/funding-status-badge'
import { getChapterFundingData } from '@/lib/actions/funding/get-data'
import {
  FUNDING_STATUS_LABELS,
  formatFundingCurrency,
  formatFundingDate,
} from '@/lib/funding-display'
import type { FundingRequestRow, FundingRequestStatus } from '@/lib/services/funding.service'
import { ComingSoon } from '@/components/ui/coming-soon'



function getStatusCount(requests: FundingRequestRow[], status: FundingRequestStatus) {
  return requests.filter(request => request.status === status).length
}

function relativeTime(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `Hace ${days} días`
}

function StatBlock({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

function FundingRequestCard({ request }: { request: FundingRequestRow }) {
  const status = request.status as FundingRequestStatus

  let actionLabel: string
  let actionHref: string
  if (status === 'draft' || status === 'changes_requested') {
    actionLabel = 'Continuar solicitud'
    actionHref = `/chapter/funding/${request.id}/edit`
  } else if (status === 'submitted') {
    actionLabel = 'Ver detalle'
    actionHref = `/chapter/funding/${request.id}`
  } else if (status === 'approved') {
    actionLabel = 'Ver comprobante'
    actionHref = `/chapter/funding/${request.id}`
  } else if (status === 'receipts_due') {
    actionLabel = 'Subir comprobante'
    actionHref = `/chapter/funding/${request.id}`
  } else {
    actionLabel = 'Ver detalle'
    actionHref = `/chapter/funding/${request.id}`
  }

  return (
    <Card>
      <CardContent className="space-y-3 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <FundingStatusBadge status={status} />
              {request.is_late_request && <Badge variant="destructive">Solicitud tardía</Badge>}
            </div>
            <div>
              <p className="line-clamp-2 break-words font-headline text-lg font-semibold leading-tight tracking-tight text-foreground">{request.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.purpose}</p>
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-lg font-semibold">{formatFundingCurrency(request.requested_amount, request.currency)}</p>
            <p className="text-xs text-muted-foreground">Solicitado</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p className="whitespace-nowrap font-medium">{formatFundingDate(request.event_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Creada</p>
              <p className="whitespace-nowrap font-medium">{relativeTime(request.created_at)}</p>
            </div>
            {request.approved_amount != null && (
              <div>
                <p className="text-xs text-muted-foreground">Aprobado</p>
                <p className="whitespace-nowrap font-medium">{formatFundingCurrency(request.approved_amount, request.currency)}</p>
              </div>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function ChapterFundingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const result = await getChapterFundingData()

  if (!result.success) {
    return (
      <MainContainer className="py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <Icons.AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <h1 className="text-xl font-semibold">No se pudo cargar financiamiento</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{result.error}</p>
          </CardContent>
        </Card>
      </MainContainer>
    )
  }

  const LIFECYCLE_STATUSES: FundingRequestStatus[] = ['draft', 'submitted', 'changes_requested', 'approved']
  const ACTION_STATUSES: FundingRequestStatus[] = ['receipts_due']

  const requests = result.data
  const activeFilter = filter && [...LIFECYCLE_STATUSES, ...ACTION_STATUSES].includes(filter as FundingRequestStatus)
    ? (filter as FundingRequestStatus)
    : undefined
  const activeRequests = requests.filter(request =>
    [...LIFECYCLE_STATUSES, ...ACTION_STATUSES].includes(request.status as FundingRequestStatus)
  )
  const filteredRequests = activeFilter
    ? activeRequests.filter(request => request.status === activeFilter)
    : activeRequests
  const closedRequests = requests.filter(request => request.status === 'closed' || request.status === 'rejected')

  return (
    <ComingSoon
      title="Estamos revolucionando el financiamiento"
      description="Solicita fondos para tus iniciativas y da seguimiento a cada solicitud desde un solo lugar."
    >
      <MainContainer className="space-y-8 py-8">
        <PageHeader
          title="Financiamiento"
          description="Solicita apoyo para eventos o iniciativas y mantén visible el estado de revisión y comprobantes."
          actions={
            <Button asChild>
              <Link href="/chapter/funding/new">
                <Icons.Plus className="mr-2 h-4 w-4" />
                Nueva solicitud
              </Link>
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock label="Activas" value={activeRequests.length} helper="Abiertas o en seguimiento" />
          <StatBlock label="En revisión" value={getStatusCount(requests, 'submitted')} helper="Pendientes de admin/finanzas" />
          <StatBlock label="Aprobadas" value={getStatusCount(requests, 'approved')} helper="Con seguimiento posterior" />
          <StatBlock label="Comprobantes" value={getStatusCount(requests, 'receipts_due')} helper="Pendientes de regularizar" />
        </div>

        {requests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Icons.FileText className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Todavía no hay solicitudes</h2>
              <p className="mx-auto mt-2 mb-6 max-w-md text-sm text-muted-foreground">
                Crea una solicitud cuando tu capítulo necesite apoyo para un evento o iniciativa con impacto claro.
              </p>
              <Button asChild>
                <Link href="/chapter/funding/new">
                  <Icons.Plus className="mr-2 h-4 w-4" />
                  Nueva solicitud
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Solicitudes activas</h2>
                  <p className="text-sm text-muted-foreground">
                    {activeFilter ? FUNDING_STATUS_LABELS[activeFilter] : 'Todas las activas'}
                  </p>
                </div>
                {activeFilter ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/chapter/funding">Limpiar filtro</Link>
                  </Button>
                ) : null}
              </div>
              {filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No hay solicitudes{activeFilter ? ` en "${FUNDING_STATUS_LABELS[activeFilter]}"` : ''}.
                  </CardContent>
                </Card>
              ) : (
                filteredRequests.map(request => <FundingRequestCard key={request.id} request={request} />)
              )}
            </div>

            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Filtrar por estado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Link
                    href="/chapter/funding"
                    className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${!activeFilter ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
                  >
                    Todas <Badge variant="outline">{activeRequests.length}</Badge>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {LIFECYCLE_STATUSES.map(status => {
                    const count = getStatusCount(requests, status)
                    if (count === 0) return null
                    const isActive = activeFilter === status
                    return (
                      <Link
                        key={status}
                        href={`/chapter/funding?filter=${status}`}
                        className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${isActive ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
                      >
                        {FUNDING_STATUS_LABELS[status]}
                        <Badge variant="outline">{count}</Badge>
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Requiere tu atención</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {ACTION_STATUSES.map(status => {
                    const count = getStatusCount(requests, status)
                    if (count === 0) return null
                    const isActive = activeFilter === status
                    return (
                      <Link
                        key={status}
                        href={`/chapter/funding?filter=${status}`}
                        className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${isActive ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          {FUNDING_STATUS_LABELS[status]}
                        </span>
                        <Badge variant="outline">{count}</Badge>
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>

              {closedRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Historial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {closedRequests.slice(0, 4).map(request => (
                      <Link key={request.id} href={`/chapter/funding/${request.id}`} className="block space-y-1 rounded-md border border-border/60 p-3 transition-colors hover:bg-muted">
                        <FundingStatusBadge status={request.status} />
                        <p className="line-clamp-1 text-sm font-medium">{request.title}</p>
                        <p className="text-xs text-muted-foreground">{formatFundingDate(request.event_date)}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        )}
      </MainContainer>
    </ComingSoon>
  )
}
