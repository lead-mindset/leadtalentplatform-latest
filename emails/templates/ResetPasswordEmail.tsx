import { EmailLayout } from '../EmailLayout'

type ResetPasswordEmailProps = {
  resetUrl: string
}

export default function ResetPasswordEmail({
  resetUrl,
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout title="Restablece tu contraseña">
      <p>Hola 👋</p>

      <p>
        Recibimos una solicitud para restablecer la contraseña de tu cuenta
        en <strong>LEAD Mindset</strong>.
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
          Restablecer contraseña
        </a>
      </p>

      <p>
        Si no solicitaste este cambio, puedes ignorar este correo.
      </p>
    </EmailLayout>
  )
}