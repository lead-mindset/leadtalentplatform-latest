'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AdminEventListItem } from '@/lib/services/admin.service'
import { formatLeadDateTime } from '@/lib/utils/date-format'

type Props = {
  items: AdminEventListItem[]
  total: number
  page: number
  pageSize: 25 | 50 | 100
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  chapterFilters: string[]
  statusFilters: string[]
  chapterOptions: { id: string; name: string }[]
}

const STATUS_OPTIONS = ['published', 'draft', 'upcoming', 'past']
const SORT_COLUMNS: Array<[string, string]> = [
  ['title', 'Evento'],
  ['startAt', 'Inicio'],
  ['chapter', 'Capítulos'],
  ['status', 'Estado'],
  ['registrations', 'Registros'],
]

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicado',
  draft: 'Borrador',
  upcoming: 'Próximo',
  past: 'Finalizado',
}

function getStatus(item: AdminEventListItem) {
  const now = Date.now()
  if (new Date(item.end_at).getTime() < now) return 'past'
  if (!item.is_published) return 'draft'
  if (new Date(item.start_at).getTime() > now) return 'upcoming'
  return 'published'
}

function statusVariant(status: string) {
  if (status === 'published') return 'success'
  if (status === 'upcoming') return 'info'
  if (status === 'draft') return 'warning'
  return 'outline'
}

function getEventChapters(event: AdminEventListItem) {
  const chapters = [
    event.chapter,
    ...(event.event_chapter?.map((collaborator) => collaborator.chapter) ?? []),
  ].filter((chapter): chapter is NonNullable<typeof chapter> => Boolean(chapter))

  return Array.from(new Map(chapters.map((chapter) => [chapter.id, chapter])).values())
}

export function EventsManagementClient({
  items,
  total,
  page,
  pageSize,
  search,
  sortBy,
  sortOrder,
  chapterFilters,
  statusFilters,
  chapterOptions,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.delete('chapter')
    params.delete('status')
    params.delete('sortBy')
    params.delete('sortOrder')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleSort = (column: string) => {
    const nextOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', column)
    params.set('sortOrder', nextOrder)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleMulti = (key: string, value: string, current: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    params.delete(key)
    next.forEach((v) => params.append(key, v))
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const renderEventActions = (event: AdminEventListItem, compact = false) => (
    <div className={compact ? 'grid gap-2 sm:grid-cols-2' : 'flex flex-wrap gap-2'}>
      <Button asChild size="sm" variant="outline" className={compact ? 'w-full' : undefined}>
        <Link href={`/admin/events/${event.id}`}>Gestionar</Link>
      </Button>
      <Button asChild size="sm" variant="outline" className={compact ? 'w-full' : undefined}>
        <Link href={`/events/${event.id}`}>Vista pública</Link>
      </Button>
    </div>
  )

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = Boolean(search || chapterFilters.length || statusFilters.length)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca eventos y filtra por capítulo o estado del ciclo de vida.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              aria-label="Buscar eventos por título"
              className="md:w-80"
              defaultValue={search}
              placeholder="Buscar por título"
              onChange={(event) => updateParam('search', event.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Capítulos ({chapterFilters.length || 'todos'})</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filtrar capítulos</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {chapterOptions.map((chapter) => (
                  <DropdownMenuCheckboxItem
                    key={chapter.id}
                    checked={chapterFilters.includes(chapter.id)}
                    onCheckedChange={() => toggleMulti('chapter', chapter.id, chapterFilters)}
                  >
                    {chapter.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Estado ({statusFilters.length || 'todos'})</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filtrar estado</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilters.includes(status)}
                    onCheckedChange={() => toggleMulti('status', status, statusFilters)}
                  >
                    {STATUS_LABELS[status]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetFilters}>Limpiar filtros</Button>
            <Button asChild><Link href="/admin/events/new">Nuevo evento</Link></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:hidden">
            {items.map((event) => {
              const status = getStatus(event)
              const chapters = getEventChapters(event)

              return (
                <div key={event.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(status)}>{STATUS_LABELS[status]}</Badge>
                        <Badge
                          variant={
                            event.capacity !== null && event.registrations >= event.capacity
                              ? 'warning'
                              : 'outline'
                          }
                        >
                          {event.registrations}
                          {event.capacity !== null ? ` / ${event.capacity}` : ''} registros
                        </Badge>
                      </div>
                      <Link
                        className="block break-words text-base font-semibold text-foreground hover:underline"
                        href={`/admin/events/${event.id}`}
                      >
                        {event.title}
                      </Link>
                    </div>

                    <dl className="grid gap-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-muted-foreground">Inicio</dt>
                        <dd className="text-right font-medium">{formatLeadDateTime(event.start_at)}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-muted-foreground">Capítulos</dt>
                        <dd className="flex min-w-0 flex-1 flex-wrap justify-end gap-1 text-right">
                          {chapters.length ? (
                            chapters.map((chapter) => (
                              <Badge key={chapter.id} variant="secondary">
                                {chapter.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="font-medium">Sin capítulo</span>
                          )}
                        </dd>
                      </div>
                    </dl>

                    <details className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <summary className="cursor-pointer font-medium text-foreground/80">
                        ID técnico
                      </summary>
                      <p className="mt-2 break-all font-mono text-[11px] leading-5">{event.id}</p>
                    </details>

                    {renderEventActions(event, true)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {SORT_COLUMNS.map(([key, label]) => (
                    <TableHead key={key} className="whitespace-nowrap">
                      <button
                        className="min-h-6 rounded-sm px-1 py-1 hover:underline"
                        onClick={() => toggleSort(key)}
                      >
                        {label}{sortBy === key ? ` ${sortOrder === 'asc' ? 'asc' : 'desc'}` : ''}
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="w-[12rem]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((event) => {
                  const status = getStatus(event)
                  return (
                    <TableRow key={event.id} className="align-top">
                      <TableCell className="min-w-[16rem] font-medium">
                        {event.title}
                        <p className="mt-1 text-xs text-muted-foreground">{event.id}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatLeadDateTime(event.start_at)}</TableCell>
                      <TableCell className="min-w-[14rem]">
                        <div className="flex flex-wrap gap-1">
                          {getEventChapters(event).map((chapter) => (
                            <Badge key={chapter.id} variant="secondary">
                              {chapter.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={statusVariant(status)}>{STATUS_LABELS[status]}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={event.capacity !== null && event.registrations >= event.capacity ? 'warning' : 'outline'}>
                          {event.registrations}{event.capacity !== null ? ` / ${event.capacity}` : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {renderEventActions(event)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {items.length === 0 && (
            <div className="py-10 text-center">
              <CardTitle className="mb-2 text-lg">
                {hasFilters ? 'No hay eventos con esos filtros' : 'Aún no hay eventos creados'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {hasFilters
                  ? 'Limpia los filtros o prueba otra búsqueda.'
                  : 'Crea el primer evento o espera a que un editor de capítulo agregue uno.'}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {hasFilters && <Button variant="outline" onClick={resetFilters}>Limpiar filtros</Button>}
                <Button asChild><Link href="/admin/events/new">Nuevo evento</Link></Button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">{total} total - página {page} de {totalPages}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>Anterior</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => updateParam('page', String(page + 1))}>Siguiente</Button>
              {[25, 50, 100].map((size) => (
                <Button key={size} size="sm" variant={pageSize === size ? 'default' : 'outline'} onClick={() => updateParam('pageSize', String(size))}>{size}</Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
