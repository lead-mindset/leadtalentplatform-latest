import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Suspense } from 'react'
import { Mail, Clock, CheckCircle2, XCircle, AlertCircle, Building } from 'lucide-react'
import type { RecruiterInvite } from '@/lib/types'
import { InviteForm } from './components/invite-form'
import { InviteActions } from './components/invite-actions'
import { getInvites, getCompanies } from '@/lib/actions/admin/get-data'

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
        label: 'Revoked',
        variant: 'destructive',
        icon: XCircle,
        iconClass: 'text-destructive',
      }
    case 'accepted':
      return {
        label: 'Accepted',
        variant: 'default',
        icon: CheckCircle2,
        iconClass: 'text-success',
      }
    case 'expired':
      return {
        label: 'Expired',
        variant: 'secondary',
        icon: AlertCircle,
        iconClass: 'text-warning',
      }
    default:
      return {
        label: 'Pending',
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
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.accepted}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired</CardTitle>
                <AlertCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expired}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revoked</CardTitle>
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
          <CardTitle>All Invites</CardTitle>
          <CardDescription>Company representative invitations across all companies</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invites yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Send your first invitation using the form above
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Company</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Granted By</th>
                    <th className="text-left p-3 font-medium">Granted Date</th>
                    <th className="text-left p-3 font-medium">Expires</th>
                    <th className="text-right p-3 font-medium">Actions</th>
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
                              {invite.company?.name || 'Unknown'}
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
                            <p className="font-medium">{invite.granted_by?.name || 'Unknown'}</p>
                            <p className="text-muted-foreground text-xs">
                              {invite.granted_by?.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {new Date(invite.granted_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {invite.invite_expires_at
                              ? new Date(invite.invite_expires_at).toLocaleDateString()
                              : 'Never'}
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Representative Invites</h1>
        <p className="text-muted-foreground mt-2">
          Invite and manage company representative access across all companies
        </p>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <InvitesList />
      </Suspense>
    </div>
  )
}
