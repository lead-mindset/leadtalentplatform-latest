import { LifeBuoy, Mail, ShieldCheck } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '../_components/navbar'

export const metadata = {
  title: 'Help',
  description: 'Get help using the LEAD Talent Platform.',
}

type HelpPageProps = {
  params: Promise<{ locale: string }>
}

export default async function HelpPage({ params }: HelpPageProps) {
  const { locale } = await params
  const isEnglish = locale === 'en'
  const copy = isEnglish
    ? {
        badge: 'Support',
        title: 'Help Center',
        body:
          'Find the quickest path for account access, member activation, event registration, check-in, and company invite support.',
        accountTitle: 'Student account help',
        accountDesc: 'Sign-in issues, wrong email or chapter, missing membership, profile edits, event registration, and check-in.',
        accountCta: 'Go to sign in',
        emailTitle: 'Partnership support',
        emailDesc:
          'Reach the team for sponsorships, invite-only company access, visibility questions, or platform issues.',
        privacyTitle: 'Privacy and policies',
        privacyDesc:
          'Review profile visibility, consent, platform terms, and privacy expectations before onboarding or partnership conversations.',
        privacy: 'Privacy',
        terms: 'Terms',
      }
    : {
        badge: 'Soporte',
        title: 'Centro de ayuda',
        body:
          'Encuentra el camino mas rapido para acceso de cuenta, activacion de miembros, registro a eventos, check-in y soporte de invitaciones para empresas.',
        accountTitle: 'Ayuda de cuenta',
        accountDesc: 'Problemas de ingreso, email o chapter incorrecto, membresia faltante, perfil, registro a eventos y check-in.',
        accountCta: 'Ir a iniciar sesion',
        emailTitle: 'Soporte de alianzas',
        emailDesc:
          'Contacta al equipo por sponsors, acceso invite-only de empresas, dudas de visibilidad o problemas de la plataforma.',
        privacyTitle: 'Privacidad y politicas',
        privacyDesc:
          'Revisa visibilidad de perfil, consentimiento, terminos y privacidad antes de completar onboarding o conversaciones de alianza.',
        privacy: 'Privacidad',
        terms: 'Terminos',
      }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-16 pt-28">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              {copy.badge}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">{copy.title}</h1>
            <p className="max-w-2xl text-muted-foreground">
              {copy.body}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <LifeBuoy className="h-5 w-5 text-primary" />
                <CardTitle>{copy.accountTitle}</CardTitle>
                <CardDescription>
                  {copy.accountDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/auth/login">{copy.accountCta}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>{copy.emailTitle}</CardTitle>
                <CardDescription>
                  {copy.emailDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                support@leadtalentplatform.com
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle>{copy.privacyTitle}</CardTitle>
                <CardDescription>
                  {copy.privacyDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/privacy">{copy.privacy}</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/terms">{copy.terms}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
