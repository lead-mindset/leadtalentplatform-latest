'use client'

import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEvent, type CreateEventInput } from '@/lib/actions/events/create-event'
import { updateEvent, type UpdateEventInput } from '@/lib/actions/events/update-event'
import { deleteEvent } from '@/lib/actions/events/delete-event'
import { addEventCollaborators } from '@/lib/actions/events/add-event-collaborators'
import type { EventRow, EventType, EventAccessModel, ChapterRow, EventApplicationQuestionRow, EventApplicationQuestionType } from '@/lib/types'
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
  { value: 'short_text', label: 'Respuesta corta' },
  { value: 'long_text', label: 'Respuesta larga' },
  { value: 'single_select', label: 'Selección única' },
  { value: 'checkbox', label: 'Casillas' },
  { value: 'url', label: 'URL' },
]

const EVENT_ACCESS_OPTIONS: Array<{ value: EventAccessModel; label: string }> = [
  { value: 'open', label: 'Registro abierto' },
  { value: 'application', label: 'Postulación requerida' },
]

const eventTypeOptions: Array<{ value: EventType; label: string; icon: typeof MapPin }> = [
  { value: 'in_person', label: 'Presencial', icon: MapPin },
  { value: 'online', label: 'Virtual', icon: Video },
  { value: 'hybrid', label: 'Híbrido', icon: MonitorSmartphone },
]

const eventTypeLabels: Record<EventType, string> = {
  in_person: 'Presencial',
  online: 'Virtual',
  hybrid: 'Híbrido',
}

const accessModelLabels: Record<EventAccessModel, string> = {
  open: 'Registro abierto',
  application: 'Postulación requerida',
}

const EMPTY_APPLICATION_QUESTIONS: EventApplicationQuestionRow[] = []

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
  canArchiveEvents = false,
  applicationQuestions = EMPTY_APPLICATION_QUESTIONS,
}: {
  mode: Mode
  initial?: EventRow | null
  editorChapter?: ChapterRow | null
  canArchiveEvents?: boolean
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
      locationLatitude: e?.location_latitude ?? null,
      locationLongitude: e?.location_longitude ?? null,
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
  const [locationLatitude, setLocationLatitude] = useState<number | null>(defaults.locationLatitude)
  const [locationLongitude, setLocationLongitude] = useState<number | null>(defaults.locationLongitude)
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
      setLocationLatitude(initial.location_latitude ?? null)
      setLocationLongitude(initial.location_longitude ?? null)
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
      setCoverError('Solo se permiten archivos de imagen')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setCoverError('La imagen de portada debe pesar 2 MB o menos')
      return
    }

    setCoverError(null)
    const formData = new FormData()
    formData.set('cover', file)
    const toastId = toast.loading('Subiendo imagen...')
    try {
      const result = await uploadEventCover(formData)
      setCoverImage(result.publicUrl)
      toast.success('Imagen subida correctamente', { id: toastId })
    } catch (uploadError) {
      setCoverError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen')
      toast.error('No se pudo subir la imagen', { id: toastId })
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
      if (!title.trim()) { errors.title = 'El título es obligatorio'; isValid = false }
      if (title.length > 100) { errors.title = 'El título debe tener menos de 100 caracteres'; isValid = false }
      if (description.length > 2000) { errors.description = 'La descripción debe tener menos de 2000 caracteres'; isValid = false }
      if (coverImage && !coverImage.startsWith('http')) { errors.cover_image = 'La URL de imagen no es valida'; isValid = false }
    }

    if (checkLogistics) {
      if (!startAt) { errors.start_at = 'La fecha y hora de inicio son obligatorias'; isValid = false }
      if (!endAt) { errors.end_at = 'La fecha y hora de fin son obligatorias'; isValid = false }
      if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
        errors.end_at = 'La fecha de fin debe ser posterior al inicio'
        isValid = false
      }
      if (eventType === 'in_person' && !location?.trim()) {
        errors.location = 'La ubicación es obligatoria para eventos presenciales'
        isValid = false
      }
      if (eventType === 'online' && !meetingUrl?.trim()) {
        errors.meeting_url = 'El enlace de reunión es obligatorio para eventos virtuales'
        isValid = false
      }
      if (eventType === 'hybrid') {
        if (!location?.trim()) { errors.location = 'La ubicación es obligatoria para eventos híbridos'; isValid = false }
        if (!meetingUrl?.trim()) { errors.meeting_url = 'El enlace de reunión es obligatorio para eventos híbridos'; isValid = false }
      }
    }

    if (checkAccess) {
      if (capacity && (isNaN(Number(capacity)) || Number(capacity) <= 0)) {
        errors.capacity = 'La capacidad debe ser un número mayor que 0'
        isValid = false
      }
      if (accessModel === 'application' && !applicationFormUrl?.trim()) {
        const hasQuestions = applicationQuestionsState.some((question) => question.questionText.trim())
        if (!hasQuestions) {
          errors.application_questions = 'Agrega al menos una pregunta de postulación'
          isValid = false
        }
      }

      if (accessModel === 'application') {
        applicationQuestionsState.forEach((question, index) => {
          if (!question.questionText.trim()) {
            errors.application_questions = `La pregunta ${index + 1} necesita texto`
            isValid = false
          }

          if (
            ['single_select', 'checkbox'].includes(question.questionType) &&
            !question.optionsText.split('\n').some((option) => option.trim())
          ) {
            errors.application_questions = `La pregunta ${index + 1} necesita al menos una opción`
            isValid = false
          }
        })
      }
    }

    if (!isValid) {
      setFieldErrors(errors)
      toast.error('Corrige los campos marcados antes de guardar')
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
        locationLatitude,
        locationLongitude,
        meetingUrl: meetingUrl || undefined,
        eventType,
        capacity: capacity === '' ? undefined : Number(capacity),
        isPublished: targetPublished,
        accessModel,
        applicationFormUrl: undefined,
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
            toast.error(`El evento se actualizó, pero no se pudieron agregar colaboradores: ${collaboratorResult.error}`)
          }
        }
        toast.success(mode === 'create' ? 'Evento creado correctamente' : 'Evento actualizado correctamente')
        setLastSavedAt(new Date().toLocaleTimeString('es-PE'))
        setIsPublished(res.event.is_published)

        if (mode === 'create') {
          router.push(`/${locale}/chapter/events/${res.event.id}`)
        } else {
          router.refresh()
        }
      } catch {
        toast.error('Ocurrió un error inesperado. Inténtalo nuevamente.')
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
        locationLatitude,
        locationLongitude,
        meetingUrl: meetingUrl || null,
        eventType,
        capacity: capacity === '' ? null : Number(capacity),
        isPublished: false,
        accessModel,
        applicationFormUrl: null,
        applicationQuestions:
          accessModel === 'application'
            ? applicationQuestionsState.map(toQuestionPayload).filter((question) => question.questionText)
            : undefined,
      }
      const res = await updateEvent(payload as UpdateEventInput)
      if (!('error' in res)) {
        setLastSavedAt(new Date().toLocaleTimeString('es-PE'))
      }
      setIsAutoSaving(false)
    }, 30000)

    return () => window.clearInterval(interval)
  }, [mode, isPublished, initial, title, description, coverImage, startAt, endAt, location, locationName, locationAddress, locationCity, locationRegion, locationLatitude, locationLongitude, meetingUrl, eventType, capacity, accessModel, applicationFormUrl, applicationQuestionsState])

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
    { num: 1, title: 'Datos' },
    { num: 2, title: 'Logística' },
    { num: 3, title: 'Acceso' },
    { num: 4, title: 'Revisión' },
  ]
  const fieldErrorEntries = Object.entries(fieldErrors).filter(([, message]) => message)

  const renderErrorSummary = () => {
    if (!error && fieldErrorEntries.length === 0) return null

    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error && <div className="font-medium">{error}</div>}
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
          <div className="text-xl font-semibold">Datos del evento</div>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Título del evento</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (fieldErrors.title) {
                  setFieldErrors(prev => ({ ...prev, title: '' }))
                }
              }}
              placeholder="Ej. LEAD Spark: Tech & Careers"
              className={fieldErrors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {fieldErrors.title && <div className="text-sm text-destructive">{fieldErrors.title}</div>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Descripción</Label>
            <Textarea
              id="description"
              className={fieldErrors.description ? 'min-h-32 border-destructive focus-visible:ring-destructive' : 'min-h-32'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica el propósito, la audiencia y qué deben esperar los participantes."
            />
            {fieldErrors.description && <div className="text-sm text-destructive">{fieldErrors.description}</div>}
          </div>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
        <Label className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-4 block">Imagen de portada</Label>
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
          className={`relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border border-dashed transition-all group ${isDraggingCover ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/60'}`}
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
                alt="Vista previa de la portada"
                fill
                sizes="(min-width: 1024px) 768px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <Button variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <ImagePlus className="w-4 h-4 mr-2" /> Cambiar portada
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="text-center px-4">
                <div className="mb-1 text-lg font-semibold">Arrastra la portada aquí</div>
                <div className="text-sm text-muted-foreground">Recomendado: 1920 x 1080 px. Máximo 2 MB.</div>
              </div>
            </>
          )}
        </div>
        {coverError && <div className="mt-2 text-sm text-destructive">{coverError}</div>}
        {fieldErrors.cover_image && <div className="mt-2 text-sm text-destructive">{fieldErrors.cover_image}</div>}

        <div className="mt-4 space-y-2">
          <Label htmlFor="coverImageUrl" className="text-sm text-muted-foreground">O pega una URL de imagen</Label>
          <Input
            id="coverImageUrl"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
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
          <div className="text-xl font-semibold">Formato de asistencia</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {eventTypeOptions.map((type) => (
            <label key={type.value} className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-6 transition-colors ${eventType === type.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}>
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
          <div className="text-xl font-semibold">Fecha y hora</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startAt" className="text-sm font-semibold text-muted-foreground ml-1">Inicio</Label>
            <Input
              id="startAt"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className={fieldErrors.start_at ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {fieldErrors.start_at && <div className="ml-1 text-xs text-destructive">{fieldErrors.start_at}</div>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt" className="text-sm font-semibold text-muted-foreground ml-1">Fin</Label>
            <Input
              id="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className={fieldErrors.end_at ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {fieldErrors.end_at && <div className="ml-1 text-xs text-destructive">{fieldErrors.end_at}</div>}
          </div>
        </div>
      </section>

      {(eventType === 'in_person' || eventType === 'hybrid') && (
        <section className="bg-card border rounded-lg p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-xl font-semibold">Lugar</div>
          </div>
          <div className="space-y-2 relative z-50">
            <Label htmlFor="location" className="text-sm font-semibold text-muted-foreground ml-1">Ubicación / dirección</Label>
            <LocationAutocomplete
              value={location}
              onChange={(data) => {
                setLocation(data.address || '')
                setLocationName(data.name || data.address?.split(',')[0]?.trim() || '')
                setLocationAddress(data.address || '')
                setLocationCity(data.city || '')
                setLocationRegion(data.region || '')
                setLocationLatitude(data.latitude ?? null)
                setLocationLongitude(data.longitude ?? null)
              }}
              onClear={() => {
                setLocation('')
                setLocationName('')
                setLocationAddress('')
                setLocationCity('')
                setLocationRegion('')
                setLocationLatitude(null)
                setLocationLongitude(null)
              }}
              placeholder="Busca el lugar con Google Places..."
              className={`w-full ${fieldErrors.location ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {fieldErrors.location && <div className="ml-1 text-xs text-destructive">{fieldErrors.location}</div>}

            {(locationCity || locationRegion) && (
              <div className="ml-1 mt-2 inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <span>Datos detectados:</span>
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
            <div className="text-xl font-semibold">Conexion virtual</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meetingUrl" className="text-sm font-semibold text-muted-foreground ml-1">Enlace de reunión</Label>
            <Input
              id="meetingUrl"
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/..."
              className={fieldErrors.meeting_url ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            <div className="ml-1 mt-1 text-xs text-muted-foreground">El enlace se compartira solo con asistentes aprobados.</div>
            {fieldErrors.meeting_url && <div className="ml-1 text-xs text-destructive">{fieldErrors.meeting_url}</div>}
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
          <div className="text-xl font-semibold">Modelo de registro</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EVENT_ACCESS_OPTIONS.map((option) => (
            <label key={option.value} className={`flex cursor-pointer items-start gap-4 rounded-lg border p-5 transition-colors ${accessModel === option.value ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/20 hover:bg-muted/40'}`}>
              <div className="mt-1">
                <input
                  type="radio"
                  name="accessModel"
                  value={option.value}
                  checked={accessModel === option.value}
                  onChange={(e) => setAccessModel(e.target.value as EventAccessModel)}
                  className="h-4 w-4 accent-primary"
                />
              </div>
              <div>
                <span className={`block font-semibold ${accessModel === option.value ? 'text-primary' : 'text-foreground'}`}>{option.label}</span>
                <span className="text-sm text-muted-foreground mt-1 block leading-relaxed">
                  {option.value === 'open'
                    ? 'Los estudiantes se registran al instante y reciben su QR de inmediato.'
                    : 'Los participantes postulan y el chapter revisa las solicitudes antes de aprobarlas.'
                  }
                </span>
              </div>
            </label>
          ))}
        </div>

        {accessModel === 'application' && (
          <div className="mt-6 rounded-xl border-l-4 border-l-primary bg-muted/50 p-5 animate-in fade-in slide-in-from-left-4 md:ml-10">
            <div className="space-y-3">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Label className="text-sm font-semibold">Preguntas de postulación</Label>
                <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={addApplicationQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar pregunta
                </Button>
              </div>

              {applicationQuestionsState.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
                  Agrega al menos una pregunta. Los postulantes responderán dentro de LEAD.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicationQuestionsState.map((question, index) => (
                    <div key={question.id ?? index} className="rounded-lg border bg-background p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <GripVertical className="h-4 w-4" />
                          Pregunta {index + 1}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" aria-label="Subir pregunta" onClick={() => moveApplicationQuestion(index, -1)} disabled={index === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" aria-label="Bajar pregunta" onClick={() => moveApplicationQuestion(index, 1)} disabled={index === applicationQuestionsState.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" aria-label="Eliminar pregunta" onClick={() => removeApplicationQuestion(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          value={question.questionText}
                          onChange={(event) => updateApplicationQuestion(index, { questionText: event.target.value })}
                          placeholder={`Pregunta ${index + 1}`}
                          className="bg-muted/40"
                        />
                        <Select
                          value={question.questionType}
                          onValueChange={(value) => updateApplicationQuestion(index, {
                            questionType: value as EventApplicationQuestionType,
                            optionsText: ['single_select', 'checkbox'].includes(value)
                              ? question.optionsText
                              : '',
                          })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {['single_select', 'checkbox'].includes(question.questionType) ? (
                        <Textarea
                          value={question.optionsText}
                          onChange={(event) => updateApplicationQuestion(index, { optionsText: event.target.value })}
                          placeholder="Una opción por línea"
                          className="min-h-20 bg-muted/40"
                        />
                      ) : null}

                      <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={question.isRequired}
                          onCheckedChange={(checked) => updateApplicationQuestion(index, { isRequired: checked === true })}
                        />
                        Obligatoria
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {fieldErrors.application_questions && (
                <div className="text-xs text-destructive">{fieldErrors.application_questions}</div>
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
          <div className="text-xl font-semibold">Límite de capacidad</div>
        </div>
        <div className="relative max-w-md">
          <Input
            id="capacity"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Ej. 150"
            className={fieldErrors.capacity ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <UserCheck className="w-5 h-5 opacity-50" />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">Déjalo en blanco si no hay límite de cupos.</div>
        {fieldErrors.capacity && <div className="mt-1 text-xs text-destructive">{fieldErrors.capacity}</div>}
      </section>

      {mode === 'edit' && initial?.id && (
        <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-xl font-semibold">Chapters colaboradores</div>
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
        <div className="mb-6 border-b pb-4 text-2xl font-semibold">Resumen del evento</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Título</span>
              <div className="text-lg font-medium">{title || <span className="text-muted-foreground italic">Evento sin título</span>}</div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Formato y acceso</span>
              <div className="font-medium">{eventTypeLabels[eventType]} · {accessModelLabels[accessModel]}</div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Fecha y hora</span>
              <div className="font-medium">
                {startAt ? new Date(fromDateTimeLocal(startAt)).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : <span className="text-muted-foreground italic">Sin definir</span>}
                {' - '}
                {endAt ? new Date(fromDateTimeLocal(endAt)).toLocaleTimeString('es-PE', { timeStyle: 'short' }) : ''}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Ubicación / enlace</span>
              <div className="max-w-sm truncate font-medium">
                {eventType === 'in_person' || eventType === 'hybrid' ? location || <span className="text-muted-foreground italic">Sin ubicación</span> : null}
                {eventType === 'hybrid' && <span className="mx-2 text-muted-foreground">|</span>}
                {eventType === 'online' || eventType === 'hybrid' ? meetingUrl || <span className="text-muted-foreground italic">Sin enlace</span> : null}
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-5 border">
            <div className="font-semibold mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-success" /> Checklist de publicación</div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                {title && description ? <Check className="w-5 h-5 text-success mt-0.5" /> : <div className="w-5 h-5 rounded-full border-2 mt-0.5" />}
                <div>
                  <div className="text-sm font-medium">Datos básicos completos</div>
                  <div className="text-xs text-muted-foreground">Título y descripción definidos</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                {coverImage ? <Check className="w-5 h-5 text-success mt-0.5" /> : <div className="w-5 h-5 rounded-full border-2 mt-0.5" />}
                <div>
                  <div className="text-sm font-medium">Portada lista</div>
                  <div className="text-xs text-muted-foreground">Ayuda a comunicar mejor el evento</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                {startAt && endAt && (location || meetingUrl) ? <Check className="w-5 h-5 text-success mt-0.5" /> : <div className="w-5 h-5 rounded-full border-2 mt-0.5" />}
                <div>
                  <div className="text-sm font-medium">Logística confirmada</div>
                  <div className="text-xs text-muted-foreground">Fecha, hora y acceso definidos</div>
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
            Publicar evento ahora
          </Button>
          <div className="text-center text-xs text-muted-foreground">
            Al publicar, el evento será visible para la comunidad según el modelo de registro elegido.
          </div>
          <div className="flex gap-4 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => submitEvent(false)} disabled={isPending}>
              Guardar como borrador
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
              {canArchiveEvents ? (
                <Button
                  variant="destructive"
                  className="hidden sm:flex"
                  onClick={onDelete}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              ) : null}
              <div className="text-xs text-muted-foreground hidden md:block font-medium">
                {isAutoSaving ? 'Guardando automáticamente...' : lastSavedAt ? `Último guardado: ${lastSavedAt}` : 'Todos los cambios están guardados.'}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none font-semibold"
                onClick={() => submitEvent(false)}
                disabled={isPending}
              >
                Guardar borrador
              </Button>
              <Button
                className="flex-1 sm:flex-none font-semibold"
                onClick={() => submitEvent(true)}
                disabled={isPending}
              >
                <Save className="w-4 h-4 mr-2" /> Guardar y publicar
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
                <div className="relative mx-2 h-0.5 flex-1 overflow-hidden bg-muted">
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
              <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
            </Button>

            {step < 4 ? (
              <Button
                size="lg"
                className="min-w-36"
                onClick={handleNext}
              >
                Siguiente <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isAutoSaving ? 'Guardando borrador...' : lastSavedAt ? `Borrador guardado: ${lastSavedAt}` : ''}
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
                <div className="text-lg font-semibold">Consejos para editar</div>
              </div>

              <ul className="space-y-6">
                {step === 1 && (
                  <>
                    <li className="space-y-1">
                      <div className="text-sm font-semibold">Títulos claros</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">Usa un título específico y fácil de escanear para que el público correcto entienda el valor rápido.</div>
                    </li>
                    <li className="space-y-1">
                      <div className="text-sm font-semibold">Portada útil</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">Elige una imagen clara del tema, lugar o comunidad. Evita gráficas con demasiado texto.</div>
                    </li>
                  </>
                )}
                {step === 2 && (
                  <>
                    <li className="space-y-1">
                      <div className="text-sm font-semibold">Zona horaria</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">Si el evento es virtual o regional, menciona la zona horaria en la descripción.</div>
                    </li>
                    <li className="space-y-1">
                      <div className="text-sm font-semibold">Acceso híbrido</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">Un enlace virtual puede ayudar a chapters aliados o miembros fuera de la ciudad.</div>
                    </li>
                  </>
                )}
                {step === 3 && (
                  <>
                    <li className="space-y-1">
                      <div className="text-sm font-semibold">Registro vs. postulación</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">El registro abierto reduce fricción. La postulación ayuda cuando necesitas curar cupos.</div>
                    </li>
                    <li className="space-y-1">
                      <div className="text-sm font-semibold">Cupos reales</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">Deja margen si el espacio necesita circulación, networking o equipos de apoyo.</div>
                    </li>
                  </>
                )}
                {step === 4 && (
                  <>
                    <li className="space-y-1">
                      <div className="text-sm font-semibold">Revisión final</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">Confirma fecha, acceso, cupos y preguntas antes de publicar.</div>
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
