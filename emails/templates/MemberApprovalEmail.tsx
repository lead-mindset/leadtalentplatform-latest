import {
  EmailLayout,
  EMAIL_COLORS as C,
  buttonStyle,
  infoBoxStyle,
  featureBoxStyle,
  featureItemStyle,
  helpTextStyle,
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
      title: '¡Felicidades! Tu membresía ha sido aprobada',
      preview: 'Bienvenido oficialmente a LEAD. Tu Member ID está listo.',
      greeting: `¡Hola, ${name}!`,
      intro: `¡Excelentes noticias! Tu solicitud de membresía para <strong>${chapter_name}</strong> ha sido aprobada.`,
      memberIdTitle: 'Tu Member ID:',
      memberIdDesc: 'Este es tu identificador único como miembro de LEAD. Guárdalo para futuras referencias.',
      featuresTitle: 'Con tu membresía ahora tienes acceso a:',
      features: [
        'Registrarte para eventos y talleres de tu capítulo',
        'Obtener códigos QR para el check-in en eventos',
        'Optar por visibilidad ante empresas aliadas para oportunidades laborales',
        'Subir tu currículum para que las empresas aliadas te descubran',
      ],
      button: 'Ir a mi Dashboard',
      closing: 'Estamos emocionados de tenerte como parte de la comunidad LEAD.',
      signature: 'Equipo LEAD',
      help: '¿Necesitas ayuda?',
    },
    en: {
      title: 'Congratulations! Your Membership is Approved',
      preview: 'Welcome officially to LEAD. Your Member ID is ready.',
      greeting: `Hi, ${name}!`,
      intro: `Great news! Your membership application for <strong>${chapter_name}</strong> has been approved.`,
      memberIdTitle: 'Your Member ID:',
      memberIdDesc: 'This is your unique identifier as a LEAD member. Keep it for future reference.',
      featuresTitle: 'With your membership you now have access to:',
      features: [
        'Register for chapter events and workshops',
        'Get QR codes for event check-ins',
        'Opt into partner company visibility for job opportunities',
        'Upload your resume for partner companies to discover',
      ],
      button: 'Go to My Dashboard',
      closing: 'We are thrilled to have you as part of the LEAD community.',
      signature: 'LEAD Team',
      help: 'Need help?',
    },
  }[locale]

  const lastIdx = t.features.length - 1

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting} 
      </p>

      <p style={{ margin: '0 0 24px 0' }}>
        {t.intro}
      </p>

      {}
      <div style={{
        backgroundColor: C.primaryLight,
        border: `2px solid ${C.primaryBorder}`,
        borderRadius: 12,
        padding: '24px',
        textAlign: 'center',
        margin: '24px 0',
      }}>
        <p style={{
          margin: '0 0 8px 0',
          fontSize: 14,
          fontWeight: 600,
          color: C.primary,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {t.memberIdTitle}
        </p>
        <div style={{
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
        }}>
          {memberId}
        </div>
        <p style={{
          margin: '12px 0 0 0',
          fontSize: 13,
          color: C.muted,
          fontStyle: 'italic',
        }}>
          {t.memberIdDesc}
        </p>
      </div>

      {}
      <div style={featureBoxStyle}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: 13, color: C.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t.featuresTitle}
        </p>
        {t.features.map((feature, i) => (
          <div key={i} style={{ ...featureItemStyle, ...(i === lastIdx ? { borderBottom: 'none', paddingBottom: 0 } : {}) }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{'\u2713'}</span>
            <span style={{ color: C.foreground }}>{feature}</span>
          </div>
        ))}
      </div>

      {}
      {dashboardUrl && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a href={dashboardUrl} style={buttonStyle}>{t.button}</a>
        </div>
      )}

      {}
      <p style={{ marginTop: 28, marginBottom: 4 }}>{t.closing}</p>
      <p style={{ margin: 0, fontWeight: 600, color: C.foreground }}>&mdash; {t.signature}</p>

      <p style={helpTextStyle}>
        {t.help}{' '}
        <a href="mailto:soporte@leadmindset.org" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          soporte@leadmindset.org
        </a>
      </p>
    </EmailLayout>
  )
}
