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

type ConfirmSignupEmailProps = {
  confirmationUrl: string
  locale?: 'en' | 'es'
}

export default function ConfirmSignupEmail({ confirmationUrl, locale = 'es' }: ConfirmSignupEmailProps) {
  const t = {
    es: {
      title: 'Confirma tu cuenta',
      preview: 'Activa tu cuenta en LEAD Talent Platform.',
      greeting: 'Hola',
      intro: 'Gracias por registrarte en LEAD Talent Platform, la plataforma de LEAD Americas para eventos, comunidad y oportunidades.',
      cta: 'Confirma tu correo para activar tu cuenta y continuar con tu perfil.',
      button: 'Confirmar mi correo',
      noteTitle: 'Importante',
      note: 'Este enlace expira por seguridad. Si no creaste esta cuenta, puedes ignorar este mensaje.',
      help: '¿Necesitas ayuda? Escríbenos a',
    },
    en: {
      title: 'Confirm your account',
      preview: 'Activate your LEAD Talent Platform account.',
      greeting: 'Hi',
      intro: 'Thanks for signing up for LEAD Talent Platform, the LEAD Americas platform for events, community, and opportunities.',
      cta: 'Confirm your email to activate your account and continue with your profile.',
      button: 'Confirm my email',
      noteTitle: 'Important',
      note: 'This link expires for security. If you did not create this account, you can ignore this message.',
      help: 'Need help? Email us at',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <Greeting>{t.greeting}</Greeting>
      <p style={{ margin: mb.xxl }}>{t.intro}</p>
      <p style={{ margin: mb.xxl, color: C.muted }}>{t.cta}</p>
      <ButtonRow>
        <a href={confirmationUrl} style={buttonStyle}>{t.button}</a>
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
