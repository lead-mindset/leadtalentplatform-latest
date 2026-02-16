import { EmailLayout } from '../EmailLayout'

type ResetPasswordEmailProps = {
  resetUrl: string
  locale?: 'en' | 'es'
}

export default function ResetPasswordEmail({
  resetUrl,
  locale = 'es'
}: ResetPasswordEmailProps) {
  const content = {
    es: {
      title: "Restablece tu contraseña",
      greeting: "Hola 👋",
      body: "Recibimos una solicitud para restablecer la contraseña de tu cuenta en LEAD Mindset.",
      button: "Restablecer contraseña",
      footer: "Si no solicitaste este cambio, puedes ignorar este correo."
    },
    en: {
      title: "Reset your password",
      greeting: "Hi 👋",
      body: "We received a request to reset the password for your LEAD Mindset account.",
      button: "Reset password",
      footer: "If you didn't request this change, you can ignore this email."
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
          href={resetUrl}
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