import { EmailLayout } from '../EmailLayout'

type ConfirmSignupEmailProps = {
  confirmationUrl: string
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

export default function ConfirmSignupEmail({
  confirmationUrl,
  locale = 'es',
}: ConfirmSignupEmailProps) {
  const content = {
    es: {
      title: 'Confirma tu registro en LEAD Mindset ✓',
      greeting: '¡Hola! 👋',
      intro: 'Gracias por registrarte en LEAD Mindset. Estamos emocionados de tenerte como parte de nuestra comunidad.',
      cta: 'Solo necesitamos verificar tu correo electrónico para completar tu registro.',
      ctaBold: 'Haz clic en el botón a continuación para confirmar tu cuenta:',
      button: '✓ Confirmar mi correo',
      note: 'Este enlace expira en 24 horas. Si no solicitaste este registro, puedes ignorar este mensaje de forma segura.',
      help: '¿Necesitas ayuda? Contáctanos en',
    },
    en: {
      title: 'Confirm your registration ✓',
      greeting: 'Hi! 👋',
      intro: 'Thanks for signing up for LEAD Mindset. We are excited to have you as part of our community.',
      cta: 'We just need to verify your email address to complete your registration.',
      ctaBold: 'Click the button below to confirm your account:',
      button: '✓ Confirm my email',
      note: 'This link expires in 24 hours. If you did not sign up, you can safely ignore this message.',
      help: 'Need help? Contact us at',
    },
  }[locale]

  return (
    <EmailLayout title={content.title}>
      <p style={{ fontSize: 16, marginBottom: 20 }}>{content.greeting}</p>

      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
        {content.intro.split('LEAD Mindset').map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>{part}<strong>LEAD Mindset</strong></span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>

      <p style={{ marginBottom: 24, lineHeight: 1.7 }}>
        {content.cta} <strong>{content.ctaBold}</strong>
      </p>

      <div style={{ margin: '32px 0', textAlign: 'center' }}>
        <a href={confirmationUrl} style={BUTTON_STYLES}>
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
        <strong>Nota:</strong> {content.note}
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