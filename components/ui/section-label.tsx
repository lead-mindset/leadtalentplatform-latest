import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: "accent" | "primary" | "muted"
  size?: "sm" | "md"
}

const sectionLabelVariants = {
  accent: "text-accent",
  primary: "text-primary",
  muted: "text-muted-foreground",
}

const sectionLabelSizes = {
  sm: "text-xs tracking-[0.3em]",
  md: "text-sm tracking-[0.2em]",
}

export function SectionLabel({ 
  children, 
  variant = "accent", 
  size = "md",
  className, 
  ...props 
}: SectionLabelProps) {
  return (
    <span
      className={cn(
        "font-bold uppercase mb-4 block",
        sectionLabelVariants[variant],
        sectionLabelSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
