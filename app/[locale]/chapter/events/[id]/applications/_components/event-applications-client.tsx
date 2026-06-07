'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ApplicationReviewCard } from '@/components/events/application-review-card'
import { CapacityAdvisory } from '@/components/events/capacity-advisory'
import { EmptyState } from '@/components/ui/empty-state'
import { bulkApproveApplications, bulkRejectApplications } from '@/lib/actions/events/bulk-approve'
import type { RegistrationWithUser } from '@/lib/types'
import { CheckCircle, Loader2, Users, XCircle } from 'lucide-react'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'

type EventApplicationsClientProps = {
  event: {
    id: string
    title: string
    capacity: number | null
    accessModel: 'open' | 'application'
  }
  initialApplications: RegistrationWithUser[]
}

type ReviewTab = 'pending' | 'approved' | 'rejected'
type Feedback = {
  type: 'success' | 'error'
  title: string
  message?: string
} | null
type ApplicationActionResult = {
  success?: boolean
  capacityWarning?: boolean
  capacityStatus?: 'at_capacity' | 'over_capacity' | null
}

function SummaryBlock({
  label,
  value,
  helper,
  variant = 'default',
}: {
  label: string
  value: string | number
  helper: string
  variant?: 'default' | 'warning' | 'success' | 'destructive'
}) {
  const valueClass =
    variant === 'warning'
      ? 'text-warning'
      : variant === 'success'
      ? 'text-success'
      : variant === 'destructive'
      ? 'text-destructive'
      : 'text-foreground'

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-3 text-2xl font-semibold tracking-tight', valueClass)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

function mapApplication(application: RegistrationWithUser) {
  return {
    id: application.id,
    userId: application.user_id,
    registeredAt: application.registered_at,
    status: application.status as 'pending_review' | 'registered' | 'rejected',
    User: {
      name: application.user?.name ?? 'Asistente sin nombre',
      email: application.user?.email ?? '',
    },
    ApplicantProfile: {
      majorOrInterest: application.person_profile?.major_or_interest ?? 'Area no registrada',
      graduation_year: application.person_profile?.graduation_year ?? 0,
      linkedinUrl: application.person_profile?.linkedin_url ?? null,
      portfolioUrl: application.person_profile?.portfolio_url ?? null,
    },
    applicationAnswers: application.application_answers ?? [],
  }
}

export function EventApplicationsClient({
  event,
  initialApplications,
}: EventApplicationsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending')
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false)
  const [capacityWarning, setCapacityWarning] = useState<{
    show: boolean
    status: 'at_capacity' | 'over_capacity' | null
  }>({ show: false, status: null })
  const [isPending, startTransition] = useTransition()

  const applications = useMemo(
    () =>
      initialApplications.filter(
        (application) => application.user && application.person_profile
      ),
    [initialApplications]
  )

  const pendingApps = applications.filter((application) => application.status === 'pending_review')
  const approvedApps = applications.filter((application) => application.status === 'registered')
  const rejectedApps = applications.filter((application) => application.status === 'rejected')
  const selectedCount = selectedApplications.size
  const registeredCount = approvedApps.length
  const capacityLabel = event.capacity === null ? 'Sin límite' : `${registeredCount}/${event.capacity}`

  const refreshPage = () => {
    router.refresh()
    setSelectedApplications(new Set())
  }

  const runAction = (
    action: () => Promise<ApplicationActionResult | void>,
    successTitle: string
  ) => {
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await action()
        if (result?.capacityWarning) {
          setCapacityWarning({ show: true, status: result.capacityStatus ?? 'over_capacity' })
        }
        setFeedback({ type: 'success', title: successTitle })
        refreshPage()
      } catch (error) {
        setFeedback({
          type: 'error',
          title: 'No se pudo completar la acción',
          message: error instanceof Error ? error.message : 'Intentalo de nuevo.',
        })
      }
    })
  }

  const handleApprove = async (applicationId: string) => {
    runAction(
      () => bulkApproveApplications(event.id, [applicationId]),
      'Postulación aprobada'
    )
  }

  const handleReject = async (applicationId: string) => {
    runAction(
      () => bulkRejectApplications(event.id, [applicationId]),
      'Postulación rechazada'
    )
  }

  const handleBulkApprove = async () => {
    const selectedIds = Array.from(selectedApplications)
    if (selectedIds.length === 0) return

    runAction(
      () => bulkApproveApplications(event.id, selectedIds),
      selectedIds.length === 1
        ? '1 postulación aprobada'
        : `${selectedIds.length} postulaciones aprobadas`
    )
  }

  const handleBulkReject = async () => {
    const selectedIds = Array.from(selectedApplications)
    if (selectedIds.length === 0) return

    runAction(
      () => bulkRejectApplications(event.id, selectedIds),
      selectedIds.length === 1
        ? '1 postulación rechazada'
        : `${selectedIds.length} postulaciones rechazadas`
    )
    setShowBulkRejectDialog(false)
  }

  const toggleSelectAll = () => {
    if (selectedApplications.size === pendingApps.length) {
      setSelectedApplications(new Set())
      return
    }

    setSelectedApplications(new Set(pendingApps.map((application) => application.id)))
  }

  const renderApplications = (items: RegistrationWithUser[], empty: { title: string; description: string; icon: typeof Users }) => {
    if (items.length === 0) {
      return (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
        />
      )
    }

    return items.map((application) => (
      <ApplicationReviewCard
        key={application.id}
        application={mapApplication(application)}
        isSelected={selectedApplications.has(application.id)}
        onSelect={(id, selected) => {
          const next = new Set(selectedApplications)
          if (selected) next.add(id)
          else next.delete(id)
          setSelectedApplications(next)
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isPending}
        showCheckbox={activeTab === 'pending'}
      />
    ))
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="space-y-8">
        <div className="space-y-3">
            <Button asChild variant="ghost" size="sm" className="w-fit px-0">
              <Link href={`/chapter/events/${event.id}`}>
                <Icons.ArrowLeft className="mr-2 h-4 w-4" />
                Volver al evento
              </Link>
            </Button>
          <PageHeader
            eyebrow="Herramientas del capítulo"
            title="Revision de postulaciones"
            badge={
              <Badge variant={event.accessModel === 'application' ? 'info' : 'outline'}>
                {event.accessModel === 'application' ? 'Requiere postulación' : 'Registro abierto'}
              </Badge>
            }
            description={event.title}
            actions={
              <Button asChild variant="outline">
                <Link href={`/chapter/events/${event.id}`}>Configuracion del evento</Link>
              </Button>
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryBlock
            label="Pendientes"
            value={pendingApps.length}
            helper="Necesitan revisión"
            variant="warning"
          />
          <SummaryBlock
            label="Aprobadas"
            value={approvedApps.length}
            helper="Registradas para el evento"
            variant="success"
          />
          <SummaryBlock
            label="Rechazadas"
            value={rejectedApps.length}
            helper="Conservadas para historial"
            variant="destructive"
          />
          <SummaryBlock
            label="Capacidad"
            value={capacityLabel}
            helper={event.capacity === null ? 'Sin límite fijo' : 'Aprobadas contra el límite'}
          />
        </div>

        {capacityWarning.show ? (
          <CapacityAdvisory
            status={capacityWarning.status ?? 'over_capacity'}
          />
        ) : null}

        {feedback ? (
          <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
            {feedback.type === 'error' ? (
              <Icons.AlertCircle className="h-4 w-4" />
            ) : (
              <Icons.CheckCircle2 className="h-4 w-4" />
            )}
            <AlertTitle>{feedback.title}</AlertTitle>
            {feedback.message ? <AlertDescription>{feedback.message}</AlertDescription> : null}
          </Alert>
        ) : null}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReviewTab)} className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="w-full justify-start overflow-x-auto lg:w-auto">
              <TabsTrigger value="pending">
                Pendientes
                <Badge variant="warning" size="sm" className="ml-2">{pendingApps.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprobadas
                <Badge variant="success" size="sm" className="ml-2">{approvedApps.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rechazadas
                <Badge variant="destructive" size="sm" className="ml-2">{rejectedApps.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {activeTab === 'pending' && pendingApps.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between lg:min-w-[34rem]">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={toggleSelectAll} disabled={isPending}>
                    {selectedCount === pendingApps.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </Button>
                  <p className="text-sm font-medium">
                    {selectedCount} seleccionadas
                    <span className="ml-1 text-muted-foreground">de {pendingApps.length} pendientes</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={selectedCount === 0 || isPending}
                  >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowBulkRejectDialog(true)}
                    disabled={selectedCount === 0 || isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <TabsContent value="pending" className="space-y-3">
            {renderApplications(pendingApps, {
              icon: Users,
              title: 'Todas las postulaciones fueron revisadas',
              description: 'No hay postulaciones pendientes que necesiten decisión editorial.',
            })}
          </TabsContent>

          <TabsContent value="approved" className="space-y-3">
            {renderApplications(approvedApps, {
              icon: CheckCircle,
              title: 'No hay postulaciones aprobadas',
              description: 'Las postulaciones aprobadas aparecerán aquí.',
            })}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-3">
            {renderApplications(rejectedApps, {
              icon: XCircle,
              title: 'No hay postulaciones rechazadas',
              description: 'Las postulaciones rechazadas aparecerán aquí como referencia.',
            })}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar postulaciones seleccionadas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto rechazará {selectedCount === 1 ? '1 postulación pendiente' : `${selectedCount} postulaciones pendientes`} y notificará a la persona postulante. Usa esta acción solo después de revisar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir revisando</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleBulkReject} disabled={isPending}>
              Rechazar seleccionadas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
