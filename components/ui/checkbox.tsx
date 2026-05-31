"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  defaultChecked,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const [mounted, setMounted] = React.useState(false)
  const isChecked = checked === true || checked === "indeterminate" || defaultChecked === true

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <span
        data-slot="checkbox"
        aria-hidden="true"
        className={cn(
          "peer size-6 shrink-0 rounded-[4px] border border-input/60 shadow-xs transition-shadow outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          isChecked && "border-primary bg-primary text-primary-foreground dark:bg-primary",
          className
        )}
      >
        {isChecked ? (
          <span data-slot="checkbox-indicator" className="grid place-content-center text-current transition-none">
            <CheckIcon className="size-4" />
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      suppressHydrationWarning
      checked={checked}
      defaultChecked={defaultChecked}
      className={cn(
        "peer size-6 shrink-0 rounded-[4px] border border-input/60 shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
