import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, buttonStyle, detailBoxStyle, helpTextStyle } from '../EmailLayout'

type ApplicationRejectedEmailProps = {
  name: string
  eventTitle: string
  chapter_name: string
  eventsUrl: string
  locale?: 'en' | 'es'
}

export default function ApplicationRejectedEmail({
  name,
  eventTitle,
  chapter_name,
  eventsUrl,
  locale = 'es',
}: ApplicationRejectedEmailProps) {
  const t = {
    es: {
      title: 'Actualizacion de solicitud',
      preview: `Actualizacion sobre tu solicitud para ${eventTitle}.`,
      greeting: `Hola, ${name}`,
      intro: 'Gracias por tu interes. Esta vez tu solicitud no fue seleccionada para este evento.',
      chapter: 'Capitulo',
      body: 'Te animamos a seguir participando en nuevos eventos y oportunidades de LEAD Americas.',
      button: 'Explorar eventos',
      signature: 'Equipo LEAD Americas',
      help: 'Necesitas ayuda?',
    },
    en: {
      title: 'Application update',
      preview: `Update on your application for ${eventTitle}.`,
      greeting: `Hi, ${name}`,
      intro: 'Thank you for your interest. This time your application was not selected for this event.',
      chapter: 'Chapter',
      body: 'We encourage you to keep joining new LEAD Americas events and opportunities.',
      button: 'Browse events',
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
      <p style={{ margin: '24px 0 0 0' }}>{t.body}</p>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={eventsUrl} style={buttonStyle}>{t.button}</a>
      </div>
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
