import { useState } from 'react'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useTranslatedCareers } from '@/lib/use-translated-options'
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

export type CareerValue = string

export interface CareerCommandSelectProps {
  value: CareerValue
  onChange: (value: CareerValue) => void
  error?: string
}

export default function CareerCommandSelect({
  value,
  onChange,
  error,
}: CareerCommandSelectProps) {
  const t = useTranslations('onboarding')
  const translatedCareers = useTranslatedCareers()
  
  const [open, setOpen] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')

  const filteredOptions = translatedCareers.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSelect = (currentValue: CareerValue) => {
    onChange(currentValue === value ? '' : currentValue)
    setOpen(false)
    setSearchValue('')
  }

  const handleCreateCustom = (): void => {
    const trimmed = searchValue.trim()
    if (trimmed) {
      onChange(trimmed)
      setOpen(false)
      setSearchValue('')
    }
  }

  const showCreateOption: boolean =
    !!searchValue.trim() &&
    !translatedCareers.some(
      (option) => option.label.toLowerCase() === searchValue.toLowerCase()
    )

  const displayValue = translatedCareers.find(c => c.value === value)?.label || value

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {t('majorCareerField')}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {displayValue || t('selectCareerField')}
            <Icons.ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('searchCareerFields')}
              value={searchValue}
              onValueChange={setSearchValue}
            />

            <CommandList>
              <CommandEmpty>
                {showCreateOption ? (
                  <div className="px-2 py-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={handleCreateCustom}
                    >
                      {t('createCustom', { value: searchValue })}
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm">
                    {t('noCareerFound')}
                  </div>
                )}
              </CommandEmpty>

              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={handleSelect}
                    >
                      <Icons.CheckCircle2
                        className={`mr-2 h-4 w-4 ${
                          value.includes(option.value) ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <span>{option.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {showCreateOption && filteredOptions.length > 0 && (
                <CommandGroup>
                  <CommandItem onSelect={handleCreateCustom}>
                    {t('createCustom', { value: searchValue })}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <Icons.X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}