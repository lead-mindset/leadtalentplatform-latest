import { EmailLayout } from '../EmailLayout'

type ResetPasswordEmailProps = {
  resetUrl: string
  locale?: 'en' | 'es'
}

const BUTTON_STYLES = {
  backgroundColor: '#3759E8',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: 8,
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: 600,
  fontSize: 15,
  letterSpacing: '0.5px',
  boxShadow: '0 4px 12px rgba(55, 89, 232, 0.3)',
}

export default function ResetPasswordEmail({
  resetUrl,
  locale = 'es',
}: ResetPasswordEmailProps) {
  const content = {
    es: {
      title: 'Restablecer tu contraseña 🔐',
      greeting: '¡Hola! 👋',
      body: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta en LEAD Mindset.',
      cta: 'Para crear una nueva contraseña, haz clic en el botón a continuación:',
      button: '🔐 Restablecer contraseña',
      security: 'Seguridad: Este enlace expira en 1 hora. Nunca compartiremos tu contraseña por correo electrónico. Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.',
      help: '¿Aún tienes problemas? Contacta a nuestro equipo en',
    },
    en: {
      title: 'Reset your password 🔐',
      greeting: 'Hi! 👋',
      body: 'We received a request to reset the password for your LEAD Mindset account.',
      cta: 'To create a new password, click the button below:',
      button: '🔐 Reset password',
      security: 'Security: This link expires in 1 hour. We will never share your password by email. If you did not request this change, you can safely ignore this message.',
      help: 'Still having trouble? Contact our team at',
    },
  }[locale]

  return (
    <EmailLayout title={content.title}>
      <p style={{ fontSize: 16, marginBottom: 20 }}>{content.greeting}</p>

      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
        {content.body.split('LEAD Mindset').map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>{part}<strong>LEAD Mindset</strong></span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>

      <p style={{ marginBottom: 24, lineHeight: 1.7 }}>{content.cta}</p>

      <div style={{ margin: '32px 0', textAlign: 'center' }}>
        <a href={resetUrl} style={BUTTON_STYLES}>
          {content.button}
        </a>
      </div>

      <p style={{
        backgroundColor: '#F8FAFF',
        padding: '16px',
        borderRadius: 6,
        borderLeft: '4px solid #3759E8',
        fontSize: 13,
        lineHeight: 1.6,
        marginTop: 24,
      }}>
        <strong>{content.security.split(':')[0]}:</strong>
        {content.security.slice(content.security.indexOf(':') + 1)}
      </p>

      <p style={{ marginTop: 24, fontSize: 13, color: '#8E95A5' }}>
        {content.help}{' '}
        <a href="mailto:soporte@leadmindset.org" style={{ color: '#3759E8', textDecoration: 'none' }}>
          soporte@leadmindset.org
        </a>
      </p>
    </EmailLayout>
  )
}