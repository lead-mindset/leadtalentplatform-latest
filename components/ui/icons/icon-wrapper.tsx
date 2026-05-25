import * as React from "react"
import { cn } from "@/lib/utils"

interface IconWrapperProps {
  children: React.ReactNode
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  "aria-label"?: string
  "aria-hidden"?: boolean
}

const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8"
}

export function IconWrapper({
  children,
  size = "md",
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = false,
  ...props
}: IconWrapperProps) {
  const accessibilityProps = ariaHidden
    ? { "aria-hidden": true }
    : ariaLabel
      ? { role: "img", "aria-label": ariaLabel }
      : {}

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0",
          iconSizes[size],
          className
        )}
        {...accessibilityProps}
        {...props}
      >
        {children}
      </span>
    </div>
  )
}

export default IconWrapper
