import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'
import { Icons } from '@/components/ui/icons'
import { ComingSoon } from '@/components/ui/coming-soon'

import { getChapterEvents } from '@/lib/actions/events/get-data'
import { FundingRequestForm } from '../_components/funding-request-form'

export default async function NewChapterFundingRequestPage() {
  const events = await getChapterEvents()
  const eventOptions = events.map(event => ({
    id: event.id,
    title: event.title,
    start_at: event.start_at,
  }))

  return (
    <ComingSoon
      title="Estamos revolucionando el financiamiento"
      description="Define el monto, propósito y presupuesto de tu nueva solicitud de fondos."
    >
      <MainContainer className="space-y-8 py-8">
        <Breadcrumb
          items={[
            { label: 'Resumen', href: '/chapter' },
            { label: 'Financiamiento', href: '/chapter/funding' },
            { label: 'Nueva solicitud' },
          ]}
        />

        <PageHeader
          eyebrow="Financiamiento del capítulo"
          title="Nueva solicitud"
          description="Conecta el monto solicitado con proposito, OKRs, pilares y desglose del presupuesto."
          actions={
            <Button asChild variant="outline">
              <Link href="/chapter/funding">
                <Icons.ChevronLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
          }
        />

        <FundingRequestForm events={eventOptions} />
      </MainContainer>
    </ComingSoon>
  )
}

