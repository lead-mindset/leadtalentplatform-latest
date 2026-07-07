import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  IdCard,
  Instagram,
  Linkedin,
  Route,
  Sparkles,
  Users,
} from 'lucide-react'
import { Suspense } from 'react'
import { MainContainer } from '@/components/global/main-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Link } from '@/i18n/routing'
import { requireUser } from '@/lib/auth'
import {
  startPathwayRecommendation,
  updatePathwayRecommendationStatus,
} from '@/lib/actions/student/pathway-recommendation'
import { PageHeader } from '@/components/ui/page-header'
import {
  StudentDashboardService,
  type StudentActivationDashboard,
  type StudentDashboardChapterOption,
} from '@/lib/services/student-dashboard.service'
import type { ChapterActivationInterestRow } from '@/lib/types'
import type { PathwayDashboardGuidance } from '@/lib/services/pathway-check-in.service'
import { ChapterApplicationCard } from './_components/chapter-application-card'
import { ChapterActivationInterestCard } from './_components/chapter-activation-interest-card'
import { getStudentDashboardSecondaryData } from '@/lib/actions/student/dashboard'

import { ChapterActivationInterestService } from '@/lib/services/chapter-activation-interest.service'
import { presentLaunchEventTitle } from '@/lib/launch-copy'

type ParticipantApplicationCardProps = {
  dashboard: StudentActivationDashboard
  chapterOptions: StudentDashboardChapterOption[]
  chapterOptionsLoadState?: 'ready' | 'unavailable'
  chapterOptionsError?: string
}

const STATUS_CONTENT = {
  participant: {
    badge: 'Participante',
    title: 'Tu perfil de participante LEAD esta listo.',
    body: 'Ya puedes explorar eventos públicos. Si eres parte de un capítulo o quieres unirte, envía una solicitud para revisión.',
    badgeVariant: 'info' as const,
    icon: Users,
  },
  pending: {
    badge: 'En revisión',
    title: 'Tu solicitud de capítulo está en revisión.',
    body: 'El equipo del capítulo puede revisar tu solicitud. Mientras esperas, mantén tu perfil actualizado y regístrate a eventos públicos.',
    badgeVariant: 'warning' as const,
    icon: Clock3,
  },
  official_member: {
    badge: 'Miembro oficial',
    title: 'Ya eres miembro oficial de LEAD.',
    body: 'Tu membresia aprobada esta activa. Usa este espacio para mantener tu perfil listo, explorar eventos y revisar tu actividad.',
    badgeVariant: 'success' as const,
    icon: CheckCircle2,
  },
  alumni: {
    badge: 'Alumni',
    title: 'Tu estado Alumni esta registrado.',
    body: 'Alumni queda fuera del primer lanzamiento activo. Tu perfil se mantiene editable, pero la experiencia Alumni completa se definirá después.',
    badgeVariant: 'secondary' as const,
    icon: IdCard,
  },
}

function formatPosition(position: string | null) {
  if (!position) return 'Miembro'
  const labels: Record<string, string> = {
    member: 'Miembro',
    president: 'Presidente',
    vice_president: 'Vicepresidente',
    secretary: 'Secretaria',
    treasurer: 'Tesorero',
    events_lead: 'Lider de eventos',
    marketing_lead: 'Lider de marketing',
    editor: 'Editor',
    alumni: 'Alumni',
  }
  return labels[position] ?? position.split('_').join(' ')
}

function ChapterBadge({ dashboard }: { dashboard: StudentActivationDashboard }) {
  const membership = dashboard.membership

  if (!membership) return null

  const position = formatPosition(membership.position)
  const isDefaultPosition = !membership.position || membership.position === 'member'

  const sentence =
    dashboard.status === 'official_member'
      ? isDefaultPosition
        ? `Miembro de ${membership.chapter?.name ?? membership.chapter_id}`
        : `Miembro de ${membership.chapter?.name ?? membership.chapter_id} — ${position}`
      : dashboard.status === 'pending'
        ? `Solicitud enviada a ${membership.chapter?.name ?? membership.chapter_id} — en revisión`
        : null

  if (!sentence) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
      <IdCard className="h-4 w-4 shrink-0 text-primary" />
      <span>{sentence}</span>
    </div>
  )
}

function ParticipantApplicationCard({
  dashboard,
  chapterOptions,
  chapterOptionsLoadState = 'ready',
  chapterOptionsError,
}: ParticipantApplicationCardProps) {
  if (dashboard.status !== 'participant') return null

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Unirte a un capítulo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dashboard.loadState === 'unavailable' ? (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No pudimos confirmar todos tus datos</AlertTitle>
            <AlertDescription>
              Estamos mostrando una vista limitada mientras se recupera la información. Vuelve a intentarlo en unos minutos.
            </AlertDescription>
          </Alert>
        ) : null}
        <p className="text-sm leading-6 text-muted-foreground">
          Envía una solicitud cuando estés listo. Quedará pendiente hasta que el equipo del capítulo
          la revise.
        </p>
        {chapterOptionsLoadState === 'unavailable' ? (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No pudimos cargar los capítulos</AlertTitle>
            <AlertDescription>
              {chapterOptionsError ?? 'Intenta nuevamente en unos minutos antes de enviar una solicitud.'}
            </AlertDescription>
          </Alert>
        ) : dashboard.hasProfile ? (
          <ChapterApplicationCard chapters={chapterOptions} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-warning">
              Termina tu perfil primero para que el equipo tenga los datos basicos.
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/student/profile">Completar perfil</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PrimaryActions({ dashboard }: { dashboard: StudentActivationDashboard }) {
  const actions =
    dashboard.status === 'official_member'
      ? [
          { href: '/events', label: 'Explorar eventos', icon: CalendarDays },
          { href: '/student/events', label: 'Mis eventos', icon: IdCard },
          { href: '/student/resume', label: 'Mi CV', icon: FileText },
          { href: '/student/profile', label: 'Editar perfil', icon: Edit3 },
        ]
      : [
          { href: '/events', label: 'Explorar eventos', icon: CalendarDays },
          { href: '/student/events', label: 'Mis eventos', icon: IdCard },
          { href: '/student/profile', label: 'Editar perfil', icon: Edit3 },
        ]

  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Button
            key={action.href}
            asChild
            variant={action.href === '/events' ? 'default' : 'outline'}
            className="h-auto min-h-11 w-full min-w-0 justify-between rounded-lg px-4 py-2.5"
          >
            <Link href={action.href} className="min-w-0">
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{action.label}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </Button>
        )
      })}
    </div>
  )
}

const GROWTH_STAGE_LABELS: Record<string, string> = {
  explorer: 'Explorador',
  builder: 'Constructor',
  leader: 'Lider',
  candidate: 'Candidato',
  emerging_professional: 'Profesional emergente',
}

const PRIMARY_FOCUS_LABELS: Record<string, string> = {
  career_exploration: 'Exploracion profesional',
  technical_experience: 'Experiencia tecnica',
  opportunity_readiness: 'Preparación para oportunidades',
  community_mentorship: 'Comunidad y mentoria',
  leadership: 'Liderazgo',
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  learn: 'Aprender',
  connect: 'Conectar',
  prove: 'Demostrar',
}

const RECOMMENDATION_CTA_LABELS: Record<string, string> = {
  register: 'Registrarme al evento',
  apply: 'Postular al evento',
  attend: 'Ver evento',
  reflect: 'Capturar reflexión',
  update_profile: 'Actualizar perfil',
  update_linkedin: 'Actualizar perfil',
  update_resume: 'Actualizar CV',
  capture_proof: 'Capturar aprendizaje',
}

const EVIDENCE_SIGNAL_LABELS: Record<string, string> = {
  event_registration: 'registro',
  event_attendance: 'asistencia',
  application_submitted: 'postulación',
  reflection_completed: 'reflexión',
  proof_submitted: 'evidencia',
  certificate_earned: 'certificado',
  linkedin_updated: 'LinkedIn',
  resume_updated: 'CV',
  profile_updated: 'perfil',
  mission_recap_completed: 'resumen de misión',
}

type DashboardRecommendation = PathwayDashboardGuidance['recommendations'][number]

function RecommendationAction({
  recommendationId,
  status,
  label,
  variant = 'outline',
}: {
  recommendationId: string
  status: 'started' | 'completed' | 'dismissed'
  label: string
  variant?: 'default' | 'outline' | 'ghost'
}) {
  return (
    <form action={updatePathwayRecommendationStatus}>
      <input type="hidden" name="recommendation_id" value={recommendationId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  )
}

function StartRecommendationAction({
  recommendationId,
  targetPath,
  label,
  variant = 'default',
}: {
  recommendationId: string
  targetPath: string
  label: string
  variant?: 'default' | 'outline' | 'ghost'
}) {
  return (
    <form action={startPathwayRecommendation}>
      <input type="hidden" name="recommendation_id" value={recommendationId} />
      <input type="hidden" name="target_path" value={targetPath} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </form>
  )
}

function getReflectionTarget(recommendation: DashboardRecommendation) {
  const params = new URLSearchParams({
    recommendationId: recommendation.id,
    recommendationTitle: presentRecommendationCopy(recommendation.title),
  })

  if (recommendation.source_event_id) {
    params.set('eventId', recommendation.source_event_id)
    params.set('eventTitle', presentLaunchEventTitle(recommendation.title))
  }

  return `/student/growth-reflection?${params.toString()}`
}

function getPrimaryRecommendationCta(recommendation: DashboardRecommendation) {
  if (recommendation.source_event_id) {
    const ctaType = recommendation.cta_type ?? 'attend'
    return {
      targetPath: `/events/${recommendation.source_event_id}`,
      label: RECOMMENDATION_CTA_LABELS[ctaType] ?? 'Ver evento',
    }
  }

  if (recommendation.cta_type === 'update_resume') {
    return { targetPath: '/student/resume', label: 'Actualizar CV' }
  }

  if (
    recommendation.source_type === 'profile_action' ||
    recommendation.cta_type === 'update_profile' ||
    recommendation.cta_type === 'update_linkedin'
  ) {
    return { targetPath: '/student/profile', label: 'Actualizar perfil' }
  }

  if (
    recommendation.source_type === 'proof_action' ||
    recommendation.cta_type === 'reflect' ||
    recommendation.cta_type === 'capture_proof'
  ) {
    return {
      targetPath: getReflectionTarget(recommendation),
      label: RECOMMENDATION_CTA_LABELS[recommendation.cta_type ?? 'reflect'] ?? 'Capturar reflexión',
    }
  }

  return null
}

function getMatchedReasons(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((reason): reason is string => typeof reason === 'string' && reason.trim().length > 0).slice(0, 3)
}

const RECOMMENDATION_COPY_LABELS: Record<string, string> = {
  'QA Pathway Event: AI Career Sprint': 'Evento QA Pathway: Sprint de carrera en IA',
  'Register for the LEAD AI Career Sprint and capture one practical learning afterward.':
    'Regístrate al sprint de carrera en IA de LEAD y captura un aprendizaje práctico después.',
  'Matched because your focus is opportunity readiness and the event is ready to recommend.':
    'Aparece porque tu enfoque es preparación para oportunidades y el evento está listo para recomendarse.',
  'Refresh your LEAD profile': 'Actualiza tu perfil LEAD',
  'Make sure your profile reflects your current interests before new opportunities appear.':
    'Asegura que tu perfil refleje tus intereses actuales antes de que aparezcan nuevas oportunidades.',
  'Profile clarity helps Pathway recommend better next steps.':
    'Un perfil claro ayuda a Pathway a recomendar mejores siguientes pasos.',
  'Capture one learning proof': 'Captura una evidencia de aprendizaje',
  'Turn a recent LEAD experience into a private Growth Reflection.':
    'Convierte una experiencia LEAD reciente en una reflexión privada de crecimiento.',
  'A small proof artifact makes progress concrete.':
    'Una pequeña evidencia hace que tu avance sea concreto.',
  'opportunity readiness': 'preparación para oportunidades',
  'professional readiness': 'preparación profesional',
  'OKR Elevate Student outcome: professional readiness': 'OKR Elevate. Resultado del estudiante: preparación profesional',
  'Student outcome: professional readiness': 'Resultado del estudiante: preparación profesional',
  'Profile readiness': 'Perfil listo',
  'Proof loop': 'Ciclo de evidencia',
}

function presentRecommendationCopy(value: string) {
  return RECOMMENDATION_COPY_LABELS[value] ?? value
}

function PathwayGuidanceCard({ guidance }: { guidance: PathwayDashboardGuidance | null }) {
  if (!guidance || guidance.status !== 'completed' || !guidance.row) {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5 text-primary" />
            Tus próximos pasos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Completa un Check-In de 3 minutos para recibir tres movimientos claros: qué aprender,
            con quién conectar y qué pequeña prueba construir.
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/student/pathway-check-in">Empezar Check-In</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Tus próximos tres movimientos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {guidance.progress.completed} de {guidance.progress.actionable}
          </span>{' '}
          movimientos completados. Avanza a tu ritmo; esto es guia, no una calificacion.
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="font-semibold text-foreground">Etapa de crecimiento</p>
            <p className="mt-1 text-muted-foreground">
              {GROWTH_STAGE_LABELS[guidance.row.growth_stage ?? ''] ?? 'En progreso'}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="font-semibold text-foreground">Enfoque principal</p>
            <p className="mt-1 text-muted-foreground">
              {PRIMARY_FOCUS_LABELS[guidance.row.primary_focus ?? ''] ?? 'Tu siguiente paso'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {guidance.recommendations.map((recommendation) => {
            const primaryCta = getPrimaryRecommendationCta(recommendation)
            const reflectionTarget = getReflectionTarget(recommendation)
            const matchedReasons = getMatchedReasons(recommendation.matched_reasons)
            const showReflectionCta =
              recommendation.status !== 'completed' &&
              primaryCta?.targetPath !== reflectionTarget

            return (
              <div
                key={recommendation.id}
                className="rounded-lg border border-border/70 bg-background p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" size="sm">
                    {RECOMMENDATION_LABELS[recommendation.category] ?? recommendation.category}
                  </Badge>
                  {recommendation.source_event_id ? (
                    <Badge variant="outline" size="sm">Evento LEAD</Badge>
                  ) : null}
                  {recommendation.cta_type ? (
                    <Badge variant="outline" size="sm">
                      {RECOMMENDATION_CTA_LABELS[recommendation.cta_type] ?? recommendation.cta_type}
                    </Badge>
                  ) : null}
                  {recommendation.status === 'started' ? (
                    <Badge variant="warning" size="sm">En progreso</Badge>
                  ) : null}
                  {recommendation.status === 'completed' ? (
                    <Badge variant="success" size="sm">Completado</Badge>
                  ) : null}
                </div>

                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  {presentRecommendationCopy(recommendation.title)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {presentRecommendationCopy(recommendation.body)}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {presentRecommendationCopy(recommendation.reason)}
                </p>

                {matchedReasons.length > 0 || recommendation.evidence_signal ? (
                  <div className="mt-3 rounded-lg border border-border/70 bg-muted/25 p-3 text-xs leading-5 text-muted-foreground">
                    {matchedReasons.length > 0 ? (
                      <p>
                        <span className="font-semibold text-foreground">Por que aparece: </span>
                        {matchedReasons.map(presentRecommendationCopy).join(' ')}
                      </p>
                    ) : null}
                    {recommendation.evidence_signal ? (
                      <p className={matchedReasons.length > 0 ? 'mt-1' : ''}>
                        <span className="font-semibold text-foreground">Evidencia: </span>
                        {EVIDENCE_SIGNAL_LABELS[recommendation.evidence_signal] ?? recommendation.evidence_signal}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {recommendation.status !== 'completed' && primaryCta ? (
                    <StartRecommendationAction
                      recommendationId={recommendation.id}
                      targetPath={primaryCta.targetPath}
                      label={primaryCta.label}
                    />
                  ) : null}
                  {showReflectionCta ? (
                    <StartRecommendationAction
                      recommendationId={recommendation.id}
                      targetPath={reflectionTarget}
                      label="Capturar aprendizaje"
                      variant={primaryCta ? 'outline' : 'default'}
                    />
                  ) : null}
                  {recommendation.status !== 'completed' ? (
                    <RecommendationAction
                      recommendationId={recommendation.id}
                      status="dismissed"
                      label="No aplica"
                      variant="ghost"
                    />
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

const STEPPER_STEPS = ['Participante', 'En revisión', 'Miembro oficial'] as const

const STEPPER_INDEX: Record<string, number> = {
  participant: 0,
  pending: 1,
  official_member: 2,
}

function MembershipStepper({ status }: { status: StudentActivationDashboard['status'] }) {
  if (status === 'alumni' || status === 'official_member') return null

  const currentIndex = STEPPER_INDEX[status] ?? -1

  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {STEPPER_STEPS.map((label, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === STEPPER_STEPS.length - 1

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'border-2 border-primary text-primary ring-4 ring-primary/15'
                      : 'border-2 border-muted-foreground/30 text-muted-foreground/50'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`mt-1.5 text-xs whitespace-nowrap ${
                  isCurrent
                    ? 'font-semibold text-primary'
                    : isCompleted
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/50'
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast ? (
              <div
                className={`mx-2 h-px w-12 sm:w-20 ${
                  index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function StatusCallout({ status }: { status: StudentActivationDashboard['status'] }) {
  if (status === 'official_member') return null

  const config =
    status === 'participant'
      ? {
          title: 'Completa tu perfil y postula a un capítulo para empezar',
          action: { href: '/student/profile', label: 'Ir a mi perfil' },
        }
      : status === 'pending'
        ? {
            title: 'Tu solicitud está en revisión. No necesitas hacer nada — te avisaremos cuando el equipo responda.',
          }
        : {
            title: 'Tu perfil Alumni está activo. Tienes acceso a eventos y networking de la comunidad.',
          }

  return (
    <Card className="rounded-lg">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <p className="text-sm text-muted-foreground">{config.title}</p>
        {'action' in config ? (
          <Button asChild size="sm">
            <Link href={config.action.href}>
              {config.action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function StudentDashboardDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="h-5 w-48 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </CardContent>
      </Card>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="h-5 w-40 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-20 rounded bg-muted" />
        </CardContent>
      </Card>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="h-5 w-44 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-32 rounded bg-muted" />
        </CardContent>
      </Card>
    </div>
  )
}

async function StudentDashboardDetails({
  userId,
  dashboard,
  latestActivationInterest,
}: {
  userId: string
  dashboard: StudentActivationDashboard
  latestActivationInterest: Pick<
    ChapterActivationInterestRow,
    'id' | 'status' | 'university_name' | 'created_at'
  > | null
}) {
  const {
    pathwayFlags,
    pathwayGuidance,
    chapterOptions,
    chapterOptionsLoadState,
    chapterOptionsError,
  } = await getStudentDashboardSecondaryData({
    userId,
    chapterId: dashboard.membership?.chapter_id ?? null,
    status: dashboard.status,
  })
  return (
    <div className="space-y-6">
      <StatusCallout status={dashboard.status} />
      {pathwayFlags.enable_recommendation_card ? (
        <PathwayGuidanceCard guidance={pathwayGuidance} />
      ) : null}
      {dashboard.status === 'participant' ? (
        <ChapterActivationInterestCard latestInterest={latestActivationInterest} />
      ) : null}
      <ParticipantApplicationCard
        dashboard={dashboard}
        chapterOptions={chapterOptions}
        chapterOptionsLoadState={chapterOptionsLoadState}
        chapterOptionsError={chapterOptionsError}
      />
    </div>
  )
}

export default async function StudentDashboard() {
  const { supabase, user } = await requireUser()
  const dashboard = await StudentDashboardService.getActivationDashboard(supabase, user.id)
  const latestActivationInterest = await ChapterActivationInterestService.getLatestForUser(
    supabase,
    user.id
  )
  const content = STATUS_CONTENT[dashboard.status]

  const showStepper = dashboard.status === 'participant' || dashboard.status === 'pending'
  const showBadge = dashboard.status === 'alumni'

  return (
    <MainContainer maxWidth="7xl" className="space-y-6 py-6 pb-24 sm:py-8">
      <PageHeader
        title={`Bienvenido${user.name ? `, ${user.name}` : ''}`}
        badge={
          showBadge
            ? (
              <Badge variant={content.badgeVariant} size="lg">
                {content.badge}
              </Badge>
            )
            : undefined
        }
        description={
          dashboard.status === 'official_member' && dashboard.membership?.chapter?.university
            ? dashboard.membership.chapter.university
            : undefined
        }
      />

      {showStepper ? <MembershipStepper status={dashboard.status} /> : null}

      <ChapterBadge dashboard={dashboard} />

      {dashboard.loadState === 'unavailable' ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información temporalmente incompleta</AlertTitle>
          <AlertDescription>
            No pudimos confirmar todos tus datos de perfil o membresía. Algunas secciones pueden verse limitadas hasta que la carga se recupere.
          </AlertDescription>
        </Alert>
      ) : null}

      <PrimaryActions dashboard={dashboard} />

      <Suspense fallback={<StudentDashboardDetailsSkeleton />}>
        <StudentDashboardDetails
          userId={user.id}
          dashboard={dashboard}
          latestActivationInterest={latestActivationInterest}
        />
      </Suspense>

      <Card className="rounded-lg">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Sigue a LEAD</p>
            <p className="text-xs text-muted-foreground">
            Entérate de eventos, convocatorias y novedades de la comunidad.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.instagram.com/lead_americas/" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" />
                Instagram
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.linkedin.com/company/leadmindsetorg/posts/?feedView=all" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" />
                LinkedIn
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainContainer>
  )
}
