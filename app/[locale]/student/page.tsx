import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  IdCard,
  Route,
  Sparkles,
  Users,
} from 'lucide-react'
import { MainContainer } from '@/components/global/main-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { requireUser } from '@/lib/auth'
import { updatePathwayRecommendationStatus } from '@/lib/actions/student/pathway-recommendation'
import { PageHeader } from '@/components/ui/page-header'
import {
  StudentDashboardService,
  type StudentActivationDashboard,
  type StudentDashboardChapterOption,
} from '@/lib/services/student-dashboard.service'
import {
  PathwayCheckInService,
  type PathwayDashboardGuidance,
} from '@/lib/services/pathway-check-in.service'
import { PathwayRolloutService } from '@/lib/services/pathway-rollout.service'
import {
  GrowthReflectionService,
  type GrowthReflectionProgress,
} from '@/lib/services/growth-reflection.service'
import { ChapterApplicationCard } from './_components/chapter-application-card'

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
    body: 'El equipo del capitulo puede revisar tu solicitud. Mientras esperas, mantén tu perfil actualizado y registrate a eventos publicos.',
    badgeVariant: 'warning' as const,
    icon: Clock3,
  },
  official_member: {
    badge: 'Miembro oficial',
    title: 'Ya eres miembro oficial de LEAD.',
    body: 'Tu membresia aprobada esta activa. Tu Member ID solo aparece despues de la aprobacion.',
    badgeVariant: 'success' as const,
    icon: CheckCircle2,
  },
  alumni: {
    badge: 'Alumni',
    title: 'Estas registrado como alumni de LEAD.',
    body: 'Tu historial de capitulo se mantiene. Puedes seguir actualizando tu perfil y participar en eventos relevantes.',
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
              {profile?.major_or_interest ?? 'Aun no agregado'}
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
                <p className="font-semibold text-foreground">Member ID</p>
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
          { href: '/student/events', label: 'Ver mis eventos', icon: CalendarDays },
          { href: '/student/profile', label: 'Editar perfil', icon: Edit3 },
        ]
      : [
          { href: '/events', label: 'Explorar eventos', icon: CalendarDays },
          { href: '/student/events', label: 'Mis eventos', icon: IdCard },
          { href: '/student/profile', label: 'Editar perfil', icon: Edit3 },
        ]

  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
  explorer: 'Explorer',
  builder: 'Builder',
  leader: 'Leader',
  candidate: 'Candidate',
  emerging_professional: 'Emerging Professional',
}

const PRIMARY_FOCUS_LABELS: Record<string, string> = {
  career_exploration: 'Career exploration',
  technical_experience: 'Technical experience',
  opportunity_readiness: 'Opportunity readiness',
  community_mentorship: 'Community and mentorship',
  leadership: 'Leadership',
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  learn: 'Learn',
  connect: 'Connect',
  prove: 'Prove',
}

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
          Tus Next Three Moves
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
            <p className="font-semibold text-foreground">Growth stage</p>
            <p className="mt-1 text-muted-foreground">
              {GROWTH_STAGE_LABELS[guidance.row.growth_stage ?? ''] ?? 'En progreso'}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="font-semibold text-foreground">Primary focus</p>
            <p className="mt-1 text-muted-foreground">
              {PRIMARY_FOCUS_LABELS[guidance.row.primary_focus ?? ''] ?? 'Tu siguiente paso'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {guidance.recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="rounded-lg border border-border/70 bg-background p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" size="sm">
                  {RECOMMENDATION_LABELS[recommendation.category] ?? recommendation.category}
                </Badge>
                <h3 className="text-sm font-semibold text-foreground">{recommendation.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.body}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {recommendation.reason}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recommendation.status === 'active' ? (
                  <RecommendationAction
                    recommendationId={recommendation.id}
                    status="started"
                    label="Marcar empezado"
                  />
                ) : null}
                {recommendation.status !== 'completed' ? (
                  <RecommendationAction
                    recommendationId={recommendation.id}
                    status="completed"
                    label="Completar"
                    variant="default"
                  />
                ) : (
                  <Badge variant="success" size="sm">
                    Completado
                  </Badge>
                )}
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
          ))}
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
      label: 'Next moves completados',
      value: completedMoves,
      helper: 'Acciones pequenas que ya convertiste en avance.',
    },
    {
      label: 'Growth Reflections completadas',
      value: reflectionProgress.completedReflections,
      helper: 'Momentos que transformaste en aprendizaje claro.',
    },
    {
      label: 'Proof items creados',
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

export default async function StudentDashboard() {
  const { supabase, user } = await requireUser()
  const dashboard = await StudentDashboardService.getActivationDashboard(supabase, user.id)
  const pathwayFlags = await PathwayRolloutService.getFlagsForChapter(
    supabase,
    dashboard.membership?.chapter_id
  )
  const pathwayGuidance = pathwayFlags.enable_recommendation_card
    ? await PathwayCheckInService.getDashboardGuidanceForUser(supabase, user.id)
    : null
  const reflectionProgress = await GrowthReflectionService.getProgressForUser(supabase, user.id)
  const chapterOptions =
    dashboard.status === 'participant'
      ? await StudentDashboardService.getChapterApplicationOptions(supabase)
      : []
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
    </MainContainer>
  )
}
