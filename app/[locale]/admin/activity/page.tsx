import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Suspense } from 'react'
import { Activity, CheckCircle2, Mail, Calendar, XCircle } from 'lucide-react'
import { getActivityLog } from '@/lib/actions/admin/get-data'
import type { ActivityItem } from '@/lib/types'
import { PageHeader } from '@/components/ui/page-header'
import { formatLeadDate, formatLeadDateTime } from '@/lib/utils/date-format'

function getActivityDescription(activity: ActivityItem) {
  const actorName = activity.actor?.name || activity.actor?.email || 'Desconocido'
  const targetName = activity.target?.name || activity.target?.email || 'Desconocido'

  switch (activity.type) {
    case 'approval':
      return {
        icon: CheckCircle2,
        iconClass: 'text-success',
        bgClass: 'bg-success-muted',
        title: 'Perfil aprobado',
        description: `${actorName} aprobo el perfil de ${targetName}`,
        badge: activity.chapter?.name,
      }
    case 'invite_sent':
      return {
        icon: Mail,
        iconClass: 'text-info',
        bgClass: 'bg-info-muted',
        title: 'Invitacion enviada',
        description: `${actorName} invito a ${targetName} a ${activity.company?.name || 'una empresa'}`,
        badge: activity.company?.name,
      }
    case 'invite_accepted':
      return {
        icon: CheckCircle2,
        iconClass: 'text-success',
        bgClass: 'bg-success-muted',
        title: 'Invitacion aceptada',
        description: `${targetName} acepto la invitacion a ${activity.company?.name || 'una empresa'}`,
        badge: activity.company?.name,
      }
    case 'invite_revoked':
      return {
        icon: XCircle,
        iconClass: 'text-destructive',
        bgClass: 'bg-destructive/10',
        title: 'Invitacion revocada',
        description: `${actorName} revoco la invitacion para ${targetName}`,
        badge: activity.company?.name,
      }
    default:
      return {
        icon: Activity,
        iconClass: 'text-muted-foreground',
        bgClass: 'bg-muted',
        title: 'Actividad desconocida',
        description: 'Tipo de actividad desconocido',
        badge: undefined,
      }
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} d`
  return formatLeadDate(timestamp)
}

async function ActivityLog() {
  const activities = await getActivityLog()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de actividad del sistema</CardTitle>
        <CardDescription>Acciones recientes en la plataforma (ultimos 50 eventos)</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Todavia no hay actividad</p>
            <p className="text-sm text-muted-foreground mt-2">
              Los eventos del sistema aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const details = getActivityDescription(activity)
              const Icon = details.icon

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${details.bgClass}`}
                  >
                    <Icon className={`h-5 w-5 ${details.iconClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{details.title}</p>
                        <p className="text-sm text-muted-foreground wrap-break-word">
                          {details.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        {details.badge && (
                          <Badge variant="outline" className="text-xs">
                            {details.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatLeadDateTime(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 pb-4 border-b">
              <div className="h-10 w-10 bg-muted animate-pulse rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-3 w-40 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminActivityPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Actividad del sistema"
        description="Bitacora de eventos recientes de la plataforma y acciones administrativas."
      />
      <Suspense fallback={<LoadingSkeleton />}>
        <ActivityLog />
      </Suspense>
    </div>
  )
}
