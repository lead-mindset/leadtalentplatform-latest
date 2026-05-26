'use client'

import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEvent, type CreateEventInput } from '@/lib/actions/events/create-event'
import { updateEvent, type UpdateEventInput } from '@/lib/actions/events/update-event'
import { deleteEvent } from '@/lib/actions/events/delete-event'
import { addEventCollaborators } from '@/lib/actions/events/add-event-collaborators'
import type {
  EventRow,
  EventType,
  EventAccessModel,
  ChapterRow,
  EventApplicationQuestionRow,
  EventApplicationQuestionType,
  EventPathwayMetadataRow,
} from '@/lib/types'
import {
  LEAD_EVENT_AUDIENCE_KEYS,
  LEAD_OKR_KEYS,
  LEAD_PILLAR_KEYS,
  LEAD_PROOF_OUTCOME_KEYS,
  LEAD_RECOMMENDATION_CTA_TYPES,
  LEAD_STUDENT_OUTCOME_KEYS,
  PATHWAY_GROWTH_STAGE_KEYS,
  PATHWAY_PRIMARY_FOCUS_KEYS,
  type LeadEventAudienceKey,
  type LeadEvidenceSignalKey,
  type LeadOkrKey,
  type LeadPillarKey,
  type LeadProofOutcomeKey,
  type LeadRecommendationCtaType,
  type LeadRecommendationSafetyKey,
  type LeadStudentOutcomeKey,
  type PathwayGrowthStageKey,
  type PathwayPrimaryFocusKey,
} from '@/lib/lead-taxonomy'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { uploadEventCover } from '@/lib/actions/events/upload-cover'
import { ImagePlus, Check, ArrowRight, ArrowLeft, UploadCloud, MapPin, Video, MonitorSmartphone, Lightbulb, UserCheck, QrCode, Rocket, Save, Trash2, Plus, GripVertical, ChevronUp, ChevronDown, Sparkles, Target, ShieldCheck } from 'lucide-react'
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

type TaxonomyOption<T extends string> = {
  value: T
  label: string
  description?: string
}

const okrLabels: Record<LeadOkrKey, string> = {
  inspire: 'Inspire',
  unite: 'Unite',
  empower: 'Empower',
  elevate: 'Elevate',
}

const pillarLabels: Record<LeadPillarKey, string> = {
  lead_academia: 'LEAD Academia',
  academic_excellence: 'Academic Excellence',
  womens_excellence: "Women's Excellence",
  professional_development: 'Professional Development',
  leadership_development: 'Leadership Development',
  community_outreach: 'Community Outreach',
  chapter_development: 'Chapter Development',
}

const focusLabels: Record<PathwayPrimaryFocusKey, string> = {
  career_exploration: 'Exploracion de carrera',
  technical_experience: 'Experiencia tecnica',
  opportunity_readiness: 'Preparacion para oportunidades',
  community_mentorship: 'Comunidad y mentorias',
  leadership: 'Liderazgo',
}

const growthStageLabels: Record<PathwayGrowthStageKey, string> = {
  explorer: 'Explorer',
  builder: 'Builder',
  leader: 'Leader',
  candidate: 'Candidate',
  emerging_professional: 'Emerging professional',
}

const studentOutcomeLabels: Record<LeadStudentOutcomeKey, string> = {
  mission_orientation: 'Orientacion a la mision',
  belonging: 'Sentido de pertenencia',
  career_exposure: 'Exposicion profesional',
  technical_skill: 'Habilidad tecnica',
  innovation_project: 'Proyecto o innovacion',
  proof_artifact: 'Evidencia concreta',
  professional_readiness: 'Preparacion profesional',
  profile_visibility: 'Perfil mas visible',
  leadership_confidence: 'Confianza de liderazgo',
  teamwork: 'Trabajo en equipo',
  reflection: 'Reflexion de aprendizaje',
  community_service: 'Servicio a la comunidad',
}

const proofOutcomeLabels: Record<LeadProofOutcomeKey, string> = {
  none: 'Sin evidencia posterior',
  reflection: 'Growth Reflection',
  certificate: 'Certificado',
  pitch_deck: 'Pitch deck',
  linkedin_update: 'Actualizacion de LinkedIn',
  resume_bullet: 'Bullet de resume',
  project_note: 'Nota de proyecto',
  portfolio_item: 'Item de portafolio',
}

const audienceLabels: Record<LeadEventAudienceKey, string> = {
  new_member: 'Nuevos miembros',
  active_member: 'Miembros activos',
  chapter_leader: 'Chapter leaders',
  all_students: 'Todos los estudiantes',
  application_required: 'Personas listas para postular',
  open_public: 'Publico abierto',
  chapter_only: 'Solo chapter',
}

const ctaTypeLabels: Record<LeadRecommendationCtaType, string> = {
  register: 'Registrarse',
  apply: 'Postular',
  attend: 'Asistir',
  reflect: 'Reflexionar',
  update_profile: 'Actualizar perfil',
  update_linkedin: 'Actualizar LinkedIn',
  update_resume: 'Actualizar resume',
  capture_proof: 'Capturar evidencia',
}

const okrOptions: Array<TaxonomyOption<LeadOkrKey>> = LEAD_OKR_KEYS.map((value) => ({ value, label: okrLabels[value] }))
const pillarOptions: Array<TaxonomyOption<LeadPillarKey>> = LEAD_PILLAR_KEYS.map((value) => ({ value, label: pillarLabels[value] }))
const focusOptions: Array<TaxonomyOption<PathwayPrimaryFocusKey>> = PATHWAY_PRIMARY_FOCUS_KEYS.map((value) => ({ value, label: focusLabels[value] }))
const growthStageOptions: Array<TaxonomyOption<PathwayGrowthStageKey>> = PATHWAY_GROWTH_STAGE_KEYS.map((value) => ({ value, label: growthStageLabels[value] }))
const studentOutcomeOptions: Array<TaxonomyOption<LeadStudentOutcomeKey>> = LEAD_STUDENT_OUTCOME_KEYS.map((value) => ({ value, label: studentOutcomeLabels[value] }))
const proofOutcomeOptions: Array<TaxonomyOption<LeadProofOutcomeKey>> = LEAD_PROOF_OUTCOME_KEYS.map((value) => ({ value, label: proofOutcomeLabels[value] }))
const audienceOptions: Array<TaxonomyOption<LeadEventAudienceKey>> = LEAD_EVENT_AUDIENCE_KEYS.map((value) => ({ value, label: audienceLabels[value] }))
const ctaTypeOptions: Array<TaxonomyOption<LeadRecommendationCtaType>> = LEAD_RECOMMENDATION_CTA_TYPES.map((value) => ({ value, label: ctaTypeLabels[value] }))

const EMPTY_APPLICATION_QUESTIONS: EventApplicationQuestionRow[] = []

function RequirementBadge({ required, label }: { required: boolean; label?: string }) {
  return (
    <Badge variant={required ? 'default' : 'outline'} size="sm">
      {label ?? (required ? 'Obligatorio' : 'Opcional')}
    </Badge>
  )
}

function FieldLabel({
  htmlFor,
  children,
  required,
  badgeLabel,
  className,
}: {
  htmlFor?: string
  children: React.ReactNode
  required: boolean
  badgeLabel?: string
  className?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={htmlFor} className={className ?? 'text-sm font-semibold tracking-wide text-muted-foreground uppercase'}>
        {children}
      </Label>
      <RequirementBadge required={required} label={badgeLabel} />
    </div>
  )
}

function filterTaxonomyValues<T extends string>(
  values: string[] | null | undefined,
  allowed: readonly T[]
): T[] {
  return (values ?? []).filter((value): value is T => allowed.includes(value as T))
}

function CheckboxOptionGrid<T extends string>({
  idPrefix,
  options,
  values,
  disabled = false,
  onChange,
}: {
  idPrefix: string
  options: Array<TaxonomyOption<T>>
  values: T[]
  disabled?: boolean
  onChange: (values: T[]) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const id = `${idPrefix}-${option.value}`
        const checked = values.includes(option.value)
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
              checked ? 'border-primary bg-primary/5' : 'bg-muted/30 hover:bg-muted/50'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <Checkbox
              id={id}
              checked={checked}
              disabled={disabled}
              onCheckedChange={(nextChecked) => {
                if (nextChecked === true) {
                  onChange([...values, option.value])
                } else {
                  onChange(values.filter((value) => value !== option.value))
                }
              }}
              className="mt-0.5"
            />
            <span className="font-medium leading-snug">{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}

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

function uniqueEvidenceSignals(signals: LeadEvidenceSignalKey[]) {
  return [...new Set(signals)]
}

function deriveEvidenceSignals({
  accessModel,
  ctaType,
  proofOutcome,
}: {
  accessModel: EventAccessModel
  ctaType: LeadRecommendationCtaType | ''
  proofOutcome: LeadProofOutcomeKey | ''
}): LeadEvidenceSignalKey[] {
  const signals: LeadEvidenceSignalKey[] = []

  if (accessModel === 'application' || ctaType === 'apply') {
    signals.push('application_submitted')
  } else if (ctaType === 'attend') {
    signals.push('event_attendance')
  } else if (ctaType === 'register') {
    signals.push('event_registration')
  }

  if (ctaType === 'update_profile') signals.push('profile_updated')
  if (ctaType === 'update_linkedin') signals.push('linkedin_updated')
  if (ctaType === 'update_resume') signals.push('resume_updated')
  if (ctaType === 'reflect') signals.push('reflection_completed')
  if (ctaType === 'capture_proof') signals.push('proof_submitted')

  switch (proofOutcome) {
    case 'reflection':
      signals.push('reflection_completed')
      break
    case 'certificate':
      signals.push('certificate_earned')
      break
    case 'linkedin_update':
      signals.push('linkedin_updated')
      break
    case 'resume_bullet':
      signals.push('resume_updated')
      break
    case 'pitch_deck':
    case 'project_note':
    case 'portfolio_item':
      signals.push('proof_submitted')
      break
  }

  return uniqueEvidenceSignals(signals)
}

function getRecommendationSafety(pathwayEligible: boolean): LeadRecommendationSafetyKey {
  return pathwayEligible ? 'recommend_only_if_event_active' : 'manual_review'
}

export function EventForm({
  mode,
  initial,
  editorChapter,
  canArchiveEvents = false,
  applicationQuestions = EMPTY_APPLICATION_QUESTIONS,
  pathwayMetadata = null,
}: {
  mode: Mode
  initial?: EventRow | null
  editorChapter?: ChapterRow | null
  canArchiveEvents?: boolean
  applicationQuestions?: EventApplicationQuestionRow[]
  pathwayMetadata?: EventPathwayMetadataRow | null
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

  const pathwayDefaults = useMemo(() => ({
    isPathwayEligible: pathwayMetadata?.is_pathway_eligible ?? false,
    primaryOkr: (pathwayMetadata?.primary_okr ?? '') as LeadOkrKey | '',
    okrAlignment: filterTaxonomyValues(pathwayMetadata?.okr_alignment, LEAD_OKR_KEYS),
    pillarKeys: filterTaxonomyValues(pathwayMetadata?.pillar_keys, LEAD_PILLAR_KEYS),
    studentGoal: (pathwayMetadata?.student_goal ?? '') as PathwayPrimaryFocusKey | '',
    growthStageFit: filterTaxonomyValues(pathwayMetadata?.growth_stage_fit, PATHWAY_GROWTH_STAGE_KEYS),
    studentOutcomes: filterTaxonomyValues(pathwayMetadata?.student_outcomes, LEAD_STUDENT_OUTCOME_KEYS),
    proofOutcome: (pathwayMetadata?.proof_outcome ?? '') as LeadProofOutcomeKey | '',
    audience: (pathwayMetadata?.audience ?? '') as LeadEventAudienceKey | '',
    ctaType: (pathwayMetadata?.cta_type ?? '') as LeadRecommendationCtaType | '',
  }), [pathwayMetadata])

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
  const [pathwayEligible, setPathwayEligible] = useState(pathwayDefaults.isPathwayEligible)
  const [pathwayPrimaryOkr, setPathwayPrimaryOkr] = useState<LeadOkrKey | ''>(pathwayDefaults.primaryOkr)
  const [pathwayOkrAlignment, setPathwayOkrAlignment] = useState<LeadOkrKey[]>(pathwayDefaults.okrAlignment)
  const [pathwayPillarKeys, setPathwayPillarKeys] = useState<LeadPillarKey[]>(pathwayDefaults.pillarKeys)
  const [pathwayStudentGoal, setPathwayStudentGoal] = useState<PathwayPrimaryFocusKey | ''>(pathwayDefaults.studentGoal)
  const [pathwayGrowthStageFit, setPathwayGrowthStageFit] = useState<PathwayGrowthStageKey[]>(pathwayDefaults.growthStageFit)
  const [pathwayStudentOutcomes, setPathwayStudentOutcomes] = useState<LeadStudentOutcomeKey[]>(pathwayDefaults.studentOutcomes)
  const [pathwayProofOutcome, setPathwayProofOutcome] = useState<LeadProofOutcomeKey | ''>(pathwayDefaults.proofOutcome)
  const [pathwayAudience, setPathwayAudience] = useState<LeadEventAudienceKey | ''>(pathwayDefaults.audience)
  const [pathwayCtaType, setPathwayCtaType] = useState<LeadRecommendationCtaType | ''>(pathwayDefaults.ctaType)
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
    setPathwayEligible(pathwayDefaults.isPathwayEligible)
    setPathwayPrimaryOkr(pathwayDefaults.primaryOkr)
    setPathwayOkrAlignment(pathwayDefaults.okrAlignment)
    setPathwayPillarKeys(pathwayDefaults.pillarKeys)
    setPathwayStudentGoal(pathwayDefaults.studentGoal)
    setPathwayGrowthStageFit(pathwayDefaults.growthStageFit)
    setPathwayStudentOutcomes(pathwayDefaults.studentOutcomes)
    setPathwayProofOutcome(pathwayDefaults.proofOutcome)
    setPathwayAudience(pathwayDefaults.audience)
    setPathwayCtaType(pathwayDefaults.ctaType)
  }, [initial, applicationQuestions, pathwayDefaults])

  useEffect(() => {
    if (accessModel === 'application' && pathwayEligible && pathwayCtaType && pathwayCtaType !== 'apply') {
      setPathwayCtaType('apply')
    }
  }, [accessModel, pathwayEligible, pathwayCtaType])

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

  const pathwayMetadataPayload = useMemo(() => {
    const evidenceSignals = pathwayEligible
      ? deriveEvidenceSignals({
          accessModel,
          ctaType: pathwayCtaType,
          proofOutcome: pathwayProofOutcome,
        })
      : []

    const hasPathwayMetadata = Boolean(pathwayMetadata) ||
      pathwayEligible ||
      Boolean(pathwayPrimaryOkr) ||
      pathwayOkrAlignment.length > 0 ||
      pathwayPillarKeys.length > 0 ||
      Boolean(pathwayStudentGoal) ||
      pathwayGrowthStageFit.length > 0 ||
      pathwayStudentOutcomes.length > 0 ||
      Boolean(pathwayProofOutcome) ||
      Boolean(pathwayAudience) ||
      Boolean(pathwayCtaType)

    if (!hasPathwayMetadata) return undefined

    return {
      isPathwayEligible: pathwayEligible,
      primaryOkr: pathwayPrimaryOkr || null,
      okrAlignment: pathwayOkrAlignment,
      pillarKeys: pathwayPillarKeys,
      studentGoal: pathwayStudentGoal || null,
      growthStageFit: pathwayGrowthStageFit,
      studentOutcomes: pathwayStudentOutcomes,
      proofOutcome: pathwayProofOutcome || null,
      evidenceSignals,
      audience: pathwayAudience || null,
      ctaType: pathwayCtaType || null,
      coordinationRisk: pathwayMetadata?.coordination_risk ?? 'low',
      recommendationSafety: getRecommendationSafety(pathwayEligible),
      metadataStatus: pathwayEligible ? 'ready' : pathwayMetadata?.metadata_status ?? 'draft',
      notes: pathwayMetadata?.notes ?? null,
    }
  }, [accessModel, pathwayMetadata, pathwayEligible, pathwayPrimaryOkr, pathwayOkrAlignment, pathwayPillarKeys, pathwayStudentGoal, pathwayGrowthStageFit, pathwayStudentOutcomes, pathwayProofOutcome, pathwayAudience, pathwayCtaType])

  const validateFields = (checkMode: 'step' | 'all', currentStep?: number, targetPublished = true) => {
    setFieldErrors({})
    let isValid = true
    const errors: Record<string, string> = {}

    const checkBasics = checkMode === 'all' || currentStep === 1
    const checkLogistics = checkMode === 'all' || currentStep === 2
    const checkAccess = checkMode === 'all' || currentStep === 3
    const checkPathway = checkMode === 'all' || currentStep === 4

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
      if (targetPublished && eventType === 'in_person' && !location?.trim()) {
        errors.location = 'La ubicación es obligatoria para eventos presenciales'
        isValid = false
      }
      if (targetPublished && eventType === 'online' && !meetingUrl?.trim()) {
        errors.meeting_url = 'El enlace de reunión es obligatorio para eventos virtuales'
        isValid = false
      }
      if (targetPublished && eventType === 'hybrid') {
        if (!location?.trim()) { errors.location = 'La ubicación es obligatoria para eventos híbridos'; isValid = false }
        if (!meetingUrl?.trim()) { errors.meeting_url = 'El enlace de reunión es obligatorio para eventos híbridos'; isValid = false }
      }
    }

    if (checkAccess) {
      if (capacity && (isNaN(Number(capacity)) || Number(capacity) <= 0)) {
        errors.capacity = 'La capacidad debe ser un número mayor que 0'
        isValid = false
      }
      if (targetPublished && accessModel === 'application' && !applicationFormUrl?.trim()) {
        const hasQuestions = applicationQuestionsState.some((question) => question.questionText.trim())
        if (!hasQuestions) {
          errors.application_questions = 'Agrega al menos una pregunta de postulación'
          isValid = false
        }
      }

      if (targetPublished && accessModel === 'application') {
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

    if (checkPathway && pathwayEligible) {
      if (!pathwayPrimaryOkr) { errors.pathway_primary_okr = 'Selecciona el OKR principal'; isValid = false }
      if (pathwayPillarKeys.length === 0) { errors.pathway_pillar_keys = 'Selecciona al menos un pilar LEAD'; isValid = false }
      if (!pathwayStudentGoal) { errors.pathway_student_goal = 'Selecciona el objetivo del estudiante'; isValid = false }
      if (pathwayGrowthStageFit.length === 0) { errors.pathway_growth_stage_fit = 'Selecciona al menos una etapa Pathway'; isValid = false }
      if (pathwayStudentOutcomes.length === 0) { errors.pathway_student_outcomes = 'Selecciona al menos un resultado esperado'; isValid = false }
      if (!pathwayProofOutcome) { errors.pathway_proof_outcome = 'Selecciona que puede capturar el estudiante despues'; isValid = false }
      if (!pathwayAudience) { errors.pathway_audience = 'Selecciona para quien es este evento'; isValid = false }
      if (!pathwayCtaType) { errors.pathway_cta_type = 'Selecciona el boton que vera el estudiante'; isValid = false }
      if (accessModel === 'application' && pathwayCtaType && pathwayCtaType !== 'apply') {
        errors.pathway_cta_type = 'Los eventos con postulacion deben usar CTA de postular'
        isValid = false
      }
    }

    if (!isValid) {
      setFieldErrors(errors)
      toast.error(targetPublished ? 'Corrige los campos obligatorios antes de publicar' : 'Corrige los campos mínimos antes de guardar el borrador')
    }
    return isValid
  }

  const handleNext = () => {
    if (validateFields('step', step, false)) {
      setStep(s => Math.min(s + 1, 5))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitEvent(targetPublished: boolean) {
    if (!validateFields('all', undefined, targetPublished)) {
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
        pathwayMetadata: pathwayMetadataPayload,
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
        pathwayMetadata: pathwayMetadataPayload,
      }
      const res = await updateEvent(payload as UpdateEventInput)
      if (!('error' in res)) {
        setLastSavedAt(new Date().toLocaleTimeString('es-PE'))
      }
      setIsAutoSaving(false)
    }, 30000)

    return () => window.clearInterval(interval)
  }, [mode, isPublished, initial, title, description, coverImage, startAt, endAt, location, locationName, locationAddress, locationCity, locationRegion, locationLatitude, locationLongitude, meetingUrl, eventType, capacity, accessModel, applicationFormUrl, applicationQuestionsState, pathwayMetadataPayload])

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
    { num: 2, title: 'Logistica' },
    { num: 3, title: 'Acceso' },
    { num: 4, title: 'Pathway' },
    { num: 5, title: 'Revision' },
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
            <FieldLabel htmlFor="title" required>Título del evento</FieldLabel>
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
            <FieldLabel htmlFor="description" required={false}>Descripción</FieldLabel>
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
        <div className="mb-4">
          <FieldLabel required={false}>Imagen de portada</FieldLabel>
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
          className={`relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border border-dashed transition-all group ${isDraggingCover ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/60'}`}
          onClick={() => !coverImage && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label="Subir imagen de portada del evento"
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
            <FieldLabel htmlFor="startAt" required className="text-sm font-semibold text-muted-foreground">Inicio</FieldLabel>
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
            <FieldLabel htmlFor="endAt" required className="text-sm font-semibold text-muted-foreground">Fin</FieldLabel>
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
            <FieldLabel
              htmlFor="location"
              required={eventType === 'in_person' || eventType === 'hybrid'}
              badgeLabel="Para publicar"
              className="text-sm font-semibold text-muted-foreground"
            >
              Ubicación / dirección
            </FieldLabel>
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
            <FieldLabel
              htmlFor="meetingUrl"
              required={eventType === 'online' || eventType === 'hybrid'}
              badgeLabel="Para publicar"
              className="text-sm font-semibold text-muted-foreground"
            >
              Enlace de reunión
            </FieldLabel>
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
          <div className="mt-6 rounded-lg border bg-muted/30 p-4 md:p-5">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-sm font-semibold">Preguntas de postulación</Label>
                    <RequirementBadge required label="Para publicar" />
                  </div>
                  <div className="text-xs leading-relaxed text-muted-foreground">
                    El borrador se puede guardar incompleto. Para publicar, cada pregunta debe tener texto y las preguntas de selección deben tener opciones.
                  </div>
                </div>
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
                    <div key={question.id ?? index} className="space-y-3 rounded-lg border bg-background p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <GripVertical className="h-4 w-4" />
                          Pregunta {index + 1}
                          <Badge variant={question.isRequired ? 'default' : 'outline'} size="sm">
                            {question.isRequired ? 'Obligatoria' : 'Opcional'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          <label className="inline-flex min-h-7 items-center gap-1.5 rounded-md border bg-muted/20 px-2 text-xs font-medium text-muted-foreground">
                            <Checkbox
                              checked={question.isRequired}
                              onCheckedChange={(checked) => updateApplicationQuestion(index, { isRequired: checked === true })}
                            />
                            Requerir
                          </label>
                          <Button type="button" variant="ghost" size="icon-xs" aria-label="Subir pregunta" onClick={() => moveApplicationQuestion(index, -1)} disabled={index === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-xs" aria-label="Bajar pregunta" onClick={() => moveApplicationQuestion(index, 1)} disabled={index === applicationQuestionsState.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-xs" aria-label="Eliminar pregunta" onClick={() => removeApplicationQuestion(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_14rem]">
                        <Input
                          value={question.questionText}
                          onChange={(event) => updateApplicationQuestion(index, { questionText: event.target.value })}
                          placeholder="Ej. ¿Por qué quieres asistir?"
                          className="bg-muted/40"
                          aria-label={`Texto de pregunta ${index + 1}`}
                        />

                        <div className="min-w-0">
                          <Select
                            value={question.questionType}
                            onValueChange={(value) => updateApplicationQuestion(index, {
                              questionType: value as EventApplicationQuestionType,
                              optionsText: ['single_select', 'checkbox'].includes(value)
                                ? question.optionsText
                                : '',
                            })}
                          >
                            <SelectTrigger className="w-full" aria-label={`Tipo de respuesta para pregunta ${index + 1}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {['single_select', 'checkbox'].includes(question.questionType) ? (
                        <Textarea
                          value={question.optionsText}
                          onChange={(event) => updateApplicationQuestion(index, { optionsText: event.target.value })}
                          placeholder="Opciones, una por línea"
                          className="min-h-20 bg-muted/40"
                          aria-label={`Opciones de pregunta ${index + 1}`}
                        />
                      ) : null}
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
          <div className="mb-2">
            <FieldLabel htmlFor="capacity" required={false} className="text-sm font-semibold text-muted-foreground">
              Cupos disponibles
            </FieldLabel>
          </div>
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

  const renderPathway = () => {
    const pathwayDisabled = !pathwayEligible
    const eventCtaOptions = ctaTypeOptions.filter((option) =>
      ['register', 'apply', 'attend'].includes(option.value)
    )
    const availableCtaOptions = accessModel === 'application'
      ? eventCtaOptions.filter((option) => option.value === 'apply')
      : eventCtaOptions

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xl font-semibold">Recomendar este evento a estudiantes</div>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Pathway ayuda a estudiantes a encontrar su siguiente mejor accion en LEAD. Activalo solo si este evento tiene un beneficio claro para ellos.
                </p>
              </div>
            </div>

            <label className="flex min-w-64 cursor-pointer items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
              <span className="text-sm font-semibold">Permitir recomendacion en Pathway</span>
              <Checkbox
                checked={pathwayEligible}
                onCheckedChange={(checked) => {
                  const enabled = checked === true
                  setPathwayEligible(enabled)
                  if (enabled && accessModel === 'application' && !pathwayCtaType) {
                    setPathwayCtaType('apply')
                  }
                }}
              />
            </label>
          </div>

          {!pathwayEligible ? (
            <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Este evento no aparecera en recomendaciones de Pathway. Puedes guardar o publicar sin completar esta seccion.
            </div>
          ) : null}
        </section>

        <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-semibold">Por que vale la pena recomendarlo</div>
              <div className="text-sm text-muted-foreground">Define el objetivo, etapa y resultado que este evento apoya.</div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel required={pathwayEligible}>OKR principal</FieldLabel>
                <Select
                  value={pathwayPrimaryOkr}
                  disabled={pathwayDisabled}
                  onValueChange={(value) => setPathwayPrimaryOkr(value as LeadOkrKey)}
                >
                  <SelectTrigger
                    aria-label="OKR principal"
                    className={fieldErrors.pathway_primary_okr ? 'border-destructive focus:ring-destructive' : ''}
                  >
                    <SelectValue placeholder="Selecciona OKR" />
                  </SelectTrigger>
                  <SelectContent>
                    {okrOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.pathway_primary_okr && <div className="text-xs text-destructive">{fieldErrors.pathway_primary_okr}</div>}
              </div>

              <div className="space-y-2">
                <FieldLabel required={pathwayEligible}>Objetivo para el estudiante</FieldLabel>
                <Select
                  value={pathwayStudentGoal}
                  disabled={pathwayDisabled}
                  onValueChange={(value) => setPathwayStudentGoal(value as PathwayPrimaryFocusKey)}
                >
                  <SelectTrigger
                    aria-label="Objetivo para el estudiante"
                    className={fieldErrors.pathway_student_goal ? 'border-destructive focus:ring-destructive' : ''}
                  >
                    <SelectValue placeholder="Selecciona objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {focusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.pathway_student_goal && <div className="text-xs text-destructive">{fieldErrors.pathway_student_goal}</div>}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel required={false}>OKRs secundarios</FieldLabel>
              <CheckboxOptionGrid
                idPrefix="pathway-okr"
                options={okrOptions}
                values={pathwayOkrAlignment}
                disabled={pathwayDisabled}
                onChange={setPathwayOkrAlignment}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel required={pathwayEligible}>Pilares LEAD</FieldLabel>
              <CheckboxOptionGrid
                idPrefix="pathway-pillar"
                options={pillarOptions}
                values={pathwayPillarKeys}
                disabled={pathwayDisabled}
                onChange={setPathwayPillarKeys}
              />
              {fieldErrors.pathway_pillar_keys && <div className="text-xs text-destructive">{fieldErrors.pathway_pillar_keys}</div>}
            </div>

            <div className="space-y-2">
              <FieldLabel required={pathwayEligible}>Para que momento del estudiante</FieldLabel>
              <CheckboxOptionGrid
                idPrefix="pathway-stage"
                options={growthStageOptions}
                values={pathwayGrowthStageFit}
                disabled={pathwayDisabled}
                onChange={setPathwayGrowthStageFit}
              />
              {fieldErrors.pathway_growth_stage_fit && <div className="text-xs text-destructive">{fieldErrors.pathway_growth_stage_fit}</div>}
            </div>

            <div className="space-y-2">
              <FieldLabel required={pathwayEligible}>Resultados esperados</FieldLabel>
              <CheckboxOptionGrid
                idPrefix="pathway-outcome"
                options={studentOutcomeOptions}
                values={pathwayStudentOutcomes}
                disabled={pathwayDisabled}
                onChange={setPathwayStudentOutcomes}
              />
              {fieldErrors.pathway_student_outcomes && <div className="text-xs text-destructive">{fieldErrors.pathway_student_outcomes}</div>}
            </div>
          </div>
        </section>

        <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-semibold">Como se recomendara este evento</div>
              <div className="text-sm text-muted-foreground">Define lo que vera el estudiante y que puede capturar despues.</div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel required={pathwayEligible}>Para quien es este evento</FieldLabel>
                <Select
                  value={pathwayAudience}
                  disabled={pathwayDisabled}
                  onValueChange={(value) => setPathwayAudience(value as LeadEventAudienceKey)}
                >
                  <SelectTrigger
                    aria-label="Para quien es este evento"
                    className={fieldErrors.pathway_audience ? 'border-destructive focus:ring-destructive' : ''}
                  >
                    <SelectValue placeholder="Selecciona audiencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.pathway_audience && <div className="text-xs text-destructive">{fieldErrors.pathway_audience}</div>}
              </div>

              <div className="space-y-2">
                <FieldLabel required={pathwayEligible}>Boton que vera el estudiante</FieldLabel>
                <Select
                  value={pathwayCtaType}
                  disabled={pathwayDisabled}
                  onValueChange={(value) => setPathwayCtaType(value as LeadRecommendationCtaType)}
                >
                  <SelectTrigger
                    aria-label="Boton que vera el estudiante"
                    className={fieldErrors.pathway_cta_type ? 'border-destructive focus:ring-destructive' : ''}
                  >
                    <SelectValue placeholder={accessModel === 'application' ? 'Postular' : 'Selecciona accion'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCtaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.pathway_cta_type && <div className="text-xs text-destructive">{fieldErrors.pathway_cta_type}</div>}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel required={pathwayEligible}>Que puede capturar despues</FieldLabel>
              <Select
                value={pathwayProofOutcome}
                disabled={pathwayDisabled}
                onValueChange={(value) => setPathwayProofOutcome(value as LeadProofOutcomeKey)}
              >
                <SelectTrigger
                  aria-label="Que puede capturar despues"
                  className={fieldErrors.pathway_proof_outcome ? 'border-destructive focus:ring-destructive' : ''}
                >
                  <SelectValue placeholder="Selecciona que puede capturar" />
                </SelectTrigger>
                <SelectContent>
                  {proofOutcomeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.pathway_proof_outcome && <div className="text-xs text-destructive">{fieldErrors.pathway_proof_outcome}</div>}
            </div>
          </div>
        </section>
      </div>
    )
  }

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
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Pathway</span>
              <div className="font-medium">
                {pathwayEligible ? (
                  <>
                    {pathwayPrimaryOkr ? okrLabels[pathwayPrimaryOkr] : 'OKR pendiente'}
                    {' · '}
                    {pathwayStudentGoal ? focusLabels[pathwayStudentGoal] : 'Objetivo pendiente'}
                  </>
                ) : (
                  <span className="text-muted-foreground italic">No elegible</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-5 border">
            <div className="font-semibold mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-success" /> Checklist de publicación</div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                {title ? <Check className="w-5 h-5 text-success mt-0.5" /> : <div className="w-5 h-5 rounded-full border-2 mt-0.5" />}
                <div>
                  <div className="text-sm font-medium">Datos básicos completos</div>
                  <div className="text-xs text-muted-foreground">Título definido; la descripción es opcional</div>
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
              <li className="flex items-start gap-3">
                {!pathwayEligible || (
                  pathwayPrimaryOkr &&
                  pathwayPillarKeys.length > 0 &&
                  pathwayStudentGoal &&
                  pathwayGrowthStageFit.length > 0 &&
                  pathwayStudentOutcomes.length > 0 &&
                  pathwayAudience &&
                  pathwayCtaType &&
                  pathwayProofOutcome
                )
                  ? <Check className="w-5 h-5 text-success mt-0.5" />
                  : <div className="w-5 h-5 rounded-full border-2 mt-0.5" />}
                <div>
                  <div className="text-sm font-medium">Recomendacion revisada</div>
                  <div className="text-xs text-muted-foreground">Solo se exige si permites recomendar este evento</div>
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
          {renderPathway()}
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
                variant="secondary"
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
        <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto px-4">
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
          {step === 4 && renderPathway()}
          {step === 5 && renderReview()}

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

            {step < 5 ? (
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
                      <div className="text-sm font-semibold">Recomendacion opcional</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">Activala solo si el evento tiene un beneficio y siguiente paso claros para estudiantes.</div>
                    </li>
                    <li className="space-y-1">
                      <div className="text-sm font-semibold">Postulacion clara</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">Si el evento requiere postulacion, el boton del estudiante debe pedir postular, no prometer cupo.</div>
                    </li>
                  </>
                )}
                {step === 5 && (
                  <>
                    <li className="space-y-1">
                      <div className="text-sm font-semibold">Revision final</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">Confirma fecha, acceso, cupos, preguntas y Pathway antes de publicar.</div>
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
