import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, mb, Greeting, ButtonRow, HelpFooter, buttonStyle, detailBoxStyle, infoBoxStyle } from '../EmailLayout'

type EventRegistrationConfirmedEmailProps = {
  name: string
  eventTitle: string
  eventDate: string
  eventLocation?: string | null
  meetingUrl?: string | null
  eventType: string
  eventsUrl: string
  locale?: 'en' | 'es'
}

export default function EventRegistrationConfirmedEmail({
  name,
  eventTitle,
  eventDate,
  eventLocation,
  meetingUrl,
  eventType,
  eventsUrl,
  locale = 'es',
}: EventRegistrationConfirmedEmailProps) {
  const isOnline = eventType === 'online'
  const isHybrid = eventType === 'hybrid'
  const t = {
    es: {
      title: 'Registro confirmado',
      preview: `Tu registro para ${eventTitle} está confirmado.`,
      greeting: `Hola, ${name}`,
      intro: 'Tu registro fue confirmado. Puedes revisar los detalles y tu código QR desde la plataforma.',
      event: 'Evento',
      date: 'Fecha',
      location: 'Lugar',
      meetingLink: 'Enlace',
      qr: 'Tu código QR estará disponible en Mis eventos.',
      button: 'Ver mis eventos',
      signature: 'Equipo LEAD Americas',
      help: '¿Necesitas ayuda?',
    },
    en: {
      title: 'Registration confirmed',
      preview: `Your registration for ${eventTitle} is confirmed.`,
      greeting: `Hi, ${name}`,
      intro: 'Your registration was confirmed. You can review details and your QR code from the platform.',
      event: 'Event',
      date: 'Date',
      location: 'Location',
      meetingLink: 'Link',
      qr: 'Your QR code will be available in My events.',
      button: 'View my events',
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
        <p style={{ margin: '0 0 8px 0' }}><strong>{t.date}:</strong> {eventDate}</p>
        {!isOnline && eventLocation && <p style={{ margin: '0 0 8px 0' }}><strong>{t.location}:</strong> {eventLocation}</p>}
        {(isOnline || isHybrid) && meetingUrl && (
          <p style={{ margin: 0 }}>
            <strong>{t.meetingLink}:</strong>{' '}
            <a href={meetingUrl} style={{ color: C.primary }}>Unirse al evento</a>
          </p>
        )}
      </div>
      <div style={infoBoxStyle}>{t.qr}</div>
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
