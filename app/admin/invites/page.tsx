import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Suspense } from 'react'
import { Mail, Clock, CheckCircle2, XCircle, AlertCircle, Building } from 'lucide-react'
import type { RecruiterInviteRaw } from '@/lib/types'
import type { RecruiterInvite } from '@/lib/types'

function normalizeRecruiterInvites(
  invites: RecruiterInviteRaw[]
): RecruiterInvite[] {
  return invites.map(invite => ({
    ...invite,
    Company: invite.Company[0] ?? null,
    GrantedBy: invite.GrantedBy[0] ?? null,
    AcceptedBy: invite.AcceptedBy[0] ?? null,
  }))
}

function getInviteStatus(invite: RecruiterInvite) {
  if (invite.revokedAt) {
    return {
      label: 'Revoked',
      variant: 'destructive' as const,
      icon: XCircle,
      color: 'text-red-500'
    }
  }
  if (invite.acceptedAt) {
    return {
      label: 'Accepted',
      variant: 'default' as const,
      icon: CheckCircle2,
      color: 'text-green-500'
    }
  }
  if (invite.inviteExpiresAt && new Date(invite.inviteExpiresAt) < new Date()) {
    return {
      label: 'Expired',
      variant: 'secondary' as const,
      icon: AlertCircle,
      color: 'text-orange-500'
    }
  }
  return {
    label: 'Pending',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-blue-500'
  }
}

async function getInvites() {
  const supabase = await createClient()

  const { data: invites, error } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      recruiterEmail,
      isActive,
      grantedAt,
      inviteExpiresAt,
      acceptedAt,
      revokedAt,
      companyId,
      Company (name),
      GrantedBy:User!RecruiterAccess_grantedById_fkey (
        name,
        email
      ),
      AcceptedBy:User!RecruiterAccess_acceptedByUserId_fkey (
        name,
        email
      )
    `)
    .order('grantedAt', { ascending: false })

  if (error) {
    console.error('Failed to fetch invites:', error)
    return []
  }

return normalizeRecruiterInvites(invites as RecruiterInviteRaw[])
}

async function InvitesList() {
  const invites = await getInvites()

  const stats = {
    total: invites.length,
    pending: invites.filter(i => !i.acceptedAt && !i.revokedAt && i.inviteExpiresAt && new Date(i.inviteExpiresAt) > new Date()).length,
    accepted: invites.filter(i => i.acceptedAt).length,
    expired: invites.filter(i => !i.acceptedAt && i.inviteExpiresAt && new Date(i.inviteExpiresAt) < new Date()).length,
    revoked: invites.filter(i => i.revokedAt).length,
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revoked</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revoked}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invites</CardTitle>
          <CardDescription>
            Recruiter invitations across all companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invites yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Invites will appear here when companies invite recruiters
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
                    const status = getInviteStatus(invite)
                    const StatusIcon = status.icon
                    
                    return (
                      <tr key={invite.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{invite.recruiterEmail}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {invite.Company?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className={`h-3 w-3 ${status.color}`} />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p className="font-medium">
                              {invite.GrantedBy?.name || 'Unknown'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {invite.GrantedBy?.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {new Date(invite.grantedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3">
                          {invite.inviteExpiresAt ? (
                            <span className="text-sm text-muted-foreground">
                              {new Date(invite.inviteExpiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/invites/${invite.id}`}>
                              View
                            </Link>
                          </Button>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
        <h1 className="text-3xl font-bold tracking-tight">Recruiter Invites</h1>
        <p className="text-muted-foreground mt-2">
          Manage recruiter invitations across all companies
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <InvitesList />
      </Suspense>
    </div>
  )
}