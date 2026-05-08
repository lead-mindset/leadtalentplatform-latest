import { BriefcaseBusiness, Users, Zap } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '../_components/navbar'

export const metadata = {
  title: 'Partner Info',
  description: 'Information for partners and company collaborators on LEAD.',
}

type PartnerInfoProps = {
  params: Promise<{ locale: string }>
}

export default async function PartnerInfo({ params }: PartnerInfoProps) {
  const { locale } = await params
  const isEnglish = locale === 'en'
  const copy = isEnglish
    ? {
        badge: 'For partners',
        title: 'Partner with LEAD',
        body:
          'LEAD connects sponsors and partner organizations with Latin American student leaders through chapter communities, public events, and opt-in talent visibility.',
        cards: [
          {
            title: 'Opt-in student visibility',
            description:
              'Company representatives only browse profiles from students who have explicitly chosen to be visible.',
          },
          {
            title: 'Company access workflows',
            description:
              'Invited representatives can review visible talent, save profiles, and coordinate with LEAD through scoped access.',
          },
          {
            title: 'Events and applications',
            description:
              'Support chapter programs, workshops, and application-based events with clear operational flows.',
          },
        ],
        nextTitle: 'Next steps',
        nextDescription:
          'Ready to explore a partnership or need company account support?',
        primary: 'Company login',
        secondary: 'Visit help center',
      }
    : {
        badge: 'Para aliados',
        title: 'Colabora con LEAD',
        body:
          'LEAD conecta empresas aliadas y sponsors con lideres estudiantiles de Latinoamerica mediante capitulos, eventos publicos y visibilidad de talento con consentimiento.',
        cards: [
          {
            title: 'Visibilidad con consentimiento',
            description:
              'Los representantes solo pueden explorar perfiles de estudiantes que eligieron hacerlos visibles.',
          },
          {
            title: 'Acceso para empresas',
            description:
              'Representantes invitados pueden revisar talento visible, guardar perfiles y coordinar con LEAD mediante acceso controlado.',
          },
          {
            title: 'Eventos y postulaciones',
            description:
              'Apoya programas de capitulos, talleres y eventos con postulacion usando flujos claros.',
          },
        ],
        nextTitle: 'Siguientes pasos',
        nextDescription:
          'Quieres explorar una alianza o necesitas soporte de acceso para empresas?',
        primary: 'Ingreso empresa',
        secondary: 'Centro de ayuda',
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
            <p className="max-w-3xl text-muted-foreground">
              {copy.body}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>{copy.cards[0].title}</CardTitle>
                <CardDescription>
                  {copy.cards[0].description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BriefcaseBusiness className="h-5 w-5 text-primary" />
                <CardTitle>{copy.cards[1].title}</CardTitle>
                <CardDescription>
                  {copy.cards[1].description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>{copy.cards[2].title}</CardTitle>
                <CardDescription>
                  {copy.cards[2].description}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{copy.nextTitle}</CardTitle>
              <CardDescription>
                {copy.nextDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/company/login">{copy.primary}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/help">{copy.secondary}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
