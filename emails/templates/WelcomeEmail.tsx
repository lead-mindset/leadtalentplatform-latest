import { EmailLayout } from '../EmailLayout'

type WelcomeEmailProps = {
  dashboardUrl?: string
  locale?: 'en' | 'es'
}

export default function WelcomeEmail({
  dashboardUrl,
  locale = 'es'
}: WelcomeEmailProps) {
  const content = {
    es: {
      title: "Bienvenido/a a LEAD Mindset 🚀",
      greeting: "Hola 👋",
      intro: "Tu cuenta en LEAD Mindset ya está activa. Nos alegra tenerte como parte de una comunidad enfocada en liderazgo, mentalidad y crecimiento continuo.",
      listTitle: "Desde LEAD Platform podrás:",
      listItems: [
        "Acceder a contenidos y experiencias exclusivas",
        "Conectar con personas con mentalidad de crecimiento",
        "Desarrollar habilidades clave para tu futuro profesional"
      ],
      button: "Ir a la plataforma",
      closing: "Gracias por ser parte de este camino.",
      signature: "Equipo LEAD Mindset"
    },
    en: {
      title: "Welcome to LEAD Mindset 🚀",
      greeting: "Hi 👋",
      intro: "Your LEAD Mindset account is now active. We're thrilled to have you as part of a community focused on leadership, mindset, and continuous growth.",
      listTitle: "With LEAD Platform you can:",
      listItems: [
        "Access exclusive content and experiences",
        "Connect with growth-minded people",
        "Develop key skills for your professional future"
      ],
      button: "Go to platform",
      closing: "Thanks for being part of this journey.",
      signature: "LEAD Mindset Team"
    }
  }[locale];

  return (
    <EmailLayout title={content.title}>
      <p>{content.greeting}</p>

      <p>
        {content.intro.includes('LEAD Mindset') ? (
          <>
            {content.intro.split('LEAD Mindset')[0]}
            <strong>LEAD Mindset</strong>
            {content.intro.split('LEAD Mindset')[1]}
          </>
        ) : (
          content.intro
        )}
      </p>

      <p>
        {content.listTitle}
      </p>

      <ul style={{ paddingLeft: 20 }}>
        {content.listItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      {dashboardUrl && (
        <p style={{ margin: '24px 0' }}>
          <a
            href={dashboardUrl}
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
      )}

      <p>
        {content.closing}
      </p>

      <p>
        — {content.signature.includes('LEAD Mindset') ? (
          <>
            {content.signature.split('LEAD Mindset')[0]}
            <strong>LEAD Mindset</strong>
            {content.signature.split('LEAD Mindset')[1]}
          </>
        ) : (
          content.signature
        )}
      </p>
    </EmailLayout>
  )
}