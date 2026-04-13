import { EventAccessModel, RegistrationStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Video, Users } from 'lucide-react'

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
  id,
  title, 
  startAt, 
  location, 
  meetingUrl,
  eventType,
  accessModel,
  capacity,
  registeredCount = 0,
  isRegistered = false,
  registrationStatus,
  chapterName,
  coverImage,
  onRegister,
  onViewDetails
}: EventCardProps) {
  
  const isOnline = eventType === 'online'
  const isHybrid = eventType === 'hybrid'
  const isApplicationRequired = accessModel === 'application'
  
  const getButtonLabel = () => {
    if (isRegistered) return 'Registered ✓'
    if (registrationStatus === 'pending_review') return 'Under Review'
    if (registrationStatus === 'rejected') return 'Not Selected'
    if (isApplicationRequired) return 'Apply'
    return 'Register'
  }
  
  const isButtonDisabled = () => {
    if (isRegistered) return true
    if (registrationStatus === 'pending_review') return true
    if (registrationStatus === 'rejected') return true
    return false
  }

  return (
    <div className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted relative">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
        
        {isApplicationRequired && (
          <Badge variant="secondary" className="absolute top-2 right-2 bg-amber-500/90 text-white">
            Application Required
          </Badge>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        {chapterName && (
          <p className="text-sm text-muted-foreground">{chapterName}</p>
        )}
        
        <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formatDateTime(startAt)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isOnline ? (
            <Video className="w-4 h-4" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          <span>
            {isOnline ? 'Online Event' : location || 'Location TBD'}
            {isHybrid && ' + Online'}
          </span>
        </div>
        
        {capacity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{registeredCount} / {capacity} registered</span>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <button
            onClick={onViewDetails}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-md border hover:bg-accent transition-colors"
          >
            View Details
          </button>
          
          <button
            onClick={onRegister}
            disabled={isButtonDisabled()}
            className={`
              flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
              ${isButtonDisabled() 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : isApplicationRequired 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }
            `}
          >
            {getButtonLabel()}
          </button>
        </div>
      </div>
    </div>
  )
}
