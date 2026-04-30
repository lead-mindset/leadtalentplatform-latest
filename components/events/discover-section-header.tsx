"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscoverSectionHeaderProps {
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

export function DiscoverSectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  className,
}: DiscoverSectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="group flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
