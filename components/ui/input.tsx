import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "w-full rounded-md border border-input bg-background text-foreground shadow-xs placeholder:text-muted-foreground transition-colors duration-150 selection:bg-primary selection:text-primary-foreground hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-12 px-4 text-sm",
        sm: "h-10 px-3 text-sm",
        lg: "h-14 px-5 text-base",
      },
      state: {
        default: "",
        error: "ring-destructive/50 focus:ring-destructive",
        success: "ring-success/50 focus:ring-success",
      },
      variant: {
        default: "",
        filled: "bg-muted/50",
        outlined: "bg-background",
      },
    },
    defaultVariants: {
      size: "default",
      state: "default",
      variant: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string
  helperText?: React.ReactNode
  errorText?: React.ReactNode
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, state, label, helperText, errorText, iconLeft, iconRight, type, ...props }, ref) => {
    const inputState = errorText ? "error" : state

    if (!label && !helperText && !errorText && !iconLeft && !iconRight) {
      return (
        <input
          type={type}
          data-slot="input"
          className={cn(inputVariants({ size, state: inputState }), className)}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {iconLeft}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            data-slot="input"
            className={cn(
              inputVariants({ size, state: inputState }),
              iconLeft && "pl-11",
              iconRight && "pr-11",
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {iconRight}
            </div>
          )}
        </div>
        {helperText && !errorText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        {errorText && (
          <p className="text-xs text-destructive">{errorText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
