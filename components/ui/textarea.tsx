import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-muted text-foreground placeholder:text-muted-foreground rounded-2xl px-4 py-3 w-full ring-1 ring-white/8 focus-visible:ring-white/25 focus-visible:outline-none transition-all duration-200 disabled:opacity-40 min-h-20 resize-none field-sizing-content",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
