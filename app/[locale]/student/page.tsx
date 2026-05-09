import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Edit3, IdCard, Users } from 'lucide-react'
import { MainContainer } from '@/components/global/main-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { requireUser } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import {
  StudentDashboardService,
  type StudentActivationDashboard,
  type StudentDashboardChapterOption,
} from '@/lib/services/student-dashboard.service'
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

export default async function StudentDashboard() {
  const { supabase, user } = await requireUser()
  const dashboard = await StudentDashboardService.getActivationDashboard(supabase, user.id)
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
          <ParticipantApplicationCard dashboard={dashboard} chapterOptions={chapterOptions} />
          <ProfileReadinessCard dashboard={dashboard} />
        </div>
        <MembershipDetailsCard dashboard={dashboard} />
      </div>
    </MainContainer>
  )
}
