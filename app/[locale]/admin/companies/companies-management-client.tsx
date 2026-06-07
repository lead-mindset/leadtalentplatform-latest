'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
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

const COPY = {
  es: {
    sortColumns: {
      name: 'Empresa',
      createdat: 'Creada',
      created_by_name: 'Creada por',
      active_recruiters: 'Representantes activos',
      pending_invites: 'Invitaciones pendientes',
    },
    filtersTitle: 'Filtros',
    filtersDescription: 'Busca empresas y ordena por columnas de acceso.',
    searchAria: 'Buscar empresas por nombre',
    searchPlaceholder: 'Buscar nombre de empresa',
    reset: 'Restablecer',
    createCompany: 'Crear empresa',
    actions: 'Acciones',
    manage: 'Gestionar',
    edit: 'Editar',
    delete: 'Eliminar',
    deleteBlockedTitle: 'No se puede eliminar mientras existan representantes o invitaciones pendientes.',
    deleteTitle: 'Eliminar empresa',
    deleteBlocked: 'Bloqueado por representantes o invitaciones pendientes.',
    noMatches: 'No hay empresas con esos filtros',
    noItems: 'Aun no hay empresas creadas',
    clearHelp: 'Limpia los filtros o prueba otro nombre.',
    createHelp: 'Crea la primera empresa antes de emitir accesos.',
    clearFilters: 'Limpiar filtros',
    totalLabel: 'total',
    pageLabel: 'pagina',
    previous: 'Anterior',
    next: 'Siguiente',
    sortAsc: 'ascendente',
    sortDesc: 'descendente',
    createTitle: 'Crear empresa',
    createDescription: 'El nombre de la empresa debe ser unico.',
    editTitle: 'Editar empresa',
    name: 'Nombre',
    cancel: 'Cancelar',
    create: 'Crear',
    save: 'Guardar',
    createdToast: 'Empresa creada.',
    updatedToast: 'Empresa actualizada.',
    deletedToast: 'Empresa eliminada.',
    deleteConfirmTitle: 'Eliminar empresa?',
    deleteConfirmDescription: 'se eliminara solo si no tiene representantes activos ni invitaciones pendientes.',
  },
  en: {
    sortColumns: {
      name: 'Company',
      createdat: 'Created',
      created_by_name: 'Created by',
      active_recruiters: 'Active representatives',
      pending_invites: 'Pending invites',
    },
    filtersTitle: 'Filters',
    filtersDescription: 'Search organizations and sort access-readiness columns.',
    searchAria: 'Search companies by name',
    searchPlaceholder: 'Search company name',
    reset: 'Reset',
    createCompany: 'Create company',
    actions: 'Actions',
    manage: 'Manage',
    edit: 'Edit',
    delete: 'Delete',
    deleteBlockedTitle: 'Delete is blocked while representatives or pending invites exist.',
    deleteTitle: 'Delete company',
    deleteBlocked: 'Delete blocked by representatives or pending invites.',
    noMatches: 'No companies match your filters',
    noItems: 'No companies created yet',
    clearHelp: 'Clear filters or try a different company name.',
    createHelp: 'Create the first company before issuing representative access.',
    clearFilters: 'Clear filters',
    totalLabel: 'total',
    pageLabel: 'page',
    previous: 'Previous',
    next: 'Next',
    sortAsc: 'ascending',
    sortDesc: 'descending',
    createTitle: 'Create Company',
    createDescription: 'Company names must be unique.',
    editTitle: 'Edit Company',
    name: 'Name',
    cancel: 'Cancel',
    create: 'Create',
    save: 'Save',
    createdToast: 'Company created.',
    updatedToast: 'Company updated.',
    deletedToast: 'Company deleted.',
    deleteConfirmTitle: 'Delete company?',
    deleteConfirmDescription: 'will be deleted only if it has no active company representatives and no pending invites.',
  },
} as const

const SORT_COLUMNS = ['name', 'createdat', 'created_by_name', 'active_recruiters', 'pending_invites'] as const

export function CompaniesManagementClient({
  items,
  total,
  page,
  pageSize,
  search,
  sortBy,
  sortOrder,
}: Props) {
  const locale = useLocale() === 'en' ? 'en' : 'es'
  const copy = COPY[locale]
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
          <CardTitle>{copy.filtersTitle}</CardTitle>
          <CardDescription>{copy.filtersDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            aria-label={copy.searchAria}
            defaultValue={search}
            placeholder={copy.searchPlaceholder}
            onChange={(event) => updateParam('search', event.target.value)}
            className="md:max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetFilters}>{copy.reset}</Button>
            <Button
              onClick={() => {
                setNameInput('')
                setCreateOpen(true)
              }}
            >
              {copy.createCompany}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="hidden overflow-x-auto lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {SORT_COLUMNS.map((key) => (
                    <TableHead key={key} className="whitespace-nowrap">
                      {key === 'created_by_name' ? (
                        copy.sortColumns[key]
                      ) : (
                        <button
                          className="min-h-6 rounded-sm px-1 py-1 hover:underline"
                          onClick={() => toggleSort(key)}
                        >
                          {copy.sortColumns[key]}{sortBy === key ? ` ${sortOrder === 'asc' ? copy.sortAsc : copy.sortDesc}` : ''}
                        </button>
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="w-[16rem]">{copy.actions}</TableHead>
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
                            <Link href={`/admin/companies/${company.id}`}>{copy.manage}</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditOpen(company)
                              setNameInput(company.name)
                            }}
                          >
                            {copy.edit}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deleteBlocked}
                            title={deleteBlocked ? copy.deleteBlockedTitle : copy.deleteTitle}
                            onClick={() => setDeleteOpen(company)}
                          >
                            {copy.delete}
                          </Button>
                          {deleteBlocked && (
                            <p className="w-full text-xs text-muted-foreground">{copy.deleteBlocked}</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {items.map((company) => {
              const deleteBlocked = company.active_recruiters > 0 || company.pending_invites > 0

              return (
                <div key={company.id} className="space-y-4 py-4">
                  <div className="space-y-1">
                    <p className="break-words font-semibold">{company.name}</p>
                    <p className="break-all text-xs text-muted-foreground">{company.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{copy.sortColumns.createdat}</p>
                      <p>{formatLeadDate(company.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{copy.sortColumns.created_by_name}</p>
                      <p>{company.created_by_name ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{copy.sortColumns.active_recruiters}</p>
                      <Badge variant={company.active_recruiters > 0 ? 'success' : 'outline'}>{company.active_recruiters}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{copy.sortColumns.pending_invites}</p>
                      <Badge variant={company.pending_invites > 0 ? 'warning' : 'outline'}>{company.pending_invites}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/companies/${company.id}`}>{copy.manage}</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditOpen(company)
                        setNameInput(company.name)
                      }}
                    >
                      {copy.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deleteBlocked}
                      title={deleteBlocked ? copy.deleteBlockedTitle : copy.deleteTitle}
                      onClick={() => setDeleteOpen(company)}
                    >
                      {copy.delete}
                    </Button>
                  </div>
                  {deleteBlocked && (
                    <p className="text-xs text-muted-foreground">{copy.deleteBlocked}</p>
                  )}
                </div>
              )
            })}
          </div>

          {items.length === 0 && (
            <div className="py-10 text-center">
              <CardTitle className="mb-2 text-lg">{hasFilters ? copy.noMatches : copy.noItems}</CardTitle>
              <p className="text-sm text-muted-foreground">{hasFilters ? copy.clearHelp : copy.createHelp}</p>
              <div className="mt-4 flex justify-center gap-2">
                {hasFilters && <Button variant="outline" onClick={resetFilters}>{copy.clearFilters}</Button>}
                <Button onClick={() => setCreateOpen(true)}>{copy.createCompany}</Button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">{total} {copy.totalLabel} - {copy.pageLabel} {page} / {totalPages}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>{copy.previous}</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => updateParam('page', String(page + 1))}>{copy.next}</Button>
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
            <DialogTitle>{copy.createTitle}</DialogTitle>
            <DialogDescription>{copy.createDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{copy.name}</Label>
            <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{copy.cancel}</Button>
            <Button
              disabled={isPending || !nameInput.trim()}
              onClick={() =>
                startTransition(async () => {
                  const result = await createCompany(nameInput)
                  if (!result.success) {
                    toast.error(result.error)
                    return
                  }
                  toast.success(copy.createdToast)
                  setCreateOpen(false)
                  router.refresh()
                })
              }
            >
              {copy.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editOpen)} onOpenChange={(open) => !open && setEditOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.editTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{copy.name}</Label>
            <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(null)}>{copy.cancel}</Button>
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
                  toast.success(copy.updatedToast)
                  setEditOpen(null)
                  router.refresh()
                })
              }
            >
              {copy.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteOpen)} onOpenChange={(open) => !open && setDeleteOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteOpen?.name} {copy.deleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{copy.cancel}</AlertDialogCancel>
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
                  toast.success(copy.deletedToast)
                  setDeleteOpen(null)
                  router.refresh()
                })
              }
            >
              {copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
