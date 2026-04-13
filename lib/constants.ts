export const CAPACITY_WARNING_MESSAGE = 'This event is approaching capacity. Some spots may still be available if people cancel.'
export const BULK_APPROVE_FAILURE_MESSAGE = 'Something went wrong — no approvals were saved. Please try again.'

export const EVENT_ACCESS_MODEL_OPTIONS = [
  { value: 'open', label: 'Open registration' },
  { value: 'application', label: 'Application required' }
] as const

export const REGISTRATION_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered', color: 'green' },
  { value: 'pending_review', label: 'Under Review', color: 'amber' },
  { value: 'rejected', label: 'Not Selected', color: 'neutral' },
  { value: 'cancelled', label: 'Cancelled', color: 'neutral' },
  { value: 'attended', label: 'Attended', color: 'blue' }
] as const

export const EVENT_TYPE_OPTIONS = [
  { value: 'in_person', label: 'In Person' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' }
] as const
