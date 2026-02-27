import {
  EmailLayout,
  EMAIL_COLORS as C,
  buttonStyle,
  infoBoxStyle,
  helpTextStyle,
} from '../EmailLayout'

type ConfirmSignupEmailProps = {
  confirmationUrl: string
  locale?: 'en' | 'es'
}

export default function ConfirmSignupEmail({ confirmationUrl, locale = 'es' }: ConfirmSignupEmailProps) {
  const t = {
    es: {
      title: 'Confirma tu registro ✓',
      preview: 'Un último paso para activar tu cuenta en LEAD Mindset.',
      greeting: '¡Hola! 👋',
      intro: 'Gracias por registrarte en LEAD Mindset. Estamos emocionados de tenerte como parte de nuestra comunidad.',
      cta: 'Solo un paso más — confirma tu correo electrónico para activar tu cuenta:',
      button: '✓ Confirmar mi correo',
      noteTitle: 'Importante',
      note: 'Este enlace expira en 24 horas. Si no realizaste este registro, puedes ignorar este mensaje de forma segura.',
      help: '¿Necesitas ayuda? Contáctanos en',
    },
    en: {
      title: 'Confirm your registration ✓',
      preview: 'One last step to activate your LEAD Mindset account.',
      greeting: 'Hi! 👋',
      intro: 'Thanks for signing up for LEAD Mindset. We are excited to have you as part of our community.',
      cta: 'Just one more step — confirm your email address to activate your account:',
      button: '✓ Confirm my email',
      noteTitle: 'Important',
      note: 'This link expires in 24 hours. If you did not sign up, you can safely ignore this message.',
      help: 'Need help? Contact us at',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting}
      </p>

      <p style={{ margin: '0 0 20px 0' }}>
        {t.intro.split('LEAD Mindset').map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>{part}<strong style={{ color: C.primary }}>LEAD Mindset</strong></span>
          ) : <span key={i}>{part}</span>
        )}
      </p>

      <p style={{ margin: '0 0 28px 0', color: C.muted }}>{t.cta}</p>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={confirmationUrl} style={buttonStyle}>{t.button}</a>
      </div>

      <div style={infoBoxStyle}>
        <strong>📋 {t.noteTitle}:</strong>{' '}{t.note}
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