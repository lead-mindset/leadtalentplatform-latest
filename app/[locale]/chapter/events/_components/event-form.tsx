'use client'

import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createEvent, type CreateEventInput } from '@/lib/actions/events/create-event'
import { updateEvent, type UpdateEventInput } from '@/lib/actions/events/update-event'
import { deleteEvent } from '@/lib/actions/events/delete-event'
import { addEventCollaborators } from '@/lib/actions/events/add-event-collaborators'
import type { EventRow, EventType, EventAccessModel, ChapterRow, EventApplicationQuestionRow, EventApplicationQuestionType } from '@/lib/types'
import { EVENT_ACCESS_MODEL_OPTIONS } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { uploadEventCover } from '@/lib/actions/events/upload-cover'
import { ImagePlus, Check, ArrowRight, ArrowLeft, UploadCloud, MapPin, Video, MonitorSmartphone, Lightbulb, UserCheck, QrCode, Rocket, Save, Trash2, Plus, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { CollaboratorManager } from './collaborator-manager'
import { LocationAutocomplete } from '@/components/events/location-autocomplete'

type Mode = 'create' | 'edit'
type EditableApplicationQuestion = {
  id?: string
  questionText: string
  questionType: EventApplicationQuestionType
  optionsText: string
  isRequired: boolean
}

const questionTypeOptions: Array<{ value: EventApplicationQuestionType; label: string }> = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'single_select', label: 'Single select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
]

function toEditableQuestion(question: EventApplicationQuestionRow): EditableApplicationQuestion {
  return {
    id: question.id,
    questionText: question.question_text,
    questionType: question.question_type,
    optionsText: question.options?.join('\n') ?? '',
    isRequired: question.is_required,
  }
}

function toQuestionPayload(question: EditableApplicationQuestion) {
  const options = question.optionsText
    .split('\n')
    .map((option) => option.trim())
    .filter(Boolean)

  return {
    id: question.id,
    questionText: question.questionText.trim(),
    questionType: question.questionType,
    options: ['single_select', 'checkbox'].includes(question.questionType) ? options : null,
    isRequired: question.isRequired,
  }
}

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
  applicationQuestions = [],
}: {
  mode: Mode
  initial?: EventRow | null
  editorChapter?: ChapterRow | null
  applicationQuestions?: EventApplicationQuestionRow[]
}) {
  const router = useRouter()
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)

  const defaults = useMemo(() => {
    const e = initial
    return {
      title: e?.title ?? '',
      description: e?.description ?? '',
      coverImage: e?.cover_image ?? '',
      startAt: toDateTimeLocal(e?.start_at),
      endAt: toDateTimeLocal(e?.end_at),
      location: e?.location ?? '',
      locationName: e?.location_name ?? '',
      locationAddress: e?.location_address ?? '',
      locationCity: e?.location_city ?? '',
      locationRegion: e?.location_region ?? '',
      meetingUrl: e?.meeting_url ?? '',
      eventType: (e?.event_type ?? 'in_person') as EventType,
      capacity: e?.capacity?.toString?.() ?? '',
      isPublished: e?.is_published ?? false,
      accessModel: (e?.access_model ?? 'open') as EventAccessModel,
      applicationFormUrl: e?.application_form_url ?? '',
    }
  }, [initial])

  const [title, setTitle] = useState(defaults.title)
  const [description, setDescription] = useState(defaults.description)
  const [coverImage, setCoverImage] = useState(defaults.coverImage)
  const [startAt, setStartAt] = useState(defaults.startAt)
  const [endAt, setEndAt] = useState(defaults.endAt)
  const [location, setLocation] = useState(defaults.location)
  const [locationName, setLocationName] = useState(defaults.locationName)
  const [locationAddress, setLocationAddress] = useState(defaults.locationAddress)
  const [locationCity, setLocationCity] = useState(defaults.locationCity)
  const [locationRegion, setLocationRegion] = useState(defaults.locationRegion)
  const [meetingUrl, setMeetingUrl] = useState(defaults.meetingUrl)
  const [eventType, setEventType] = useState<EventType>(defaults.eventType)
  const [capacity, setCapacity] = useState(defaults.capacity)
  const [isPublished, setIsPublished] = useState(defaults.isPublished)
  const [accessModel, setAccessModel] = useState<EventAccessModel>(defaults.accessModel)
  const [applicationFormUrl, setApplicationFormUrl] = useState(defaults.applicationFormUrl)
  const [applicationQuestionsState, setApplicationQuestionsState] = useState<EditableApplicationQuestion[]>(
    applicationQuestions.map(toEditableQuestion)
  )
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [isDraggingCover, setIsDraggingCover] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingCollaboratorIds, setPendingCollaboratorIds] = useState<string[]>([])

  useEffect(() => {
    if (initial) {
      setTitle(initial.title ?? '')
      setDescription(initial.description ?? '')
      setCoverImage(initial.cover_image ?? '')
      setStartAt(toDateTimeLocal(initial.start_at))
      setEndAt(toDateTimeLocal(initial.end_at))
      setLocation(initial.location ?? '')
      setLocationName(initial.location_name ?? '')
      setLocationAddress(initial.location_address ?? '')
      setLocationCity(initial.location_city ?? '')
      setLocationRegion(initial.location_region ?? '')
      setMeetingUrl(initial.meeting_url ?? '')
      setEventType((initial.event_type ?? 'in_person') as EventType)
      setCapacity(initial.capacity?.toString() ?? '')
      setIsPublished(initial.is_published ?? false)
      setAccessModel((initial.access_model ?? 'open') as EventAccessModel)
      setApplicationFormUrl(initial.application_form_url ?? '')
    }
    setApplicationQuestionsState(applicationQuestions.map(toEditableQuestion))
  }, [initial, applicationQuestions])

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

    setCoverError(null)
    const formData = new FormData()
    formData.set('cover', file)
    const toastId = toast.loading('Uploading image...')
    try {
      const result = await uploadEventCover(formData)
      setCoverImage(result.publicUrl)
      toast.success('Image uploaded successfully', { id: toastId })
    } catch (uploadError) {
      setCoverError(uploadError instanceof Error ? uploadError.message : 'Failed to upload image')
      toast.error('Failed to upload image', { id: toastId })
    }
  }

  const validateFields = (checkMode: 'step' | 'all', currentStep?: number) => {
    setFieldErrors({})
    let isValid = true
    const errors: Record<string, string> = {}

    const checkBasics = checkMode === 'all' || currentStep === 1
    const checkLogistics = checkMode === 'all' || currentStep === 2
    const checkAccess = checkMode === 'all' || currentStep === 3

    if (checkBasics) {
      if (!title.trim()) { errors.title = 'Title is required'; isValid = false }
      if (title.length > 100) { errors.title = 'Title must be less than 100 characters'; isValid = false }
      if (description.length > 2000) { errors.description = 'Description must be less than 2000 characters'; isValid = false }
      if (coverImage && !coverImage.startsWith('http')) { errors.cover_image = 'Invalid image URL'; isValid = false }
    }

    if (checkLogistics) {
      if (!startAt) { errors.start_at = 'Start date and time are required'; isValid = false }
      if (!endAt) { errors.end_at = 'End date and time are required'; isValid = false }
      if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
        errors.end_at = 'End date must be after start date'
        isValid = false
      }
      if (eventType === 'in_person' && !location?.trim()) {
        errors.location = 'Location is required for in-person events'
        isValid = false
      }
      if (eventType === 'online' && !meetingUrl?.trim()) {
        errors.meeting_url = 'Meeting URL is required for online events'
        isValid = false
      }
      if (eventType === 'hybrid') {
        if (!location?.trim()) { errors.location = 'Location is required for hybrid events'; isValid = false }
        if (!meetingUrl?.trim()) { errors.meeting_url = 'Meeting URL is required for hybrid events'; isValid = false }
      }
    }

    if (checkAccess) {
      if (capacity && (isNaN(Number(capacity)) || Number(capacity) <= 0)) {
        errors.capacity = 'Capacity must be a valid number greater than 0'
        isValid = false
      }
      if (accessModel === 'application' && !applicationFormUrl?.trim()) {
        const hasQuestions = applicationQuestionsState.some((question) => question.questionText.trim())
        if (!hasQuestions) {
          errors.application_questions = 'Add at least one question or an external form URL'
          isValid = false
        }
      }

      if (accessModel === 'application') {
        applicationQuestionsState.forEach((question, index) => {
          if (!question.questionText.trim()) {
            errors.application_questions = `Question ${index + 1} needs text`
            isValid = false
          }

          if (
            ['single_select', 'checkbox'].includes(question.questionType) &&
            !question.optionsText.split('\n').some((option) => option.trim())
          ) {
            errors.application_questions = `Question ${index + 1} needs at least one option`
            isValid = false
          }
        })
      }
    }

    if (!isValid) {
      setFieldErrors(errors)
      toast.error('Please fix the highlighted errors before saving')
    }
    return isValid
  }

  const handleNext = () => {
    if (validateFields('step', step)) {
      setStep(s => Math.min(s + 1, 4))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitEvent(targetPublished: boolean) {
    if (!validateFields('all')) {
      return
    }

    setError(null)

    startTransition(async () => {
      const payload = {
        title,
        description: description.trim() || undefined,
        coverImage: coverImage || undefined,
        startAt: fromDateTimeLocal(startAt),
        endAt: fromDateTimeLocal(endAt),
        location: location || undefined,
        locationName: locationName || undefined,
        locationAddress: locationAddress || undefined,
        locationCity: locationCity || undefined,
        locationRegion: locationRegion || undefined,
        meetingUrl: meetingUrl || undefined,
        eventType,
        capacity: capacity === '' ? undefined : Number(capacity),
        isPublished: targetPublished,
        accessModel,
        applicationFormUrl: accessModel === 'application' ? applicationFormUrl : undefined,
        applicationQuestions:
          accessModel === 'application'
            ? applicationQuestionsState.map(toQuestionPayload).filter((question) => question.questionText)
            : undefined,
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

        if (mode === 'edit' && pendingCollaboratorIds.length > 0) {
          const collaboratorResult = await addEventCollaborators(res.event.id, pendingCollaboratorIds)
          if ('error' in collaboratorResult) {
            toast.error(`Event updated but failed to add collaborators: ${collaboratorResult.error}`)
          }
        }
        toast.success(mode === 'create' ? 'Event created successfully!' : 'Event updated successfully!')
        setLastSavedAt(new Date().toLocaleTimeString())
        setIsPublished(res.event.is_published)

        if (mode === 'create') {
          router.push(`/${locale}/chapter/events/${res.event.id}/edit`)
        } else {
          router.refresh()
        }
      } catch {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  // Auto-save logic
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
        locationName: locationName || null,
        locationAddress: locationAddress || null,
        locationCity: locationCity || null,
        locationRegion: locationRegion || null,
        meetingUrl: meetingUrl || null,
        eventType,
        capacity: capacity === '' ? null : Number(capacity),
        isPublished: false,
        accessModel,
        applicationFormUrl: accessModel === 'application' ? applicationFormUrl : null,
        applicationQuestions:
          accessModel === 'application'
            ? applicationQuestionsState.map(toQuestionPayload).filter((question) => question.questionText)
            : undefined,
      }
      const res = await updateEvent(payload as UpdateEventInput)
      if (!('error' in res)) {
        setLastSavedAt(new Date().toLocaleTimeString())
      }
      setIsAutoSaving(false)
    }, 30000)

    return () => window.clearInterval(interval)
  }, [mode, isPublished, initial, title, description, coverImage, startAt, endAt, location, locationName, locationAddress, locationCity, locationRegion, meetingUrl, eventType, capacity, accessModel, applicationFormUrl, applicationQuestionsState])

  async function onDelete() {
    if (!initial?.id) return
    setError(null)
    startTransition(async () => {
      const res = await deleteEvent(initial.id)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push(`/${locale}/chapter/events`)
    })
  }

  function addApplicationQuestion() {
    setApplicationQuestionsState((questions) => [
      ...questions,
      {
        questionText: '',
        questionType: 'short_text',
        optionsText: '',
        isRequired: true,
      },
    ])
  }

  function updateApplicationQuestion(
    index: number,
    updates: Partial<EditableApplicationQuestion>
  ) {
    setApplicationQuestionsState((questions) =>
      questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...updates } : question
      )
    )
  }

  function removeApplicationQuestion(index: number) {
    setApplicationQuestionsState((questions) =>
      questions.filter((_, questionIndex) => questionIndex !== index)
    )
  }

  function moveApplicationQuestion(index: number, direction: -1 | 1) {
    setApplicationQuestionsState((questions) => {
      const next = [...questions]
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= next.length) return questions
      const [question] = next.splice(index, 1)
      next.splice(targetIndex, 0, question)
      return next
    })
  }

  const steps = [
    { num: 1, title: 'Basics' },
    { num: 2, title: 'Logistics' },
    { num: 3, title: 'Access' },
    { num: 4, title: 'Review' },
  ]
  const fieldErrorEntries = Object.entries(fieldErrors).filter(([, message]) => message)

  const renderErrorSummary = () => {
    if (!error && fieldErrorEntries.length === 0) return null

    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error && <p className="font-medium">{error}</p>}
        {fieldErrorEntries.length > 0 && (
          <ul className={error ? 'mt-2 list-disc space-y-1 pl-5' : 'list-disc space-y-1 pl-5'}>
            {fieldErrorEntries.slice(0, 4).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // --- RENDER FUNCTIONS FOR UI SECTIONS ---

  const renderBasics = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-card border rounded-lg p-6 md:p-8 space-y-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Event Basics</h2>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (fieldErrors.title) {
                  setFieldErrors(prev => ({ ...prev, title: '' }))
                }
              }}
              placeholder="e.g. LATAM Tech Summit 2026"
              className={`h-12 px-4 text-lg bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background transition-all rounded-xl ${fieldErrors.title ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Description</Label>
            <div className={`bg-muted/50 rounded-xl overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-primary focus-within:bg-background ${fieldErrors.description ? 'border-destructive focus-within:ring-destructive' : 'border-transparent'}`}>
              <textarea
                id="description"
                className="w-full min-h-32 bg-transparent border-none px-4 py-4 text-foreground outline-none resize-y placeholder:text-muted-foreground"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what participants should expect..."
              />
            </div>
            {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description}</p>}
          </div>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
        <Label className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-4 block">Event Cover Image</Label>
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
          className={`relative w-full aspect-[21/9] rounded-lg overflow-hidden border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${isDraggingCover ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/60'}`}
          onClick={() => !coverImage && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (event) => handleCoverFile(event.target.files?.[0] ?? null)}
          />

          {coverImage ? (
            <>
              <Image
                src={coverImage}
                alt="Cover preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <Button variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <ImagePlus className="w-4 h-4 mr-2" /> Change Cover
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="text-center px-4">
                <p className="font-bold text-lg mb-1">Drop your cover here</p>
                <p className="text-muted-foreground text-sm">Recommended: 1920x820px (Max 2MB)</p>
              </div>
            </>
          )}
        </div>
        {coverError && <p className="text-sm text-destructive mt-2">{coverError}</p>}
        {fieldErrors.cover_image && <p className="text-sm text-destructive mt-2">{fieldErrors.cover_image}</p>}

        <div className="mt-4 space-y-2">
          <Label htmlFor="coverImageUrl" className="text-sm text-muted-foreground">Or paste image URL</Label>
          <Input
            id="coverImageUrl"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
            className="bg-muted/50 border-transparent focus-visible:bg-background"
          />
        </div>
      </section>
    </div>
  )

  const renderLogistics = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-card border rounded-lg p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <UserCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Attendance Type</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'in_person', label: 'In-person', icon: MapPin },
            { value: 'online', label: 'Virtual', icon: Video },
            { value: 'hybrid', label: 'Hybrid', icon: MonitorSmartphone },
          ].map((type) => (
            <label key={type.value} className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all ${eventType === type.value ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}>
              <input
                type="radio"
                name="attendance_type"
                value={type.value}
                checked={eventType === type.value}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="sr-only"
              />
              <type.icon className="mb-3 w-8 h-8" />
              <span className="font-bold">{type.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Video className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Schedule</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startAt" className="text-sm font-semibold text-muted-foreground ml-1">Start Date & Time</Label>
            <Input
              id="startAt"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className={`h-12 bg-muted/50 border-transparent focus-visible:bg-background ${fieldErrors.start_at ? 'border-destructive' : ''}`}
            />
            {fieldErrors.start_at && <p className="text-xs text-destructive ml-1">{fieldErrors.start_at}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt" className="text-sm font-semibold text-muted-foreground ml-1">End Date & Time</Label>
            <Input
              id="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className={`h-12 bg-muted/50 border-transparent focus-visible:bg-background ${fieldErrors.end_at ? 'border-destructive' : ''}`}
            />
            {fieldErrors.end_at && <p className="text-xs text-destructive ml-1">{fieldErrors.end_at}</p>}
          </div>
        </div>
      </section>

      {(eventType === 'in_person' || eventType === 'hybrid') && (
        <section className="bg-card border rounded-lg p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Venue Details</h2>
          </div>
          <div className="space-y-2 relative z-50">
            <Label htmlFor="location" className="text-sm font-semibold text-muted-foreground ml-1">Location / Address</Label>
            <LocationAutocomplete
              value={location}
              onChange={(data) => {
                setLocation(data.address || '')
                setLocationAddress(data.address || '')
                setLocationCity(data.city || '')
                setLocationRegion(data.region || '')
              }}
              onClear={() => {
                setLocation('')
                setLocationAddress('')
                setLocationCity('')
                setLocationRegion('')
              }}
              placeholder="Start typing to search for venue via Google Places..."
              className={`h-12 w-full bg-muted/50 border-transparent focus-visible:bg-background ${fieldErrors.location ? 'border-destructive' : ''}`}
            />
            {fieldErrors.location && <p className="text-xs text-destructive ml-1">{fieldErrors.location}</p>}

            {(locationCity || locationRegion) && (
              <div className="flex gap-2 ml-1 mt-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border inline-flex items-center">
                <span>📍 Parsed Data:</span>
                {locationCity && <span className="font-semibold text-foreground">{locationCity}</span>}
                {locationCity && locationRegion && <span>,</span>}
                {locationRegion && <span className="font-semibold text-foreground">{locationRegion}</span>}
              </div>
            )}
          </div>
        </section>
      )}

      {(eventType === 'online' || eventType === 'hybrid') && (
        <section className="bg-card border rounded-lg p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Video className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Virtual Connection</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meetingUrl" className="text-sm font-semibold text-muted-foreground ml-1">Meeting URL</Label>
            <Input
              id="meetingUrl"
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/..."
              className={`h-12 bg-muted/50 border-transparent focus-visible:bg-background ${fieldErrors.meeting_url ? 'border-destructive' : ''}`}
            />
            <p className="text-xs text-muted-foreground ml-1 italic mt-1">Link will be shared with approved attendees only.</p>
            {fieldErrors.meeting_url && <p className="text-xs text-destructive ml-1">{fieldErrors.meeting_url}</p>}
          </div>
        </section>
      )}
    </div>
  )

  const renderAccess = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-card border rounded-lg p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <QrCode className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Enrollment Model</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EVENT_ACCESS_MODEL_OPTIONS.map((option) => (
            <label key={option.value} className={`flex items-start gap-4 p-5 rounded-xl transition-all cursor-pointer border ${accessModel === option.value ? 'bg-primary/5 border-primary shadow-sm' : 'bg-muted/30 border-transparent hover:bg-muted/60'}`}>
              <div className="mt-1">
                <input
                  type="radio"
                  name="accessModel"
                  value={option.value}
                  checked={accessModel === option.value}
                  onChange={(e) => setAccessModel(e.target.value as EventAccessModel)}
                  className="w-4 h-4 text-primary bg-background border-border focus:ring-primary focus:ring-2"
                />
              </div>
              <div>
                <span className={`block font-semibold ${accessModel === option.value ? 'text-primary' : 'text-foreground'}`}>{option.label}</span>
                <span className="text-sm text-muted-foreground mt-1 block leading-relaxed">
                  {option.value === 'open'
                    ? 'First-come, first-served. Students register instantly and receive their QR code immediately.'
                    : 'Members must apply. Admins review and approve entries manually.'
                  }
                </span>
              </div>
            </label>
          ))}
        </div>

        {accessModel === 'application' && (
          <div className="mt-6 ml-10 p-5 rounded-xl bg-muted/50 border-l-4 border-l-primary animate-in fade-in slide-in-from-left-4">
            <Label htmlFor="applicationFormUrl" className="text-sm font-semibold mb-2 block">External Form URL</Label>
            <Input
              id="applicationFormUrl"
              value={applicationFormUrl}
              onChange={(e) => setApplicationFormUrl(e.target.value)}
              placeholder="https://forms.google.com/..."
              className={`bg-background ${fieldErrors.application_form_url ? 'border-destructive' : ''}`}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Paste any form link — Google Forms, Typeform, etc. Students will be redirected here when they click &quot;Apply&quot;.
            </p>
            {fieldErrors.application_form_url && <p className="text-xs text-destructive mt-1">{fieldErrors.application_form_url}</p>}

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm font-semibold">Application Questions</Label>
                <Button type="button" variant="outline" size="sm" onClick={addApplicationQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {applicationQuestionsState.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
                  Add native questions or provide an external form URL.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicationQuestionsState.map((question, index) => (
                    <div key={question.id ?? index} className="rounded-lg border bg-background p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <GripVertical className="mt-3 h-4 w-4 text-muted-foreground" />
                        <div className="grid flex-1 gap-3 md:grid-cols-[1fr_160px]">
                          <Input
                            value={question.questionText}
                            onChange={(event) => updateApplicationQuestion(index, { questionText: event.target.value })}
                            placeholder={`Question ${index + 1}`}
                            className="bg-muted/40"
                          />
                          <select
                            value={question.questionType}
                            onChange={(event) => updateApplicationQuestion(index, {
                              questionType: event.target.value as EventApplicationQuestionType,
                              optionsText: ['single_select', 'checkbox'].includes(event.target.value)
                                ? question.optionsText
                                : '',
                            })}
                            className="h-10 rounded-md border border-input bg-muted/40 px-3 text-sm"
                          >
                            {questionTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => moveApplicationQuestion(index, -1)} disabled={index === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => moveApplicationQuestion(index, 1)} disabled={index === applicationQuestionsState.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeApplicationQuestion(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {['single_select', 'checkbox'].includes(question.questionType) ? (
                        <textarea
                          value={question.optionsText}
                          onChange={(event) => updateApplicationQuestion(index, { optionsText: event.target.value })}
                          placeholder="One option per line"
                          className="min-h-20 w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      ) : null}

                      <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={question.isRequired}
                          onChange={(event) => updateApplicationQuestion(index, { isRequired: event.target.checked })}
                          className="h-4 w-4 rounded border-border"
                        />
                        Required
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {fieldErrors.application_questions && (
                <p className="text-xs text-destructive">{fieldErrors.application_questions}</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <UserCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Capacity Limit</h2>
        </div>
        <div className="relative max-w-md">
          <Input
            id="capacity"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="e.g. 150"
            className={`h-12 bg-muted/50 border-transparent focus-visible:bg-background ${fieldErrors.capacity ? 'border-destructive' : ''}`}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <UserCheck className="w-5 h-5 opacity-50" />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Leave blank for unlimited capacity.</p>
        {fieldErrors.capacity && <p className="text-xs text-destructive mt-1">{fieldErrors.capacity}</p>}
      </section>

      {mode === 'edit' && initial?.id && (
        <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Collaborating Chapters</h2>
          </div>
          <CollaboratorManager
            eventId={initial.id}
            ownerChapterId={editorChapter?.id || null}
            mode={mode}
            onCollaboratorsChange={setPendingCollaboratorIds}
          />
        </section>
      )}
    </div>
  )

  const renderReview = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-card border rounded-lg p-6 md:p-8 space-y-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-6 border-b pb-4">Event Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Title</span>
              <p className="text-lg font-medium">{title || <span className="text-muted-foreground italic">Untitled Event</span>}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Type & Access</span>
              <p className="font-medium capitalize">{eventType.replace('_', ' ')} • {accessModel === 'open' ? 'Open Enrollment' : 'Application Required'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Date & Time</span>
              <p className="font-medium">
                {startAt ? new Date(fromDateTimeLocal(startAt)).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : <span className="text-muted-foreground italic">Not set</span>}
                {' - '}
                {endAt ? new Date(fromDateTimeLocal(endAt)).toLocaleTimeString(undefined, { timeStyle: 'short' }) : ''}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Location/Meeting</span>
              <p className="font-medium max-w-[300px] truncate">
                {eventType === 'in_person' || eventType === 'hybrid' ? location || <span className="text-muted-foreground italic">No location set</span> : null}
                {eventType === 'hybrid' && <span className="mx-2 text-muted-foreground">|</span>}
                {eventType === 'online' || eventType === 'hybrid' ? meetingUrl || <span className="text-muted-foreground italic">No meeting link set</span> : null}
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-5 border">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-success" /> Readiness Checklist</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                {title && description ? <Check className="w-5 h-5 text-success mt-0.5" /> : <div className="w-5 h-5 rounded-full border-2 mt-0.5" />}
                <div>
                  <p className="font-medium text-sm">Basic details completed</p>
                  <p className="text-xs text-muted-foreground">Title and description provided</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                {coverImage ? <Check className="w-5 h-5 text-success mt-0.5" /> : <div className="w-5 h-5 rounded-full border-2 mt-0.5" />}
                <div>
                  <p className="font-medium text-sm">Cover image uploaded</p>
                  <p className="text-xs text-muted-foreground">Helps attract more attendees</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                {startAt && endAt && (location || meetingUrl) ? <Check className="w-5 h-5 text-success mt-0.5" /> : <div className="w-5 h-5 rounded-full border-2 mt-0.5" />}
                <div>
                  <p className="font-medium text-sm">Logistics confirmed</p>
                  <p className="text-xs text-muted-foreground">Date, time, and location set</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t space-y-4">
          <Button
            className="w-full py-6 text-lg font-semibold"
            onClick={() => submitEvent(true)}
            disabled={isPending}
          >
            <Rocket className="w-5 h-5 mr-2" />
            Publish Event Now
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By publishing, this event will become visible to all members within the chapter network.
          </p>
          <div className="flex gap-4 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => submitEvent(false)} disabled={isPending}>
              Save as Draft
            </Button>
          </div>
        </div>
      </section>
    </div>
  )

  // --- MAIN RENDER ---

  if (mode === 'edit') {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8 pb-32">
        {renderErrorSummary()}

        {/* Render all sections cleanly on one page for quick editing */}
        <div className="space-y-12">
          {renderBasics()}
          {renderLogistics()}
          {renderAccess()}
        </div>

        {/* Sticky Bottom Bar for Edit Mode */}
        <div className="sticky bottom-6 z-50 mt-12 rounded-lg border bg-card/95 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                className="hidden sm:flex"
                onClick={onDelete}
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
              <div className="text-xs text-muted-foreground hidden md:block font-medium">
                {isAutoSaving ? 'Auto-saving...' : lastSavedAt ? `Last saved at ${lastSavedAt}` : 'All changes saved.'}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none font-semibold"
                onClick={() => submitEvent(false)}
                disabled={isPending}
              >
                Save Draft
              </Button>
              <Button
                className="flex-1 sm:flex-none font-semibold"
                onClick={() => submitEvent(true)}
                disabled={isPending}
              >
                <Save className="w-4 h-4 mr-2" /> Save & Publish
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Create Mode Wizard
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16">
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8 max-w-2xl mx-auto px-4">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step === s.num ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg' :
                  step > s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs font-medium uppercase tracking-wider transition-colors ${step === s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="h-[2px] flex-1 mx-2 relative overflow-hidden bg-muted">
                  <div className={`absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out ${step > s.num ? 'w-full' : 'w-0'}`} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {renderErrorSummary()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {step === 1 && renderBasics()}
          {step === 2 && renderLogistics()}
          {step === 3 && renderAccess()}
          {step === 4 && renderReview()}

          {/* Form Navigation for Create Mode */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-8">
            <Button
              variant="outline"
              size="lg"
              className={step === 1 ? 'invisible' : ''}
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {step < 4 ? (
              <Button
                size="lg"
                className="min-w-[140px]"
                onClick={handleNext}
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isAutoSaving ? 'Auto-saving draft...' : lastSavedAt ? `Draft last saved at ${lastSavedAt}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Tips */}
        <aside className="lg:col-span-4 hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Editor Tips</h3>
              </div>

              <ul className="space-y-6">
                {step === 1 && (
                  <>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Clear titles</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Keep titles under 50 characters. Use action verbs to attract the right talent.</p>
                    </li>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Visual impact</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">High-contrast cover images perform 40% better. Avoid text-heavy graphics.</p>
                    </li>
                  </>
                )}
                {step === 2 && (
                  <>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Timezone check</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Most LEAD events are cross-border. Ensure your timezone is clear in the description.</p>
                    </li>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Hybrid access</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Providing a virtual link increases participation for regional chapters.</p>
                    </li>
                  </>
                )}
                {step === 3 && (
                  <>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Open vs. application</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Open enrollment leads to higher turnout, but application models ensure higher attendee quality.</p>
                    </li>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Capacity buffers</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Set capacity slightly lower than venue limit to ensure comfortable networking space.</p>
                    </li>
                  </>
                )}
                {step === 4 && (
                  <>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Final check</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Review all details carefully. Once published, members will receive immediate notifications.</p>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
