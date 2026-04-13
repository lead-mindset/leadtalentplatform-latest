import {
  EmailLayout,
  EMAIL_COLORS as C,
  buttonStyle,
  infoBoxStyle,
  helpTextStyle,
} from '../EmailLayout'

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
      preview: `Actualización sobre tu solicitud para ${eventTitle}`,
      greeting: `¡Hola, ${name}!`,
      intro: `Gracias por tu interés en <strong>${eventTitle}</strong>.`,
      eventDetails: 'Detalles del evento:',
      chapter: 'Capítulo:',
      decision: 'Después de una cuidadosa consideración, lamentamos informarte que tu solicitud no fue seleccionada para este evento.',
      encouragement: '¡No te desanimes! Hay muchas más oportunidades para participar en LEAD:',
      opportunities: [
        'Revisa otros eventos próximos',
        'Completa tu perfil para aumentar tu visibilidad',
        'Conéctate con tu capítulo para otras oportunidades',
      ],
      button: 'Explorar más eventos',
      closing: 'Te animamos a seguir explorando y aplicando para eventos futuros.',
      signature: 'Equipo LEAD',
      help: '¿Necesitas ayuda?',
    },
    en: {
      title: 'Application Update',
      preview: `Update on your application for ${eventTitle}`,
      greeting: `Hi, ${name}!`,
      intro: `Thank you for your interest in <strong>${eventTitle}</strong>.`,
      eventDetails: 'Event Details:',
      chapter: 'Chapter:',
      decision: 'After careful consideration, we regret to inform you that your application was not selected for this event.',
      encouragement: 'Don\'t let this discourage you! There are many more opportunities to get involved with LEAD:',
      opportunities: [
        'Check out other upcoming events',
        'Complete your profile to increase visibility',
        'Connect with your chapter for other opportunities',
      ],
      button: 'Browse More Events',
      closing: 'We encourage you to keep exploring and applying for future events!',
      signature: 'LEAD Team',
      help: 'Need help?',
    },
  }[locale]

  const lastIdx = t.opportunities.length - 1

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
            <strong style={{ color: C.primary }}>{t.chapter}</strong> {chapterName}
          </p>
        </div>
      </div>

      <div style={{
        backgroundColor: '#fef2f2',
        border: `1px solid #fecaca`,
        borderRadius: 8,
        padding: '20px',
        margin: '24px 0',
      }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
          {t.decision}
        </p>
      </div>

      <div style={{ margin: '24px 0' }}>
        <p style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: C.foreground }}>
          {t.encouragement}
        </p>
        <div style={{ fontSize: 15, lineHeight: 1.6 }}>
          {t.opportunities.map((opportunity, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: i === lastIdx ? 0 : '12px',
              paddingBottom: i === lastIdx ? 0 : '12px',
              borderBottom: i === lastIdx ? 'none' : `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 18, color: C.primary, marginTop: '2px' }}>{'\u2022'}</span>
              <span style={{ color: C.foreground }}>{opportunity}</span>
            </div>
          ))}
        </div>
      </div>

      {eventsUrl && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a href={eventsUrl} style={{
            ...buttonStyle,
            backgroundColor: C.muted,
            boxShadow: 'none',
          }}>{t.button}</a>
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
