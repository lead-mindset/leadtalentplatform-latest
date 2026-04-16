'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEvent, type CreateEventInput } from '@/lib/actions/events/create-event'
import { updateEvent, type UpdateEventInput } from '@/lib/actions/events/update-event'
import { deleteEvent } from '@/lib/actions/events/delete-event'
import { addEventCollaborators } from '@/lib/actions/events/add-event-collaborators'
import type { EventRow, EventType, EventAccessModel, ChapterRow } from '@/lib/types'
import { EVENT_ACCESS_MODEL_OPTIONS, EVENT_TYPE_OPTIONS } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { uploadEventCover } from '@/lib/actions/events/upload-cover'
import { ImagePlus, HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { validateEventForm, type EventFormData } from '@/lib/validations/event'
import { CollaboratorManager } from './collaborator-manager'

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

export function EventForm({
  mode,
  initial,
  editorChapter,
}: {
  mode: Mode
  initial?: EventRow | null
  editorChapter?: ChapterRow | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const defaults = useMemo(() => {
    const e = initial
    return {
      title: e?.title ?? '',
      description: e?.description ?? '',
      coverImage: e?.coverImage ?? '',
      startAt: toDateTimeLocal(e?.startAt),
      endAt: toDateTimeLocal(e?.endAt),
      location: e?.location ?? '',
      meetingUrl: e?.meetingUrl ?? '',
      eventType: (e?.eventType ?? 'in_person') as EventType,
      capacity: e?.capacity?.toString?.() ?? '',
      isPublished: e?.isPublished ?? false,
      accessModel: (e?.accessModel ?? 'open') as EventAccessModel,
      applicationFormUrl: e?.applicationFormUrl ?? '',
    }
  }, [initial])

  const [title, setTitle] = useState(defaults.title)
  const [description, setDescription] = useState(defaults.description)
  const [coverImage, setCoverImage] = useState(defaults.coverImage)
  const [startAt, setStartAt] = useState(defaults.startAt)
  const [endAt, setEndAt] = useState(defaults.endAt)
  const [location, setLocation] = useState(defaults.location)
  const [meetingUrl, setMeetingUrl] = useState(defaults.meetingUrl)
  const [eventType, setEventType] = useState<EventType>(defaults.eventType)
  const [capacity, setCapacity] = useState(defaults.capacity)
  const [isPublished, setIsPublished] = useState(defaults.isPublished)
  const [accessModel, setAccessModel] = useState<EventAccessModel>(defaults.accessModel)
  const [applicationFormUrl, setApplicationFormUrl] = useState(defaults.applicationFormUrl)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isDraggingCover, setIsDraggingCover] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingCollaboratorIds, setPendingCollaboratorIds] = useState<string[]>([])

  async function handleCoverFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setCoverError('Only image files are allowed')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setCoverError('Cover image must be 2MB or smaller')
      return
    }

    setError(null)
    const formData = new FormData()
    formData.set('cover', file)
    try {
      const result = await uploadEventCover(formData)
      setCoverImage(result.publicUrl)
    } catch (uploadError) {
      setCoverError(uploadError instanceof Error ? uploadError.message : 'Failed to upload image')
    }
  }

  async function submitEvent(targetPublished: boolean) {
    setError(null)
    setFieldErrors({})
    
    const formData: EventFormData = {
      title,
      description: description.trim() || '',
      coverImage: coverImage || '',
      startAt: fromDateTimeLocal(startAt),
      endAt: fromDateTimeLocal(endAt),
      location: location || '',
      meetingUrl: meetingUrl || '',
      eventType,
      capacity: capacity || '',
      isPublished: targetPublished,
      accessModel,
      applicationFormUrl: applicationFormUrl || '',
    }

    const validation = validateEventForm(formData)
    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        errors[field] = issue.message
      })
      setFieldErrors(errors)
      
      const errorCount = validation.error.issues.length
      toast.error(`Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''}`, {
        description: 'Check the highlighted fields in the form',
        action: {
          label: 'Fix errors',
          onClick: () => {
            const firstErrorField = validation.error.issues[0]?.path[0] as string
            if (firstErrorField) {
              const element = document.getElementById(firstErrorField)
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                element.focus()
              }
            }
          }
        }
      })
      
      return
    }

    startTransition(async () => {
      const payload = {
        title,
        description: description.trim() || undefined,
        coverImage: coverImage || undefined,
        startAt: fromDateTimeLocal(startAt),
        endAt: fromDateTimeLocal(endAt),
        location: location || undefined,
        meetingUrl: meetingUrl || undefined,
        eventType,
        capacity: capacity === '' ? undefined : Number(capacity),
        isPublished: targetPublished,
        accessModel,
        applicationFormUrl: accessModel === 'application' ? applicationFormUrl : undefined,
      }

      try {
        const res =
          mode === 'create'
            ? await createEvent(payload as CreateEventInput)
            : await updateEvent({ id: initial!.id, ...payload } as UpdateEventInput)

        if ('error' in res) {
          toast.error(res.error)
          return
        }
        
        // In create mode, add collaborators if any were selected
        if (mode === 'create' && pendingCollaboratorIds.length > 0) {
          const collaboratorResult = await addEventCollaborators(res.event.id, pendingCollaboratorIds)
          if ('error' in collaboratorResult) {
            toast.error(`Event created but failed to add collaborators: ${collaboratorResult.error}`)
          }
        }
        
        toast.success(mode === 'create' ? 'Event created successfully!' : 'Event updated successfully!')
        setLastSavedAt(new Date().toLocaleTimeString())
        setIsPublished(res.event.isPublished)

        if (mode === 'create') {
          router.push(`/chapter/events/${res.event.id}`)
        } else {
          router.refresh()
        }
      } catch (error) {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  useEffect(() => {
    if (mode !== 'edit' || isPublished) return

    const interval = window.setInterval(async () => {
      setIsAutoSaving(true)
      const payload = {
        id: initial!.id,
        title,
        description: description.trim() || null,
        coverImage: coverImage || null,
        startAt: fromDateTimeLocal(startAt),
        endAt: fromDateTimeLocal(endAt),
        location: location || null,
        meetingUrl: meetingUrl || null,
        eventType,
        capacity: capacity === '' ? null : Number(capacity),
        isPublished: false,
        accessModel,
        applicationFormUrl: accessModel === 'application' ? applicationFormUrl : null,
      }
      const res = await updateEvent(payload as UpdateEventInput)
      if (!('error' in res)) {
        setLastSavedAt(new Date().toLocaleTimeString())
      }
      setIsAutoSaving(false)
    }, 30000)

    return () => window.clearInterval(interval)
  }, [mode, isPublished, initial, title, description, coverImage, startAt, endAt, location, meetingUrl, eventType, capacity])

  async function onDelete() {
    if (!initial?.id) return
    setError(null)
    startTransition(async () => {
      const res = await deleteEvent(initial.id)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push('/chapter/events')
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
          <Input 
            id="title" 
            value={title} 
            onChange={(e) => {
              setTitle(e.target.value)
              setFieldErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors.title
                return newErrors
              })
            }} 
            className={fieldErrors.title ? 'border-destructive' : ''}
          />
          {fieldErrors.title && (
            <p className="text-sm text-destructive">{fieldErrors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="w-full min-h-32 rounded-md border border-border/60 px-3 py-2 text-sm outline-none resize-y focus-visible:ring-1 focus-visible:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startAt">Start</Label>
            <Input
              id="startAt"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">End</Label>
            <Input
              id="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
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
            <Input
              id="capacity"
              inputMode="numeric"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={eventType === 'online'}
              placeholder={eventType === 'online' ? 'Not required for online events' : 'Venue or address'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
            <Input
              id="meetingUrl"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              disabled={eventType === 'in_person'}
              placeholder={eventType === 'in_person' ? 'Not required for in-person events' : 'https://...'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cover image</Label>
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setIsDraggingCover(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setIsDraggingCover(false)
            }}
            onDrop={async (event) => {
              event.preventDefault()
              setIsDraggingCover(false)
              await handleCoverFile(event.dataTransfer.files[0] ?? null)
            }}
            className={`rounded-lg border-2 border-dashed p-4 text-sm ${isDraggingCover ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (event) => handleCoverFile(event.target.files?.[0] ?? null)}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">Drag and drop cover image (max 2MB)</p>
                <p className="text-muted-foreground">JPG, PNG, WEBP supported</p>
              </div>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
          </div>
          {coverError && (
            <p className="text-sm text-destructive">{coverError}</p>
          )}
          {coverImage && (
            <div className="rounded-md border p-2">
              <Image
                src={coverImage}
                alt="Cover preview"
                width={1200}
                height={480}
                className="h-36 w-full object-cover rounded"
              />
            </div>
          )}
          <Label htmlFor="coverImage">Or paste image URL</Label>
          <Input
            id="coverImage"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Access Settings</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Open: Students register instantly and get QR code immediately.
                    Application: Students fill external form, editors approve/ reject manually.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-3">
            {EVENT_ACCESS_MODEL_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <input
                  type="radio"
                  id={option.value}
                  name="accessModel"
                  value={option.value}
                  checked={accessModel === option.value}
                  onChange={(e) => setAccessModel(e.target.value as 'open' | 'application')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor={option.value} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {option.value === 'open' 
                      ? 'Students can register instantly. QR code generated immediately.'
                      : 'Students apply via external form. Manual approval required before QR issuance.'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>

          {accessModel === 'application' && (
            <div className="ml-7 pl-4 border-l-2 border-primary/20">
              <Label htmlFor="applicationFormUrl">
                Application Form URL *
              </Label>
              <Input
                id="applicationFormUrl"
                value={applicationFormUrl}
                onChange={(e) => setApplicationFormUrl(e.target.value)}
                placeholder="https://forms.google.com/..."
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Paste any form link — Google Forms, Typeform, or any URL. Students will be redirected here when they click "Apply".
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6 border-t pt-6">
          <CollaboratorManager 
            eventId={mode === 'create' ? 'new' : initial?.id || ''} 
            ownerChapterId={editorChapter?.id || null} 
            mode={mode} 
            onCollaboratorsChange={setPendingCollaboratorIds}
          />
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

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {isAutoSaving ? 'Auto-saving draft...' : lastSavedAt ? `Last saved at ${lastSavedAt}` : 'Draft not saved yet'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">Preview as student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title || 'Untitled event'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {startAt ? new Date(fromDateTimeLocal(startAt)).toLocaleString() : 'No start date'}
              </p>
              <p className="whitespace-pre-wrap">{description || 'No description yet.'}</p>
              <p>
                <span className="font-medium">Type:</span> {eventType.replace('_', ' ')}
              </p>
              <p>
                <span className="font-medium">Access:</span> {accessModel === 'open' ? 'Open Registration' : 'Application Required'}
              </p>
              {(eventType === 'in_person' || eventType === 'hybrid') && (
                <p><span className="font-medium">Location:</span> {location || 'Not set'}</p>
              )}
              {(eventType === 'online' || eventType === 'hybrid') && (
                <p><span className="font-medium">Meeting:</span> {meetingUrl || 'Not set'}</p>
              )}
              <p>
                <span className="font-medium">Capacity:</span> {capacity || 'Unlimited'}
              </p>
              {accessModel === 'application' && (
                <p><span className="font-medium">Application Form:</span> {applicationFormUrl || 'Not set'}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {mode === 'edit' && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isPending}
          >
            Delete
          </Button>
        )}
        <Button type="button" variant="outline" onClick={() => submitEvent(false)} disabled={isPending}>
          Save Draft
        </Button>
        <Button type="button" onClick={() => submitEvent(true)} disabled={isPending}>
          {mode === 'create' ? 'Publish event' : 'Save & Publish'}
        </Button>
      </div>
    </div>
  )
}