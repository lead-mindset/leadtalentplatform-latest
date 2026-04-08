'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AdminEventListItem } from '@/lib/actions/admin/events'

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

function getStatus(item: AdminEventListItem) {
  const now = Date.now()
  if (new Date(item.endAt).getTime() < now) return 'past'
  if (!item.isPublished) return 'draft'
  if (new Date(item.startAt).getTime() > now) return 'upcoming'
  return 'published'
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
    params.set(key, value)
    if (key !== 'page') params.set('page', '1')
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

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-2">
          <Input
            className="max-w-sm"
            defaultValue={search}
            placeholder="Search event title"
            onChange={(e) => updateParam('search', e.target.value)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Chapters ({chapterFilters.length || 'all'})</Button>
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
              <Button variant="outline" size="sm">Status ({statusFilters.length || 'all'})</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {['published', 'draft', 'upcoming', 'past'].map((status) => (
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
          <Button asChild className="ml-auto">
            <Link href="/admin/events/new">New Event</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                  {[
                    ['title', 'Title'],
                    ['startAt', 'Start Date'],
                    ['chapter', 'Chapter'],
                    ['status', 'Status'],
                    ['registrations', 'Registrations'],
                  ].map(([key, label]) => (
                    <TableHead key={key} className="text-left p-2">
                      <button
                        className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        onClick={() => toggleSort(key)}
                      >
                        {label}
                      </button>
                    </TableHead>
                  ))}
                <TableHead className="text-left p-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((event) => {
                  const status = getStatus(event)
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="p-2 font-medium">{event.title}</TableCell>
                      <TableCell className="p-2">{new Date(event.startAt).toLocaleString()}</TableCell>
                      <TableCell className="p-2">{event.chapterName ?? 'Global'}</TableCell>
                      <TableCell className="p-2">
                        <Badge variant={status === 'published' ? 'secondary' : 'outline'}>{status}</Badge>
                      </TableCell>
                      <TableCell className="p-2">
                        {event.registrations}{event.capacity !== null ? ` / ${event.capacity}` : ''}
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex gap-2">
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

          {items.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No events found.</div>
          )}

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {total} total • page {page} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => updateParam('page', String(page + 1))}>
                Next
              </Button>
              {[25, 50, 100].map((size) => (
                <Button
                  key={size}
                  size="sm"
                  variant={pageSize === size ? 'default' : 'outline'}
                  onClick={() => updateParam('pageSize', String(size))}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
