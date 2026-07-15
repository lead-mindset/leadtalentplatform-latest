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

type ResetPasswordEmailProps = {
  resetUrl: string
  locale?: 'en' | 'es'
}

export default function ResetPasswordEmail({ resetUrl, locale = 'es' }: ResetPasswordEmailProps) {
  const t = {
    es: {
      title: 'Restablece tu contraseña',
      preview: 'Solicitud para restablecer tu contraseña en LEAD Talent Platform.',
      greeting: 'Hola',
      body: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta en LEAD Talent Platform.',
      cta: 'Usa este enlace seguro para crear una nueva contraseña.',
      button: 'Restablecer contraseña',
      securityTitle: 'Seguridad',
      security: 'Si no solicitaste este cambio, ignora este mensaje. Tu cuenta sigue protegida.',
      help: '¿Necesitas ayuda? Escríbenos a',
    },
    en: {
      title: 'Reset your password',
      preview: 'Password reset request for LEAD Talent Platform.',
      greeting: 'Hi',
      body: 'We received a request to reset the password for your LEAD Talent Platform account.',
      cta: 'Use this secure link to create a new password.',
      button: 'Reset password',
      securityTitle: 'Security',
      security: 'If you did not request this change, ignore this message. Your account remains protected.',
      help: 'Need help? Email us at',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <Greeting>{t.greeting}</Greeting>
      <p style={{ margin: mb.lg }}>{t.body}</p>
      <p style={{ margin: mb.xxl, color: C.muted }}>{t.cta}</p>
      <ButtonRow>
        <a href={resetUrl} style={buttonStyle}>{t.button}</a>
      </ButtonRow>
      <div style={infoBoxStyle}>
        <strong>{t.securityTitle}:</strong> {t.security}
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
