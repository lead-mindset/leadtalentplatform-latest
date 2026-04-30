"use client"

import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CategoryCardProps {
  name: string
  slug: string
  eventCount: number
  iconUrl?: string
  color?: string
  className?: string
}

export function CategoryCard({
  name,
  slug,
  eventCount,
  iconUrl,
  color,
  className,
}: CategoryCardProps) {
  const formattedCount = eventCount >= 1000 
    ? `${(eventCount / 1000).toFixed(0)}K` 
    : eventCount.toString()

  return (
    <Link href={`/discover?category=${slug}`} className="block">
      <Card
        className={cn(
          "group flex flex-col items-center justify-center p-6",
          "transition-all duration-200",
          "hover:scale-[1.02] hover:shadow-lg",
          "cursor-pointer",
          className
        )}
        style={{ backgroundColor: color }}
      >
        {}
        {iconUrl ? (
          <div className="relative h-12 w-12 mb-3">
            <Image
              src={iconUrl}
              alt={name}
              fill
              className="object-contain transition-transform duration-200 group-hover:scale-110"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <span className="text-xl font-bold text-primary">
              {name.charAt(0)}
            </span>
          </div>
        )}

        {}
        <h3 className="text-center font-semibold text-base">
          {name}
        </h3>

        {}
        <p className="mt-1 text-sm text-muted-foreground">
          {formattedCount} Events
        </p>
      </Card>
    </Link>
  )
}
