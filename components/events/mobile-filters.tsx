"use client"

import { useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
}

interface MobileFiltersProps {
  filterGroups: FilterGroup[]
  activeFilters: Record<string, string[]>
  onFilterChange: (groupId: string, values: string[]) => void
  onClearFilters: () => void
  className?: string
}

export function MobileFilters({
  filterGroups,
  activeFilters,
  onFilterChange,
  onClearFilters,
  className,
}: MobileFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount = Object.values(activeFilters).flat().length

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {}
      {activeFilterCount > 0 && (
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-2">
          {filterGroups.map((group) =>
            activeFilters[group.id]?.map((value) => {
              const option = group.options.find((o) => o.value === value)
              if (!option) return null
              return (
                <Badge
                  key={`${group.id}-${value}`}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    const newValues = activeFilters[group.id].filter(
                      (v) => v !== value
                    )
                    onFilterChange(group.id, newValues)
                  }}
                >
                  {option.label}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              )
            })
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onClearFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[85vh] sm:h-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {filterGroups.map((group) => (
              <div key={group.id}>
                <h3 className="font-medium text-sm mb-3">{group.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const isActive = activeFilters[group.id]?.includes(option.value)
                    return (
                      <Button
                        key={option.value}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const currentValues = activeFilters[group.id] || []
                          const newValues = isActive
                            ? currentValues.filter((v) => v !== option.value)
                            : [...currentValues, option.value]
                          onFilterChange(group.id, newValues)
                        }}
                        className="h-8"
                      >
                        {option.label}
                        {option.count !== undefined && (
                          <span className="ml-1.5 text-xs opacity-60">
                            ({option.count})
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
                <Separator className="mt-6" />
              </div>
            ))}
          </div>

          <SheetFooter className="mt-6 flex-row gap-2">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button 
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Apply Filters
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
