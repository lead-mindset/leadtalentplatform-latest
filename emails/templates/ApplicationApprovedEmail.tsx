import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, buttonStyle, detailBoxStyle, helpTextStyle, infoBoxStyle } from '../EmailLayout'

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
      title: 'Solicitud aprobada',
      preview: `Tu solicitud para ${eventTitle} fue aprobada.`,
      greeting: `Hola, ${name}`,
      intro: 'Tu solicitud fue aprobada. Ya puedes revisar los detalles y tu codigo QR.',
      date: 'Fecha',
      location: 'Lugar',
      meetingLink: 'Enlace',
      qrTitle: 'Tu codigo QR',
      qrDesc: 'Usa tu codigo QR desde LEAD Talent Platform para hacer check-in.',
      qrButton: 'Ver codigo QR',
      eventsButton: 'Ir a mis eventos',
      closing: 'Te esperamos en el evento.',
      signature: 'Equipo LEAD Americas',
      help: 'Necesitas ayuda?',
    },
    en: {
      title: 'Application approved',
      preview: `Your application for ${eventTitle} was approved.`,
      greeting: `Hi, ${name}`,
      intro: 'Your application was approved. You can now review details and your QR code.',
      date: 'Date',
      location: 'Location',
      meetingLink: 'Link',
      qrTitle: 'Your QR code',
      qrDesc: 'Use your QR code from LEAD Talent Platform to check in.',
      qrButton: 'View QR code',
      eventsButton: 'Go to my events',
      closing: 'We look forward to seeing you at the event.',
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
        <p style={{ margin: '0 0 8px 0' }}><strong>{t.date}:</strong> {eventDate}</p>
        {!isOnline && eventLocation && <p style={{ margin: '0 0 8px 0' }}><strong>{t.location}:</strong> {eventLocation}</p>}
        {(isOnline || isHybrid) && meetingUrl && (
          <p style={{ margin: 0 }}>
            <strong>{t.meetingLink}:</strong>{' '}
            <a href={meetingUrl} style={{ color: C.primary }}>Unirse al evento</a>
          </p>
        )}
      </div>
      <div style={infoBoxStyle}>
        <strong>{t.qrTitle}:</strong> {t.qrDesc}
      </div>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={qrUrl || eventsUrl} style={buttonStyle}>{t.qrButton}</a>
      </div>
      <div style={{ textAlign: 'center', margin: '0 0 32px 0' }}>
        <a href={eventsUrl} style={{ ...buttonStyle, backgroundColor: C.foreground, boxShadow: 'none' }}>{t.eventsButton}</a>
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
