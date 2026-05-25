import {
  EmailLayout,
  EMAIL_COLORS as C,
  SUPPORT_EMAIL,
  buttonStyle,
  helpTextStyle,
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
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting}
      </p>
      <p style={{ margin: '0 0 16px 0' }}>{t.body}</p>
      <p style={{ margin: '0 0 28px 0', color: C.muted }}>{t.cta}</p>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={resetUrl} style={buttonStyle}>{t.button}</a>
      </div>
      <div style={infoBoxStyle}>
        <strong>{t.securityTitle}:</strong> {t.security}
      </div>
      <p style={helpTextStyle}>
        {t.help}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          {SUPPORT_EMAIL}
        </a>
      </p>
    </EmailLayout>
  )
}
