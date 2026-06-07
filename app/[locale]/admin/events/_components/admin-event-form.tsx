'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { ChapterRow, EventRow, EventType } from '@/lib/types'
import { createEvent, type CreateEventInput } from '@/lib/actions/events/create-event'
import { updateEvent, type UpdateEventInput } from '@/lib/actions/events/update-event'
import { deleteEvent } from '@/lib/actions/events/delete-event'

type Mode = 'create' | 'edit'

function toDateTimeLocal(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDateTimeLocal(value: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString()
}

export function AdminEventForm({
  mode,
  chapters,
  initial,
}: {
  mode: Mode
  chapters: ChapterRow[]
  initial?: EventRow | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const defaults = useMemo(() => {
    const e = initial
    return {
      title: e?.title ?? '',
      description: e?.description ?? '',
      cover_image: e?.cover_image ?? '',
      start_at: toDateTimeLocal(e?.start_at),
      end_at: toDateTimeLocal(e?.end_at),
      location: e?.location ?? '',
      meeting_url: e?.meeting_url ?? '',
      event_type: (e?.event_type ?? 'in_person') as EventType,
      capacity: e?.capacity?.toString?.() ?? '',
      is_published: e?.is_published ?? false,
      chapter_id: e?.chapter_id ?? 'global',
    }
  }, [initial])

  const [title, setTitle] = useState(defaults.title)
  const [description, setDescription] = useState(defaults.description)
  const [coverImage, setCoverImage] = useState(defaults.cover_image)
  const [startAt, setStartAt] = useState(defaults.start_at)
  const [endAt, setEndAt] = useState(defaults.end_at)
  const [location, setLocation] = useState(defaults.location)
  const [meetingUrl, setMeetingUrl] = useState(defaults.meeting_url)
  const [eventType, setEventType] = useState<EventType>(defaults.event_type)
  const [capacity, setCapacity] = useState(defaults.capacity)
  const [isPublished, setIsPublished] = useState(defaults.is_published)
  const [chapter_id, setChapterId] = useState(defaults.chapter_id)

  async function onSubmit() {
    setError(null)
    startTransition(async () => {
      const payload: CreateEventInput = {
        title,
        description: description || undefined,
        coverImage: coverImage || undefined,
        startAt: fromDateTimeLocal(startAt),
        endAt: fromDateTimeLocal(endAt),
        location: location || undefined,
        meetingUrl: meetingUrl || undefined,
        eventType: eventType,
        capacity: capacity === '' ? undefined : Number(capacity),
        isPublished: isPublished,
        chapter_id: chapter_id === 'global' ? null : chapter_id,
        accessModel: (initial?.access_model as 'open' | 'application') ?? 'open',
        applicationFormUrl: initial?.application_form_url ?? null,
      }

      const res =
        mode === 'create'
          ? await createEvent(payload)
          : await updateEvent({ id: initial!.id, ...payload } satisfies UpdateEventInput)

      if ('error' in res) {
        setError(res.error)
        return
      }

      if (mode === 'create') {
        router.push(`/admin/events/${res.event.id}`)
      } else {
        router.refresh()
      }
    })
  }

  async function onDelete() {
    if (!initial?.id) return
    setError(null)
    startTransition(async () => {
      const res = await deleteEvent(initial.id)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push('/admin/events')
    })
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titulo *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripcion</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startAt">Inicio *</Label>
            <Input id="startAt" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">Fin *</Label>
            <Input id="endAt" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de evento</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">Presencial</SelectItem>
                <SelectItem value="online">En linea</SelectItem>
                <SelectItem value="hybrid">Hibrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidad opcional</Label>
            <Input id="capacity" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Sin límite" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chapter_id">Capítulo</Label>
            <Select value={chapter_id ?? 'global'} onValueChange={setChapterId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un capítulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                {chapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.university}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Ubicacion opcional</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="meetingUrl">URL de reunion opcional</Label>
            <Input id="meetingUrl" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverImage">URL de imagen de portada opcional</Label>
            <Input id="coverImage" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            id="isPublished"
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <Label htmlFor="isPublished">Publicado</Label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        {mode === 'edit' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={isPending}>
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar evento</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará el evento. Úsala solo si no hay registros o actividad operativa asociada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction disabled={isPending} onClick={onDelete}>
                  Eliminar evento
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button type="button" onClick={onSubmit} disabled={isPending}>
          {isPending ? 'Guardando...' : mode === 'create' ? 'Crear evento' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}

