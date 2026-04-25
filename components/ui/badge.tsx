import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-3 py-1 text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-300 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive/15 text-destructive ring-1 ring-destructive/30 focus-visible:ring-destructive/20 dark:bg-destructive/15 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/25",
        success:
          "bg-success/15 text-success ring-1 ring-success/30 focus-visible:ring-success/20 dark:bg-success/15 dark:focus-visible:ring-success/40 [a&]:hover:bg-success/25",
        warning:
          "bg-warning/15 text-warning ring-1 ring-warning/30 focus-visible:ring-warning/20 dark:bg-warning/15 dark:focus-visible:ring-warning/40 [a&]:hover:bg-warning/25",
        info:
          "bg-info/15 text-info ring-1 ring-info/30 focus-visible:ring-info/20 dark:bg-info/15 dark:focus-visible:ring-info/40 [a&]:hover:bg-info/25",
        outline:
          "border border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        neutral: "bg-card text-muted-foreground ring-1 ring-white/10",
        live: "bg-primary/15 text-primary ring-1 ring-primary/30 animate-pulse",
        student: "bg-primary/15 text-primary ring-1 ring-primary/30",
        editor: "bg-accent/15 text-accent ring-1 ring-accent/30",
        count: "min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-[10px] font-bold",
        link: "text-primary underline hover:underline underline-offset-4",
      },
      size: {
        default: "",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
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
