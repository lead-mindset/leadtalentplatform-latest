import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, buttonStyle, helpTextStyle } from '../EmailLayout'

type ChapterApplicationRejectedEmailProps = {
  name: string
  chapterName: string
  dashboardUrl: string
  locale?: 'en' | 'es'
}

export default function ChapterApplicationRejectedEmail({
  name,
  chapterName,
  dashboardUrl,
  locale = 'es',
}: ChapterApplicationRejectedEmailProps) {
  const t = {
    es: {
      title: 'Actualizacion de solicitud de capitulo',
      preview: `Actualizacion sobre tu solicitud para ${chapterName}.`,
      greeting: `Hola, ${name}`,
      intro: 'Gracias por tu interes en formar parte del capitulo. Esta vez tu solicitud no fue aprobada.',
      chapter: 'Capitulo',
      body: 'Puedes seguir participando en eventos y mantener tu perfil actualizado desde la plataforma.',
      button: 'Ver mi dashboard',
      signature: 'Equipo LEAD Americas',
      help: 'Necesitas ayuda?',
    },
    en: {
      title: 'Chapter application update',
      preview: `Update on your application for ${chapterName}.`,
      greeting: `Hi, ${name}`,
      intro: 'Thank you for your interest in joining the chapter. This time your application was not approved.',
      chapter: 'Chapter',
      body: 'You can continue joining events and keeping your profile updated from the platform.',
      button: 'View my dashboard',
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
      <p style={{ margin: '0 0 24px 0' }}><strong>{t.chapter}:</strong> {chapterName}</p>
      <p style={{ margin: '0 0 24px 0' }}>{t.body}</p>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={dashboardUrl} style={buttonStyle}>{t.button}</a>
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
