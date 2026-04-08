'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  createCompany,
  deleteCompany,
  updateCompany,
  type CompanyListItem,
} from '@/lib/actions/admin/companies'

type Props = {
  items: CompanyListItem[]
  total: number
  page: number
  pageSize: 25 | 50 | 100
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-2 justify-between">
          <Input
            defaultValue={search}
            placeholder="Search company name"
            onChange={(event) => updateParam('search', event.target.value)}
            className="max-w-md"
          />
          <Button
            onClick={() => {
              setNameInput('')
              setCreateOpen(true)
            }}
          >
            Create Company
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                  {[
                    ['name', 'Company Name'],
                    ['createdat', 'Created At'],
                    ['createdByName', 'Created By'],
                    ['activeRecruiters', 'Active Recruiters'],
                    ['pendingInvites', 'Pending Invites'],
                  ].map(([key, label]) => (
                    <TableHead key={key} className="text-left p-2">
                      {key === 'createdByName' ? (
                        label
                      ) : (
                        <button
                          className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          onClick={() => toggleSort(key)}
                        >
                          {label}
                        </button>
                      )}
                    </TableHead>
                  ))}
                <TableHead className="text-left p-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="p-2 font-medium">{company.name}</TableCell>
                    <TableCell className="p-2">{new Date(company.createdat).toLocaleDateString()}</TableCell>
                    <TableCell className="p-2">{company.createdByName ?? '—'}</TableCell>
                    <TableCell className="p-2">{company.activeRecruiters}</TableCell>
                    <TableCell className="p-2">{company.pendingInvites}</TableCell>
                    <TableCell className="p-2">
                      <div className="flex gap-2">
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
                          disabled={company.activeRecruiters > 0 || company.pendingInvites > 0}
                          onClick={() => setDeleteOpen(company)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {items.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No companies created yet.
            </div>
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
                  if (!result.success) return toast.error(result.error)
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
                  if (!result.success) return toast.error(result.error)
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
              {deleteOpen?.name} will be deleted only if it has no active recruiters and no pending invites.
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
                  if (!result.success) return toast.error(result.error)
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
