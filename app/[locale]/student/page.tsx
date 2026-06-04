import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  IdCard,
  Route,
  Sparkles,
  Users,
} from 'lucide-react'
import { Suspense } from 'react'
import { MainContainer } from '@/components/global/main-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  type PathwayDashboardGuidance,
} from '@/lib/services/pathway-check-in.service'
import {
  type GrowthReflectionProgress,
} from '@/lib/services/growth-reflection.service'
import { ChapterApplicationCard } from './_components/chapter-application-card'
import { getStudentDashboardSecondaryData } from '@/lib/actions/student/dashboard'
import { presentLaunchEventTitle, presentLaunchProfileFocus } from '@/lib/launch-copy'

type ParticipantApplicationCardProps = {
  dashboard: StudentActivationDashboard
  chapterOptions: StudentDashboardChapterOption[]
}

const STATUS_CONTENT = {
  participant: {
    badge: 'Participante',
    title: 'Tu perfil de participante LEAD esta listo.',
    body: 'Ya puedes explorar eventos publicos. Si eres parte de un capitulo o quieres unirte, envia una solicitud para revision.',
    badgeVariant: 'info' as const,
    icon: Users,
  },
  pending: {
    badge: 'En revision',
    title: 'Tu solicitud de capitulo esta en revision.',
    body: 'El equipo del capitulo puede revisar tu solicitud. Mientras esperas, manten tu perfil actualizado y registrate a eventos publicos.',
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
    body: 'Alumni queda fuera del primer lanzamiento activo. Tu perfil se mantiene editable, pero la experiencia Alumni completa se definira despues.',
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

function ProfileReadinessCard({ dashboard }: { dashboard: StudentActivationDashboard }) {
  const profile = dashboard.profile
  const focus = presentLaunchProfileFocus(profile?.major_or_interest)

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Edit3 className="h-5 w-5 text-primary" />
          Estado del perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          {dashboard.hasProfile
            ? 'Tu perfil basico esta listo para registros a eventos y revision de capitulo.'
            : 'Completa tu perfil basico antes de postular a un capitulo o registrarte a eventos.'}
        </p>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="font-semibold text-foreground">Universidad</p>
            <p className="mt-1 text-muted-foreground">{profile?.university ?? 'Aun no agregado'}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="font-semibold text-foreground">Enfoque</p>
            <p className="mt-1 text-muted-foreground">
              {focus ?? 'Aun no agregado'}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/student/profile">Editar perfil</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function MembershipDetailsCard({ dashboard }: { dashboard: StudentActivationDashboard }) {
  const membership = dashboard.membership

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IdCard className="h-5 w-5 text-primary" />
          Estado de capitulo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {membership ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
              <p className="font-semibold text-foreground">
                {membership.chapter?.name ?? membership.chapter_id}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {membership.chapter?.university ?? 'Detalles del capitulo'}
              </p>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                <p className="font-semibold text-foreground">Posicion</p>
                <p className="mt-1 text-muted-foreground">{formatPosition(membership.position)}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                <p className="font-semibold text-foreground">ID de miembro</p>
                <p className="mt-1 text-muted-foreground">
                  {dashboard.status === 'official_member' && membership.member_id
                    ? membership.member_id
                    : 'Disponible despues de la aprobacion'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Aun no tienes una solicitud de capitulo. Al postular, se crea una solicitud pendiente
            para que el equipo la revise.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ParticipantApplicationCard({ dashboard, chapterOptions }: ParticipantApplicationCardProps) {
  if (dashboard.status !== 'participant') return null

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Unirte a un capitulo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Envia una solicitud cuando estes listo. Quedara pendiente hasta que el equipo del capitulo
          la revise.
        </p>
        {dashboard.hasProfile ? (
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
  opportunity_readiness: 'Preparacion para oportunidades',
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
  reflect: 'Capturar reflexion',
  update_profile: 'Actualizar perfil',
  update_linkedin: 'Actualizar perfil',
  update_resume: 'Actualizar CV',
  capture_proof: 'Capturar aprendizaje',
}

const EVIDENCE_SIGNAL_LABELS: Record<string, string> = {
  event_registration: 'registro',
  event_attendance: 'asistencia',
  application_submitted: 'postulacion',
  reflection_completed: 'reflexion',
  proof_submitted: 'evidencia',
  certificate_earned: 'certificado',
  linkedin_updated: 'LinkedIn',
  resume_updated: 'CV',
  profile_updated: 'perfil',
  mission_recap_completed: 'resumen de mision',
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
      label: RECOMMENDATION_CTA_LABELS[recommendation.cta_type ?? 'reflect'] ?? 'Capturar reflexion',
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
    'Registrate al sprint de carrera en IA de LEAD y captura un aprendizaje practico despues.',
  'Matched because your focus is opportunity readiness and the event is ready to recommend.':
    'Aparece porque tu enfoque es preparacion para oportunidades y el evento esta listo para recomendarse.',
  'Refresh your LEAD profile': 'Actualiza tu perfil LEAD',
  'Make sure your profile reflects your current interests before new opportunities appear.':
    'Asegura que tu perfil refleje tus intereses actuales antes de que aparezcan nuevas oportunidades.',
  'Profile clarity helps Pathway recommend better next steps.':
    'Un perfil claro ayuda a Pathway a recomendar mejores siguientes pasos.',
  'Capture one learning proof': 'Captura una evidencia de aprendizaje',
  'Turn a recent LEAD experience into a private Growth Reflection.':
    'Convierte una experiencia LEAD reciente en una reflexion privada de crecimiento.',
  'A small proof artifact makes progress concrete.':
    'Una pequena evidencia hace que tu avance sea concreto.',
  'opportunity readiness': 'preparacion para oportunidades',
  'professional readiness': 'preparacion profesional',
  'OKR Elevate Student outcome: professional readiness': 'OKR Elevate. Resultado del estudiante: preparacion profesional',
  'Student outcome: professional readiness': 'Resultado del estudiante: preparacion profesional',
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
            Tus proximos pasos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Completa un Check-In de 3 minutos para recibir tres movimientos claros: que aprender,
            con quien conectar y que pequena prueba construir.
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
          Tus proximos tres movimientos
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

function PersonalProgressCard({
  pathwayGuidance,
  reflectionProgress,
}: {
  pathwayGuidance: PathwayDashboardGuidance | null
  reflectionProgress: GrowthReflectionProgress
}) {
  const completedMoves =
    pathwayGuidance && pathwayGuidance.status === 'completed' ? pathwayGuidance.progress.completed : 0

  const metrics = [
    {
      label: 'Movimientos completados',
      value: completedMoves,
      helper: 'Acciones pequenas que ya convertiste en avance.',
    },
    {
      label: 'Reflexiones completadas',
      value: reflectionProgress.completedReflections,
      helper: 'Momentos que transformaste en aprendizaje claro.',
    },
    {
      label: 'Evidencias creadas',
      value: reflectionProgress.proofItemsCreated,
      helper: 'Evidencia personal que puedes convertir en historias, perfil o entrevistas.',
    },
  ]

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Tu progreso personal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Sin rankings ni comparaciones. Solo senales de lo que ya estas construyendo.
        </p>
        <div className="grid gap-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-border/70 bg-muted/25 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{metric.label}</p>
                <span className="text-2xl font-semibold tabular-nums text-primary">
                  {metric.value}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{metric.helper}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StudentDashboardDetailsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
      </div>
      <div className="space-y-6">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="h-5 w-44 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-32 rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function StudentDashboardDetails({
  userId,
  dashboard,
}: {
  userId: string
  dashboard: StudentActivationDashboard
}) {
  const {
    pathwayFlags,
    pathwayGuidance,
    reflectionProgress,
    chapterOptions,
  } = await getStudentDashboardSecondaryData({
    userId,
    chapterId: dashboard.membership?.chapter_id ?? null,
    status: dashboard.status,
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        {pathwayFlags.enable_recommendation_card ? (
          <PathwayGuidanceCard guidance={pathwayGuidance} />
        ) : null}
        <ParticipantApplicationCard dashboard={dashboard} chapterOptions={chapterOptions} />
        <ProfileReadinessCard dashboard={dashboard} />
      </div>
      <div className="space-y-6">
        <PersonalProgressCard
          pathwayGuidance={pathwayGuidance}
          reflectionProgress={reflectionProgress}
        />
        <MembershipDetailsCard dashboard={dashboard} />
      </div>
    </div>
  )
}

export default async function StudentDashboard() {
  const { supabase, user } = await requireUser()
  const dashboard = await StudentDashboardService.getActivationDashboard(supabase, user.id)
  const content = STATUS_CONTENT[dashboard.status]
  const StatusIcon = content.icon

  return (
    <MainContainer maxWidth="7xl" className="space-y-6 py-6 pb-24 sm:py-8">
      <PageHeader
        eyebrow="Mi LEAD"
        title={`Bienvenido${user.name ? `, ${user.name}` : ''}`}
        badge={
          <Badge variant={content.badgeVariant} size="lg">
            {content.badge}
          </Badge>
        }
        description={content.body}
      />

      <PrimaryActions dashboard={dashboard} />

      <Card className="rounded-lg">
        <CardContent className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <StatusIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{content.title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {dashboard.membership?.chapter?.name
                ? `${dashboard.membership.chapter.name} - ${dashboard.membership.chapter.university}`
                : 'Tu actividad de eventos y capitulos aparecera aqui cuando uses la plataforma.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<StudentDashboardDetailsSkeleton />}>
        <StudentDashboardDetails userId={user.id} dashboard={dashboard} />
      </Suspense>
    </MainContainer>
  )
}
