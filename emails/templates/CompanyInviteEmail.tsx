import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, mb, Greeting, ButtonRow, HelpFooter, buttonStyle, infoBoxStyle } from '../EmailLayout'

type CompanyInviteEmailProps = {
  companyName: string
  inviteUrl: string
  locale?: 'en' | 'es'
}

export default function CompanyInviteEmail({ companyName, inviteUrl, locale = 'es' }: CompanyInviteEmailProps) {
  const t = {
    es: {
      title: 'Invitación para representante de empresa',
      preview: `${companyName} fue invitada a LEAD Talent Platform.`,
      greeting: 'Hola',
      intro: `Recibiste una invitación para acceder como representante de ${companyName} en LEAD Talent Platform.`,
      cta: 'Acepta la invitación para configurar tu acceso y revisar talento autorizado por LEAD Americas.',
      button: 'Aceptar invitación',
      note: 'Este enlace es personal y expira por seguridad.',
      help: '¿Necesitas ayuda?',
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
      <Greeting>{t.greeting}</Greeting>
      <p style={{ margin: mb.xxl }}>{t.intro}</p>
      <p style={{ margin: mb.xxl, color: C.muted }}>{t.cta}</p>
      <ButtonRow>
        <a href={inviteUrl} style={buttonStyle}>{t.button}</a>
      </ButtonRow>
      <div style={infoBoxStyle}>{t.note}</div>
      <HelpFooter>
        {t.help}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          {SUPPORT_EMAIL}
        </a>
      </HelpFooter>
    </EmailLayout>
  )
}
