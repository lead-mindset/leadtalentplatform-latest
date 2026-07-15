import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, mb, Greeting, ButtonRow, ClosingSignature, HelpFooter, buttonStyle, detailBoxStyle, infoBoxStyle } from '../EmailLayout'

type ApplicationReceivedEmailProps = {
  name: string
  eventTitle: string
  chapterName: string
  eventsUrl: string
  locale?: 'en' | 'es'
}

export default function ApplicationReceivedEmail({
  name,
  eventTitle,
  chapterName,
  eventsUrl,
  locale = 'es',
}: ApplicationReceivedEmailProps) {
  const t = {
    es: {
      title: 'Solicitud de evento recibida',
      preview: `Recibimos tu solicitud para ${eventTitle}.`,
      greeting: `Hola, ${name}`,
      intro: 'Tu solicitud fue recibida y será revisada por el equipo del evento.',
      event: 'Evento',
      chapter: 'Capítulo',
      nextTitle: 'Próximo paso',
      next: 'Te enviaremos un correo cuando haya una decisión.',
      button: 'Ver mis eventos',
      closing: 'Gracias por tu interés en participar.',
      signature: 'Equipo LEAD Americas',
      help: '¿Necesitas ayuda?',
    },
    en: {
      title: 'Event application received',
      preview: `We received your application for ${eventTitle}.`,
      greeting: `Hi, ${name}`,
      intro: 'Your application was received and will be reviewed by the event team.',
      event: 'Event',
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
      <Greeting>{t.greeting}</Greeting>
      <p style={{ margin: mb.xxl }}>{t.intro}</p>
      <div style={detailBoxStyle}>
        <p style={{ margin: '0 0 8px 0' }}><strong>{t.event}:</strong> {eventTitle}</p>
        <p style={{ margin: 0 }}><strong>{t.chapter}:</strong> {chapterName}</p>
      </div>
      <div style={infoBoxStyle}>
        <strong>{t.nextTitle}:</strong> {t.next}
      </div>
      <ButtonRow>
        <a href={eventsUrl} style={buttonStyle}>{t.button}</a>
      </ButtonRow>
      <ClosingSignature closing={t.closing} signature={t.signature} />
      <HelpFooter>
        {t.help}{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          {SUPPORT_EMAIL}
        </a>
      </HelpFooter>
    </EmailLayout>
  )
}
