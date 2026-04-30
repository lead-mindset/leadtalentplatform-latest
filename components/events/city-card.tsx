"use client"

import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CityCardProps {
  name: string
  slug: string
  eventCount: number
  iconUrl?: string
  className?: string
}

export function CityCard({
  name,
  slug,
  eventCount,
  iconUrl,
  className,
}: CityCardProps) {
  const formattedCount = eventCount >= 1000 
    ? `${(eventCount / 1000).toFixed(0)}K` 
    : eventCount.toString()

  return (
    <Link href={`/discover?city=${slug}`} className="block">
      <Card
        className={cn(
          "group flex items-center gap-3 p-3",
          "transition-all duration-200",
          "hover:bg-accent/50 hover:shadow-md",
          "cursor-pointer",
          className
        )}
      >
        {}
        {iconUrl ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={iconUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-sm font-bold text-primary">
              {name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm truncate">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {formattedCount} Events
          </p>
        </div>
      </Card>
    </Link>
  )
}
