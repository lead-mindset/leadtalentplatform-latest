import {
  EmailLayout,
  EMAIL_COLORS as C,
  buttonStyle,
  infoBoxStyle,
  featureBoxStyle,
  featureItemStyle,
  helpTextStyle,
} from '../EmailLayout'

type Role = 'member' | 'admin' | 'recruiter'

type WelcomeEmailProps = {
  dashboardUrl?: string
  locale?: 'en' | 'es'
  name?: string
  role?: Role
}

const roleFeatures: Record<Role, Record<'en' | 'es', { icon: string; text: string }[]>> = {
  member: {
    es: [
      { icon: '📚', text: 'Contenidos y experiencias exclusivas diseñadas por expertos' },
      { icon: '🤝', text: 'Conecta con personas con mentalidad de crecimiento' },
      { icon: '🎯', text: 'Desarrolla habilidades clave para tu futuro profesional' },
      { icon: '🏆', text: 'Participa en desafíos y certificaciones reconocidas' },
    ],
    en: [
      { icon: '📚', text: 'Exclusive content and experiences designed by experts' },
      { icon: '🤝', text: 'Connect with growth-minded people' },
      { icon: '🎯', text: 'Develop key skills for your professional future' },
      { icon: '🏆', text: 'Participate in recognized challenges and certifications' },
    ],
  },
  recruiter: {
    es: [
      { icon: '🔍', text: 'Explora perfiles de estudiantes listos para el mundo profesional' },
      { icon: '🎯', text: 'Conecta con talento filtrado por capítulo y habilidades' },
      { icon: '💾', text: 'Guarda y gestiona candidatos desde tu panel' },
    ],
    en: [
      { icon: '🔍', text: 'Browse student profiles ready for the professional world' },
      { icon: '🎯', text: 'Connect with talent filtered by chapter and skills' },
      { icon: '💾', text: 'Save and manage candidates from your dashboard' },
    ],
  },
  admin: {
    es: [
      { icon: '⚙️', text: 'Gestiona usuarios y capítulos desde el panel de administración' },
      { icon: '✅', text: 'Aprueba perfiles de estudiantes' },
      { icon: '👥', text: 'Supervisa el acceso de representantes de empresas' },
    ],
    en: [
      { icon: '⚙️', text: 'Manage users and chapters from the admin panel' },
      { icon: '✅', text: 'Approve student profiles' },
      { icon: '👥', text: 'Oversee company representative access' },
    ],
  },
}

export default function WelcomeEmail({
  dashboardUrl,
  locale = 'es',
  name,
  role = 'member',
}: WelcomeEmailProps) {
  const t = {
    es: {
      title: '¡Bienvenido/a a LEAD Mindset! 🚀',
      preview: 'Tu cuenta ya está activa. ¡Empieza tu camino hoy!',
      greeting: name ? `¡Hola, ${name}!` : '¡Hola!',
      intro: {
        member: 'Tu cuenta en LEAD Mindset ya está activa. Nos emociona tenerte como parte de nuestra comunidad global de líderes comprometidos con el crecimiento continuo.',
        recruiter: 'Tu acceso como representante de empresa en LEAD Mindset ya está activo. Estamos felices de tenerte con nosotros.',
        admin: 'Tu cuenta de administrador en LEAD Mindset ya está activa. Tienes acceso completo a la plataforma.',
      }[role],
      listTitle: 'Ahora tienes acceso a:',
      tip: 'Completa tu perfil lo antes posible para que podamos personalizar tu experiencia y recomendarte contenido relevante.',
      button: '🚀 Ir a la plataforma',
      closing: 'Gracias por ser parte de este camino.',
      signature: 'Equipo LEAD Mindset',
      help: '¿Necesitas ayuda?',
    },
    en: {
      title: 'Welcome to LEAD Mindset! 🚀',
      preview: 'Your account is now active. Start your journey today!',
      greeting: name ? `Hi, ${name}!` : 'Hi!',
      intro: {
        member: 'Your LEAD Mindset account is now active. We are thrilled to have you as part of our global community of leaders committed to continuous growth.',
        recruiter: 'Your company representative access to LEAD Mindset is now active. We are glad to have you on board.',
        admin: 'Your admin account on LEAD Mindset is now active. You have full access to the platform.',
      }[role],
      listTitle: 'You now have access to:',
      tip: 'Complete your profile as soon as possible so we can personalize your experience and recommend relevant content.',
      button: '🚀 Go to platform',
      closing: 'Thanks for being part of this journey.',
      signature: 'LEAD Mindset Team',
      help: 'Need help?',
    },
  }[locale]

  const features = roleFeatures[role][locale]
  const lastIdx = features.length - 1

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting} 👋
      </p>

      <p style={{ margin: '0 0 24px 0' }}>
        {t.intro.split('LEAD Mindset').map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>{part}<strong style={{ color: C.primary }}>LEAD Mindset</strong></span>
          ) : <span key={i}>{part}</span>
        )}
      </p>

      <div style={featureBoxStyle}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: 13, color: C.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t.listTitle}
        </p>
        {features.map((item, i) => (
          <div key={i} style={{ ...featureItemStyle, ...(i === lastIdx ? { borderBottom: 'none', paddingBottom: 0 } : {}) }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ color: C.foreground }}>{item.text}</span>
          </div>
        ))}
      </div>

      {dashboardUrl && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a href={dashboardUrl} style={buttonStyle}>{t.button}</a>
        </div>
      )}

      <div style={infoBoxStyle}>
        <strong>💡 {locale === 'es' ? 'Consejo:' : 'Tip:'}</strong>{' '}{t.tip}
      </div>

      <p style={{ marginTop: 28, marginBottom: 4 }}>{t.closing}</p>
      <p style={{ margin: 0, fontWeight: 600, color: C.foreground }}>— {t.signature}</p>

      <p style={helpTextStyle}>
        {t.help}{' '}
        <a href="mailto:soporte@leadmindset.org" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          soporte@leadmindset.org
        </a>
      </p>
    </EmailLayout>
  )
}
