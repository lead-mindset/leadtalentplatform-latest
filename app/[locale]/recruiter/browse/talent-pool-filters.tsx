'use client'

import { useCallback, useMemo, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SkillsCombobox } from '@/components/ui/skills-combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SKILL_OPTIONS } from '@/lib/options'

type TalentPoolFiltersProps = {
  years: number[]
  chapters: Array<{ id: string; name: string }>
  current: {
    q?: string
    year?: string
    chapter?: string
    skills: string[]
  }
}

export function TalentPoolFilters({ years, chapters, current }: TalentPoolFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const skillOptions = useMemo(
    () => SKILL_OPTIONS.map(option => ({ value: option.value, label: option.value, category: option.category })),
    []
  )

  const pushWithUpdates = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value && value.length > 0 && value !== 'all') {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }

      if (!updates.page) params.delete('page')

      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search students by name..."
        defaultValue={current.q ?? ''}
        onChange={event => {
          if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
          const value = event.target.value.trim()
          searchDebounceRef.current = setTimeout(() => {
            pushWithUpdates({ q: value || undefined })
          }, 300)
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Select value={current.year ?? 'all'} onValueChange={value => pushWithUpdates({ year: value })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Graduation year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>
                Class of {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={current.chapter ?? 'all'} onValueChange={value => pushWithUpdates({ chapter: value })}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Chapter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All chapters</SelectItem>
            {chapters.map(chapter => (
              <SelectItem key={chapter.id} value={chapter.id}>
                {chapter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="min-w-80 flex-1">
          <SkillsCombobox
            value={current.skills}
            onChange={skills => pushWithUpdates({ skills: skills.join(',') || undefined })}
            options={skillOptions}
            placeholder="Filter by skills"
            searchPlaceholder="Search skills..."
          />
        </div>

        <Button variant="ghost" onClick={() => router.push(pathname)}>
          Clear filters
        </Button>
      </div>
    </div>
  )
}
