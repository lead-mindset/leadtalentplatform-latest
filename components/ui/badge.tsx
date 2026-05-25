import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary ring-1 ring-primary/20 [a&]:hover:bg-primary/20",
        secondary:
          "bg-muted/60 text-muted-foreground ring-1 ring-border/70 [a&]:hover:bg-muted [a&]:hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive ring-1 ring-destructive/30 focus-visible:ring-destructive/20 dark:bg-destructive/10 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/20",
        success:
          "bg-success/10 text-success ring-1 ring-success/30 focus-visible:ring-success/20 dark:bg-success/10 dark:focus-visible:ring-success/40 [a&]:hover:bg-success/20",
        warning:
          "bg-warning/10 text-warning ring-1 ring-warning/30 focus-visible:ring-warning/20 dark:bg-warning/10 dark:focus-visible:ring-warning/40 [a&]:hover:bg-warning/20",
        info:
          "bg-primary/15 text-[var(--md-sys-color-on-primary-container)] ring-1 ring-primary/25 focus-visible:ring-primary/25 [a&]:hover:bg-primary/20",
        outline:
          "border border-border/55 bg-muted/20 text-muted-foreground [a&]:hover:border-border/75 [a&]:hover:bg-muted/35 [a&]:hover:text-foreground",
        ghost: "text-muted-foreground [a&]:hover:bg-muted [a&]:hover:text-foreground",
        neutral: "bg-muted text-muted-foreground ring-1 ring-border",
        live: "bg-primary/10 text-primary ring-1 ring-primary/30 animate-pulse",
        student: "bg-primary/10 text-primary ring-1 ring-primary/20",
        editor: "bg-info/10 text-info ring-1 ring-info/20",
        count: "h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground",
        link: "rounded-none px-0 text-primary underline underline-offset-4",
      },
      size: {
        default: "",
        sm: "px-1.5 py-0.5 text-[10px]",
        lg: "px-2.5 py-1 text-sm",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      pulse: false,
    },
  }
)

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
  icon?: React.ReactNode
}

function Badge({
  className,
  variant = "default",
  size = "default",
  pulse = false,
  asChild = false,
  icon,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size, pulse }), className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
