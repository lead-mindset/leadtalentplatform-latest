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
import { Search, X, GraduationCap, Globe, FileText, Link } from 'lucide-react'
import { useCallback, useRef, useTransition } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

interface BrowseFiltersProps {
  majors: string[]
  years: number[]
  chapters: [string, string][]
  cities: string[]
  currentFilters: {
    q?: string
    major?: string
    year?: string
    chapter?: string
    city?: string
    showAlumni?: string
    hasLinkedIn?: string
    hasPortfolio?: string
    hasResume?: string
    sortBy?: string
  }
}

export function BrowseFilters({
  majors,
  years,
  chapters,
  cities,
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

  const activeCount = [currentFilters.q, currentFilters.major, currentFilters.year, currentFilters.chapter, currentFilters.city, currentFilters.sortBy, currentFilters.showAlumni, currentFilters.hasLinkedIn, currentFilters.hasPortfolio, currentFilters.hasResume]
    .filter(Boolean).length

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Buscar perfiles de talento"
            placeholder="Buscar por nombre, correo o habilidad..."
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
            Limpiar filtros
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
          <SelectTrigger className="w-[12.5rem]" aria-label="Filtrar por área">
            <SelectValue placeholder="Todas las áreas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las áreas</SelectItem>
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
          <SelectTrigger className="w-[10rem]" aria-label="Filtrar por promoción">
            <SelectValue placeholder="Todos los años" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los años</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>
                Promoción {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.chapter ?? 'all'}
          onValueChange={val => updateParam('chapter', val)}
          disabled={isPending}
        >
          <SelectTrigger className="w-[12.5rem]" aria-label="Filtrar por capítulo">
            <SelectValue placeholder="Todos los capítulos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los capítulos</SelectItem>
            {chapters.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.city ?? 'all'}
          onValueChange={val => updateParam('city', val)}
          disabled={isPending}
        >
          <SelectTrigger className="w-[10rem]" aria-label="Filtrar por ciudad">
            <SelectValue placeholder="Todas las ciudades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.sortBy ?? 'all'}
          onValueChange={val => updateParam('sortBy', val === 'all' ? undefined : val)}
          disabled={isPending}
        >
          <SelectTrigger className="w-[10rem]" aria-label="Ordenar por">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Más recientes</SelectItem>
            <SelectItem value="updated_at">Última actualización</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={currentFilters.showAlumni === 'true'}
            onCheckedChange={checked => updateParam('showAlumni', checked ? 'true' : undefined)}
            disabled={isPending}
          />
          <div className="flex items-center gap-1.5 text-sm">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            Alumni
          </div>
        </label>
      </div>

      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={currentFilters.hasLinkedIn === 'true'}
            onCheckedChange={checked => updateParam('hasLinkedIn', checked ? 'true' : undefined)}
            disabled={isPending}
          />
          <div className="flex items-center gap-1.5 text-sm">
            <Link className="h-4 w-4 text-muted-foreground" />
            LinkedIn
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={currentFilters.hasPortfolio === 'true'}
            onCheckedChange={checked => updateParam('hasPortfolio', checked ? 'true' : undefined)}
            disabled={isPending}
          />
          <div className="flex items-center gap-1.5 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Portfolio
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={currentFilters.hasResume === 'true'}
            onCheckedChange={checked => updateParam('hasResume', checked ? 'true' : undefined)}
            disabled={isPending}
          />
          <div className="flex items-center gap-1.5 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            CV
          </div>
        </label>
      </div>
    </div>
  )
}
