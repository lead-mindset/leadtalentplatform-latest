"use client"

import { useState } from "react"
import { CalendarPlus, Check } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EventShareButton } from "@/components/events/event-share-button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface RegistrationCardProps {
  eventId: string
  title: string
  startAt: Date
  endAt?: Date
  isPast: boolean
  isRegistered: boolean
  registrationStatus?: "pending" | "approved" | "rejected"
  requiresApplication: boolean
  onRegister: () => Promise<void>
  className?: string
}

export function RegistrationCard({
  eventId,
  title,
  startAt,
  endAt,
  isPast,
  isRegistered,
  registrationStatus,
  requiresApplication,
  onRegister,
  className,
}: RegistrationCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    setIsLoading(true)
    try {
      await onRegister()
      toast.success(
        requiresApplication 
          ? "Application submitted successfully!" 
          : "You're registered! Check your email for details."
      )
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getCtaLabel = () => {
    if (isPast) return "Event Ended"
    if (isRegistered) return "Registered"
    if (registrationStatus === "pending") return "Under Review"
    if (registrationStatus === "rejected") return "Not Selected"
    if (requiresApplication) return "Apply to Attend"
    return "Register"
  }

  const getCtaVariant = () => {
    if (isPast) return "secondary"
    if (isRegistered) return "secondary"
    return "default"
  }

  const isCtaDisabled = isPast || isRegistered || registrationStatus === "pending" || registrationStatus === "rejected"

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      {}
      <div className="flex items-center justify-between">
        <Badge 
          variant={isPast ? "secondary" : isRegistered ? "default" : "outline"}
          className={cn(
            isPast && "text-muted-foreground",
            isRegistered && "bg-success text-success-foreground"
          )}
        >
          {isPast ? (
            "Past Event"
          ) : isRegistered ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              Registered
            </>
          ) : (
            "Open Registration"
          )}
        </Badge>
      </div>

      {}
      <div className="space-y-1">
        <p className="font-semibold text-lg">
          {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(startAt)}
        </p>
        <p className="text-muted-foreground">
          {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(startAt)}
          {endAt && ` - ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(endAt)}`}
        </p>
      </div>

      <Separator />

      {}
      <Button
        className="w-full"
        size="lg"
        variant={getCtaVariant()}
        onClick={handleRegister}
        disabled={isCtaDisabled || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          getCtaLabel()
        )}
      </Button>

      {}
      <div className="flex gap-2">
        <EventShareButton eventId={eventId} eventTitle={title} className="flex-1" />
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {

            toast.info("Calendar integration coming soon!")
          }}
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>
      </div>

      {}
      {requiresApplication && !isRegistered && !isPast && (
        <p className="text-xs text-muted-foreground text-center">
          This event requires an application. You&apos;ll be notified once reviewed.
        </p>
      )}
    </Card>
  )
}
