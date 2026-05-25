import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { FundingStatusBadge } from '@/components/funding/funding-status-badge'
import { getAdminFundingReviewData } from '@/lib/actions/funding/get-data'
import {
  FUNDING_OKR_LABELS,
  FUNDING_PILLAR_LABELS,
  FUNDING_STATUS_HELPER,
  FUNDING_STATUS_LABELS,
  FUNDING_BUDGET_CATEGORY_LABELS,
  FUNDING_SOURCE_LABELS,
  formatFundingCurrency,
  formatFundingDate,
} from '@/lib/funding-display'
import type {
  FundingAdminRequestContext,
  FundingBudgetCategory,
  FundingOkrKey,
  FundingPillarKey,
  FundingRequestStatus,
  FundingSourceKey,
} from '@/lib/services/funding.service'
import { AdminFundingReviewPanel } from './_components/admin-funding-review-panel'

type PageSearchParams = {
  status?: string | string[]
}

type StatusFilter = FundingRequestStatus | 'all'

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'submitted', label: 'Pendientes' },
  { key: 'changes_requested', label: 'Cambios solicitados' },
  { key: 'approved', label: 'Aprobadas' },
  { key: 'receipts_due', label: 'Comprobantes' },
  { key: 'closed', label: 'Cerradas' },
  { key: 'all', label: 'Todas' },
]

const VALID_FILTERS = new Set<StatusFilter>(FILTERS.map(filter => filter.key))

function normalizeStatus(value: string | string[] | undefined): StatusFilter {
  const rawValue = Array.isArray(value) ? value[0] : value
  return rawValue && VALID_FILTERS.has(rawValue as StatusFilter)
    ? rawValue as StatusFilter
    : 'submitted'
}

function filterContexts(
  contexts: FundingAdminRequestContext[],
  status: StatusFilter
) {
  if (status === 'all') return contexts
  return contexts.filter(context => context.request.status === status)
}

function countByStatus(contexts: FundingAdminRequestContext[], status: StatusFilter) {
  if (status === 'all') return contexts.length
  return contexts.filter(context => context.request.status === status).length
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function FundingAdminCard({ context }: { context: FundingAdminRequestContext }) {
  const request = context.request
  const status = request.status as FundingRequestStatus
  const sourceKey = request.internal_funding_source as FundingSourceKey | null
  const okrs = (request.okr_keys ?? []) as FundingOkrKey[]
  const pillars = (request.pillar_keys ?? []) as FundingPillarKey[]

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <FundingStatusBadge status={status} />
                  {request.is_late_request && <Badge variant="warning">Solicitud tardía</Badge>}
                  {sourceKey && <Badge variant="secondary">{FUNDING_SOURCE_LABELS[sourceKey]}</Badge>}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{request.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {context.chapter?.name ?? request.chapter_id}
                    {context.chapter?.university ? ` - ${context.chapter.university}` : ''}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-lg font-semibold">
                  {formatFundingCurrency(request.requested_amount, request.currency)}
                </p>
                <p className="text-xs text-muted-foreground">Solicitado</p>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">{request.purpose}</p>

            <div className="grid gap-3 text-sm md:grid-cols-4">
              <MetaBlock label="Solicitante" value={context.requester?.name ?? context.requester?.email ?? request.requester_user_id} />
              <MetaBlock label="Fecha" value={formatFundingDate(request.event_date)} />
              <MetaBlock
                label="Aprobado"
                value={request.approved_amount == null ? 'Pendiente' : formatFundingCurrency(request.approved_amount, request.currency)}
              />
              <MetaBlock label="Comprobantes" value={FUNDING_STATUS_HELPER[status]} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">OKRs y pilares</p>
                <div className="flex flex-wrap gap-2">
                  {okrs.map(key => (
                    <Badge key={key} variant="secondary">{FUNDING_OKR_LABELS[key]}</Badge>
                  ))}
                  {pillars.map(key => (
                    <Badge key={key} variant="outline">{FUNDING_PILLAR_LABELS[key]}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Presupuesto</p>
                <div className="space-y-2">
                  {context.budgetItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {FUNDING_BUDGET_CATEGORY_LABELS[item.category as FundingBudgetCategory]}
                        </p>
                      </div>
                      <span className="shrink-0 font-medium">
                        {formatFundingCurrency(item.amount, request.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(request.expected_audience || request.expected_attendee_count || request.partner_name || request.accountability_due_at) && (
              <div className="grid gap-3 rounded-md border border-border/60 p-3 text-sm md:grid-cols-4">
                <MetaBlock label="Audiencia" value={request.expected_audience ?? 'No indicada'} />
                <MetaBlock label="Asistencia" value={request.expected_attendee_count == null ? 'No indicada' : String(request.expected_attendee_count)} />
                <MetaBlock label="Partner" value={request.partner_name ?? 'Sin partner'} />
                <MetaBlock label="Límite comprobantes" value={formatFundingDate(request.accountability_due_at)} />
              </div>
            )}
          </div>

          <AdminFundingReviewPanel context={context} />
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminFundingPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  const activeStatus = normalizeStatus(params.status)
  const result = await getAdminFundingReviewData('all')

  if (!result.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administración"
          title="Financiamiento"
          description="Revisa solicitudes de financiamiento de capítulos y seguimiento de comprobantes."
        />
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold">No se pudo cargar financiamiento</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{result.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const contexts = result.data
  const visibleContexts = filterContexts(contexts, activeStatus)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Financiamiento"
        description="Revisa solicitudes de financiamiento de capítulos, asigna fuente interna y monitorea comprobantes."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {FILTERS.map(filter => (
          <Link
            key={filter.key}
            href={filter.key === 'submitted' ? '/admin/funding' : `/admin/funding?status=${filter.key}`}
            className={`rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40 sm:p-4 ${
              activeStatus === filter.key ? 'border-primary/50 ring-1 ring-primary/25' : ''
            }`}
          >
            <p className="text-sm font-medium text-muted-foreground">{filter.label}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight sm:mt-3 sm:text-2xl">{countByStatus(contexts, filter.key)}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">
            {activeStatus === 'all' ? 'Todas las solicitudes' : FUNDING_STATUS_LABELS[activeStatus]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {visibleContexts.length} solicitud{visibleContexts.length === 1 ? '' : 'es'} en esta vista.
          </p>
        </div>

        {visibleContexts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-14 text-center">
              <h3 className="text-lg font-semibold">No hay solicitudes en esta vista</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Cambia el filtro para revisar otros estados o espera nuevas solicitudes de los capítulos.
              </p>
            </CardContent>
          </Card>
        ) : (
          visibleContexts.map(context => (
            <FundingAdminCard key={context.request.id} context={context} />
          ))
        )}
      </div>
    </div>
  )
}
