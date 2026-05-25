import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'
import { Icons } from '@/components/ui/icons'
import { getChapterEvents } from '@/lib/actions/events/get-data'
import { getFundingRequestDetail } from '@/lib/actions/funding/get-data'
import { FundingRequestForm } from '../../_components/funding-request-form'
import { FundingStatusBadge } from '@/components/funding/funding-status-badge'
import type { FundingRequestStatus } from '@/lib/services/funding.service'

const EDITABLE_STATUSES: FundingRequestStatus[] = ['draft', 'changes_requested']

export default async function EditChapterFundingRequestPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const detail = await getFundingRequestDetail(id)

  if (!detail.success) {
    return (
      <MainContainer className="py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <Icons.AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <h1 className="text-xl font-semibold">No se pudo cargar la solicitud</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{detail.error}</p>
            <Button asChild className="mt-6">
              <Link href={`/${locale}/chapter/funding`}>Volver a financiamiento</Link>
            </Button>
          </CardContent>
        </Card>
      </MainContainer>
    )
  }

  const request = detail.data.request
  const status = request.status as FundingRequestStatus
  const events = await getChapterEvents()
  const eventOptions = events.map(event => ({
    id: event.id,
    title: event.title,
    start_at: event.start_at,
  }))
  const canEdit = EDITABLE_STATUSES.includes(status)

  return (
    <MainContainer className="space-y-8 py-8">
      <Breadcrumb
        items={[
          { label: 'Resumen', href: `/${locale}/chapter` },
          { label: 'Financiamiento', href: `/${locale}/chapter/funding` },
          { label: 'Editar solicitud' },
        ]}
      />

      <PageHeader
        eyebrow="Financiamiento del chapter"
        title="Editar solicitud"
        description="Ajusta el borrador antes de enviarlo o responde a cambios solicitados."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FundingStatusBadge status={status} />
            {request.is_late_request && <Badge variant="warning">Solicitud tardia</Badge>}
            <Button asChild variant="outline">
              <Link href={`/${locale}/chapter/funding`}>
                <Icons.ChevronLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
          </div>
        }
      />

      {canEdit ? (
        <FundingRequestForm events={eventOptions} initial={detail.data} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Icons.FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Esta solicitud ya no se puede editar</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Solo los borradores o solicitudes con cambios solicitados pueden modificarse desde el chapter.
            </p>
            <Button asChild className="mt-6">
              <Link href={`/${locale}/chapter/funding`}>Ver solicitudes</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </MainContainer>
  )
}
