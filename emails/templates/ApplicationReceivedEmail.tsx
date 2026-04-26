import {
  EmailLayout,
  EMAIL_COLORS as C,
  buttonStyle,
  infoBoxStyle,
  helpTextStyle,
} from '../EmailLayout'

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
      preview: `Tu solicitud para ${eventTitle} ha sido recibida y está bajo revisión.`,
      greeting: `¡Hola, ${name}!`,
      intro: `Tu solicitud para <strong>${eventTitle}</strong> ha sido recibida y está siendo revisada por los editores del capítulo.`,
      eventDetails: 'Detalles del evento:',
      chapter: 'Capítulo:',
      nextSteps: 'Próximos pasos:',
      nextStepsDesc: 'Recibirás un correo electrónico una vez que se haya tomado una decisión sobre tu solicitud.',
      tracking: 'Puedes seguir el estado de todas tus solicitudes en la pestaña "Pendientes" de tu dashboard de eventos.',
      button: 'Ver mis eventos',
      closing: 'Gracias por tu interés en participar en nuestros eventos.',
      signature: 'Equipo LEAD',
      help: '¿Necesitas ayuda?',
    },
    en: {
      title: 'Event Application Received',
      preview: `Your application for ${eventTitle} has been received and is under review.`,
      greeting: `Hi, ${name}!`,
      intro: `Your application for <strong>${eventTitle}</strong> has been received and is under review by the chapter editors.`,
      eventDetails: 'Event Details:',
      chapter: 'Chapter:',
      nextSteps: 'Next Steps:',
      nextStepsDesc: 'You will receive an email once a decision has been made on your application.',
      tracking: 'You can track the status of all your applications in the "Pending" tab of your events dashboard.',
      button: 'View My Events',
      closing: 'Thank you for your interest in participating in our events.',
      signature: 'LEAD Team',
      help: 'Need help?',
    },
  }[locale]

  return (
    <EmailLayout title={t.title} preview={t.preview}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: C.foreground }}>
        {t.greeting} 
      </p>

      <p style={{ margin: '0 0 24px 0' }}>
        {t.intro}
      </p>

      <div style={{
        backgroundColor: C.mutedBg,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '20px',
        margin: '24px 0',
      }}>
        <p style={{
          margin: '0 0 12px 0',
          fontSize: 14,
          fontWeight: 700,
          color: C.foreground,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {t.eventDetails}
        </p>
        <div style={{ fontSize: 15, lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong style={{ color: C.primary }}>Evento:</strong> {eventTitle}
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: C.primary }}>{t.chapter}</strong> {chapter_name}
          </p>
        </div>
      </div>

      <div style={infoBoxStyle}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
          {t.nextSteps}
        </p>
        <p style={{ margin: 0 }}>
          {t.nextStepsDesc}
        </p>
      </div>

      <p style={{ margin: '24px 0 0 0', fontSize: 15, lineHeight: 1.6 }}>
        {t.tracking}
      </p>

      {eventsUrl && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a href={eventsUrl} style={buttonStyle}>{t.button}</a>
        </div>
      )}

      <p style={{ marginTop: 28, marginBottom: 4 }}>{t.closing}</p>
      <p style={{ margin: 0, fontWeight: 600, color: C.foreground }}>&mdash; {t.signature}</p>

      <p style={helpTextStyle}>
        {t.help}{' '}
        <a href="mailto:soporte@leadmindset.org" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
          soporte@leadmindset.org
        </a>
      </p>
    </EmailLayout>
  )
}
