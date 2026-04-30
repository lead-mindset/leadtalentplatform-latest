import {
  EmailLayout,
  EMAIL_COLORS as C,
  buttonStyle,
  infoBoxStyle,
  helpTextStyle,
} from '../EmailLayout'

type ApplicationApprovedEmailProps = {
  name: string
  eventTitle: string
  eventDate: string
  eventLocation?: string | null
  meetingUrl?: string | null
  eventType: string
  qrUrl: string
  eventsUrl: string
  locale?: 'en' | 'es'
}

export default function ApplicationApprovedEmail({
  name,
  eventTitle,
  eventDate,
  eventLocation,
  meetingUrl,
  eventType,
  qrUrl,
  eventsUrl,
  locale = 'es',
}: ApplicationApprovedEmailProps) {
  const isOnline = eventType === 'online'
  const isHybrid = eventType === 'hybrid'

  const t = {
    es: {
      title: '¡Estás dentro! Solicitud aprobada',
      preview: `¡Buenas noticias! Tu solicitud para ${eventTitle} ha sido aprobada.`,
      greeting: `¡Hola, ${name}!`,
      intro: `¡Excelentes noticias! Tu solicitud para <strong>${eventTitle}</strong> ha sido aprobada.`,
      eventDetails: 'Detalles del evento:',
      date: 'Fecha:',
      location: 'Ubicación:',
      meetingLink: 'Enlace de reunión:',
      qrTitle: 'Tu código QR para check-in:',
      qrDesc: 'Accede a tu código QR en la plataforma LEAD para hacer check-in en el evento.',
      qrButton: 'Ver mi código QR',
      lookingForward: '¡Esperamos verte en el evento!',
      closing: 'Gracias por tu participación.',
      signature: 'Equipo LEAD',
      help: '¿Necesitas ayuda?',
    },
    en: {
      title: 'You\'re In! Application Approved',
      preview: `Good news! Your application for ${eventTitle} has been approved.`,
      greeting: `Hi, ${name}!`,
      intro: `Great news! Your application for <strong>${eventTitle}</strong> has been approved.`,
      eventDetails: 'Event Details:',
      date: 'Date:',
      location: 'Location:',
      meetingLink: 'Meeting Link:',
      qrTitle: 'Your QR Code for Check-in:',
      qrDesc: 'Access your QR code in the LEAD platform to check in at the event.',
      qrButton: 'View My QR Code',
      lookingForward: 'We look forward to seeing you at the event!',
      closing: 'Thank you for your participation.',
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
            <strong style={{ color: C.primary }}>{t.date}</strong> {eventDate}
          </p>
          {!isOnline && eventLocation && (
            <p style={{ margin: '0 0 8px 0' }}>
              <strong style={{ color: C.primary }}>{t.location}</strong> {eventLocation}
            </p>
          )}
          {(isOnline || isHybrid) && meetingUrl && (
            <p style={{ margin: 0 }}>
              <strong style={{ color: C.primary }}>{t.meetingLink}</strong>{' '}
              <a href={meetingUrl} style={{ color: C.primary, textDecoration: 'underline' }}>
                Unirse al evento
              </a>
            </p>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: C.primaryLight,
        border: `1px solid ${C.primaryBorder}`,
        borderRadius: 8,
        padding: '20px',
        margin: '24px 0',
        textAlign: 'center',
      }}>
        <p style={{
          margin: '0 0 12px 0',
          fontSize: 16,
          fontWeight: 700,
          color: C.foreground,
        }}>
          {t.qrTitle}
        </p>
        <p style={{
          margin: '0 0 16px 0',
          fontSize: 14,
          color: C.muted,
        }}>
          {t.qrDesc}
        </p>
        {qrUrl && (
          <a href={qrUrl} style={buttonStyle}>{t.qrButton}</a>
        )}
      </div>

      {eventsUrl && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a href={eventsUrl} style={buttonStyle}>
            {locale === 'es' ? 'Ir a mis eventos' : 'Go to My Events'}
          </a>
        </div>
      )}

      <p style={{ marginTop: 28, marginBottom: 4 }}>{t.lookingForward}</p>
      <p style={{ marginTop: 16, marginBottom: 4 }}>{t.closing}</p>
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
