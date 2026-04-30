import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "accent" | "muted"
}

const iconSizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
}

const iconInnerSizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
}

const iconVariants = {
  default: "bg-muted border border-border/30 text-foreground",
  accent: "bg-muted border border-border/30 text-accent",
  muted: "bg-muted/50 border border-border/20 text-muted-foreground",
}

export function Icon({ icon: Icon, size = "md", variant = "accent", className, ...props }: IconProps) {
  return (
    <div
      className={cn(
        "rounded-2xl flex items-center justify-center",
        iconSizes[size],
        iconVariants[variant],
        className
      )}
      {...props}
    >
      <Icon className={iconInnerSizes[size]} />
    </div>
  )
}
