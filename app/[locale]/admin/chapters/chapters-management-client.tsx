'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  assignEditor,
  createChapter,
  deleteChapter,
  removeEditor,
  updateChapter,
} from '@/lib/actions/admin/chapters'
import type { ChapterListItem } from '@/lib/services/admin.service'

type AvailableEditor = {
  id: string
  name: string
  email: string
  role: 'member' | 'editor'
}

type Props = {
  items: ChapterListItem[]
  total: number
  page: number
  pageSize: 25 | 50 | 100
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  availableEditorsByChapter: Record<string, AvailableEditor[]>
}

type ChapterFormState = {
  id: string
  name: string
  university: string
  city: string
  region: string
}

const INITIAL_FORM: ChapterFormState = {
  id: '',
  name: '',
  university: '',
  city: '',
  region: '',
}

const COPY = {
  es: {
    sortColumns: {
      name: 'Capítulo',
      university: 'Universidad',
      city: 'Ciudad',
      region: 'Region',
      member_count: 'Miembros',
      active_events_count: 'Eventos activos',
    },
    filtersTitle: 'Filtros',
    filtersDescription: 'Busca capítulos y ordena por columnas operativas.',
    searchAria: 'Buscar capítulos por nombre o universidad',
    searchPlaceholder: 'Buscar nombre o universidad',
    reset: 'Restablecer',
    createChapter: 'Crear capítulo',
    editors: 'Editores',
    actions: 'Acciones',
    noEditors: 'Sin editores',
    edit: 'Editar',
    delete: 'Eliminar',
    deleteBlockedTitle: 'No se puede eliminar mientras el capítulo tenga miembros o eventos activos.',
    deleteTitle: 'Eliminar capítulo',
    deleteBlocked: 'Bloqueado por miembros o eventos activos.',
    noMatches: 'No hay capítulos con esos filtros',
    noItems: 'Aún no hay capítulos creados',
    clearHelp: 'Limpia los filtros o prueba otra búsqueda.',
    createHelp: 'Crea el primer capítulo para empezar.',
    clearFilters: 'Limpiar filtros',
    totalLabel: 'total',
    pageLabel: 'página',
    previous: 'Anterior',
    next: 'Siguiente',
    sortAsc: 'ascendente',
    sortDesc: 'descendente',
    createTitle: 'Crear capítulo',
    createDescription: 'Completa los datos del capítulo y asigna editores si corresponde.',
    chapterId: 'ID del capítulo (slug)',
    name: 'Nombre',
    university: 'Universidad',
    city: 'Ciudad',
    region: 'Region',
    cancel: 'Cancelar',
    create: 'Crear',
    editTitle: 'Editar capítulo',
    save: 'Guardar',
    editorsTitle: 'Asignar liderazgo de capítulo',
    editorsDescription: 'Selecciona miembros aprobados para dar responsabilidad y permisos operativos del capítulo.',
    noAvailableEditors: 'No hay miembros aprobados disponibles para asignar en este capítulo.',
    saving: 'Guardando...',
    saveAssignments: 'Guardar asignaciones',
    createdToast: 'Capítulo creado.',
    updatedToast: 'Capítulo actualizado.',
    deletedToast: 'Capítulo eliminado.',
    assignmentsToast: 'Asignaciones actualizadas.',
    deleteConfirmTitle: '¿Eliminar capítulo?',
    deleteConfirmDescription: 'se eliminará permanentemente si no tiene miembros ni eventos.',
  },
  en: {
    sortColumns: {
      name: 'Chapter',
      university: 'University',
      city: 'City',
      region: 'Region',
      member_count: 'Members',
      active_events_count: 'Active events',
    },
    filtersTitle: 'Filters',
    filtersDescription: 'Search chapters and sort by operational columns.',
    searchAria: 'Search chapters by name or university',
    searchPlaceholder: 'Search chapter name or university',
    reset: 'Reset',
    createChapter: 'Create chapter',
    editors: 'Editors',
    actions: 'Actions',
    noEditors: 'No editors',
    edit: 'Edit',
    delete: 'Delete',
    deleteBlockedTitle: 'Delete is blocked while this chapter has members or active events.',
    deleteTitle: 'Delete chapter',
    deleteBlocked: 'Delete blocked by members or active events.',
    noMatches: 'No chapters match your filters',
    noItems: 'No chapters created yet',
    clearHelp: 'Clear filters or try a different search.',
    createHelp: 'Create your first chapter to get started.',
    clearFilters: 'Clear filters',
    totalLabel: 'total',
    pageLabel: 'page',
    previous: 'Previous',
    next: 'Next',
    sortAsc: 'ascending',
    sortDesc: 'descending',
    createTitle: 'Create Chapter',
    createDescription: 'Fill chapter details and optionally assign editors.',
    chapterId: 'Chapter ID (slug)',
    name: 'Name',
    university: 'University',
    city: 'City',
    region: 'Region',
    cancel: 'Cancel',
    create: 'Create',
    editTitle: 'Edit Chapter',
    save: 'Save',
    editorsTitle: 'Assign chapter leadership',
    editorsDescription: 'Select approved members to give chapter responsibility and operating permissions.',
    noAvailableEditors: 'No approved members are available for assignment in this chapter.',
    saving: 'Saving...',
    saveAssignments: 'Save assignments',
    createdToast: 'Chapter created.',
    updatedToast: 'Chapter updated.',
    deletedToast: 'Chapter deleted.',
    assignmentsToast: 'Assignments updated.',
    deleteConfirmTitle: 'Delete chapter?',
    deleteConfirmDescription: 'will be permanently removed if it has no members or events.',
  },
} as const

const SORT_COLUMNS = ['name', 'university', 'city', 'region', 'member_count', 'active_events_count'] as const

export function ChaptersManagementClient({
  items,
  total,
  page,
  pageSize,
  search,
  sortBy,
  sortOrder,
  availableEditorsByChapter,
}: Props) {
  const locale = useLocale() === 'en' ? 'en' : 'es'
  const copy = COPY[locale]
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<ChapterListItem | null>(null)
  const [editorOpen, setEditorOpen] = useState<ChapterListItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState<ChapterListItem | null>(null)
  const [createForm, setCreateForm] = useState<ChapterFormState>(INITIAL_FORM)
  const [editForm, setEditForm] = useState<ChapterFormState>(INITIAL_FORM)
  const [selectedEditorIds, setSelectedEditorIds] = useState<string[]>([])

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
    const nextOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', column)
    params.set('sortOrder', nextOrder)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const submitCreate = () => {
    startTransition(async () => {
      const result = await createChapter({ ...createForm, editorIds: selectedEditorIds })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(copy.createdToast)
      setCreateOpen(false)
      setCreateForm(INITIAL_FORM)
      setSelectedEditorIds([])
      router.refresh()
    })
  }

  const submitEdit = () => {
    if (!editOpen) return
    startTransition(async () => {
      const result = await updateChapter(editOpen.id, editForm)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(copy.updatedToast)
      setEditOpen(null)
      router.refresh()
    })
  }

  const submitDelete = () => {
    if (!deleteOpen) return
    startTransition(async () => {
      const result = await deleteChapter(deleteOpen.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(copy.deletedToast)
      setDeleteOpen(null)
      router.refresh()
    })
  }

  const syncEditors = () => {
    if (!editorOpen) return
    const currentEditorIds = new Set(editorOpen.editors.map((editor) => editor.id))
    const nextEditorIds = new Set(selectedEditorIds)
    startTransition(async () => {
      for (const id of nextEditorIds) {
        if (!currentEditorIds.has(id)) {
          const result = await assignEditor(id, editorOpen.id)
          if (!result.success) {
            toast.error(result.error)
            return
          }
        }
      }
      for (const id of currentEditorIds) {
        if (!nextEditorIds.has(id)) {
          const result = await removeEditor(id, editorOpen.id)
          if (!result.success) {
            toast.error(result.error)
            return
          }
        }
      }

      toast.success(copy.assignmentsToast)
      setEditorOpen(null)
      router.refresh()
    })
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
            <Button onClick={() => setCreateOpen(true)}>{copy.createChapter}</Button>
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
                      <button
                        className="min-h-6 rounded-sm px-1 py-1 hover:underline"
                        onClick={() => toggleSort(key)}
                      >
                        {copy.sortColumns[key]}{sortBy === key ? ` ${sortOrder === 'asc' ? copy.sortAsc : copy.sortDesc}` : ''}
                      </button>
                    </TableHead>
                  ))}
                  <TableHead>{copy.editors}</TableHead>
                  <TableHead className="w-[18rem]">{copy.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((chapter) => {
                  const deleteBlocked = chapter.member_count > 0 || chapter.active_events_count > 0
                  return (
                    <TableRow key={chapter.id} className="align-top">
                      <TableCell className="font-medium">
                        <Link className="hover:underline" href={`/admin/chapters/${chapter.id}`}>{chapter.name}</Link>
                        <p className="mt-1 text-xs text-muted-foreground">{chapter.id}</p>
                      </TableCell>
                      <TableCell>{chapter.university}</TableCell>
                      <TableCell>{chapter.city ?? '-'}</TableCell>
                      <TableCell>{chapter.region ?? '-'}</TableCell>
                      <TableCell><Badge variant="secondary">{chapter.member_count}</Badge></TableCell>
                      <TableCell><Badge variant={chapter.active_events_count > 0 ? 'info' : 'outline'}>{chapter.active_events_count}</Badge></TableCell>
                      <TableCell className="max-w-[16rem]">
                        {chapter.editors.length === 0 ? (
                          <Badge variant="outline">{copy.noEditors}</Badge>
                        ) : (
                          <div className="space-y-1">
                            {chapter.editors.slice(0, 2).map((editor) => (
                              <p key={editor.id} className="truncate text-xs text-muted-foreground">{editor.email}</p>
                            ))}
                            {chapter.editors.length > 2 && <Badge variant="outline">+{chapter.editors.length - 2}</Badge>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditForm({
                                id: chapter.id,
                                name: chapter.name,
                                university: chapter.university,
                                city: chapter.city ?? '',
                                region: chapter.region ?? '',
                              })
                              setEditOpen(chapter)
                            }}
                          >
                            {copy.edit}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditorOpen(chapter)
                              setSelectedEditorIds(chapter.editors.map((editor) => editor.id))
                            }}
                          >
                            {copy.editors}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deleteBlocked}
                            title={deleteBlocked ? copy.deleteBlockedTitle : copy.deleteTitle}
                            onClick={() => setDeleteOpen(chapter)}
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
            {items.map((chapter) => {
              const deleteBlocked = chapter.member_count > 0 || chapter.active_events_count > 0

              return (
                <div key={chapter.id} className="space-y-4 py-4">
                  <div className="space-y-1">
                    <Link className="break-words font-semibold hover:underline" href={`/admin/chapters/${chapter.id}`}>
                      {chapter.name}
                    </Link>
                    <p className="break-all text-xs text-muted-foreground">{chapter.id}</p>
                    <p className="text-sm text-muted-foreground">{chapter.university}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{copy.city}</p>
                      <p>{chapter.city ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{copy.region}</p>
                      <p>{chapter.region ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{copy.sortColumns.member_count}</p>
                      <Badge variant="secondary">{chapter.member_count}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{copy.sortColumns.active_events_count}</p>
                      <Badge variant={chapter.active_events_count > 0 ? 'info' : 'outline'}>{chapter.active_events_count}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{copy.editors}</p>
                    {chapter.editors.length === 0 ? (
                      <Badge variant="outline">{copy.noEditors}</Badge>
                    ) : (
                      <div className="space-y-1">
                        {chapter.editors.slice(0, 2).map((editor) => (
                          <p key={editor.id} className="truncate text-xs text-muted-foreground">{editor.email}</p>
                        ))}
                        {chapter.editors.length > 2 && <Badge variant="outline">+{chapter.editors.length - 2}</Badge>}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditForm({
                          id: chapter.id,
                          name: chapter.name,
                          university: chapter.university,
                          city: chapter.city ?? '',
                          region: chapter.region ?? '',
                        })
                        setEditOpen(chapter)
                      }}
                    >
                      {copy.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditorOpen(chapter)
                        setSelectedEditorIds(chapter.editors.map((editor) => editor.id))
                      }}
                    >
                      {copy.editors}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deleteBlocked}
                      title={deleteBlocked ? copy.deleteBlockedTitle : copy.deleteTitle}
                      onClick={() => setDeleteOpen(chapter)}
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
                <Button onClick={() => setCreateOpen(true)}>{copy.createChapter}</Button>
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
          <div className="space-y-3">
            <Label>{copy.chapterId}</Label>
            <Input value={createForm.id} onChange={(e) => setCreateForm((s) => ({ ...s, id: e.target.value }))} />
            <Label>{copy.name}</Label>
            <Input value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} />
            <Label>{copy.university}</Label>
            <Input value={createForm.university} onChange={(e) => setCreateForm((s) => ({ ...s, university: e.target.value }))} />
            <Label>{copy.city}</Label>
            <Input value={createForm.city} onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value }))} />
            <Label>{copy.region}</Label>
            <Input value={createForm.region} onChange={(e) => setCreateForm((s) => ({ ...s, region: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{copy.cancel}</Button>
            <Button disabled={isPending} onClick={submitCreate}>{copy.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editOpen)} onOpenChange={(open) => !open && setEditOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.editTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Badge variant="outline">{editOpen?.id}</Badge>
            <Label>{copy.name}</Label>
            <Input value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
            <Label>{copy.university}</Label>
            <Input value={editForm.university} onChange={(e) => setEditForm((s) => ({ ...s, university: e.target.value }))} />
            <Label>{copy.city}</Label>
            <Input value={editForm.city} onChange={(e) => setEditForm((s) => ({ ...s, city: e.target.value }))} />
            <Label>{copy.region}</Label>
            <Input value={editForm.region} onChange={(e) => setEditForm((s) => ({ ...s, region: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(null)}>{copy.cancel}</Button>
            <Button disabled={isPending} onClick={submitEdit}>{copy.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editorOpen)} onOpenChange={(open) => !open && setEditorOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.editorsTitle}</DialogTitle>
            <DialogDescription>
              {editorOpen?.name}. {copy.editorsDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(editorOpen ? availableEditorsByChapter[editorOpen.id] : [])?.length ? (
              (editorOpen ? availableEditorsByChapter[editorOpen.id] : [])?.map((user) => (
              <label key={user.id} className="flex items-center gap-2 rounded border p-2">
                <Checkbox
                  checked={selectedEditorIds.includes(user.id)}
                  onCheckedChange={(checked) =>
                    setSelectedEditorIds((prev) =>
                      checked ? [...prev, user.id] : prev.filter((id) => id !== user.id)
                    )
                  }
                />
                <span className="text-sm">{user.name} ({user.email})</span>
              </label>
              ))
            ) : (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                {copy.noAvailableEditors}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(null)}>{copy.cancel}</Button>
            <Button disabled={isPending} onClick={syncEditors}>
              {isPending ? copy.saving : copy.saveAssignments}
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
            <AlertDialogAction disabled={isPending} onClick={submitDelete}>{copy.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
