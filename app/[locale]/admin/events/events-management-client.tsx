'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
  ['title', 'Title'],
  ['startAt', 'Start'],
  ['chapters', 'Chapters'],
  ['status', 'Status'],
  ['registrations', 'Registrations'],
]

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = Boolean(search || chapterFilters.length || statusFilters.length)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search event titles and filter by chapter or lifecycle state.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              aria-label="Search events by title"
              className="md:w-80"
              defaultValue={search}
              placeholder="Search event title"
              onChange={(event) => updateParam('search', event.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Chapters ({chapterFilters.length || 'all'})</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter chapters</DropdownMenuLabel>
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
                <Button variant="outline">Status ({statusFilters.length || 'all'})</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilters.includes(status)}
                    onCheckedChange={() => toggleMulti('status', status, statusFilters)}
                  >
                    {status}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetFilters}>Reset</Button>
            <Button asChild><Link href="/admin/events/new">New event</Link></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {SORT_COLUMNS.map(([key, label]) => (
                    <TableHead key={key} className="whitespace-nowrap">
                      <button
                        className="min-h-6 rounded-sm px-1 py-1 hover:underline"
                        onClick={() => toggleSort(key)}
                      >
                        {label}{sortBy === key ? ` ${sortOrder === 'asc' ? 'up' : 'down'}` : ''}
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="w-[12rem]">Actions</TableHead>
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
                          {event.chapter && <Badge variant="info">{event.chapter.name}</Badge>}
                          {event.event_chapter?.map((collaborator) => (
                            <Badge key={collaborator.id} variant="secondary">
                              {collaborator.chapter?.name || 'Unknown chapter'}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={statusVariant(status)}>{status}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={event.capacity !== null && event.registrations >= event.capacity ? 'warning' : 'outline'}>
                          {event.registrations}{event.capacity !== null ? ` / ${event.capacity}` : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/events/${event.id}`}>Manage</Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/events/${event.id}`}>Public</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {items.length === 0 && (
            <div className="py-10 text-center">
              <CardTitle className="mb-2 text-lg">{hasFilters ? 'No events match your filters' : 'No events created yet'}</CardTitle>
              <p className="text-sm text-muted-foreground">{hasFilters ? 'Clear filters or try a different search.' : 'Create the first event or wait for chapter editors to add one.'}</p>
              <div className="mt-4 flex justify-center gap-2">
                {hasFilters && <Button variant="outline" onClick={resetFilters}>Clear filters</Button>}
                <Button asChild><Link href="/admin/events/new">New event</Link></Button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">{total} total - page {page} / {totalPages}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => updateParam('page', String(page + 1))}>Next</Button>
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
