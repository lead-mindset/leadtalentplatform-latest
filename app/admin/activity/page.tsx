import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Suspense } from 'react'
import { Activity, CheckCircle2, Mail, Calendar } from 'lucide-react'

type ActivityItem = {
  id: string
  type: 'approval' | 'invite_sent' | 'invite_accepted' | 'invite_revoked'
  timestamp: string
  actor: {
    name: string | null
    email: string
  } | null
  target: {
    name: string | null
    email: string
  } | null
  company?: {
    name: string
  } | null
  chapter?: {
    name: string
  } | null
}

async function getActivityLog() {
  const supabase = await createClient()

  // Get profile approvals - specify userId relationship
  const { data: approvals } = await supabase
    .from('StudentProfile')
    .select(`
      userId,
      updatedAt,
      Student:User!StudentProfile_userId_fkey (
        name,
        email,
        Chapter (name)
      ),
      ApprovedBy:User!StudentProfile_approvedById_fkey (
        name,
        email
      )
    `)
    .not('approvedById', 'is', null)
    .order('updatedAt', { ascending: false })
    .limit(20)

  // Get invite activities
  const { data: invites } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      grantedAt,
      acceptedAt,
      revokedAt,
      recruiterEmail,
      Company (name),
      GrantedBy:User!RecruiterAccess_grantedById_fkey (
        name,
        email
      ),
      AcceptedBy:User!RecruiterAccess_acceptedByUserId_fkey (
        name,
        email
      ),
      RevokedBy:User!RecruiterAccess_revokedById_fkey (
        name,
        email
      )
    `)
    .order('grantedAt', { ascending: false })
    .limit(20)

  const activities: ActivityItem[] = []

  // Process approvals
  if (approvals) {
    approvals.forEach((approval: any) => {
      activities.push({
        id: `approval-${approval.userId}`,
        type: 'approval',
        timestamp: approval.updatedAt,
        actor: approval.ApprovedBy,
        target: approval.Student,
        chapter: approval.Student?.Chapter
      })
    })
  }

  // Process invites
  if (invites) {
    invites.forEach((invite: any) => {
      // Invite sent
      activities.push({
        id: `invite-sent-${invite.id}`,
        type: 'invite_sent',
        timestamp: invite.grantedAt,
        actor: invite.GrantedBy,
        target: { name: null, email: invite.recruiterEmail },
        company: invite.Company
      })

      // Invite accepted
      if (invite.acceptedAt) {
        activities.push({
          id: `invite-accepted-${invite.id}`,
          type: 'invite_accepted',
          timestamp: invite.acceptedAt,
          actor: invite.AcceptedBy,
          target: { name: null, email: invite.recruiterEmail },
          company: invite.Company
        })
      }

      // Invite revoked
      if (invite.revokedAt) {
        activities.push({
          id: `invite-revoked-${invite.id}`,
          type: 'invite_revoked',
          timestamp: invite.revokedAt,
          actor: invite.RevokedBy,
          target: { name: null, email: invite.recruiterEmail },
          company: invite.Company
        })
      }
    })
  }

  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return activities.slice(0, 50)
}

function getActivityDescription(activity: ActivityItem) {
  const actorName = activity.actor?.name || activity.actor?.email || 'Unknown'
  const targetName = activity.target?.name || activity.target?.email || 'Unknown'

  switch (activity.type) {
    case 'approval':
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        title: 'Profile Approved',
        description: `${actorName} approved ${targetName}'s profile`,
        badge: activity.chapter?.name
      }
    case 'invite_sent':
      return {
        icon: Mail,
        color: 'text-blue-500',
        title: 'Invite Sent',
        description: `${actorName} invited ${targetName} to ${activity.company?.name || 'a company'}`,
        badge: activity.company?.name
      }
    case 'invite_accepted':
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        title: 'Invite Accepted',
        description: `${targetName} accepted invite to ${activity.company?.name || 'a company'}`,
        badge: activity.company?.name
      }
    case 'invite_revoked':
      return {
        icon: Mail,
        color: 'text-red-500',
        title: 'Invite Revoked',
        description: `${actorName} revoked invite for ${targetName}`,
        badge: activity.company?.name
      }
    default:
      return {
        icon: Activity,
        color: 'text-gray-500',
        title: 'Unknown Activity',
        description: 'Unknown activity type',
        badge: undefined
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

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

async function ActivityLog() {
  const activities = await getActivityLog()

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Activity Log</CardTitle>
        <CardDescription>
          Recent actions across the platform (last 50 events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              System events will appear here
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
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted flex-shrink-0 ${details.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{details.title}</p>
                        <p className="text-sm text-muted-foreground break-words">
                          {details.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
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
                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
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
              <div className="h-10 w-10 bg-muted animate-pulse rounded-full flex-shrink-0" />
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Activity</h1>
        <p className="text-muted-foreground mt-2">
          Audit log of all system events and administrative actions
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ActivityLog />
      </Suspense>
    </div>
  )
}