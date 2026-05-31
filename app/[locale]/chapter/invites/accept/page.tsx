import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { AlertCircle, CheckCircle2, Clock, LogIn, UserPlus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getChapterInviteAcceptanceState } from '@/lib/actions/chapter/invite-acceptance-data'
import {
  CHAPTER_FUNCTIONAL_AREA_LABELS,
  CHAPTER_ROLE_LEVEL_LABELS,
} from '@/lib/chapter-role-options'
import type { ChapterFunctionalArea } from '@/lib/services/chapter-role-assignment.service'
import { AcceptInviteClient } from './accept-invite-client'

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}

function getReturnPath(token: string) {
  return `/chapter/invites/accept?token=${encodeURIComponent(token)}`
}

function statusCopy(state: 'expired' | 'revoked' | 'accepted') {
  if (state === 'expired') return 'Esta invitacion expiro. Pide que te reenvien el enlace.'
  if (state === 'revoked') return 'Esta invitacion fue cancelada. Contacta al equipo si crees que fue un error.'
  return 'Esta invitacion ya fue aceptada.'
}

export default async function ChapterInviteAcceptPage({ params, searchParams }: PageProps) {
  await params
  const { token = '' } = await searchParams

  if (!token) redirect('/auth/login')

  const acceptance = await getChapterInviteAcceptanceState(token)

  if (acceptance.state === 'invalid') {
    return (
      <InviteShell>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{acceptance.error}</AlertDescription>
        </Alert>
      </InviteShell>
    )
  }

  const invite = acceptance.invite
  const returnPath = getReturnPath(token)

  return (
    <InviteShell>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Invitacion de chapter</CardTitle>
            <Badge variant="outline">{acceptance.state === 'expired' ? 'Expirada' : invite.status}</Badge>
          </div>
          <CardDescription>
            Revisa el chapter, rol y correo antes de aceptar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Correo invitado</p>
                <p className="font-medium">{invite.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Chapter</p>
                <p className="font-medium">{invite.chapter_id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rol</p>
                <p className="font-medium">{invite.display_title}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {CHAPTER_ROLE_LEVEL_LABELS[invite.role_level as keyof typeof CHAPTER_ROLE_LEVEL_LABELS] ?? invite.role_level}
                  {' / '}
                  {CHAPTER_FUNCTIONAL_AREA_LABELS[invite.functional_area as ChapterFunctionalArea] ?? invite.functional_area}
                </p>
              </div>
            </div>
          </div>

          {['expired', 'revoked', 'accepted'].includes(acceptance.state) ? (
            <Alert>
              {acceptance.state === 'accepted' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <AlertDescription>{statusCopy(acceptance.state as 'expired' | 'revoked' | 'accepted')}</AlertDescription>
            </Alert>
          ) : null}

          {acceptance.state === 'signed_out' ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href={`/auth/login?next=${encodeURIComponent(returnPath)}`}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesion
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/auth/sign-up?next=${encodeURIComponent(returnPath)}`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear cuenta
                </Link>
              </Button>
            </div>
          ) : null}

          {acceptance.state === 'email_mismatch' ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Iniciaste sesion como {acceptance.signedInEmail}. Esta invitacion debe aceptarse con {invite.email}.
              </AlertDescription>
            </Alert>
          ) : null}

          {acceptance.state === 'profile_required' ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <span className="block">Completa tu perfil basico antes de aceptar esta invitacion.</span>
                <Button asChild size="sm">
                  <Link href={`/onboarding?next=${encodeURIComponent(returnPath)}`}>Completar onboarding</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {acceptance.state === 'ready' ? (
            <AcceptInviteClient token={token} />
          ) : null}

          <p className="text-xs text-muted-foreground">
            Si el correo, chapter o rol no se ve correcto, contacta a abriones@leadmindset.org antes de aceptar.
          </p>
        </CardContent>
      </Card>
    </InviteShell>
  )
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {children}
      </div>
    </main>
  )
}
