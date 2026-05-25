'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCompany, deleteCompany, updateCompany } from '@/lib/actions/admin/companies'
import type { CompanyListItem } from '@/lib/services/admin.service'
import { formatLeadDate } from '@/lib/utils/date-format'

type Props = {
  items: CompanyListItem[]
  total: number
  page: number
  pageSize: 25 | 50 | 100
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const SORT_COLUMNS: Array<[string, string]> = [
  ['name', 'Company'],
  ['createdat', 'Created'],
  ['created_by_name', 'Created by'],
  ['active_recruiters', 'Active representatives'],
  ['pending_invites', 'Pending invites'],
]

export function CompaniesManagementClient({
  items,
  total,
  page,
  pageSize,
  search,
  sortBy,
  sortOrder,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<CompanyListItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState<CompanyListItem | null>(null)
  const [nameInput, setNameInput] = useState('')

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
    params.delete('sortBy')
    params.delete('sortOrder')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleSort = (column: string) => {
    if (column === 'created_by_name') return
    const nextOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', column)
    params.set('sortOrder', nextOrder)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = Boolean(search)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search organizations and sort access-readiness columns.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            aria-label="Search companies by name"
            defaultValue={search}
            placeholder="Search company name"
            onChange={(event) => updateParam('search', event.target.value)}
            className="md:max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetFilters}>Reset</Button>
            <Button
              onClick={() => {
                setNameInput('')
                setCreateOpen(true)
              }}
            >
              Create company
            </Button>
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
                      {key === 'created_by_name' ? (
                        label
                      ) : (
                        <button
                          className="min-h-6 rounded-sm px-1 py-1 hover:underline"
                          onClick={() => toggleSort(key)}
                        >
                          {label}{sortBy === key ? ` ${sortOrder === 'asc' ? 'up' : 'down'}` : ''}
                        </button>
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="w-[16rem]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((company) => {
                  const deleteBlocked = company.active_recruiters > 0 || company.pending_invites > 0
                  return (
                    <TableRow key={company.id} className="align-top">
                      <TableCell className="font-medium">
                        {company.name}
                        <p className="mt-1 text-xs text-muted-foreground">{company.id}</p>
                      </TableCell>
                      <TableCell>{formatLeadDate(company.created_at)}</TableCell>
                      <TableCell>{company.created_by_name ?? '-'}</TableCell>
                      <TableCell><Badge variant={company.active_recruiters > 0 ? 'success' : 'outline'}>{company.active_recruiters}</Badge></TableCell>
                      <TableCell><Badge variant={company.pending_invites > 0 ? 'warning' : 'outline'}>{company.pending_invites}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/companies/${company.id}`}>Manage</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditOpen(company)
                              setNameInput(company.name)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deleteBlocked}
                            title={deleteBlocked ? 'Delete is blocked while representatives or pending invites exist.' : 'Delete company'}
                            onClick={() => setDeleteOpen(company)}
                          >
                            Delete
                          </Button>
                          {deleteBlocked && (
                            <p className="w-full text-xs text-muted-foreground">Delete blocked by representatives or pending invites.</p>
                          )}
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
              <CardTitle className="mb-2 text-lg">{hasFilters ? 'No companies match your filters' : 'No companies created yet'}</CardTitle>
              <p className="text-sm text-muted-foreground">{hasFilters ? 'Clear filters or try a different company name.' : 'Create the first company before issuing representative access.'}</p>
              <div className="mt-4 flex justify-center gap-2">
                {hasFilters && <Button variant="outline" onClick={resetFilters}>Clear filters</Button>}
                <Button onClick={() => setCreateOpen(true)}>Create company</Button>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Company</DialogTitle>
            <DialogDescription>Company names must be unique.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              disabled={isPending || !nameInput.trim()}
              onClick={() =>
                startTransition(async () => {
                  const result = await createCompany(nameInput)
                  if (!result.success) {
                    toast.error(result.error)
                    return
                  }
                  toast.success('Company created.')
                  setCreateOpen(false)
                  router.refresh()
                })
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editOpen)} onOpenChange={(open) => !open && setEditOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(null)}>Cancel</Button>
            <Button
              disabled={isPending || !nameInput.trim() || !editOpen}
              onClick={() =>
                startTransition(async () => {
                  if (!editOpen) return
                  const result = await updateCompany(editOpen.id, nameInput)
                  if (!result.success) {
                    toast.error(result.error)
                    return
                  }
                  toast.success('Company updated.')
                  setEditOpen(null)
                  router.refresh()
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteOpen)} onOpenChange={(open) => !open && setDeleteOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete company?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteOpen?.name} will be deleted only if it has no active company representatives and no pending invites.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending || !deleteOpen}
              onClick={() =>
                startTransition(async () => {
                  if (!deleteOpen) return
                  const result = await deleteCompany(deleteOpen.id)
                  if (!result.success) {
                    toast.error(result.error)
                    return
                  }
                  toast.success('Company deleted.')
                  setDeleteOpen(null)
                  router.refresh()
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
