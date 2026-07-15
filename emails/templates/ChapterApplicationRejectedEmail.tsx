import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, mb, my, Greeting, ButtonRow, HelpFooter, buttonStyle } from '../EmailLayout'

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
      title: 'Actualización de solicitud de capítulo',
      preview: `Actualización sobre tu solicitud para ${chapterName}.`,
      greeting: `Hola, ${name}`,
      intro: 'Gracias por tu interés en formar parte del capítulo. Esta vez tu solicitud no fue aprobada.',
      chapter: 'Capítulo',
      body: 'Puedes seguir participando en eventos y mantener tu perfil actualizado desde la plataforma.',
      button: 'Ver mi dashboard',
      signature: 'Equipo LEAD Americas',
      help: '¿Necesitas ayuda?',
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
      <Greeting>{t.greeting}</Greeting>
      <p style={{ margin: mb.xxl }}>{t.intro}</p>
      <p style={{ margin: mb.xxl }}><strong>{t.chapter}:</strong> {chapterName}</p>
      <p style={{ margin: mb.xxl }}>{t.body}</p>
      <ButtonRow>
        <a href={dashboardUrl} style={buttonStyle}>{t.button}</a>
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
