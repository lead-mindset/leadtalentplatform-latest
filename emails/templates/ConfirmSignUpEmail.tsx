import { EmailLayout } from '../EmailLayout'

type ConfirmSignupEmailProps = {
  confirmationUrl: string
  locale?: 'en' | 'es'
}

export default function ConfirmSignupEmail({
  confirmationUrl,
  locale = 'es'
}: ConfirmSignupEmailProps) {
  const content = {
    es: {
      title: "Confirma tu registro en LEAD Mindset",
      greeting: "Hola 👋",
      body: "Gracias por registrarte en LEAD Mindset. Estás a un solo paso de activar tu cuenta.",
      button: "Confirmar mi correo",
      footer: "Si tú no realizaste este registro, puedes ignorar este mensaje."
    },
    en: {
      title: "Confirm your registration",
      greeting: "Hi 👋",
      body: "Thanks for signing up for LEAD Mindset. You're just one step away from activating your account.",
      button: "Confirm my email",
      footer: "If you didn't sign up, you can ignore this message."
    }
  }[locale];

  return (
    <EmailLayout title={content.title}>
      <p>{content.greeting}</p>

      <p>
        {content.body.includes('LEAD Mindset') ? (
          <>
            {content.body.split('LEAD Mindset')[0]}
            <strong>LEAD Mindset</strong>
            {content.body.split('LEAD Mindset')[1]}
          </>
        ) : (
          content.body
        )}
      </p>

      <p style={{ margin: '24px 0' }}>
        <a
          href={confirmationUrl}
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 6,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          {content.button}
        </a>
      </p>

      <p>
        {content.footer}
      </p>
    </EmailLayout>
  )
}