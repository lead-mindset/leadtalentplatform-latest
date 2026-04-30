"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Host {
  id: string
  name: string
  avatarUrl?: string | null
  href?: string
}

interface HostAvatarsProps {
  hosts: Host[]
  max?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
}

export function HostAvatars({
  hosts,
  max = 3,
  size = "md",
  className,
}: HostAvatarsProps) {
  const visibleHosts = hosts.slice(0, max)
  const remainingCount = hosts.length - max

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visibleHosts.map((host, index) => {
          const content = (
            <Avatar
              className={cn(
                sizeMap[size],
                "border-2 border-background ring-0",
                "transition-transform duration-200",
                "hover:scale-110 hover:z-10"
              )}
              style={{ zIndex: visibleHosts.length - index }}
            >
              <AvatarImage src={host.avatarUrl || undefined} alt={host.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {host.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )

          if (host.href) {
            return (
              <Link
                key={host.id}
                href={host.href}
                className="relative inline-block"
              >
                {content}
              </Link>
            )
          }

          return (
            <div key={host.id} className="relative inline-block">
              {content}
            </div>
          )
        })}
      </div>

      {remainingCount > 0 && (
        <div className="ml-2 text-sm text-muted-foreground">
          +{remainingCount} more
        </div>
      )}
    </div>
  )
}
