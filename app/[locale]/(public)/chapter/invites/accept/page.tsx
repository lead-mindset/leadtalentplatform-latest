import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getChapterInviteAcceptanceState } from '@/lib/actions/chapter/invite-acceptance-data'
import {
  CHAPTER_FUNCTIONAL_AREA_LABELS,
  CHAPTER_ROLE_LEVEL_LABELS,
} from '@/lib/chapter-role-options'
import type { ChapterFunctionalArea } from '@/lib/services/chapter-role-assignment.service'
import { AcceptInviteClient } from './accept-invite-client'
import { InviteGoogleButton } from './invite-google-button'

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}

function formatExpiration(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getReturnPath(token: string) {
  return `/chapter/invites/accept?token=${encodeURIComponent(token)}`
}

function statusCopy(state: 'expired' | 'revoked' | 'accepted') {
  if (state === 'expired') return 'Esta invitación expiró. Pide al equipo que te reenvíe el enlace.'
  if (state === 'revoked') return 'Esta invitación fue cancelada. Si crees que hay un error, escribe al equipo LEAD.'
  return 'Esta invitación ya fue aceptada. ¡Bienvenido/a a bordo!'
}

function badgeLabel(state: string, invite?: { expires_at: string | null }) {
  if (state === 'expired') return 'Expirada'
  if (state === 'revoked') return 'Cancelada'
  if (state === 'accepted') return 'Aceptada'
  if (state === 'pending' && invite?.expires_at) {
    return `Pendiente · expira el ${formatExpiration(invite.expires_at)}`
  }
  return 'Pendiente'
}

function badgeVariant(state: string) {
  if (state === 'expired' || state === 'revoked') return 'destructive' as const
  if (state === 'accepted') return 'default' as const
  return 'outline' as const
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
  const chapterName = acceptance.chapterName
  const returnPath = getReturnPath(token)
  const state = acceptance.state

  return (
    <InviteShell>
      <Card className="overflow-hidden">
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">
                {state === 'signed_out' || state === 'profile_required' || state === 'ready'
                  ? `${invite.display_title} en ${chapterName}`
                  : `Invitación a ${chapterName}`}
              </h1>
              <p className="text-sm text-muted-foreground">
                {state === 'signed_out' && 'Crea tu cuenta o inicia sesión para aceptar la invitación.'}
                {state === 'profile_required' && 'Antes de aceptar, completa tu perfil.'}
                {state === 'ready' && 'Confirma tus datos y activa tu rol al instante.'}
                {state === 'email_mismatch' && 'El correo de tu sesión no coincide con la invitación.'}
                {['expired', 'revoked', 'accepted'].includes(state) && statusCopy(state as 'expired' | 'revoked' | 'accepted')}
              </p>
            </div>
            <Badge variant={badgeVariant(state)} className="shrink-0">
              {badgeLabel(state, invite.expires_at ? { expires_at: invite.expires_at } : undefined)}
            </Badge>
          </div>

          {state === 'signed_out' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">1</span>
                <span className="font-medium text-foreground">Crear cuenta</span>
                <span className="text-muted-foreground/30">→</span>
                <span className="text-muted-foreground/50">Confirmar rol</span>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Correo</p>
                    <p className="font-medium">{invite.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Capítulo</p>
                    <p className="font-medium">{chapterName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rol</p>
                    <p className="font-medium">{invite.display_title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Área</p>
                    <p className="font-medium">
                      {CHAPTER_ROLE_LEVEL_LABELS[invite.role_level as keyof typeof CHAPTER_ROLE_LEVEL_LABELS] ?? invite.role_level}
                      {' / '}
                      {CHAPTER_FUNCTIONAL_AREA_LABELS[invite.functional_area as ChapterFunctionalArea] ?? invite.functional_area}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <InviteGoogleButton returnPath={returnPath} />

                <p className="text-center text-sm text-muted-foreground">
                  o{' '}
                  <Link
                    href={`/auth/sign-up?email=${encodeURIComponent(invite.email)}&next=${encodeURIComponent(returnPath)}`}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    crea una cuenta con correo y contraseña
                  </Link>
                </p>

                <p className="text-center text-xs text-muted-foreground">
                  Tu cuenta se vinculará automáticamente a esta invitación. No necesitas compartir ningún código.
                </p>
              </div>
            </div>
          ) : null}

          {['expired', 'revoked', 'accepted'].includes(state) ? (
            <Alert variant={state === 'accepted' ? 'default' : 'destructive'}>
              {state === 'accepted' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <AlertDescription>{statusCopy(state as 'expired' | 'revoked' | 'accepted')}</AlertDescription>
            </Alert>
          ) : null}

          {state === 'email_mismatch' ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Estás dentro con <strong>{acceptance.signedInEmail}</strong>, pero esta invitación es
                para <strong>{invite.email}</strong>. Entra con ese correo para aceptar.
              </AlertDescription>
            </Alert>
          ) : null}

          {state === 'profile_required' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground">1</span>
                <span className="text-muted-foreground">Crear cuenta</span>
                <span className="text-muted-foreground/30">→</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">2</span>
                <span className="font-medium text-foreground">Completar perfil</span>
                <span className="text-muted-foreground/30">→</span>
                <span className="text-muted-foreground/50">Confirmar rol</span>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-3">
                  <span className="block">Completa tu perfil básico en unos pasos rápidos y vuelve para activar tu rol.</span>
                  <Button asChild size="sm">
                    <Link href={`/onboarding?next=${encodeURIComponent(returnPath)}`}>Ir a mi perfil</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : null}

          {state === 'ready' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground">1</span>
                <span className="text-muted-foreground">Crear cuenta</span>
                <span className="text-muted-foreground/30">→</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground">2</span>
                <span className="text-muted-foreground">Perfil listo</span>
                <span className="text-muted-foreground/30">→</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">3</span>
                <span className="font-medium text-foreground">Confirmar rol</span>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Correo</p>
                    <p className="font-medium">{invite.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Capítulo</p>
                    <p className="font-medium">{chapterName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rol</p>
                    <p className="font-medium">{invite.display_title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Área</p>
                    <p className="font-medium">
                      {CHAPTER_ROLE_LEVEL_LABELS[invite.role_level as keyof typeof CHAPTER_ROLE_LEVEL_LABELS] ?? invite.role_level}
                      {' / '}
                      {CHAPTER_FUNCTIONAL_AREA_LABELS[invite.functional_area as ChapterFunctionalArea] ?? invite.functional_area}
                    </p>
                  </div>
                </div>
              </div>

              <AcceptInviteClient token={token} />
            </div>
          ) : null}

          <p className="text-center text-xs text-muted-foreground">
            ¿Algo no cuadra?{' '}
            <a href="mailto:abriones@leadmindset.org" className="underline underline-offset-2 hover:text-foreground">
              Escríbenos
            </a>
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
