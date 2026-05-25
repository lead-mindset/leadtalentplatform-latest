import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, buttonStyle, detailBoxStyle, helpTextStyle, infoBoxStyle } from '../EmailLayout'

type ApplicationReceivedEmailProps = {
  name: string
  eventTitle: string
  chapter_name: string
  eventsUrl: string
  locale?: 'en' | 'es'
}

export default function ApplicationReceivedEmail({
  name,
  eventTitle,
  chapter_name,
  eventsUrl,
  locale = 'es',
}: ApplicationReceivedEmailProps) {
  const t = {
    es: {
      title: 'Solicitud de evento recibida',
      preview: `Recibimos tu solicitud para ${eventTitle}.`,
      greeting: `Hola, ${name}`,
      intro: 'Tu solicitud fue recibida y sera revisada por el equipo del evento.',
      chapter: 'Capitulo',
      nextTitle: 'Proximo paso',
      next: 'Te enviaremos un correo cuando haya una decision.',
      button: 'Ver mis eventos',
      closing: 'Gracias por tu interes en participar.',
      signature: 'Equipo LEAD Americas',
      help: 'Necesitas ayuda?',
    },
    en: {
      title: 'Event application received',
      preview: `We received your application for ${eventTitle}.`,
      greeting: `Hi, ${name}`,
      intro: 'Your application was received and will be reviewed by the event team.',
      chapter: 'Chapter',
      nextTitle: 'Next step',
      next: 'We will email you when there is a decision.',
      button: 'View my events',
      closing: 'Thanks for your interest in participating.',
      signature: 'LEAD Americas Team',
      help: 'Need help?',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting}
      </p>
      <p style={{ margin: '0 0 20px 0' }}>{t.intro}</p>
      <div style={detailBoxStyle}>
        <p style={{ margin: '0 0 8px 0' }}><strong>Evento:</strong> {eventTitle}</p>
        <p style={{ margin: 0 }}><strong>{t.chapter}:</strong> {chapter_name}</p>
      </div>
      <div style={infoBoxStyle}>
        <strong>{t.nextTitle}:</strong> {t.next}
      </div>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={eventsUrl} style={buttonStyle}>{t.button}</a>
      </div>
      <p style={{ marginTop: 28, marginBottom: 4 }}>{t.closing}</p>
      <p style={{ margin: 0, fontWeight: 600, color: C.foreground }}>{t.signature}</p>
      <p style={helpTextStyle}>
        {t.help}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          {SUPPORT_EMAIL}
        </a>
      </p>
    </EmailLayout>
  )
}
