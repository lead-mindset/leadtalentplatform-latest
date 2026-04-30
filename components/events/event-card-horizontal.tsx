"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin } from "lucide-react"
function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EventCardHorizontalProps {
  id: string
  title: string
  startAt: Date
  locationName?: string | null
  locationCity?: string | null
  coverImage?: string | null
  category?: string
  isPast?: boolean
  href: string
  className?: string
}

export function EventCardHorizontal({
  id,
  title,
  startAt,
  locationName,
  locationCity,
  coverImage,
  category,
  isPast,
  href,
  className,
}: EventCardHorizontalProps) {
  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "flex gap-4 p-4 transition-all duration-200",
          "hover:bg-accent/50 hover:shadow-md",
          isPast && "opacity-60",
          className
        )}
      >
        {}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          {}
          {category && (
            <Badge variant="outline" className="mb-1.5 w-fit text-xs">
              {category}
            </Badge>
          )}

          {}
          <h3 className="line-clamp-2 text-base font-semibold leading-tight">
            {title}
          </h3>

          {}
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {formatEventDate(startAt)}
            </span>
          </div>

          {}
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {locationName || locationCity || "Online"}
            </span>
          </div>

          {}
          {isPast && (
            <Badge variant="secondary" className="mt-2 w-fit text-xs">
              Past Event
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  )
}
