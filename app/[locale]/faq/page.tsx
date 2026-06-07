import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes - LEAD',
  description: 'Preguntas frecuentes sobre LEAD Talent Platform',
}

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Preguntas frecuentes</h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Respuestas claras sobre LEAD, sus capítulos, eventos y oportunidades.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">General</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Qué es LEAD?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD es una plataforma de talento que conecta a estudiantes con oportunidades en
                  tecnología. Reúne recursos educativos, eventos, mentoría, comunidad y acceso a
                  oportunidades profesionales con organizaciones aliadas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Quién puede unirse a LEAD?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD está abierto a estudiantes interesados en construir una carrera en tecnología.
                  Puedes estar empezando, explorando tu camino o preparándote para prácticas y roles
                  profesionales.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Tiene algún costo?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  La membresía estudiantil de LEAD es gratuita. La misión es reducir barreras y abrir
                  acceso a formación, comunidad y oportunidades de calidad.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Dónde hay capítulos de LEAD?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD trabaja con capítulos universitarios. Puedes revisar los eventos disponibles
                  para encontrar actividad cerca de ti o expresar interés si quieres impulsar LEAD en
                  tu universidad.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Membresía</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cómo me convierto en miembro?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Crea tu cuenta, completa tu perfil y sigue el flujo de tu capítulo. Cuando tu
                  membresía sea aprobada, tendrás acceso a las experiencias y recursos disponibles
                  para miembros.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cómo funciona la aprobación?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cada capítulo revisa las solicitudes según su proceso local. La plataforma muestra
                  tu estado para que sepas si estás como participante, en revisión, miembro oficial o
                  alumni.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Qué beneficios tiene la membresía?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-muted-foreground">Como miembro de LEAD puedes acceder a:</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Talleres, eventos y experiencias de aprendizaje.</li>
                  <li>Mentoría y orientación profesional.</li>
                  <li>Preparación de CV, entrevistas y portafolio.</li>
                  <li>Conexiones con comunidad, capítulos y aliados.</li>
                  <li>Oportunidades de liderazgo dentro de tu capítulo.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Qué tipos de eventos organiza LEAD?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-muted-foreground">Los eventos pueden incluir:</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Talleres técnicos y sesiones de habilidades.</li>
                  <li>Eventos de carrera, networking y liderazgo.</li>
                  <li>Charlas con profesionales e industrias aliadas.</li>
                  <li>Experiencias de comunidad y colaboración.</li>
                  <li>Actividades organizadas por capítulos locales.</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cómo me registro a un evento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Entra al evento desde la plataforma y sigue el flujo de registro. Algunos eventos
                  pueden requerir postulación, aprobación o cupos limitados.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Los eventos son virtuales o presenciales?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Puede haber eventos virtuales, presenciales o híbridos. La modalidad, ubicación y
                  requisitos aparecen en la página de cada evento.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Carrera y oportunidades</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cómo puede ayudarme LEAD con mi carrera?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-muted-foreground">LEAD te ayuda a construir señal profesional mediante:</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Eventos y retos alineados con habilidades reales.</li>
                  <li>Revisión de CV, perfil y materiales profesionales.</li>
                  <li>Mentoría y conversaciones con personas de la industria.</li>
                  <li>Oportunidades compartidas por aliados y capítulos.</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Las empresas pueden ver mi perfil?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Solo si activas la visibilidad para representantes de empresas aliadas y cumples
                  con los requisitos de membresía aprobada. Puedes controlar esa visibilidad desde
                  tu perfil cuando la función esté disponible para tu rol.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Hay oportunidades de prácticas?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD puede compartir oportunidades de prácticas, programas, becas o eventos de
                  reclutamiento según la disponibilidad de sus aliados y capítulos.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Soporte</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tengo problemas con mi perfil. ¿Qué hago?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Primero actualiza la página e intenta nuevamente. Si el problema continúa,
                  contacta a tu capítulo o al equipo de soporte con tu correo, captura y descripción
                  del caso.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cómo funciona el check-in con QR?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Para eventos presenciales con check-in, la plataforma puede generar un código QR
                  después del registro. Muéstralo al equipo organizador para confirmar tu asistencia.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Qué navegadores puedo usar?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD funciona mejor en versiones recientes de Chrome, Firefox, Safari y Edge.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-8 text-center">
          <h3 className="mb-4 text-2xl font-bold">¿Aún tienes preguntas?</h3>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            Si no encontraste la respuesta, escríbenos con el contexto de tu caso y el equipo te
            orientará.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="mailto:support@leadtech.org"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Contactar soporte
            </a>
            <Link
              href="/events"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Ver eventos
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
