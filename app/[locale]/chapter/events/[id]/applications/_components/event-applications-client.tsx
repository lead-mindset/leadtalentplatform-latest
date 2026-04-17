'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ApplicationReviewCard } from '@/components/events/application-review-card'
import { CapacityAdvisory } from '@/components/events/capacity-advisory'
import { EmptyState } from '@/components/ui/empty-state'
import { bulkApproveApplications, bulkRejectApplications } from '@/lib/actions/events/bulk-approve'
import type { RegistrationWithUser } from '@/lib/types'
import { CheckCircle, Loader2, Users, XCircle } from 'lucide-react'

type EventApplicationsClientProps = {
  event: {
    id: string
    title: string
    capacity: number | null
    accessModel: 'open' | 'application'
  }
  initialApplications: RegistrationWithUser[]
}

export function EventApplicationsClient({
  event,
  initialApplications,
}: EventApplicationsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [capacityWarning, setCapacityWarning] = useState<{
    show: boolean
    status: 'at_capacity' | 'over_capacity' | null
  }>({ show: false, status: null })
  const [isPending, startTransition] = useTransition()

  const applications = useMemo(
    () =>
      initialApplications.filter(
        (application) => application.User && application.StudentProfile
      ),
    [initialApplications]
  )

  const pendingApps = applications.filter((application) => application.status === 'pending_review')
  const approvedApps = applications.filter((application) => application.status === 'registered')
  const rejectedApps = applications.filter((application) => application.status === 'rejected')

  const registeredCount = approvedApps.length
  const capacity = event.capacity

  const refreshPage = () => {
    router.refresh()
    setSelectedApplications(new Set())
  }

  const handleApprove = async (applicationId: string) => {
    startTransition(async () => {
      const result = await bulkApproveApplications(event.id, [applicationId])
      if (result.capacityWarning) {
        setCapacityWarning({ show: true, status: result.capacityStatus })
      }
      refreshPage()
    })
  }

  const handleReject = async (applicationId: string, _internalNote?: string) => {
    startTransition(async () => {
      await bulkRejectApplications(event.id, [applicationId])
      refreshPage()
    })
  }

  const handleBulkApprove = async () => {
    const selectedIds = Array.from(selectedApplications)
    if (selectedIds.length === 0) return

    startTransition(async () => {
      const result = await bulkApproveApplications(event.id, selectedIds)
      if (result.capacityWarning) {
        setCapacityWarning({ show: true, status: result.capacityStatus })
      }
      refreshPage()
    })
  }

  const handleBulkReject = async () => {
    const selectedIds = Array.from(selectedApplications)
    if (selectedIds.length === 0) return

    startTransition(async () => {
      await bulkRejectApplications(event.id, selectedIds)
      refreshPage()
    })
  }

  const toggleSelectAll = () => {
    if (selectedApplications.size === pendingApps.length) {
      setSelectedApplications(new Set())
      return
    }

    setSelectedApplications(new Set(pendingApps.map((application) => application.id)))
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <div className="mt-2 flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {event.accessModel === 'application' ? 'Application Required' : 'Open Registration'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Capacity: {registeredCount} / {capacity ?? 'Unlimited'} registered
          </span>
        </div>
      </div>

      {capacityWarning.show ? (
        <CapacityAdvisory
          status={capacityWarning.status ?? 'over_capacity'}
          className="mb-6"
        />
      ) : null}

      {activeTab === 'pending' && pendingApps.length > 0 ? (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={toggleSelectAll} disabled={isPending}>
              {selectedApplications.size === pendingApps.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedApplications.size} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBulkApprove}
              disabled={selectedApplications.size === 0 || isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkReject}
              disabled={selectedApplications.size === 0 || isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject Selected
            </Button>
          </div>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pendingApps.length > 0 ? <Badge variant="secondary" className="ml-2">{pendingApps.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            {approvedApps.length > 0 ? <Badge variant="secondary" className="ml-2">{approvedApps.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            {rejectedApps.length > 0 ? <Badge variant="secondary" className="ml-2">{rejectedApps.length}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApps.length === 0 ? (
            <EmptyState
              icon={Users}
              title="All applications have been reviewed"
              description="No pending applications to review at this time."
            />
          ) : (
            pendingApps.map((application) => (
              <ApplicationReviewCard
                key={application.id}
                application={{
                  id: application.id,
                  userId: application.user_id,
                  registeredAt: application.registered_at,
                  status: application.status as 'pending_review' | 'registered' | 'rejected',
                  User: {
                    name: application.User?.name ?? 'Unknown attendee',
                    email: application.User?.email ?? '',
                  },
                  StudentProfile: {
                    major: application.StudentProfile?.major ?? 'Unknown major',
                    graduationYear: application.StudentProfile?.graduation_year ?? 0,
                    linkedinUrl: application.StudentProfile?.linkedin_url ?? null,
                  },
                }}
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
                showCheckbox
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedApps.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No approved applications"
              description="Approved applications will appear here."
            />
          ) : (
            approvedApps.map((application) => (
              <ApplicationReviewCard
                key={application.id}
                application={{
                  id: application.id,
                  userId: application.user_id,
                  registeredAt: application.registered_at,
                  status: application.status as 'pending_review' | 'registered' | 'rejected',
                  User: {
                    name: application.User?.name ?? 'Unknown attendee',
                    email: application.User?.email ?? '',
                  },
                  StudentProfile: {
                    major: application.StudentProfile?.major ?? 'Unknown major',
                    graduationYear: application.StudentProfile?.graduation_year ?? 0,
                    linkedinUrl: application.StudentProfile?.linkedin_url ?? null,
                  },
                }}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedApps.length === 0 ? (
            <EmptyState
              icon={XCircle}
              title="No rejected applications"
              description="Rejected applications will appear here for reference."
            />
          ) : (
            rejectedApps.map((application) => (
              <ApplicationReviewCard
                key={application.id}
                application={{
                  id: application.id,
                  userId: application.user_id,
                  registeredAt: application.registered_at,
                  status: application.status as 'pending_review' | 'registered' | 'rejected',
                  User: {
                    name: application.User?.name ?? 'Unknown attendee',
                    email: application.User?.email ?? '',
                  },
                  StudentProfile: {
                    major: application.StudentProfile?.major ?? 'Unknown major',
                    graduationYear: application.StudentProfile?.graduation_year ?? 0,
                    linkedinUrl: application.StudentProfile?.linkedin_url ?? null,
                  },
                }}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={isPending}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
