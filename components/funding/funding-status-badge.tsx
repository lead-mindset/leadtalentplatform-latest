import { Badge, type BadgeProps } from '@/components/ui/badge'
import { FUNDING_STATUS_LABELS } from '@/lib/funding-display'
import type { FundingRequestStatus } from '@/lib/services/funding.service'

const STATUS_VARIANTS: Record<FundingRequestStatus, BadgeProps['variant']> = {
  draft: 'secondary',
  submitted: 'default',
  changes_requested: 'warning',
  approved: 'success',
  rejected: 'neutral',
  receipts_due: 'warning',
  closed: 'outline',
}

export function FundingStatusBadge({ status }: { status: FundingRequestStatus | string }) {
  const safeStatus = status as FundingRequestStatus
  return (
    <Badge variant={STATUS_VARIANTS[safeStatus] ?? 'secondary'}>
      {FUNDING_STATUS_LABELS[safeStatus] ?? status}
    </Badge>
  )
}

