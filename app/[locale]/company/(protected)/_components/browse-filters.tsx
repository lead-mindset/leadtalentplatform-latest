'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { useCallback, useRef, useTransition } from 'react'

interface BrowseFiltersProps {
  majors: string[]
  years: number[]
  chapters: [string, string][]
  currentFilters: {
    q?: string
    major?: string
    year?: string
    chapter?: string
  }
}

export function BrowseFilters({
  majors,
  years,
  chapters,
  currentFilters,
}: BrowseFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname)
    })
  }

  const activeCount = [currentFilters.q, currentFilters.major, currentFilters.year, currentFilters.chapter]
    .filter(Boolean).length

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search profiles by name, email, or skill..."
            defaultValue={currentFilters.q ?? ''}
            className="pl-10"
            onChange={e => {
              const val = e.target.value
              if (searchTimeout.current) {
                clearTimeout(searchTimeout.current)
              }
              searchTimeout.current = setTimeout(() => updateParam('q', val || undefined), 300)
            }}
          />
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" onClick={clearAll} className="gap-2 shrink-0">
            <X className="h-4 w-4" />
            Clear filters
            <Badge variant="secondary">{activeCount}</Badge>
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select
          value={currentFilters.major ?? 'all'}
          onValueChange={val => updateParam('major', val)}
          disabled={isPending}
        >
          <SelectTrigger className="w-[12.5rem]">
            <SelectValue placeholder="All focus areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All focus areas</SelectItem>
            {majors.map(major => (
              <SelectItem key={major} value={major}>
                {major}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.year ?? 'all'}
          onValueChange={val => updateParam('year', val)}
          disabled={isPending}
        >
          <SelectTrigger className="w-[10rem]">
            <SelectValue placeholder="All years" />
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

        <Select
          value={currentFilters.chapter ?? 'all'}
          onValueChange={val => updateParam('chapter', val)}
          disabled={isPending}
        >
          <SelectTrigger className="w-[12.5rem]">
            <SelectValue placeholder="All chapters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All chapters</SelectItem>
            {chapters.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
