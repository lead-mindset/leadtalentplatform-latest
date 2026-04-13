'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ApplicationReviewCard } from '@/components/events/application-review-card'
import { CapacityAdvisory } from '@/components/events/capacity-advisory'
import { EmptyState } from '@/components/ui/empty-state'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2 
} from 'lucide-react'
import { bulkApproveApplications, bulkRejectApplications } from '@/lib/actions/events/bulk-approve'
import { CAPACITY_WARNING_MESSAGE, BULK_APPROVE_FAILURE_MESSAGE } from '@/lib/constants'

interface Application {
  id: string
  userId: string
  registeredAt: string
  status: 'pending_review' | 'registered' | 'rejected'
  User: {
    name: string
    email: string
  }
  StudentProfile: {
    major: string
    graduationYear: number
    linkedinUrl?: string | null
  }
}

export default function EventApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [applications, setApplications] = useState<Application[]>([])
  const [event, setEvent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [capacityWarning, setCapacityWarning] = useState<{
    show: boolean
    status: 'at_capacity' | 'over_capacity' | null
  }>({ show: false, status: null })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const eventRes = await fetch(`/api/events/${eventId}`)
      const eventData = await eventRes.json()
      setEvent(eventData)

      const appsRes = await fetch(`/api/events/${eventId}/applications`)
      const appsData = await appsRes.json()
      setApplications(appsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const pendingApps = applications.filter(a => a.status === 'pending_review')
  const approvedApps = applications.filter(a => a.status === 'registered')
  const rejectedApps = applications.filter(a => a.status === 'rejected')

  const registeredCount = approvedApps.length
  const capacity = event?.capacity
  const isAtCapacity = capacity ? registeredCount >= capacity : false
  const isOverCapacity = capacity ? registeredCount > capacity : false

  const handleApprove = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/applications/${applicationId}/approve`, {
        method: 'POST',
      })
      const result = await response.json()

      if (result.capacityWarning) {
        setCapacityWarning({ show: true, status: result.capacityStatus })
        setTimeout(() => setCapacityWarning({ show: false, status: null }), 5000)
      }

      await loadData()
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleReject = async (applicationId: string, internalNote?: string) => {
    try {
      await fetch(`/api/events/${eventId}/applications/${applicationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ internalNote }),
      })
      await loadData()
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  const handleBulkApprove = async () => {
    const selectedIds = Array.from(selectedApplications)
    if (selectedIds.length === 0) return

    const willExceedCapacity = capacity && (registeredCount + selectedIds.length) > capacity
    
    if (willExceedCapacity && !confirm(
      `You're approving ${selectedIds.length} applicants but only ${Math.max(0, capacity - registeredCount)} spots remain. ` +
      `Approvals are still allowed — not all registered attendees show up. Confirm?` 
    )) {
      return
    }

    setIsBulkProcessing(true)
    try {
      const result = await bulkApproveApplications(eventId, selectedIds)
      
      if (result.capacityWarning) {
        setCapacityWarning({ show: true, status: result.capacityStatus })
        setTimeout(() => setCapacityWarning({ show: false, status: null }), 5000)
      }
      
      setSelectedApplications(new Set())
      await loadData()
    } catch (error) {
      alert(BULK_APPROVE_FAILURE_MESSAGE)
      console.error('Bulk approve failed:', error)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkReject = async () => {
    const selectedIds = Array.from(selectedApplications)
    if (selectedIds.length === 0) return

    if (!confirm(`Reject ${selectedIds.length} applicant${selectedIds.length > 1 ? 's' : ''}?`)) {
      return
    }

    setIsBulkProcessing(true)
    try {
      await bulkRejectApplications(eventId, selectedIds)
      setSelectedApplications(new Set())
      await loadData()
    } catch (error) {
      alert('Something went wrong — no rejections were saved. Please try again.')
      console.error('Bulk reject failed:', error)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedApplications.size === pendingApps.length) {
      setSelectedApplications(new Set())
    } else {
      setSelectedApplications(new Set(pendingApps.map(a => a.id)))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{event?.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="outline" className="text-sm">
            {event?.accessModel === 'application' ? 'Application Required' : 'Open Registration'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Capacity: {registeredCount} / {event?.capacity || '∞'} registered
          </span>
        </div>
      </div>

      {capacityWarning.show && (
        <CapacityAdvisory 
          status={capacityWarning.status || 'over_capacity'}
          className="mb-6"
        />
      )}

      {activeTab === 'pending' && pendingApps.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              disabled={isBulkProcessing}
            >
              {selectedApplications.size === pendingApps.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedApplications.size} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleBulkApprove}
              disabled={selectedApplications.size === 0 || isBulkProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isBulkProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkReject}
              disabled={selectedApplications.size === 0 || isBulkProcessing}
            >
              {isBulkProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject Selected
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pendingApps.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingApps.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            {approvedApps.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {approvedApps.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            {rejectedApps.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {rejectedApps.length}
              </Badge>
            )}
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
                application={application}
                isSelected={selectedApplications.has(application.id)}
                onSelect={(id, selected) => {
                  const newSet = new Set(selectedApplications)
                  if (selected) {
                    newSet.add(id)
                  } else {
                    newSet.delete(id)
                  }
                  setSelectedApplications(newSet)
                }}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={isBulkProcessing}
                showCheckbox={true}
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
                application={application}
                onApprove={handleApprove}
                onReject={handleReject}
                showCheckbox={false}
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
                application={application}
                onApprove={handleApprove}
                onReject={handleReject}
                showCheckbox={false}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
