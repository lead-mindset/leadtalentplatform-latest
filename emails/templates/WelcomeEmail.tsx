import { EmailLayout } from '../EmailLayout'

type WelcomeEmailProps = {
  dashboardUrl?: string
}

export default function WelcomeEmail({
  dashboardUrl,
}: WelcomeEmailProps) {
  return (
    <EmailLayout title="Bienvenido/a a LEAD Mindset 🚀">
      <p>Hola 👋</p>

      <p>
        Tu cuenta en <strong>LEAD Mindset</strong> ya está activa.
        Nos alegra tenerte como parte de una comunidad enfocada en
        liderazgo, mentalidad y crecimiento continuo.
      </p>

      <p>
        Desde LEAD Platform podrás:
      </p>

      <ul style={{ paddingLeft: 20 }}>
        <li>Acceder a contenidos y experiencias exclusivas</li>
        <li>Conectar con personas con mentalidad de crecimiento</li>
        <li>Desarrollar habilidades clave para tu futuro profesional</li>
      </ul>

      {dashboardUrl && (
        <p style={{ margin: '24px 0' }}>
          <a
            href={dashboardUrl}
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Ir a la plataforma
          </a>
        </p>
      )}

      <p>
        Gracias por ser parte de este camino.
      </p>

      <p>
        — Equipo <strong>LEAD Mindset</strong>
      </p>
    </EmailLayout>
  )
}