import {
  EmailLayout,
  EMAIL_COLORS as C,
  SUPPORT_EMAIL,
  bulletDotStyle,
  buttonStyle,
  featureBoxStyle,
  featureItemStyle,
  helpTextStyle,
  infoBoxStyle,
  sectionLabelStyle,
} from '../EmailLayout'

type Role = 'member' | 'admin' | 'recruiter'

type WelcomeEmailProps = {
  dashboardUrl?: string
  locale?: 'en' | 'es'
  name?: string
  role?: Role
}

const roleFeatures: Record<Role, Record<'en' | 'es', string[]>> = {
  member: {
    es: [
      'Completar y mantener tu perfil profesional.',
      'Inscribirte a eventos de LEAD Americas.',
      'Postular a capitulos y seguir tu estado.',
      'Preparar tu perfil para oportunidades con empresas aliadas.',
    ],
    en: [
      'Complete and maintain your professional profile.',
      'Register for LEAD Americas events.',
      'Apply to chapters and track your status.',
      'Prepare your profile for partner company opportunities.',
    ],
  },
  recruiter: {
    es: [
      'Revisar talento autorizado por LEAD Americas.',
      'Guardar perfiles relevantes para seguimiento.',
      'Trabajar con acceso seguro por invitacion.',
    ],
    en: [
      'Review talent authorized by LEAD Americas.',
      'Save relevant profiles for follow-up.',
      'Work through secure invite-based access.',
    ],
  },
  admin: {
    es: [
      'Gestionar usuarios, capitulos e identidades.',
      'Revisar actividad de eventos y membresias.',
      'Administrar accesos de empresas aliadas.',
    ],
    en: [
      'Manage users, chapters, and identities.',
      'Review event and membership activity.',
      'Administer partner company access.',
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
      title: 'Tu perfil esta listo',
      preview: 'Ya puedes continuar en LEAD Talent Platform.',
      greeting: name ? `Hola, ${name}` : 'Hola',
      intro: 'Tu perfil en LEAD Talent Platform esta listo. Desde aqui podras gestionar tu participacion en LEAD Americas.',
      listTitle: 'Ahora puedes',
      tip: 'Mantener tu informacion actualizada ayuda a que el equipo LEAD y las empresas aliadas entiendan mejor tu perfil.',
      button: 'Ir a la plataforma',
      closing: 'Gracias por ser parte de LEAD Americas.',
      signature: 'Equipo LEAD Americas',
      help: 'Necesitas ayuda?',
    },
    en: {
      title: 'Your profile is ready',
      preview: 'You can now continue in LEAD Talent Platform.',
      greeting: name ? `Hi, ${name}` : 'Hi',
      intro: 'Your LEAD Talent Platform profile is ready. From here, you can manage your participation in LEAD Americas.',
      listTitle: 'You can now',
      tip: 'Keeping your information updated helps the LEAD team and partner companies understand your profile.',
      button: 'Go to platform',
      closing: 'Thanks for being part of LEAD Americas.',
      signature: 'LEAD Americas Team',
      help: 'Need help?',
    },
  }[locale]

  const features = roleFeatures[role][locale]
  const lastIdx = features.length - 1

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting}
      </p>
      <p style={{ margin: '0 0 24px 0' }}>{t.intro}</p>
      <div style={featureBoxStyle}>
        <p style={sectionLabelStyle}>
          {t.listTitle}
        </p>
        {features.map((feature, index) => (
          <div
            key={feature}
            style={{ ...featureItemStyle, ...(index === lastIdx ? { borderBottom: 'none', paddingBottom: 0 } : {}) }}
          >
            <span style={bulletDotStyle} />
            <span style={{ color: C.foreground }}>{feature}</span>
          </div>
        ))}
      </div>
      {dashboardUrl && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a href={dashboardUrl} style={buttonStyle}>{t.button}</a>
        </div>
      )}
      <div style={infoBoxStyle}>
        <strong>{locale === 'es' ? 'Consejo:' : 'Tip:'}</strong> {t.tip}
      </div>
      <p style={{ marginTop: 28, marginBottom: 4 }}>{t.closing}</p>
      <p style={{ margin: 0, fontWeight: 600, color: C.foreground }}>{t.signature}</p>
      <p style={helpTextStyle}>
        {t.help}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          {SUPPORT_EMAIL}
        </a>
      </p>
    </EmailLayout>
  )
}
