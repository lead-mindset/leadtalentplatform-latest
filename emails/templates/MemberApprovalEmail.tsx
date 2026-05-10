import {
  EmailLayout,
  EMAIL_COLORS as C,
  SUPPORT_EMAIL,
  bulletDotStyle,
  buttonStyle,
  featureBoxStyle,
  featureItemStyle,
  helpTextStyle,
  sectionLabelStyle,
} from '../EmailLayout'

type MemberApprovalEmailProps = {
  name: string
  memberId: string
  chapter_name: string
  dashboardUrl: string
  locale?: 'en' | 'es'
}

export default function MemberApprovalEmail({
  name,
  memberId,
  chapter_name,
  dashboardUrl,
  locale = 'es',
}: MemberApprovalEmailProps) {
  const t = {
    es: {
      title: 'Tu membresia fue aprobada',
      preview: 'Ya eres miembro oficial de LEAD Americas.',
      greeting: `Hola, ${name}`,
      intro: 'Tu solicitud de membresia fue aprobada.',
      chapter: 'Capitulo',
      memberIdTitle: 'Tu Member ID',
      memberIdDesc: 'Este identificador confirma tu membresia oficial en LEAD Americas.',
      featuresTitle: 'Ahora puedes',
      features: [
        'Acceder a tu dashboard de miembro.',
        'Usar tu Member ID en procesos oficiales de LEAD.',
        'Gestionar tu perfil profesional y visibilidad ante empresas aliadas.',
        'Ver tus eventos, codigos QR y proximas actividades.',
      ],
      button: 'Ir a mi dashboard',
      closing: 'Felicitaciones por este paso. Nos alegra tenerte oficialmente en la comunidad.',
      signature: 'Equipo LEAD Americas',
      help: 'Necesitas ayuda?',
    },
    en: {
      title: 'Your membership was approved',
      preview: 'You are now an official LEAD Americas member.',
      greeting: `Hi, ${name}`,
      intro: 'Your membership application was approved.',
      chapter: 'Chapter',
      memberIdTitle: 'Your Member ID',
      memberIdDesc: 'This identifier confirms your official membership in LEAD Americas.',
      featuresTitle: 'You can now',
      features: [
        'Access your member dashboard.',
        'Use your Member ID in official LEAD processes.',
        'Manage your professional profile and partner company visibility.',
        'View your events, QR codes, and upcoming activities.',
      ],
      button: 'Go to my dashboard',
      closing: 'Congratulations on this step. We are glad to have you officially in the community.',
      signature: 'LEAD Americas Team',
      help: 'Need help?',
    },
  }[locale]

  const lastIdx = t.features.length - 1

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting}
      </p>
      <p style={{ margin: '0 0 12px 0' }}>{t.intro}</p>
      <p style={{ margin: '0 0 24px 0' }}>
        <strong>{t.chapter}:</strong> {chapter_name}
      </p>

      <div
        style={{
          backgroundColor: C.primaryLight,
          border: `2px solid ${C.primaryBorder}`,
          borderRadius: 12,
          padding: '24px',
          textAlign: 'center',
          margin: '24px 0',
        }}
      >
        <p style={sectionLabelStyle}>
          {t.memberIdTitle}
        </p>
        <div
          style={{
            backgroundColor: C.white,
            border: `1px solid ${C.primaryBorder}`,
            borderRadius: 8,
            padding: '16px 20px',
            display: 'inline-block',
            fontFamily: 'monospace',
            fontSize: 28,
            fontWeight: 700,
            color: C.foreground,
            letterSpacing: '2px',
          }}
        >
          {memberId}
        </div>
        <p style={{ margin: '12px 0 0 0', fontSize: 13, color: C.muted }}>{t.memberIdDesc}</p>
      </div>

      <div style={featureBoxStyle}>
        <p style={sectionLabelStyle}>
          {t.featuresTitle}
        </p>
        {t.features.map((feature, index) => (
          <div
            key={feature}
            style={{ ...featureItemStyle, ...(index === lastIdx ? { borderBottom: 'none', paddingBottom: 0 } : {}) }}
          >
            <span style={bulletDotStyle} />
            <span style={{ color: C.foreground }}>{feature}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={dashboardUrl} style={buttonStyle}>{t.button}</a>
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
