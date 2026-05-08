import type { ReactNode } from 'react'
import { AlertCircle, ArrowRight, Building2, HelpCircle, Mail, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { validateInviteToken } from '@/lib/actions/company/handle-invite'

type OnboardPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    inviteToken?: string
    access?: 'missing' | 'inactive' | 'revoked' | 'expired' | 'error'
  }>
}

const ACCESS_COPY = {
  en: {
    missing: {
      title: 'Company Access Needed',
      detail: 'Your account is signed in, but it does not have active company access yet. Company portal access is granted by invite from a LEAD administrator.',
    },
    inactive: {
      title: 'Company Access Paused',
      detail: 'Your company access exists, but it is currently inactive. Ask your LEAD contact to reactivate access before continuing.',
    },
    revoked: {
      title: 'Company Access Revoked',
      detail: 'This company access was revoked. If this seems incorrect, contact the LEAD team for a new invitation.',
    },
    expired: {
      title: 'Company Access Expired',
      detail: 'This company invite or access window has expired. Request a new company access invite from the LEAD team.',
    },
    error: {
      title: 'Company Access Could Not Be Verified',
      detail: 'We could not verify your company access right now. Try again, or contact the LEAD team if the issue continues.',
    },
  },
  es: {
    missing: {
      title: 'Se necesita acceso de empresa',
      detail: 'Tu cuenta inicio sesion, pero todavia no tiene acceso activo de empresa. El acceso al portal se otorga por invitacion de un administrador LEAD.',
    },
    inactive: {
      title: 'Acceso de empresa pausado',
      detail: 'Tu acceso existe, pero esta inactivo. Pide a tu contacto LEAD que reactive el acceso antes de continuar.',
    },
    revoked: {
      title: 'Acceso de empresa revocado',
      detail: 'Este acceso fue revocado. Si parece un error, contacta al equipo LEAD para una nueva invitacion.',
    },
    expired: {
      title: 'Acceso de empresa expirado',
      detail: 'Esta invitacion o ventana de acceso expiro. Solicita una nueva invitacion al equipo LEAD.',
    },
    error: {
      title: 'No se pudo verificar el acceso',
      detail: 'No pudimos verificar tu acceso ahora. Intenta otra vez o contacta al equipo LEAD si continua.',
    },
  },
} as const

const PAGE_COPY = {
  en: {
    companyAccess: 'Company Access',
    description: 'Company representative access is managed by invite.',
    defaultDetail:
      'If you already accepted an invite, continue to company login. If you have an invite link, open it from your email.',
    primaryLogin: 'Continue to login',
    companyLogin: 'Company login',
    inviteOnly: 'Company portal access is invite-only and tied to the invited email address.',
    useInvite: 'Use the invite link from your email, or ask the LEAD team to resend it.',
    inviteIssue: 'Invite Link Issue',
    inviteIssueDesc: 'Company access is invite-only.',
    getHelp: 'Get help',
    continueAccess: 'Continue Company Access',
    inviteNeedsAccepted:
      'This company invite needs to be accepted through the signed-in company access flow.',
    inviteFor: (companyName: string) => `This invite is for ${companyName}.`,
    inviteEmail: 'Invite email:',
    continueToAccess: 'Continue to access',
    boundary:
      'English public pages are available for partner context. The MVP company workspace is Spanish-first after access is accepted.',
  },
  es: {
    companyAccess: 'Acceso de empresa',
    description: 'El acceso para representantes de empresa se gestiona por invitacion.',
    defaultDetail:
      'Si ya aceptaste una invitacion, continua al ingreso de empresa. Si tienes un enlace de invitacion, abrelo desde tu correo.',
    primaryLogin: 'Continuar al ingreso',
    companyLogin: 'Ingreso empresa',
    inviteOnly: 'El acceso al portal de empresas es por invitacion y esta ligado al correo invitado.',
    useInvite: 'Usa el enlace de tu correo o pide al equipo LEAD que lo reenvie.',
    inviteIssue: 'Problema con la invitacion',
    inviteIssueDesc: 'El acceso de empresa es por invitacion.',
    getHelp: 'Obtener ayuda',
    continueAccess: 'Continuar acceso de empresa',
    inviteNeedsAccepted:
      'Esta invitacion debe aceptarse mediante el flujo de acceso de empresa con sesion iniciada.',
    inviteFor: (companyName: string) => `Esta invitacion es para ${companyName}.`,
    inviteEmail: 'Correo invitado:',
    continueToAccess: 'Continuar al acceso',
    boundary: '',
  },
} as const

type CompanyOnboardCopy = (typeof PAGE_COPY)[keyof typeof PAGE_COPY]

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {children}
    </div>
  )
}

function HelpCard({
  title,
  description,
  detail,
  primaryHref,
  primaryLabel,
  copy,
  showBoundary,
}: {
  title: string
  description: string
  detail?: string
  primaryHref: string
  primaryLabel: string
  copy: CompanyOnboardCopy
  showBoundary: boolean
}) {
  return (
    <PageShell>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail ? (
            <Alert>
              <AlertDescription>{detail}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{copy.inviteOnly}</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{copy.useInvite}</span>
            </div>
          </div>
          {showBoundary ? (
            <Alert>
              <AlertDescription>{copy.boundary}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/company/login">{copy.companyLogin}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

function InviteIssueCard({
  message,
  copy,
}: {
  message: string
  copy: CompanyOnboardCopy
}) {
  return (
    <PageShell>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>{copy.inviteIssue}</CardTitle>
          </div>
          <CardDescription>{copy.inviteIssueDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/company/login">{copy.companyLogin}</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/help">
                <HelpCircle className="mr-2 h-4 w-4" />
                {copy.getHelp}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export default async function CompanyOnboardPage({ params, searchParams }: OnboardPageProps) {
  const { locale } = await params
  const resolvedLocale = locale === 'en' ? 'en' : 'es'
  const copy = PAGE_COPY[resolvedLocale]
  const { inviteToken, access } = await searchParams
  const accessCopy = access ? ACCESS_COPY[resolvedLocale][access] : null

  if (!inviteToken) {
    return (
      <HelpCard
        title={accessCopy?.title ?? copy.companyAccess}
        description={copy.description}
        detail={
          accessCopy?.detail ??
          copy.defaultDetail
        }
        primaryHref="/company/login"
        primaryLabel={copy.primaryLogin}
        copy={copy}
        showBoundary={resolvedLocale === 'en'}
      />
    )
  }

  const result = await validateInviteToken(inviteToken)

  if (!result.success) {
    return <InviteIssueCard message={result.error} copy={copy} />
  }

  const accessHref = `/recruiter/access?token=${encodeURIComponent(inviteToken)}`

  return (
    <HelpCard
      title={copy.continueAccess}
      description={
        result.data.companyName
          ? copy.inviteFor(result.data.companyName)
          : copy.inviteNeedsAccepted
      }
      detail={`${copy.inviteEmail} ${result.data.recruiterEmail}`}
      primaryHref={accessHref}
      primaryLabel={copy.continueToAccess}
      copy={copy}
      showBoundary={resolvedLocale === 'en'}
    />
  )
}
