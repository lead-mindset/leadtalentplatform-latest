"use client"

import { cn } from "@/lib/utils"

interface DateBlockProps {
  date: Date
  className?: string
}

export function DateBlock({ date, className }: DateBlockProps) {
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
  const day = date.getDate().toString()
  const isToday = new Date().toDateString() === date.toDateString()

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "w-14 shrink-0 rounded-lg border bg-card p-2",
        isToday && "border-primary bg-primary/5",
        className
      )}
    >
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {month}
      </span>
      <span className={cn(
        "text-2xl font-bold leading-none",
        isToday && "text-primary"
      )}>
        {day}
      </span>
    </div>
  )
}
