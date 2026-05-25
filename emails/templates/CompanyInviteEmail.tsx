import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, buttonStyle, helpTextStyle, infoBoxStyle } from '../EmailLayout'

type CompanyInviteEmailProps = {
  companyName: string
  inviteUrl: string
  locale?: 'en' | 'es'
}

export default function CompanyInviteEmail({ companyName, inviteUrl, locale = 'es' }: CompanyInviteEmailProps) {
  const t = {
    es: {
      title: 'Invitacion para representante de empresa',
      preview: `${companyName} fue invitada a LEAD Talent Platform.`,
      greeting: 'Hola',
      intro: `Recibiste una invitacion para acceder como representante de ${companyName} en LEAD Talent Platform.`,
      cta: 'Acepta la invitacion para configurar tu acceso y revisar talento autorizado por LEAD Americas.',
      button: 'Aceptar invitacion',
      note: 'Este enlace es personal y expira por seguridad.',
      help: 'Necesitas ayuda?',
    },
    en: {
      title: 'Company representative invitation',
      preview: `${companyName} was invited to LEAD Talent Platform.`,
      greeting: 'Hi',
      intro: `You received an invitation to access LEAD Talent Platform as a representative of ${companyName}.`,
      cta: 'Accept the invitation to set up access and review talent authorized by LEAD Americas.',
      button: 'Accept invitation',
      note: 'This link is personal and expires for security.',
      help: 'Need help?',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting}
      </p>
      <p style={{ margin: '0 0 20px 0' }}>{t.intro}</p>
      <p style={{ margin: '0 0 28px 0', color: C.muted }}>{t.cta}</p>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={inviteUrl} style={buttonStyle}>{t.button}</a>
      </div>
      <div style={infoBoxStyle}>{t.note}</div>
      <p style={helpTextStyle}>
        {t.help}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          {SUPPORT_EMAIL}
        </a>
      </p>
    </EmailLayout>
  )
}
