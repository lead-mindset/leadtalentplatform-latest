'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [chapterId, setChapterId] = useState(defaults.chapter_id)

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
        chapterId: chapterId === 'global' ? null : chapterId,
        accessModel: initial?.access_model ?? 'open',
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
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startAt">Start</Label>
            <Input id="startAt" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">End</Label>
            <Input id="endAt" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Event type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">In-person</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (optional)</Label>
            <Input id="capacity" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Unlimited" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chapterId">Chapter</Label>
            <Select value={chapterId ?? 'global'} onValueChange={setChapterId}>
              <SelectTrigger>
                <SelectValue placeholder="Select chapter" />
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
            <Label htmlFor="location">Location (optional)</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
            <Input id="meetingUrl" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover image URL (optional)</Label>
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
          <Label htmlFor="isPublished">Published</Label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        {mode === 'edit' && (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
            Delete
          </Button>
        )}
        <Button type="button" onClick={onSubmit} disabled={isPending}>
          {mode === 'create' ? 'Create event' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

