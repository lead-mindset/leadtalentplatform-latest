import { EmailLayout, EMAIL_COLORS as C, SUPPORT_EMAIL, buttonStyle, helpTextStyle, infoBoxStyle } from '../EmailLayout'

type ChapterApplicationSubmittedEmailProps = {
  name: string
  chapterName: string
  dashboardUrl: string
  locale?: 'en' | 'es'
}

export default function ChapterApplicationSubmittedEmail({
  name,
  chapterName,
  dashboardUrl,
  locale = 'es',
}: ChapterApplicationSubmittedEmailProps) {
  const t = {
    es: {
      title: 'Solicitud de capitulo recibida',
      preview: `Recibimos tu solicitud para ${chapterName}.`,
      greeting: `Hola, ${name}`,
      intro: 'Recibimos tu solicitud para formar parte del capitulo.',
      chapter: 'Capitulo',
      nextTitle: 'Que sigue',
      next: 'Un editor revisara tu solicitud. Mientras tanto, puedes seguir usando tu dashboard como participante.',
      button: 'Ver mi dashboard',
      signature: 'Equipo LEAD Americas',
      help: 'Necesitas ayuda?',
    },
    en: {
      title: 'Chapter application received',
      preview: `We received your application for ${chapterName}.`,
      greeting: `Hi, ${name}`,
      intro: 'We received your application to join the chapter.',
      chapter: 'Chapter',
      nextTitle: 'What happens next',
      next: 'An editor will review your application. Meanwhile, you can continue using your participant dashboard.',
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
      <div style={infoBoxStyle}><strong>{t.nextTitle}:</strong> {t.next}</div>
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
