"use client"

import Link from "next/link"
import Image from "next/image"
import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface CalendarRowProps {
  id: string
  name: string
  slug: string
  description: string
  avatarUrl?: string | null
  location?: string
  isSubscribed?: boolean
  onSubscribe?: () => Promise<void>
  className?: string
}

export function CalendarRow({
  id,
  name,
  slug,
  description,
  avatarUrl,
  location,
  isSubscribed: initialSubscribed = false,
  onSubscribe,
  className,
}: CalendarRowProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!onSubscribe || isLoading) return
    
    setIsLoading(true)
    try {
      await onSubscribe()
      setIsSubscribed(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={cn("flex items-center gap-4 p-4", className)}>
      {}
      <Link href={`/calendar/${slug}`} className="shrink-0">
        <Avatar className="h-12 w-12 border-2 border-background">
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      {}
      <div className="flex-1 min-w-0">
        <Link 
          href={`/calendar/${slug}`}
          className="block hover:underline"
        >
          <h3 className="font-semibold text-base truncate">
            {name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {location && <span className="font-medium">{location} · </span>}
          {description}
        </p>
      </div>

      {}
      <Button
        variant={isSubscribed ? "secondary" : "outline"}
        size="sm"
        onClick={handleSubscribe}
        disabled={isSubscribed || isLoading}
        className="shrink-0"
      >
        {isSubscribed ? (
          <>
            <Check className="mr-1.5 h-4 w-4" />
            Subscribed
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
    </Card>
  )
}
