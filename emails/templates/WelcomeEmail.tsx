import { EmailLayout } from '../EmailLayout'

type Role = 'member' | 'admin' | 'recruiter'

type WelcomeEmailProps = {
  dashboardUrl?: string
  locale?: 'en' | 'es'
  name?: string
  role?: Role
}

const BUTTON_STYLES = {
  backgroundColor: '#3759E8',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: 8,
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: 600,
  fontSize: 15,
  letterSpacing: '0.5px',
  boxShadow: '0 4px 12px rgba(55, 89, 232, 0.3)',
}

const FEATURE_ITEM_STYLE = {
  padding: '12px 0',
  display: 'flex',
  alignItems: 'flex-start' as const,
  gap: '12px',
  lineHeight: 1.5,
}

export default function WelcomeEmail({
  dashboardUrl,
  locale = 'es',
  name,
  role = 'member',
}: WelcomeEmailProps) {
  const roleFeatures: Record<Role, Record<'en' | 'es', { icon: string; text: string }[]>> = {
    member: {
      es: [
        { icon: '📚', text: 'Acceder a contenidos y experiencias exclusivas diseñadas por expertos' },
        { icon: '🤝', text: 'Conectar con personas con mentalidad de crecimiento' },
        { icon: '🎯', text: 'Desarrollar habilidades clave para tu futuro profesional' },
        { icon: '🏆', text: 'Participa en desafíos y certificaciones reconocidas' },
      ],
      en: [
        { icon: '📚', text: 'Access exclusive content and experiences designed by experts' },
        { icon: '🤝', text: 'Connect with growth-minded people' },
        { icon: '🎯', text: 'Develop key skills for your professional future' },
        { icon: '🏆', text: 'Participate in recognized challenges and certifications' },
      ],
    },
    recruiter: {
      es: [
        { icon: '🔍', text: 'Explorar perfiles de estudiantes listos para el mundo profesional' },
        { icon: '🎯', text: 'Conectar con talento filtrado por capítulo y habilidades' },
        { icon: '💾', text: 'Guardar y gestionar candidatos desde tu panel' },
      ],
      en: [
        { icon: '🔍', text: 'Browse student profiles ready for the professional world' },
        { icon: '🎯', text: 'Connect with talent filtered by chapter and skills' },
        { icon: '💾', text: 'Save and manage candidates from your dashboard' },
      ],
    },
    admin: {
      es: [
        { icon: '⚙️', text: 'Gestionar usuarios y capítulos desde el panel de administración' },
        { icon: '✅', text: 'Aprobar perfiles de estudiantes' },
        { icon: '👥', text: 'Supervisar el acceso de reclutadores' },
      ],
      en: [
        { icon: '⚙️', text: 'Manage users and chapters from the admin panel' },
        { icon: '✅', text: 'Approve student profiles' },
        { icon: '👥', text: 'Oversee recruiter access' },
      ],
    },
  }

  const content = {
    es: {
      title: '¡Bienvenido/a a LEAD Mindset! 🚀',
      greeting: name ? `¡Hola, ${name}! 👋` : '¡Hola! 👋',
      intro:
        role === 'recruiter'
          ? 'Tu acceso como reclutador en LEAD Mindset ya está activo. Estamos felices de tenerte con nosotros.'
          : role === 'admin'
          ? 'Tu cuenta de administrador en LEAD Mindset ya está activa. Tienes acceso completo a la plataforma.'
          : 'Tu cuenta en LEAD Mindset ya está activa. Nos emociona tenerte como parte de nuestra comunidad global de líderes comprometidos con el crecimiento continuo.',
      listTitle: 'Ahora puedes acceder a:',
      tip: '💡 Consejo: Completa tu perfil lo antes posible. Esto nos ayuda a personalizar tu experiencia y recomendarte contenido relevante.',
      button: '🚀 Acceder a la plataforma',
      closing: 'Gracias por ser parte de este camino de transformación y liderazgo.\nEstamos aquí para apoyarte en cada paso.',
      signature: 'Equipo LEAD Mindset',
    },
    en: {
      title: 'Welcome to LEAD Mindset! 🚀',
      greeting: name ? `Hi, ${name}! 👋` : 'Hi! 👋',
      intro:
        role === 'recruiter'
          ? 'Your recruiter access to LEAD Mindset is now active. We are glad to have you on board.'
          : role === 'admin'
          ? 'Your admin account on LEAD Mindset is now active. You have full access to the platform.'
          : 'Your LEAD Mindset account is now active. We are thrilled to have you as part of our global community of leaders committed to continuous growth.',
      listTitle: 'You now have access to:',
      tip: '💡 Tip: Complete your profile as soon as possible. This helps us personalize your experience and recommend relevant content.',
      button: '🚀 Go to platform',
      closing: 'Thanks for being part of this journey of transformation and leadership.\nWe are here to support you every step of the way.',
      signature: 'LEAD Mindset Team',
    },
  }[locale]

  return (
    <EmailLayout title={content.title}>
      <p style={{ fontSize: 16, marginBottom: 20 }}>{content.greeting}</p>

      <p style={{ marginBottom: 24, lineHeight: 1.7 }}>
        {content.intro.split('LEAD Mindset').map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>{part}<strong>LEAD Mindset</strong></span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>

      <div style={{
        backgroundColor: '#F8FAFF',
        padding: '20px',
        borderRadius: 8,
        borderLeft: '4px solid #3759E8',
        marginBottom: 24,
      }}>
        <p style={{ margin: '0 0 16px 0', fontWeight: 600, color: '#3759E8', fontSize: 14 }}>
          {content.listTitle}
        </p>
        {roleFeatures[role][locale].map((item, i) => (
          <div key={i} style={FEATURE_ITEM_STYLE}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {dashboardUrl && (
        <div style={{ margin: '32px 0', textAlign: 'center' }}>
          <a href={dashboardUrl} style={BUTTON_STYLES}>
            {content.button}
          </a>
        </div>
      )}

      <p style={{
        backgroundColor: '#F0F4FF',
        padding: '16px',
        borderRadius: 6,
        fontSize: 13,
        lineHeight: 1.6,
        margin: '24px 0',
      }}>
        {content.tip}
      </p>

      <p style={{ marginTop: 24, marginBottom: 12, lineHeight: 1.7 }}>
        {content.closing.split('\n').map((line, i) => (
          <span key={i}>{line}{i === 0 && <br />}</span>
        ))}
      </p>

      <p style={{ marginTop: 24, paddingTop: 16, fontSize: 13, color: '#8E95A5', borderTop: '1px solid #E2E8F0' }}>
        — <strong>{content.signature}</strong>
        <br />
        <a href="mailto:soporte@leadmindset.org" style={{ color: '#3759E8', textDecoration: 'none' }}>
          soporte@leadmindset.org
        </a>
      </p>
    </EmailLayout>
  )
}