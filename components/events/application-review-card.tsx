'use client'

import { useState } from 'react'
import { User, Mail, GraduationCap, Calendar, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface ApplicationReviewCardProps {
  application: {
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
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, internalNote?: string) => Promise<void>
  isProcessing?: boolean
  showCheckbox?: boolean
}

export function ApplicationReviewCard({
  application,
  isSelected = false,
  onSelect,
  onApprove,
  onReject,
  isProcessing = false,
  showCheckbox = false,
}: ApplicationReviewCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [isActionPending, setIsActionPending] = useState(false)

  const handleApprove = async () => {
    setIsActionPending(true)
    try {
      await onApprove(application.id)
    } finally {
      setIsActionPending(false)
    }
  }

  const handleReject = async () => {
    setIsActionPending(true)
    try {
      await onReject(application.id, rejectNote)
      setShowRejectDialog(false)
      setRejectNote('')
    } finally {
      setIsActionPending(false)
    }
  }

  const isPending = application.status === 'pending_review'
  const isApproved = application.status === 'registered'
  const isRejected = application.status === 'rejected'

  return (
    <>
      <div className={`
        rounded-lg border bg-card p-4 transition-all
        ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}
        ${!isPending ? 'opacity-75' : ''}
      `}>
        <div className="flex items-start gap-4">
          {showCheckbox && isPending && (
            <div className="pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect?.(application.id, checked as boolean)}
                disabled={!isPending || isProcessing}
              />
            </div>
          )}

          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold">{application.User.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{application.User.email}</span>
                </div>
              </div>

              <Badge
                variant={isPending ? 'default' : isApproved ? 'secondary' : 'destructive'}
                className={`
                  ${isPending ? 'bg-amber-500' : ''}
                  ${isApproved ? 'bg-green-500' : ''}
                  ${isRejected ? 'bg-neutral-500' : ''}
                `}
              >
                {isPending && 'Pending Review'}
                {isApproved && 'Approved'}
                {isRejected && 'Rejected'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Major: {application.StudentProfile.major}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Graduation: {application.StudentProfile.graduationYear}</span>
              </div>
            </div>

            {application.StudentProfile.linkedinUrl && (
              <a
                href={application.StudentProfile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                LinkedIn Profile
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <p className="text-xs text-muted-foreground">
              Applied: {new Date(application.registeredAt).toLocaleDateString()}
            </p>
          </div>

          {isPending && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleApprove}
                disabled={isActionPending || isProcessing}
                className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={isActionPending || isProcessing}
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Reject {application.User.name}'s application for this event.
              {!showCheckbox && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Note: The student will be notified via email, but the reason is internal only (not shared with the student in v1).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Internal Note (optional)
            </label>
            <Textarea
              placeholder="Add any internal notes about this decision..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-2">
              This note is only visible to editors, not shared with the student.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isActionPending}>
              {isActionPending ? 'Processing...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
