import { EmailLayout } from '../EmailLayout'

type ConfirmSignupEmailProps = {
  confirmationUrl: string
}

export default function ConfirmSignupEmail({
  confirmationUrl,
}: ConfirmSignupEmailProps) {
  return (
    <EmailLayout title="Confirma tu registro en LEAD Mindset">
      <p>Hola 👋</p>

      <p>
        Gracias por registrarte en <strong>LEAD Mindset</strong>.
        Estás a un solo paso de activar tu cuenta.
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
          Confirmar mi correo
        </a>
      </p>

      <p>
        Si tú no realizaste este registro, puedes ignorar este mensaje.
      </p>
    </EmailLayout>
  )
}