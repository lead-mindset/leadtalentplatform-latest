import {
  EmailLayout,
  EMAIL_COLORS as C,
  buttonStyle,
  infoBoxStyle,
  helpTextStyle,
} from '../EmailLayout'

type ResetPasswordEmailProps = {
  resetUrl: string
  locale?: 'en' | 'es'
}

export default function ResetPasswordEmail({ resetUrl, locale = 'es' }: ResetPasswordEmailProps) {
  const t = {
    es: {
      title: 'Restablecer tu contraseña 🔐',
      preview: 'Solicitud para restablecer tu contraseña de LEAD Mindset.',
      greeting: '¡Hola! 👋',
      body: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta en LEAD Mindset.',
      cta: 'Para crear una nueva contraseña, haz clic en el botón a continuación:',
      button: '🔐 Restablecer contraseña',
      securityTitle: 'Aviso de seguridad',
      security: 'Este enlace expira en 1 hora. Nunca compartiremos tu contraseña por correo. Si no solicitaste este cambio, ignora este mensaje — tu cuenta sigue segura.',
      help: '¿Aún tienes problemas? Escríbenos a',
    },
    en: {
      title: 'Reset your password 🔐',
      preview: 'Password reset request for your LEAD Mindset account.',
      greeting: 'Hi! 👋',
      body: 'We received a request to reset the password for your LEAD Mindset account.',
      cta: 'To create a new password, click the button below:',
      button: '🔐 Reset password',
      securityTitle: 'Security notice',
      security: 'This link expires in 1 hour. We will never share your password by email. If you did not request this change, ignore this message — your account remains secure.',
      help: 'Still having trouble? Email us at',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting}
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        {t.body.split('LEAD Mindset').map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>{part}<strong style={{ color: C.primary }}>LEAD Mindset</strong></span>
          ) : <span key={i}>{part}</span>
        )}
      </p>

      <p style={{ margin: '0 0 28px 0', color: C.muted }}>{t.cta}</p>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={resetUrl} style={buttonStyle}>{t.button}</a>
      </div>

      <div style={infoBoxStyle}>
        <strong>🔒 {t.securityTitle}:</strong>{' '}{t.security}
      </div>

      <p style={helpTextStyle}>
        {t.help}{' '}
        <a href="mailto:soporte@leadmindset.org" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          soporte@leadmindset.org
        </a>
      </p>
    </EmailLayout>
  )
}