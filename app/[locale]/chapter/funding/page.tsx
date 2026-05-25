import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'
import { Icons } from '@/components/ui/icons'
import { FundingStatusBadge } from '@/components/funding/funding-status-badge'
import { getChapterFundingData } from '@/lib/actions/funding/get-data'
import {
  FUNDING_STATUS_HELPER,
  FUNDING_STATUS_LABELS,
  formatFundingCurrency,
  formatFundingDate,
} from '@/lib/funding-display'
import type { FundingRequestRow, FundingRequestStatus } from '@/lib/services/funding.service'

const ACTIVE_STATUSES: FundingRequestStatus[] = ['draft', 'submitted', 'changes_requested', 'approved', 'receipts_due']

function getStatusCount(requests: FundingRequestRow[], status: FundingRequestStatus) {
  return requests.filter(request => request.status === status).length
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
  const canEdit = status === 'draft' || status === 'changes_requested'
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <FundingStatusBadge status={status} />
              {request.is_late_request && <Badge variant="warning">Solicitud tardia</Badge>}
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{request.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.purpose}</p>
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-lg font-semibold">{formatFundingCurrency(request.requested_amount, request.currency)}</p>
            <p className="text-xs text-muted-foreground">Solicitado</p>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Fecha</p>
            <p className="font-medium">{formatFundingDate(request.event_date)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Aprobado</p>
            <p className="font-medium">
              {request.approved_amount == null ? 'Pendiente' : formatFundingCurrency(request.approved_amount, request.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Siguiente accion</p>
            <p className="font-medium">{FUNDING_STATUS_HELPER[status]}</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end border-t pt-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/chapter/funding/${request.id}/edit`}>
                Continuar solicitud
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function ChapterFundingPage() {
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

  const requests = result.data
  const activeRequests = requests.filter(request => ACTIVE_STATUSES.includes(request.status as FundingRequestStatus))
  const closedRequests = requests.filter(request => request.status === 'closed' || request.status === 'rejected')

  return (
    <MainContainer className="space-y-8 py-8">
      <Breadcrumb
        items={[
          { label: 'Resumen', href: '/chapter' },
          { label: 'Financiamiento' },
        ]}
      />

      <PageHeader
        eyebrow="Herramientas del capitulo"
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
        <StatBlock label="En revision" value={getStatusCount(requests, 'submitted')} helper="Pendientes de admin/finanzas" />
        <StatBlock label="Aprobadas" value={getStatusCount(requests, 'approved')} helper="Con seguimiento posterior" />
        <StatBlock label="Comprobantes" value={getStatusCount(requests, 'receipts_due')} helper="Pendientes de regularizar" />
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Icons.FileText className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Todavia no hay solicitudes</h2>
            <p className="mx-auto mt-2 mb-6 max-w-md text-sm text-muted-foreground">
              Crea una solicitud cuando tu chapter necesite apoyo para un evento o iniciativa con impacto claro.
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
            <div>
              <h2 className="text-lg font-semibold">Solicitudes activas</h2>
              <p className="text-sm text-muted-foreground">Borradores, revision, aprobadas y comprobantes pendientes.</p>
            </div>
            {activeRequests.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No hay solicitudes activas.
                </CardContent>
              </Card>
            ) : (
              activeRequests.map(request => <FundingRequestCard key={request.id} request={request} />)
            )}
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ACTIVE_STATUSES.map(status => (
                  <div key={status} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{FUNDING_STATUS_LABELS[status]}</span>
                    <Badge variant="secondary">{getStatusCount(requests, status)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {closedRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {closedRequests.slice(0, 4).map(request => (
                    <div key={request.id} className="space-y-1 rounded-md border border-border/60 p-3">
                      <FundingStatusBadge status={request.status} />
                      <p className="line-clamp-1 text-sm font-medium">{request.title}</p>
                      <p className="text-xs text-muted-foreground">{formatFundingDate(request.event_date)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      )}
    </MainContainer>
  )
}
