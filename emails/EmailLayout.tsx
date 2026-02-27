type EmailLayoutProps = {
  title: string
  children: React.ReactNode
  preview?: string
}

const COLORS = {
  primary: '#E05A7A',        // oklch(0.59 0.22 1)
  primaryLight: '#FFF0F3',
  primaryBorder: '#F9C0CC',
  foreground: '#1A2357',     // oklch(0.1947 0.0984 266.07)
  card: '#222B5E',           // oklch(0.2294 0.1343 264.04)
  background: '#F5F5F0',     // oklch(0.985 0.001 106.424)
  muted: '#78716C',          // oklch(0.553 0.013 58.071)
  mutedBg: '#F7F6F3',        // oklch(0.97 0.001 106.424)
  border: '#E8E5DF',         // oklch(0.923 0.003 48.717)
  white: '#FFFFFF',
  destructive: '#D94F4F',    // oklch(0.58 0.22 27)
}

const SOCIAL_LINKS = [
  { name: 'LinkedIn',   url: 'https://linkedin.com',  icon: 'in' },
  { name: 'Instagram',  url: 'https://instagram.com', icon: '⬡' },
  { name: 'Twitter',    url: 'https://twitter.com',   icon: '𝕏'  },
  { name: 'Facebook',   url: 'https://facebook.com',  icon: 'f'  },
]

export function EmailLayout({ title, children, preview }: EmailLayoutProps) {
  return (
    <div style={{
      fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
      backgroundColor: COLORS.background,
      padding: '40px 16px',
      minHeight: '100vh',
    }}>
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

          <div style={{
            display: 'inline-block',
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            padding: '10px 20px',
            marginBottom: 12,
          }}>
            <span style={{
              color: COLORS.white,
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '2px',
              textTransform: 'uppercase' as const,
            }}>
              LEAD
            </span>
          </div>

          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase' as const,
            letterSpacing: '3px',
            marginTop: 4,
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
          }}>
            {title}
          </h1>
        </div>

        <div style={{
          padding: '36px 32px',
          color: COLORS.foreground,
          fontSize: 15,
          lineHeight: 1.7,
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: COLORS.white,
                    border: `1.5px solid ${COLORS.border}`,
                    color: COLORS.primary,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: COLORS.border, margin: '0 0 20px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: 12, color: COLORS.muted }}>
              © {new Date().getFullYear()}{' '}
              <a href="https://leadmindset.org" style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 600 }}>
                LEAD Mindset
              </a>
            </p>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.muted, fontStyle: 'italic' }}>
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
}

export const infoBoxStyle: React.CSSProperties = {
  backgroundColor: COLORS.primaryLight,
  padding: '16px 20px',
  borderRadius: 8,
  borderLeft: `4px solid ${COLORS.primary}`,
  fontSize: 13,
  lineHeight: 1.6,
  marginTop: 24,
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
}

export const helpTextStyle: React.CSSProperties = {
  marginTop: 24,
  fontSize: 13,
  color: COLORS.muted,
}