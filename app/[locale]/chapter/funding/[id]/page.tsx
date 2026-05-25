import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'
import { FundingStatusBadge } from '@/components/funding/funding-status-badge'
import { getFundingRequestDetail } from '@/lib/actions/funding/get-data'
import {
  FUNDING_BUDGET_CATEGORY_LABELS,
  FUNDING_OKR_LABELS,
  FUNDING_PILLAR_LABELS,
  formatFundingCurrency,
  formatFundingDate,
} from '@/lib/funding-display'
import type {
  FundingBudgetCategory,
  FundingOkrKey,
  FundingPillarKey,
  FundingRequestStatus,
} from '@/lib/services/funding.service'
import { FundingAccountabilityPanel } from './_components/funding-accountability-panel'

function isOverdue(value: string | null, submittedAt: string | null) {
  if (!value || submittedAt) return false
  const dueAt = new Date(`${value}T23:59:59`)
  return dueAt.getTime() < Date.now()
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words font-medium">{value}</p>
    </div>
  )
}

export default async function ChapterFundingDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const result = await getFundingRequestDetail(id)

  if (!result.success) {
    return (
      <MainContainer className="py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h1 className="text-xl font-semibold">No se pudo cargar la solicitud</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{result.error}</p>
            <Button asChild className="mt-6">
              <Link href={`/${locale}/chapter/funding`}>Volver a financiamiento</Link>
            </Button>
          </CardContent>
        </Card>
      </MainContainer>
    )
  }

  const detail = result.data
  const request = detail.request
  const status = request.status as FundingRequestStatus
  const okrs = (request.okr_keys ?? []) as FundingOkrKey[]
  const pillars = (request.pillar_keys ?? []) as FundingPillarKey[]
  const overdue = isOverdue(request.accountability_due_at, request.accountability_submitted_at)
  const editable = status === 'draft' || status === 'changes_requested'

  return (
    <MainContainer className="space-y-8 py-8">
      <Breadcrumb
        items={[
          { label: 'Resumen', href: `/${locale}/chapter` },
          { label: 'Financiamiento', href: `/${locale}/chapter/funding` },
          { label: request.title },
        ]}
      />

      <PageHeader
        eyebrow="Financiamiento del chapter"
        title={request.title}
        description="Revisa el estado, presupuesto, comprobantes y reflexion post-evento de esta solicitud."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FundingStatusBadge status={status} />
            {request.is_late_request && <Badge variant="warning">Solicitud tardia</Badge>}
            {overdue && <Badge variant="warning">Comprobantes vencidos</Badge>}
            {editable && (
              <Button asChild variant="outline">
                <Link href={`/${locale}/chapter/funding/${request.id}/edit`}>Editar</Link>
              </Button>
            )}
          </div>
        }
      />

      {overdue && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="py-4 text-sm">
            Los comprobantes o evidencia estan vencidos. Esto no bloquea nuevas solicitudes en v1, pero ayuda a cerrar el ciclo con transparencia.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">{request.purpose}</p>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <MetaBlock label="Fecha" value={formatFundingDate(request.event_date)} />
                <MetaBlock label="Solicitado" value={formatFundingCurrency(request.requested_amount, request.currency)} />
                <MetaBlock label="Aprobado" value={request.approved_amount == null ? 'Pendiente' : formatFundingCurrency(request.approved_amount, request.currency)} />
                <MetaBlock label="Gasto real" value={request.actual_spend_amount == null ? 'Pendiente' : formatFundingCurrency(request.actual_spend_amount, request.currency)} />
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <MetaBlock label="Audiencia" value={request.expected_audience} />
                <MetaBlock label="Asistencia esperada" value={request.expected_attendee_count == null ? 'No indicada' : String(request.expected_attendee_count)} />
                <MetaBlock label="Partner" value={request.partner_name ?? 'Sin partner'} />
                <MetaBlock label="Limite comprobantes" value={formatFundingDate(request.accountability_due_at)} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">OKRs y pilares</p>
                <div className="flex flex-wrap gap-2">
                  {okrs.map(key => <Badge key={key} variant="secondary">{FUNDING_OKR_LABELS[key]}</Badge>)}
                  {pillars.map(key => <Badge key={key} variant="outline">{FUNDING_PILLAR_LABELS[key]}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.budgetItems.map(item => (
                <div key={item.id} className="grid gap-2 rounded-md border border-border/60 p-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {FUNDING_BUDGET_CATEGORY_LABELS[item.category as FundingBudgetCategory]}
                    </p>
                  </div>
                  <span className="font-medium sm:text-right">
                    {formatFundingCurrency(item.amount, request.currency)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.statusEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavia no hay historial.</p>
              ) : (
                detail.statusEvents.map(event => (
                  <div key={event.id} className="rounded-md border border-border/60 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <FundingStatusBadge status={event.to_status} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString('es-PE')}
                      </span>
                    </div>
                    {event.note && <p className="mt-2 text-muted-foreground">{event.note}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <FundingAccountabilityPanel detail={detail} />
      </div>
    </MainContainer>
  )
}
