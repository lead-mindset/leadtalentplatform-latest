import { CheckCircle2, LockKeyhole, Route } from 'lucide-react'
import { MainContainer } from '@/components/global/main-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Link } from '@/i18n/routing'
import { submitPathwayCheckIn } from '@/lib/actions/student/pathway-check-in'
import { requireUser } from '@/lib/auth'
import { PathwayCheckInService } from '@/lib/services/pathway-check-in.service'
import { PathwayRolloutService } from '@/lib/services/pathway-rollout.service'
import { StudentDashboardService } from '@/lib/services/student-dashboard.service'

const LOOKING_FOR = [
  {
    value: 'explore_career_paths',
    label: 'Explorar caminos de carrera',
    description: 'Quiero entender que opciones existen en tecnologia, liderazgo o STEM.',
  },
  {
    value: 'build_technical_experience',
    label: 'Construir experiencia tecnica',
    description: 'Quiero practicar, crear proyectos y ganar confianza con habilidades reales.',
  },
  {
    value: 'prepare_for_opportunities',
    label: 'Prepararme para oportunidades',
    description: 'Quiero mejorar mi perfil, entrevistas, resume o postulaciones.',
  },
  {
    value: 'find_community_mentorship',
    label: 'Encontrar comunidad y mentoria',
    description: 'Quiero sentirme acompanado y aprender con personas que me guien.',
  },
  {
    value: 'start_leading',
    label: 'Empezar a liderar',
    description: 'Quiero asumir responsabilidad y crear impacto en mi comunidad.',
  },
]

const CURRENT_BLOCKERS = [
  { value: 'dont_know_where_to_start', label: 'No se por donde empezar' },
  { value: 'dont_know_what_fits', label: 'No se que camino encaja conmigo' },
  { value: 'need_more_experience', label: 'Necesito mas experiencia practica' },
  { value: 'need_career_prep', label: 'Necesito preparacion profesional' },
  { value: 'need_people_to_guide_me', label: 'Necesito personas que me orienten' },
]

const TIME_COMMITMENTS = [
  { value: 'one_hour', label: '1 hora al mes' },
  { value: 'two_to_four_hours', label: '2 a 4 horas al mes' },
  { value: 'five_plus_hours', label: '5+ horas al mes' },
]

function RadioCardGroup({
  name,
  options,
}: {
  name: string
  options: { value: string; label: string; description?: string }[]
}) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer gap-3 rounded-lg border border-border/70 bg-background p-4 transition hover:border-primary/50 hover:bg-muted/30"
        >
          <input required type="radio" name={name} value={option.value} className="mt-1" />
          <span className="space-y-1">
            <span className="block text-sm font-semibold text-foreground">{option.label}</span>
            {option.description ? (
              <span className="block text-sm leading-6 text-muted-foreground">
                {option.description}
              </span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  )
}

function DisabledState() {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Check-In aun no disponible</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Este piloto se esta activando por chapter. Cuando tu chapter lo tenga habilitado,
            podras completar esta ruta en pocos minutos.
          </p>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/student">Volver a Mi LEAD</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CompletedState() {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Tu Check-In esta completo</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Ya tenemos tu punto de partida. En las siguientes fases, esta informacion alimentara
            tus proximos movimientos personalizados en LEAD.
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/student">Volver a Mi LEAD</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CheckInForm() {
  return (
    <form action={submitPathwayCheckIn} className="space-y-5">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">1. Que estas buscando ahora?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioCardGroup name="looking_for" options={LOOKING_FOR} />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">2. Que te esta bloqueando mas?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioCardGroup name="current_blocker" options={CURRENT_BLOCKERS} />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">3. Que tema quieres explorar o fortalecer?</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            required
            name="study_interest"
            maxLength={120}
            placeholder="Ej. inteligencia artificial, data, producto, liderazgo, ciberseguridad..."
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">4. Que tan seguro te sientes con tu proximo paso?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border/70 bg-background p-3 text-sm font-semibold transition hover:border-primary/50 hover:bg-muted/30"
              >
                <input required type="radio" name="confidence_level" value={value} />
                {value}
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Necesito claridad</span>
            <span>Estoy listo/a</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">5. Cuanto tiempo puedes dedicar este mes?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioCardGroup name="monthly_time_commitment" options={TIME_COMMITMENTS} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">
          Esto no es una prueba. Es una forma de ayudarte a encontrar el siguiente paso correcto.
        </p>
        <Button type="submit" className="w-full sm:w-auto">
          Completar Check-In
        </Button>
      </div>
    </form>
  )
}

export default async function PathwayCheckInPage() {
  const { supabase, user } = await requireUser()
  const dashboard = await StudentDashboardService.getActivationDashboard(supabase, user.id)
  const chapterId = dashboard.membership?.chapter_id ?? null
  const flags = await PathwayRolloutService.getFlagsForChapter(supabase, chapterId)
  const checkIn = await PathwayCheckInService.getForUser(supabase, user.id)

  return (
    <MainContainer maxWidth="4xl" className="space-y-6 py-6 pb-24 sm:py-8">
      <PageHeader
        eyebrow="Mi LEAD"
        title="Pathway Check-In"
        description="Cinco preguntas rapidas para entender donde estas y que necesitas de LEAD ahora."
        badge={
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium text-muted-foreground">
            <Route className="h-4 w-4" />
            3 minutos
          </div>
        }
      />

      {!flags.enable_check_in ? (
        <DisabledState />
      ) : checkIn.status === 'completed' ? (
        <CompletedState />
      ) : (
        <CheckInForm />
      )}
    </MainContainer>
  )
}
