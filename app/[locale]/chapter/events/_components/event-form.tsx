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
  { value: 'short_text', label: 'Texto corto' },
  { value: 'long_text', label: 'Texto largo' },
  { value: 'single_select', label: 'Seleccion unica' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
]

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
  applicationQuestions = EMPTY_APPLICATION_QUESTIONS,
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
      if (!title.trim()) { errors.title = 'El titulo es obligatorio'; isValid = false }
      if (title.length > 100) { errors.title = 'El titulo debe tener menos de 100 caracteres'; isValid = false }
      if (description.length > 2000) { errors.description = 'La descripcion debe tener menos de 2000 caracteres'; isValid = false }
      if (coverImage && !coverImage.startsWith('http')) { errors.cover_image = 'El URL de imagen no es valido'; isValid = false }
    }

    if (checkLogistics) {
      if (!startAt) { errors.start_at = 'La fecha y hora de inicio son obligatorias'; isValid = false }
      if (!endAt) { errors.end_at = 'La fecha y hora de fin son obligatorias'; isValid = false }
      if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
        errors.end_at = 'La fecha de fin debe ser posterior al inicio'
        isValid = false
      }
      if (eventType === 'in_person' && !location?.trim()) {
        errors.location = 'El lugar es obligatorio para eventos presenciales'
        isValid = false
      }
      if (eventType === 'online' && !meetingUrl?.trim()) {
        errors.meeting_url = 'El link es obligatorio para eventos virtuales'
        isValid = false
      }
      if (eventType === 'hybrid') {
        if (!location?.trim()) { errors.location = 'El lugar es obligatorio para eventos hibridos'; isValid = false }
        if (!meetingUrl?.trim()) { errors.meeting_url = 'El link es obligatorio para eventos hibridos'; isValid = false }
      }
    }

    if (checkAccess) {
      if (capacity && (isNaN(Number(capacity)) || Number(capacity) <= 0)) {
        errors.capacity = 'El cupo debe ser un numero mayor que 0'
        isValid = false
      }
      if (accessModel === 'application' && !applicationFormUrl?.trim()) {
        const hasQuestions = applicationQuestionsState.some((question) => question.questionText.trim())
        if (!hasQuestions) {
          errors.application_questions = 'Agrega al menos una pregunta de postulacion'
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
            errors.application_questions = `La pregunta ${index + 1} necesita al menos una opcion`
            isValid = false
          }
        })
      }
    }

    if (!isValid) {
      setFieldErrors(errors)
      toast.error('Revisa los campos marcados antes de continuar')
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
            toast.error(`Event updated but failed to add collaborators: ${collaboratorResult.error}`)
          }
        }
        toast.success(mode === 'create' ? 'Event created successfully!' : 'Event updated successfully!')
        setLastSavedAt(new Date().toLocaleTimeString())
        setIsPublished(res.event.is_published)

        if (mode === 'create') {
          router.push(`/${locale}/chapter/events/${res.event.id}`)
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
        setLastSavedAt(new Date().toLocaleTimeString())
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
    { num: 1, title: 'Basico', shortTitle: 'Basico', helper: 'Nombre, descripcion e imagen' },
    { num: 2, title: 'Logistica', shortTitle: 'Logistica', helper: 'Fecha, hora y lugar' },
    { num: 3, title: 'Registro', shortTitle: 'Registro', helper: 'Acceso, preguntas y cupos' },
    { num: 4, title: 'Revision', shortTitle: 'Revision', helper: 'Confirmar y publicar' },
  ]
  const currentStep = steps.find((item) => item.num === step) ?? steps[0]
  const fieldErrorEntries = Object.entries(fieldErrors).filter(([, message]) => message)

  const StepProgress = () => (
    <nav aria-label="Progreso de creacion de evento" className="rounded-lg border bg-card px-4 py-4 shadow-sm">
      <div className="space-y-3 md:hidden">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Paso {step} de 4</p>
          <p className="font-semibold">{currentStep.title}</p>
          <p className="text-xs leading-5 text-muted-foreground">{currentStep.helper}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(step / steps.length) * 100}%` }} />
        </div>
      </div>

      <ol className="hidden grid-cols-4 gap-2 md:grid">
        {steps.map((item) => {
          const isComplete = step > item.num
          const isCurrent = step === item.num

          return (
            <li key={item.num}>
              <div
                className={`flex min-h-16 flex-col justify-between rounded-md border px-3 py-2 transition-colors ${
                  isCurrent
                    ? 'border-primary bg-primary/10 text-primary'
                    : isComplete
                      ? 'border-primary/30 bg-primary/5 text-foreground'
                      : 'border-border/70 bg-muted/20 text-muted-foreground'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isCurrent || isComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isComplete ? <Check className="size-3.5" /> : item.num}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide">{item.shortTitle}</span>
                </div>
                <span className="hidden text-xs leading-snug text-muted-foreground md:block">{item.helper}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )

  function SectionHeader({
    icon: Icon,
    title,
    description,
  }: {
    icon: typeof Lightbulb
    title: string
    description: string
  }) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    )
  }

  function RequiredMark() {
    return <span className="ml-1 text-primary" aria-hidden="true">*</span>
  }

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
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-lg border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-6">
          <SectionHeader
            icon={Lightbulb}
            title="Informacion principal"
            description="Escribe lo minimo que un estudiante necesita para entender si este evento es para el."
          />
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titulo del evento
              <RequiredMark />
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (fieldErrors.title) {
                  setFieldErrors(prev => ({ ...prev, title: '' }))
                }
              }}
              placeholder="Ej. LEAD Spark: Career Night"
              className={`h-11 bg-muted/40 focus-visible:bg-background ${fieldErrors.title ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Descripcion para participantes</Label>
            <div className={`overflow-hidden rounded-md border bg-muted/40 transition-all focus-within:ring-2 focus-within:ring-primary focus-within:bg-background ${fieldErrors.description ? 'border-destructive focus-within:ring-destructive' : 'border-input'}`}>
              <textarea
                id="description"
                className="min-h-32 w-full resize-y border-none bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cuenta que pasara, para quien es y que se llevara la persona al asistir."
              />
            </div>
            {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Imagen de portada</Label>
            <p className="text-sm leading-6 text-muted-foreground">
              Opcional, pero ayuda a que el evento se vea mejor en la pagina publica.
            </p>
          </div>
          <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">Opcional</span>
        </div>
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
          className={`group relative flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed transition-all md:aspect-[21/8] md:min-h-0 ${isDraggingCover ? 'border-primary bg-primary/5' : 'border-border bg-muted/25 hover:bg-muted/45'}`}
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
                sizes="(min-width: 1024px) 768px, 100vw"
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
              <div className="rounded-md bg-primary/10 p-3 text-primary transition-transform group-hover:scale-105">
                <UploadCloud className="size-6" />
              </div>
              <div className="text-center px-4">
                <p className="font-semibold">Sube o arrastra una imagen</p>
                <p className="text-sm text-muted-foreground">Recomendado: 1920x820px, maximo 2MB</p>
              </div>
            </>
          )}
        </div>
        {coverError && <p className="text-sm text-destructive mt-2">{coverError}</p>}
        {fieldErrors.cover_image && <p className="text-sm text-destructive mt-2">{fieldErrors.cover_image}</p>}

        <div className="mt-4 space-y-2">
          <Label htmlFor="coverImageUrl" className="text-sm text-muted-foreground">O pega un URL de imagen</Label>
          <Input
            id="coverImageUrl"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
            className="h-10 bg-muted/40 focus-visible:bg-background"
          />
        </div>
      </section>
    </div>
  )

  const renderLogistics = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-lg border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-5">
          <SectionHeader
            icon={UserCheck}
            title="Formato del evento"
            description="Elige como participaran los estudiantes para mostrar solo los campos necesarios."
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { value: 'in_person', label: 'Presencial', icon: MapPin },
              { value: 'online', label: 'Virtual', icon: Video },
              { value: 'hybrid', label: 'Hibrido', icon: MonitorSmartphone },
            ].map((type) => (
              <label key={type.value} className={`flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border p-4 text-center transition-all ${eventType === type.value ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}>
                <input
                  type="radio"
                  name="attendance_type"
                  value={type.value}
                  checked={eventType === type.value}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="sr-only"
                />
                <type.icon className="mb-2 size-6" />
                <span className="font-semibold">{type.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-5">
          <SectionHeader
            icon={Video}
            title="Fecha y hora"
            description="Confirma inicio y cierre para ordenar el calendario y habilitar check-in."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startAt" className="text-sm font-medium">
                Inicio
                <RequiredMark />
              </Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className={`h-11 bg-muted/40 focus-visible:bg-background ${fieldErrors.start_at ? 'border-destructive' : ''}`}
              />
              {fieldErrors.start_at && <p className="text-xs text-destructive">{fieldErrors.start_at}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt" className="text-sm font-medium">
                Fin
                <RequiredMark />
              </Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className={`h-11 bg-muted/40 focus-visible:bg-background ${fieldErrors.end_at ? 'border-destructive' : ''}`}
              />
              {fieldErrors.end_at && <p className="text-xs text-destructive">{fieldErrors.end_at}</p>}
            </div>
          </div>
        </div>
      </section>

      {(eventType === 'in_person' || eventType === 'hybrid') && (
        <section className="animate-in fade-in zoom-in-95 rounded-lg border bg-card p-5 shadow-sm md:p-6">
          <div className="relative z-50 space-y-5">
            <SectionHeader
              icon={MapPin}
              title="Lugar"
              description="Busca el venue para guardar direccion, ciudad y coordenadas cuando sea posible."
            />
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Lugar o direccion
                <RequiredMark />
              </Label>
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
                placeholder="Busca universidad, venue o direccion..."
                className={`h-11 w-full bg-muted/40 focus-visible:bg-background ${fieldErrors.location ? 'border-destructive' : ''}`}
              />
              {fieldErrors.location && <p className="text-xs text-destructive">{fieldErrors.location}</p>}

              {(locationCity || locationRegion) && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  <span>Detectado:</span>
                  {locationCity && <span className="font-semibold text-foreground">{locationCity}</span>}
                  {locationCity && locationRegion && <span>,</span>}
                  {locationRegion && <span className="font-semibold text-foreground">{locationRegion}</span>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {(eventType === 'online' || eventType === 'hybrid') && (
        <section className="animate-in fade-in zoom-in-95 rounded-lg border bg-card p-5 shadow-sm md:p-6">
          <div className="space-y-5">
            <SectionHeader
              icon={Video}
              title="Conexion virtual"
              description="Agrega el link que recibiran las personas registradas o aprobadas."
            />
            <div className="space-y-2">
              <Label htmlFor="meetingUrl" className="text-sm font-medium">
                Link de reunion
                <RequiredMark />
              </Label>
              <Input
                id="meetingUrl"
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className={`h-11 bg-muted/40 focus-visible:bg-background ${fieldErrors.meeting_url ? 'border-destructive' : ''}`}
              />
              <p className="text-xs text-muted-foreground">El link se muestra solo a personas registradas o aprobadas.</p>
              {fieldErrors.meeting_url && <p className="text-xs text-destructive">{fieldErrors.meeting_url}</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  )

  const renderAccess = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-lg border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-5">
          <SectionHeader
            icon={QrCode}
            title="Modelo de registro"
            description="Define si el registro sera inmediato o si el equipo debe revisar postulaciones."
          />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {EVENT_ACCESS_MODEL_OPTIONS.map((option) => (
            <label key={option.value} className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all ${accessModel === option.value ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/70 bg-muted/20 hover:bg-muted/40'}`}>
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
                <span className={`block font-semibold ${accessModel === option.value ? 'text-primary' : 'text-foreground'}`}>
                  {option.value === 'open' ? 'Registro abierto' : 'Con postulacion'}
                </span>
                <span className="text-sm text-muted-foreground mt-1 block leading-relaxed">
                  {option.value === 'open'
                    ? 'Las personas se registran al instante y reciben su QR.'
                    : 'El equipo revisa respuestas antes de aprobar asistencia.'
                  }
                </span>
              </div>
            </label>
          ))}
        </div>
        </div>

        {accessModel === 'application' && (
          <div className="mt-5 animate-in fade-in slide-in-from-left-4 rounded-lg border bg-muted/25 p-4">
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label className="text-sm font-semibold">Preguntas de postulacion</Label>
                  <p className="mt-1 text-xs text-muted-foreground">Estas preguntas son exactamente lo que vera el participante al postular.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addApplicationQuestion} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar pregunta
                </Button>
              </div>

              {applicationQuestionsState.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
                  Agrega al menos una pregunta para que el equipo pueda revisar postulantes.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicationQuestionsState.map((question, index) => (
                    <div key={question.id ?? index} className="space-y-4 rounded-lg border bg-background p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                          <GripVertical className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                          <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            Pregunta {index + 1}
                          </span>
                          {question.isRequired ? (
                            <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">Obligatoria</span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover pregunta arriba" onClick={() => moveApplicationQuestion(index, -1)} disabled={index === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover pregunta abajo" onClick={() => moveApplicationQuestion(index, 1)} disabled={index === applicationQuestionsState.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" aria-label="Eliminar pregunta" onClick={() => removeApplicationQuestion(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Texto de la pregunta</Label>
                          <Input
                            value={question.questionText}
                            onChange={(event) => updateApplicationQuestion(index, { questionText: event.target.value })}
                            placeholder="Ej. Por que quieres participar?"
                            className="h-10 bg-muted/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Tipo de respuesta</Label>
                          <select
                            value={question.questionType}
                            onChange={(event) => updateApplicationQuestion(index, {
                              questionType: event.target.value as EventApplicationQuestionType,
                              optionsText: ['single_select', 'checkbox'].includes(event.target.value)
                                ? question.optionsText
                                : '',
                            })}
                            className="h-10 w-full rounded-md border border-input bg-muted/40 px-3 text-sm"
                          >
                            {questionTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {['single_select', 'checkbox'].includes(question.questionType) ? (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Opciones</Label>
                          <textarea
                            value={question.optionsText}
                            onChange={(event) => updateApplicationQuestion(index, { optionsText: event.target.value })}
                            placeholder="Una opcion por linea"
                            className="min-h-24 w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          />
                        </div>
                      ) : null}

                      <label className="inline-flex min-h-9 items-center gap-2 rounded-md border bg-muted/20 px-3 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={question.isRequired}
                          onChange={(event) => updateApplicationQuestion(index, { isRequired: event.target.checked })}
                          className="h-4 w-4 rounded border-border"
                        />
                        Obligatoria
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

      <section className="rounded-lg border bg-card p-5 shadow-sm md:p-6">
        <SectionHeader
          icon={UserCheck}
          title="Cupo"
          description="Usa un limite si el espacio o el equipo de check-in lo necesita."
        />
        <div className="relative max-w-md">
          <Input
            id="capacity"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Ej. 150"
            className={`mt-5 h-11 bg-muted/40 focus-visible:bg-background ${fieldErrors.capacity ? 'border-destructive' : ''}`}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <UserCheck className="w-5 h-5 opacity-50" />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Dejalo vacio si el evento no tiene limite.</p>
        {fieldErrors.capacity && <p className="text-xs text-destructive mt-1">{fieldErrors.capacity}</p>}
      </section>

      {mode === 'edit' && initial?.id && (
        <section className="rounded-lg border bg-card p-5 shadow-sm md:p-6">
          <SectionHeader
            icon={MapPin}
            title="Chapters colaboradores"
            description="Agrega otros chapters cuando el evento se opera en conjunto."
          />
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
            Publicar evento
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Al publicar, el evento sera visible segun su configuracion.
          </p>
          <div className="flex gap-4 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => submitEvent(false)} disabled={isPending}>
              Guardar borrador
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
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </Button>
              <div className="text-xs text-muted-foreground hidden md:block font-medium">
                {isAutoSaving ? 'Guardando...' : lastSavedAt ? `Guardado a las ${lastSavedAt}` : 'Cambios guardados.'}
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
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-28">
      <StepProgress />

      {renderErrorSummary()}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {step === 1 && renderBasics()}
          {step === 2 && renderLogistics()}
          {step === 3 && renderAccess()}
          {step === 4 && renderReview()}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Lightbulb className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold">Paso {currentStep.num}: {currentStep.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{currentStep.helper}</p>
              </div>
            </div>

              <ul className="space-y-4">
                {step === 1 && (
                  <>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Lo obligatorio</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Titulo claro. La descripcion puede mejorar despues.</p>
                    </li>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Portada opcional</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">No bloquea el avance. Sube imagen si ya la tienes.</p>
                    </li>
                  </>
                )}
                {step === 2 && (
                  <>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Primero fecha</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Sin fecha y hora no se puede ordenar calendario ni check-in.</p>
                    </li>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Lugar o link</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">El formulario cambia segun presencial, virtual o hibrido.</p>
                    </li>
                  </>
                )}
                {step === 3 && (
                  <>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Registro abierto</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Mas rapido para eventos generales y comunidad amplia.</p>
                    </li>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Con postulacion</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Mejor cuando necesitas revisar respuestas antes de aprobar.</p>
                    </li>
                  </>
                )}
                {step === 4 && (
                  <>
                    <li className="space-y-1">
                      <p className="font-semibold text-sm">Publicar o guardar</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Publica si ya esta listo. Guarda borrador si falta confirmar algo.</p>
                    </li>
                  </>
                )}
              </ul>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-4 z-40 rounded-lg border bg-card/95 p-3 shadow-lg backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Paso {step} de 4</span>
            <span className="mx-2">·</span>
            {currentStep.helper}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className={step === 1 ? 'invisible flex-1 sm:flex-none' : 'flex-1 sm:flex-none'}
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Atras
            </Button>

            {step < 4 ? (
              <Button className="flex-1 sm:flex-none sm:min-w-[150px]" onClick={handleNext}>
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => submitEvent(false)} disabled={isPending}>
                Guardar borrador
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
