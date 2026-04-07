'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  assignEditor,
  createChapter,
  deleteChapter,
  removeEditor,
  updateChapter,
  type ChapterListItem,
} from '@/lib/actions/admin/chapters'

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

  const submitCreate = () => {
    startTransition(async () => {
      const result = await createChapter({
        ...createForm,
        editorIds: selectedEditorIds,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Chapter created.')
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
      toast.success('Chapter updated.')
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
      toast.success('Chapter deleted.')
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

      toast.success('Editors updated.')
      setEditorOpen(null)
      router.refresh()
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              defaultValue={search}
              placeholder="Search chapter name/university"
              onChange={(event) => updateParam('search', event.target.value)}
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create Chapter</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {[
                    ['name', 'Chapter Name'],
                    ['university', 'University'],
                    ['city', 'City'],
                    ['region', 'Region'],
                    ['memberCount', 'Member Count'],
                    ['activeEventsCount', 'Active Events'],
                  ].map(([key, label]) => (
                    <th key={key} className="text-left p-2">
                      <button className="hover:underline" onClick={() => toggleSort(key)}>
                        {label}
                      </button>
                    </th>
                  ))}
                  <th className="text-left p-2">Editors</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((chapter) => (
                  <tr key={chapter.id} className="border-b align-top">
                    <td className="p-2 font-medium">
                      <Link className="hover:underline" href={`/admin/chapters/${chapter.id}`}>
                        {chapter.name}
                      </Link>
                    </td>
                    <td className="p-2">{chapter.university}</td>
                    <td className="p-2">{chapter.city ?? '—'}</td>
                    <td className="p-2">{chapter.region ?? '—'}</td>
                    <td className="p-2">{chapter.memberCount}</td>
                    <td className="p-2">{chapter.activeEventsCount}</td>
                    <td className="p-2">
                      {chapter.editors.length === 0 ? '—' : chapter.editors.map((editor) => editor.email).join(', ')}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
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
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditorOpen(chapter)
                            setSelectedEditorIds(chapter.editors.map((editor) => editor.id))
                          }}
                        >
                          Editors
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={chapter.memberCount > 0 || chapter.activeEventsCount > 0}
                          onClick={() => setDeleteOpen(chapter)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <div className="py-10 text-center">
              <CardTitle className="mb-2 text-lg">No chapters created yet</CardTitle>
              <p className="text-sm text-muted-foreground">Create your first chapter to get started.</p>
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
            <DialogTitle>Create Chapter</DialogTitle>
            <DialogDescription>Fill chapter details and optionally assign editors.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Chapter ID (slug)</Label>
            <Input value={createForm.id} onChange={(e) => setCreateForm((s) => ({ ...s, id: e.target.value }))} />
            <Label>Name</Label>
            <Input value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} />
            <Label>University</Label>
            <Input value={createForm.university} onChange={(e) => setCreateForm((s) => ({ ...s, university: e.target.value }))} />
            <Label>City</Label>
            <Input value={createForm.city} onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value }))} />
            <Label>Region</Label>
            <Input value={createForm.region} onChange={(e) => setCreateForm((s) => ({ ...s, region: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={isPending} onClick={submitCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editOpen)} onOpenChange={(open) => !open && setEditOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Badge variant="outline">{editOpen?.id}</Badge>
            <Label>Name</Label>
            <Input value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
            <Label>University</Label>
            <Input value={editForm.university} onChange={(e) => setEditForm((s) => ({ ...s, university: e.target.value }))} />
            <Label>City</Label>
            <Input value={editForm.city} onChange={(e) => setEditForm((s) => ({ ...s, city: e.target.value }))} />
            <Label>Region</Label>
            <Input value={editForm.region} onChange={(e) => setEditForm((s) => ({ ...s, region: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(null)}>Cancel</Button>
            <Button disabled={isPending} onClick={submitEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editorOpen)} onOpenChange={(open) => !open && setEditorOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Editors</DialogTitle>
            <DialogDescription>{editorOpen?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(editorOpen ? availableEditorsByChapter[editorOpen.id] : [])?.map((user) => (
              <label key={user.id} className="flex items-center gap-2 border p-2 rounded">
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
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(null)}>Cancel</Button>
            <Button disabled={isPending} onClick={syncEditors}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteOpen)} onOpenChange={(open) => !open && setDeleteOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chapter?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteOpen?.name} will be permanently removed if it has no members or events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={submitDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
