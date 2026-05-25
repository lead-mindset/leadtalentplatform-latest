import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Suspense } from 'react'
import { Mail, Clock, CheckCircle2, XCircle, AlertCircle, Building } from 'lucide-react'
import type { RecruiterInvite } from '@/lib/types'
import { InviteForm } from './components/invite-form'
import { InviteActions } from './components/invite-actions'
import { getInvites, getCompanies } from '@/lib/actions/admin/get-data'
import { PageHeader } from '@/components/ui/page-header'
import { formatLeadDate } from '@/lib/utils/date-format'

function getInviteStatus(invite: RecruiterInvite): 'pending' | 'accepted' | 'expired' | 'revoked' {
  if (invite.revoked_at) return 'revoked'
  if (invite.accepted_at) return 'accepted'
  if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) return 'expired'
  return 'pending'
}

type InviteStatusDisplay = {
  label: string
  variant: 'destructive' | 'default' | 'secondary' | 'outline'
  icon: React.ElementType
  iconClass: string
}

function getInviteStatusDisplay(invite: RecruiterInvite): InviteStatusDisplay {
  const status = getInviteStatus(invite)

  switch (status) {
    case 'revoked':
      return {
        label: 'Revocada',
        variant: 'destructive',
        icon: XCircle,
        iconClass: 'text-destructive',
      }
    case 'accepted':
      return {
        label: 'Aceptada',
        variant: 'default',
        icon: CheckCircle2,
        iconClass: 'text-success',
      }
    case 'expired':
      return {
        label: 'Vencida',
        variant: 'secondary',
        icon: AlertCircle,
        iconClass: 'text-warning',
      }
    default:
      return {
        label: 'Pendiente',
        variant: 'outline',
        icon: Clock,
        iconClass: 'text-info',
      }
  }
}

async function InvitesList() {
  const [invites, companies] = await Promise.all([getInvites(), getCompanies()])

  const stats = {
    total: invites.length,
    pending: invites.filter(i => getInviteStatus(i) === 'pending').length,
    accepted: invites.filter(i => getInviteStatus(i) === 'accepted').length,
    expired: invites.filter(i => getInviteStatus(i) === 'expired').length,
    revoked: invites.filter(i => getInviteStatus(i) === 'revoked').length,
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <div className="md:col-span-2">
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aceptadas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.accepted}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                <AlertCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expired}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revocadas</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.revoked}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <InviteForm companies={companies} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las invitaciones</CardTitle>
          <CardDescription>Invitaciones de representantes de empresa en todas las empresas</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Todavia no hay invitaciones</p>
              <p className="text-sm text-muted-foreground mt-2">
                Envia tu primera invitacion usando el formulario superior
              </p>
            </div>
          ) : (
            <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Empresa</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-left p-3 font-medium">Otorgada por</th>
                    <th className="text-left p-3 font-medium">Fecha</th>
                    <th className="text-left p-3 font-medium">Vence</th>
                    <th className="text-right p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => {
                    const statusDisplay = getInviteStatusDisplay(invite)
                    const status = getInviteStatus(invite)
                    const StatusIcon = statusDisplay.icon

                    return (
                      <tr
                        key={invite.id}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{invite.recruiter_email}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {invite.company?.name || 'Desconocida'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={statusDisplay.variant} className="gap-1">
                            <StatusIcon className={`h-3 w-3 ${statusDisplay.iconClass}`} />
                            {statusDisplay.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p className="font-medium">{invite.granted_by?.name || 'Desconocido'}</p>
                            <p className="text-muted-foreground text-xs">
                              {invite.granted_by?.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {formatLeadDate(invite.granted_at)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {invite.invite_expires_at
                              ? formatLeadDate(invite.invite_expires_at)
                              : 'Nunca'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <InviteActions inviteId={invite.id} status={status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="divide-y rounded-lg border lg:hidden">
              {invites.map((invite) => {
                const statusDisplay = getInviteStatusDisplay(invite)
                const status = getInviteStatus(invite)
                const StatusIcon = statusDisplay.icon

                return (
                  <div key={invite.id} className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="break-words font-medium">{invite.recruiter_email}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-4 w-4 shrink-0" />
                          <span className="truncate">{invite.company?.name || 'Empresa desconocida'}</span>
                        </div>
                      </div>
                      <Badge variant={statusDisplay.variant} className="shrink-0 gap-1">
                        <StatusIcon className={`h-3 w-3 ${statusDisplay.iconClass}`} />
                        {statusDisplay.label}
                      </Badge>
                    </div>

                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Otorgada por:</span>{' '}
                        {invite.granted_by?.name || invite.granted_by?.email || 'Desconocido'}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Fecha:</span>{' '}
                        {formatLeadDate(invite.granted_at)}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Vence:</span>{' '}
                        {invite.invite_expires_at
                          ? formatLeadDate(invite.invite_expires_at)
                          : 'Nunca'}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <InviteActions inviteId={invite.id} status={status} />
                    </div>
                  </div>
                )
              })}
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="grid gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminInvitesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administracion"
        title="Invitaciones de representantes"
        description="Invita y gestiona acceso de representantes de empresa en todas las empresas."
      />
      <Suspense fallback={<LoadingSkeleton />}>
        <InvitesList />
      </Suspense>
    </div>
  )
}
