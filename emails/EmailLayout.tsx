type EmailLayoutProps = {
  title: string
  children: React.ReactNode
  preview?: string
}

const COLORS = {
  primary: '#E05A7A',
  primaryLight: '#FFF0F3',
  primaryBorder: '#F9C0CC',
  foreground: '#1A2357',
  card: '#222B5E',
  background: '#F5F5F0',
  muted: '#78716C',
  mutedBg: '#F7F6F3',
  border: '#E8E5DF',
  white: '#FFFFFF',
  destructive: '#D94F4F',
}

const BASE_URL = 'https://talent.leadmindset.org'

const LOGO_URL = `${BASE_URL}/emails/logo.png`

export const SOCIAL_LINKS = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/leadmindsetorg/posts/?feedView=all',
    icon: `${BASE_URL}/emails/linkedin.png`,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/lead_americas/',
    icon: `${BASE_URL}/emails/instagram.png`,
  },
]

export function EmailLayout({ title, children, preview }: EmailLayoutProps) {
  return (
    <div style={{
      fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
      backgroundColor: COLORS.background,
      padding: '40px 16px',
      minHeight: '100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800&display=swap');
      `}</style>

      {preview && (
        <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden', opacity: 0 }}>
          {preview}
        </div>
      )}

      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(26, 35, 87, 0.10)',
      }}>

        <div style={{
          background: `linear-gradient(135deg, ${COLORS.foreground} 0%, ${COLORS.card} 100%)`,
          padding: '36px 32px 28px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${COLORS.primary}, #F4A0B5)`,
          }} />

          <img
            src={LOGO_URL}
            alt="LEAD Mindset"
            width={140}
            height={48}
            style={{
              display: 'block',
              margin: '0 auto 10px',
              objectFit: 'contain',
            }}
          />

          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase' as const,
            letterSpacing: '3px',
            fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
          }}>
            Mindset Platform
          </div>
        </div>

        <div style={{
          backgroundColor: COLORS.primaryLight,
          borderBottom: `1px solid ${COLORS.primaryBorder}`,
          padding: '20px 32px',
        }}>
          <h1 style={{
            margin: 0,
            color: COLORS.foreground,
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.3,
            fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
          }}>
            {title}
          </h1>
        </div>

        <div style={{
          padding: '36px 32px',
          color: COLORS.foreground,
          fontSize: 15,
          lineHeight: 1.7,
          fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
        }}>
          {children}
        </div>

        <div style={{
          backgroundColor: COLORS.mutedBg,
          borderTop: `1px solid ${COLORS.border}`,
          padding: '28px 32px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{
              margin: '0 0 12px 0',
              fontSize: 11,
              color: COLORS.muted,
              textTransform: 'uppercase' as const,
              letterSpacing: '1.5px',
              fontWeight: 600,
              fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
            }}>
              Síguenos
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  title={s.name}
                  style={{
                    display: 'inline-block',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `1.5px solid ${COLORS.border}`,
                    textDecoration: 'none',
                    backgroundColor: COLORS.white,
                  }}
                >
                  <img
                    src={s.icon}
                    alt={s.name}
                    width={34}
                    height={34}
                    style={{ display: 'block' }}
                  />
                </a>
              ))}
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: COLORS.border, margin: '0 0 20px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <p style={{
              margin: '0 0 6px 0',
              fontSize: 12,
              color: COLORS.muted,
              fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
            }}>
              © {new Date().getFullYear()}{' '}
              <a href="https://leadmindset.org" style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 600 }}>
                LEAD Mindset
              </a>
            </p>
            <p style={{
              margin: 0,
              fontSize: 11,
              color: COLORS.muted,
              fontStyle: 'italic',
              fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
            }}>
              Este correo fue enviado porque estás registrado en nuestra plataforma.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export const EMAIL_COLORS = COLORS

export const buttonStyle: React.CSSProperties = {
  backgroundColor: COLORS.primary,
  color: COLORS.white,
  padding: '14px 36px',
  borderRadius: 8,
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: '0.3px',
  boxShadow: '0 4px 14px rgba(224, 90, 122, 0.35)',
  fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
}

export const infoBoxStyle: React.CSSProperties = {
  backgroundColor: COLORS.primaryLight,
  padding: '16px 20px',
  borderRadius: 8,
  borderLeft: `4px solid ${COLORS.primary}`,
  fontSize: 13,
  lineHeight: 1.6,
  marginTop: 24,
  fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
}

export const featureBoxStyle: React.CSSProperties = {
  backgroundColor: COLORS.mutedBg,
  padding: '20px',
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  marginBottom: 24,
}

export const featureItemStyle: React.CSSProperties = {
  padding: '10px 0',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  lineHeight: 1.5,
  borderBottom: `1px solid ${COLORS.border}`,
  fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
}

export const helpTextStyle: React.CSSProperties = {
  marginTop: 24,
  fontSize: 13,
  color: COLORS.muted,
  fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
}