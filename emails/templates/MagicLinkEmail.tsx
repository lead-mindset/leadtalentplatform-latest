import {
  EmailLayout,
  EMAIL_COLORS as C,
  SUPPORT_EMAIL,
  mb,
  Greeting,
  ButtonRow,
  HelpFooter,
  buttonStyle,
  infoBoxStyle,
} from '../EmailLayout'

type MagicLinkEmailProps = {
  magicLinkUrl: string
  locale?: 'en' | 'es'
}

export default function MagicLinkEmail({ magicLinkUrl, locale = 'es' }: MagicLinkEmailProps) {
  const t = {
    es: {
      title: 'Tu enlace de ingreso',
      preview: 'Accede a LEAD Talent Platform con este enlace seguro.',
      greeting: 'Hola',
      intro: 'Recibiste una solicitud para iniciar sesión en LEAD Talent Platform.',
      cta: 'Haz clic en el botón de abajo para acceder de forma segura.',
      button: 'Iniciar sesión',
      noteTitle: 'Importante',
      note: 'Este enlace expira en 1 hora por seguridad. Si no solicitaste este ingreso, puedes ignorar este mensaje.',
      help: '¿Necesitas ayuda? Escríbenos a',
    },
    en: {
      title: 'Your sign-in link',
      preview: 'Access LEAD Talent Platform with this secure link.',
      greeting: 'Hi',
      intro: 'You requested to sign in to LEAD Talent Platform.',
      cta: 'Click the button below to securely sign in.',
      button: 'Sign in',
      noteTitle: 'Important',
      note: 'This link expires in 1 hour for security. If you did not request this, you can ignore this message.',
      help: 'Need help? Email us at',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <Greeting>{t.greeting}</Greeting>
      <p style={{ margin: mb.xxl }}>{t.intro}</p>
      <p style={{ margin: mb.xxl, color: C.muted }}>{t.cta}</p>
      <ButtonRow>
        <a href={magicLinkUrl} style={buttonStyle}>{t.button}</a>
      </ButtonRow>
      <div style={infoBoxStyle}>
        <strong>{t.noteTitle}:</strong> {t.note}
      </div>
      <HelpFooter>
        {t.help}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          {SUPPORT_EMAIL}
        </a>
      </HelpFooter>
    </EmailLayout>
  )
}
