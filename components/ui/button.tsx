import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:bg-muted! disabled:text-muted-foreground! disabled:opacity-100 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        success:
          "bg-success/10 text-success ring-1 ring-success/30 hover:bg-success/20",
        warning:
          "bg-warning/10 text-warning ring-1 ring-warning/30 hover:bg-warning/20",
        info:
          "bg-info/10 text-info ring-1 ring-info/30 hover:bg-info/20",
        outline:
          "border border-border bg-background shadow-xs hover:bg-muted hover:text-foreground",
        secondary:
          "bg-muted text-foreground ring-1 ring-border shadow-xs hover:bg-muted/80",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        glass:
          "bg-card/80 text-foreground ring-1 ring-border backdrop-blur hover:bg-card",
        brand:
          "button-gradient-primary rounded-full font-semibold text-primary-foreground shadow-sm hover:shadow-md",
        hero:
          "button-gradient-primary rounded-full px-7 font-semibold text-primary-foreground shadow-sm hover:shadow-md",
        link: "h-auto rounded-none px-0 text-primary underline-offset-4 hover:underline",
        filled: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        tonal: "bg-muted text-foreground ring-1 ring-border shadow-xs hover:bg-muted/80",
        outlined: "border border-border bg-background shadow-xs hover:bg-muted hover:text-foreground",
        text: "h-auto rounded-none px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        xs: "h-6 gap-1 rounded px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 text-base has-[>svg]:px-5",
        icon: "size-10",
        "icon-xs": "size-6 rounded [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, iconPosition = "right", children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    if (asChild) {
      return (
        <Comp
          data-slot="button"
          data-variant={variant}
          data-size={size}
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span className="inline-flex min-w-0 w-full items-center justify-[inherit] gap-2 [&>svg]:shrink-0">
          {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
