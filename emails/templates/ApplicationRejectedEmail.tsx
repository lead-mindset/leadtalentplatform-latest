import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, mb, Greeting, ButtonRow, HelpFooter, buttonStyle, detailBoxStyle } from '../EmailLayout'

type ApplicationRejectedEmailProps = {
  name: string
  eventTitle: string
  chapterName: string
  eventsUrl: string
  locale?: 'en' | 'es'
}

export default function ApplicationRejectedEmail({
  name,
  eventTitle,
  chapterName,
  eventsUrl,
  locale = 'es',
}: ApplicationRejectedEmailProps) {
  const t = {
    es: {
      title: 'Actualización de solicitud',
      preview: `Actualización sobre tu solicitud para ${eventTitle}.`,
      greeting: `Hola, ${name}`,
      intro: 'Gracias por tu interés. Esta vez tu solicitud no fue seleccionada para este evento.',
      event: 'Evento',
      chapter: 'Capítulo',
      body: 'Te animamos a seguir participando en nuevos eventos y oportunidades de LEAD Americas.',
      button: 'Explorar eventos',
      signature: 'Equipo LEAD Americas',
      help: '¿Necesitas ayuda?',
    },
    en: {
      title: 'Application update',
      preview: `Update on your application for ${eventTitle}.`,
      greeting: `Hi, ${name}`,
      intro: 'Thank you for your interest. This time your application was not selected for this event.',
      event: 'Event',
      chapter: 'Chapter',
      body: 'We encourage you to keep joining new LEAD Americas events and opportunities.',
      button: 'Browse events',
      signature: 'LEAD Americas Team',
      help: 'Need help?',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <Greeting>{t.greeting}</Greeting>
      <p style={{ margin: mb.xxl }}>{t.intro}</p>
      <div style={detailBoxStyle}>
        <p style={{ margin: '0 0 8px 0' }}><strong>{t.event}:</strong> {eventTitle}</p>
        <p style={{ margin: 0 }}><strong>{t.chapter}:</strong> {chapterName}</p>
      </div>
      <p style={{ margin: mb.xxl }}>{t.body}</p>
      <ButtonRow>
        <a href={eventsUrl} style={buttonStyle}>{t.button}</a>
      </ButtonRow>
      <p style={{ margin: 0, fontWeight: 600, color: C.foreground }}>{t.signature}</p>
      <HelpFooter>
        {t.help}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          {SUPPORT_EMAIL}
        </a>
      </HelpFooter>
    </EmailLayout>
  )
}
