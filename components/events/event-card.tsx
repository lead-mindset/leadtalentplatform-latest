import Image from 'next/image'
import { EventAccessModel, RegistrationStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface EventCardProps {
  id: string
  title: string
  startAt: Date
  location?: string | null
  meetingUrl?: string | null
  eventType: 'in_person' | 'online' | 'hybrid'
  accessModel: EventAccessModel
  capacity?: number | null
  registeredCount?: number
  isRegistered?: boolean
  registrationStatus?: RegistrationStatus
  chapterName?: string
  coverImage?: string | null
  onRegister?: () => void
  onViewDetails?: () => void
}

export function EventCard({
  title,
  startAt,
  location,
  eventType,
  accessModel,
  capacity,
  registeredCount = 0,
  isRegistered = false,
  registrationStatus,
  chapterName,
  coverImage,
  onRegister,
  onViewDetails,
}: EventCardProps) {
  const isOnline = eventType === 'online'
  const isHybrid = eventType === 'hybrid'
  const isApplicationRequired = accessModel === 'application'

  const getButtonLabel = () => {
    if (isRegistered) return 'Registered'
    if (registrationStatus === 'pending_review') return 'Under Review'
    if (registrationStatus === 'rejected') return 'Not Selected'
    if (isApplicationRequired) return 'Apply'
    return 'Register'
  }

  const isButtonDisabled =
    isRegistered ||
    registrationStatus === 'pending_review' ||
    registrationStatus === 'rejected'

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
      <div className="relative aspect-video bg-muted">
        {coverImage ? (
          <Image src={coverImage} alt={title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}

        {isApplicationRequired ? (
          <Badge variant="secondary" className="absolute right-2 top-2">
            Application Required
          </Badge>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        {chapterName ? <p className="text-sm text-muted-foreground">{chapterName}</p> : null}

        <h3 className="line-clamp-2 text-lg font-semibold">{title}</h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icons.Calendar />
          <span>{formatDateTime(startAt)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isOnline ? <Icons.Video /> : <Icons.MapPin />}
          <span>
            {isOnline ? 'Online event' : location || 'Location TBD'}
            {isHybrid ? ' + Online' : ''}
          </span>
        </div>

        {capacity ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icons.Users />
            <span>
              {registeredCount} / {capacity} registered
            </span>
          </div>
        ) : null}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onViewDetails}>
            View Details
          </Button>

          <Button
            type="button"
            className="flex-1"
            variant={isButtonDisabled ? 'secondary' : 'default'}
            onClick={onRegister}
            disabled={isButtonDisabled}
          >
            {getButtonLabel()}
          </Button>
        </div>
      </div>
    </div>
  )
}
