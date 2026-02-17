import { EmailLayout } from '../EmailLayout'

type Role = 'member' | 'admin' | 'recruiter'

type WelcomeEmailProps = {
  dashboardUrl?: string
  locale?: 'en' | 'es'
  name?: string
  role?: Role
}

export default function WelcomeEmail({
  dashboardUrl,
  locale = 'es',
  name,
  role = 'member',
}: WelcomeEmailProps) {

  const roleFeatures: Record<Role, Record<'en' | 'es', string[]>> = {
    member: {
      es: [
        'Acceder a contenidos y experiencias exclusivas',
        'Conectar con personas con mentalidad de crecimiento',
        'Desarrollar habilidades clave para tu futuro profesional',
      ],
      en: [
        'Access exclusive content and experiences',
        'Connect with growth-minded people',
        'Develop key skills for your professional future',
      ],
    },
    recruiter: {
      es: [
        'Explorar perfiles de estudiantes listos para el mundo profesional',
        'Conectar con talento filtrado por capítulo y habilidades',
        'Guardar y gestionar candidatos desde tu panel',
      ],
      en: [
        'Browse student profiles ready for the professional world',
        'Connect with talent filtered by chapter and skills',
        'Save and manage candidates from your dashboard',
      ],
    },
    admin: {
      es: [
        'Gestionar usuarios y capítulos desde el panel de administración',
        'Aprobar perfiles de estudiantes',
        'Supervisar el acceso de reclutadores',
      ],
      en: [
        'Manage users and chapters from the admin panel',
        'Approve student profiles',
        'Oversee recruiter access',
      ],
    },
  }

  const content = {
    es: {
      title: 'Bienvenido/a a LEAD Mindset 🚀',
      greeting: name ? `Hola, ${name} 👋` : 'Hola 👋',
      intro:
        role === 'recruiter'
          ? 'Tu acceso como reclutador en LEAD Mindset ya está activo. Estamos felices de tenerte con nosotros.'
          : role === 'admin'
          ? 'Tu cuenta de administrador en LEAD Mindset ya está activa. Tienes acceso completo a la plataforma.'
          : 'Tu cuenta en LEAD Mindset ya está activa. Nos alegra tenerte como parte de una comunidad enfocada en liderazgo, mentalidad y crecimiento continuo.',
      listTitle: 'Desde LEAD Platform podrás:',
      listItems: roleFeatures[role].es,
      button: 'Ir a la plataforma',
      closing: 'Gracias por ser parte de este camino.',
      signature: 'Equipo LEAD Mindset',
    },
    en: {
      title: 'Welcome to LEAD Mindset 🚀',
      greeting: name ? `Hi, ${name} 👋` : 'Hi 👋',
      intro:
        role === 'recruiter'
          ? 'Your recruiter access to LEAD Mindset is now active. We are glad to have you on board.'
          : role === 'admin'
          ? 'Your admin account on LEAD Mindset is now active. You have full access to the platform.'
          : 'Your LEAD Mindset account is now active. We are thrilled to have you as part of a community focused on leadership, mindset, and continuous growth.',
      listTitle: 'With LEAD Platform you can:',
      listItems: roleFeatures[role].en,
      button: 'Go to platform',
      closing: 'Thanks for being part of this journey.',
      signature: 'LEAD Mindset Team',
    },
  }[locale]

  return (
    <EmailLayout title={content.title}>
      <p>{content.greeting}</p>

      <p>
        {content.intro.split('LEAD Mindset').map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>
              {part}
              <strong>LEAD Mindset</strong>
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>

      <p>{content.listTitle}</p>

      <ul style={{ paddingLeft: 20 }}>
        {content.listItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
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
            {content.button}
          </a>
        </p>
      )}

      <p>{content.closing}</p>

      <p>
        —{' '}
        {content.signature.split('LEAD Mindset').map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>
              {part}
              <strong>LEAD Mindset</strong>
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    </EmailLayout>
  )
}