import { EmailLayout, EMAIL_COLORS as C, buttonStyle, helpTextStyle, infoBoxStyle } from '../EmailLayout'

type ChapterEboardInviteEmailProps = {
  chapterName: string
  displayTitle: string
  invitedEmail: string
  inviteUrl: string
  supportEmail?: string
  locale?: 'en' | 'es'
}

const DEFAULT_SUPPORT_EMAIL = 'abriones@leadmindset.org'

export default function ChapterEboardInviteEmail({
  chapterName,
  displayTitle,
  invitedEmail,
  inviteUrl,
  supportEmail = DEFAULT_SUPPORT_EMAIL,
  locale = 'es',
}: ChapterEboardInviteEmailProps) {
  const t = {
    es: {
      title: 'Activa tu rol en LEAD Talent Platform',
      preview: `Fuiste invitado/a a activar tu rol ${displayTitle} en ${chapterName}.`,
      greeting: 'Hola',
      intro: `Fuiste invitado/a a activar tu rol de ${displayTitle} en ${chapterName}.`,
      cta: 'Abre el enlace, inicia sesion o crea tu cuenta usando exactamente el correo invitado, revisa el resumen y acepta la invitacion. El enlace vence en 30 dias.',
      button: 'Revisar y aceptar invitacion',
      roleLabel: 'Rol',
      chapterLabel: 'Chapter',
      emailLabel: 'Correo que debes usar',
      note: 'Si el correo, chapter o rol no se ve correcto, escribe antes de aceptar o crear una segunda cuenta.',
      help: 'Necesitas ayuda?',
    },
    en: {
      title: 'Activate your role in LEAD Talent Platform',
      preview: `You were invited to activate your ${displayTitle} role in ${chapterName}.`,
      greeting: 'Hi',
      intro: `You were invited to activate your ${displayTitle} role in ${chapterName}.`,
      cta: 'Open the link, sign in or create your account using the exact invited email, review the summary, and accept the invite. The link expires in 30 days.',
      button: 'Review and accept invite',
      roleLabel: 'Role',
      chapterLabel: 'Chapter',
      emailLabel: 'Email to use',
      note: 'If the email, chapter, or role looks wrong, write before accepting or creating a second account.',
      help: 'Need help?',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting}
      </p>
      <p style={{ margin: '0 0 20px 0' }}>{t.intro}</p>
      <div style={infoBoxStyle}>
        <div><strong>{t.roleLabel}:</strong> {displayTitle}</div>
        <div><strong>{t.chapterLabel}:</strong> {chapterName}</div>
        <div><strong>{t.emailLabel}:</strong> {invitedEmail}</div>
      </div>
      <p style={{ margin: '24px 0 28px 0', color: C.muted }}>{t.cta}</p>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={inviteUrl} style={buttonStyle}>{t.button}</a>
      </div>
      <div style={infoBoxStyle}>{t.note}</div>
      <p style={helpTextStyle}>
        {t.help}{' '}
        <a href={`mailto:${supportEmail}`} style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          {supportEmail}
        </a>
      </p>
    </EmailLayout>
  )
}
