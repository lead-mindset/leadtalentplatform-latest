import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "button-gradient-primary text-background",
        destructive:
          "bg-destructive/15 text-destructive ring-1 ring-destructive/30 hover:bg-destructive/25 hover:ring-destructive/50",
        success:
          "bg-success/15 text-success ring-1 ring-success/30 hover:bg-success/25 hover:ring-success/50",
        warning:
          "bg-warning/15 text-warning ring-1 ring-warning/30 hover:bg-warning/25 hover:ring-warning/50",
        info:
          "bg-info/15 text-info ring-1 ring-info/30 hover:bg-info/25 hover:ring-info/50",
        outline:
          "border border-border/60 bg-background shadow-xs hover:bg-accent/10 hover:text-accent-foreground hover:border-accent/30",
        secondary:
          "bg-secondary text-secondary-foreground ring-1 ring-white/5 hover:bg-secondary/80 hover:ring-white/10",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-white/5",
        glass:
          "bg-secondary/60 backdrop-blur-xl text-foreground ring-1 ring-white/10 hover:bg-secondary/80 hover:ring-white/20",
        link: "text-primary underline hover:underline underline-offset-4",
        filled: "md-button-filled",
        tonal: "md-button-tonal",
        outlined: "md-button-outlined",
        text: "md-button-text",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-14 px-8 text-base has-[>svg]:px-6",
        icon: "size-10",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-14",
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

    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }), "font-montserrat")}
        ref={ref}
        {...props}
      >
        {asChild ? (
          <span>
            {icon && iconPosition === "left" && <span className="mr-1">{icon}</span>}
            {children}
            {icon && iconPosition === "right" && <span className="ml-1">{icon}</span>}
          </span>
        ) : (
          <div className="contents">
            {icon && iconPosition === "left" && <span className="mr-1">{icon}</span>}
            {children}
            {icon && iconPosition === "right" && <span className="ml-1">{icon}</span>}
          </div>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
