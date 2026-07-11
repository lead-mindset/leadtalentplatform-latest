'use client'

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface SkillOption {
  value: string
  label: string
  category: string
}

interface SkillsComboboxProps {
  value: string[]
  onChange: (value: string[]) => void
  options: SkillOption[]
  label?: string
  countLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  createLabel?: (input: string) => string
  noResultsLabel?: string
  error?: string
  required?: boolean
}

export function SkillsCombobox({
  value,
  onChange,
  options,
  label,
  countLabel,
  placeholder = 'Select skills...',
  searchPlaceholder = 'Search skills...',
  createLabel = (input) => `Create "${input}"`,
  noResultsLabel = 'No skills found.',
  error,
  required,
}: SkillsComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const showCreateCondition = 
    !!search.trim() &&
    !options.some((opt) => opt.label.toLowerCase() === search.trim().toLowerCase()) &&
    !value.includes(search.trim())

  const toggle = (skill: string) => {
    onChange(
      value.includes(skill)
        ? value.filter((s) => s !== skill)
        : [...value, skill]
    )
  }

  const createCustom = () => {
    const trimmed = search.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setSearch('')
  }

  const remove = (skill: string) => {
    onChange(value.filter((s) => s !== skill))
  }

  const getLabel = (skill: string) =>
    options.find((o) => o.value === skill)?.label ?? skill

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          {countLabel && (
            <span className="text-xs text-muted-foreground">
              {value.length} {countLabel}
            </span>
          )}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal h-9"
          >
            {value.length > 0
              ? `${value.length} skill${value.length > 1 ? 's' : ''} selected`
              : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 && !showCreate && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {noResultsLabel}
                </p>
              )}
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      toggle(option.value)
                      setSearch('')
                      setOpen(false)
                    }}
                  >
                    {option.label}
                  </CommandItem>
                ))}
                {showCreate && (
                  <CommandItem
                    value={search}
                    onSelect={() => {
                      if (search && !value.includes(search)) {
                        onChange([...value, search])
                      }
                      setShowCreate(false)
                      setSearch('')
                      setOpen(false)
                    }}
                  >
                    Create "{search}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <Badge key={skill} variant="secondary" className="gap-1 pr-1 text-xs">
              {getLabel(skill)}
              <button
                type="button"
                onClick={() => remove(skill)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-secondary-foreground/10 transition-colors"
                aria-label={`Remove ${getLabel(skill)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}