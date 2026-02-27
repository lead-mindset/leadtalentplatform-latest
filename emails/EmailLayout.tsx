type EmailLayoutProps = {
  title: string
  children: React.ReactNode
}

const COLORS = {
  primary: '#3759E8',
  background: '#EBF0F5',
  card: '#FFFFFF',
  foreground: '#1E293B',
  muted: '#8E95A5',
  border: '#E2E8F0',
}

const SOCIAL_LINKS = [
  { name: 'LinkedIn', url: 'https://linkedin.com', icon: '👔' },
  { name: 'Instagram', url: 'https://instagram.com', icon: '📱' },
  { name: 'Twitter', url: 'https://twitter.com', icon: '𝕏' },
  { name: 'Facebook', url: 'https://facebook.com', icon: '👥' },
]

export function EmailLayout({ title, children }: EmailLayoutProps) {
  return (
    <div style={{ 
      fontFamily: '"Raleway", "Arial", sans-serif', 
      backgroundColor: COLORS.background, 
      padding: '32px 16px'
    }}>
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto', 
        backgroundColor: COLORS.card, 
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Header con Logo */}
        <div style={{
          backgroundColor: COLORS.foreground,
          padding: '32px',
          textAlign: 'center',
          borderBottom: `4px solid ${COLORS.primary}`
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/leadl2.svg"
            alt="LEAD Mindset"
            style={{
              height: 50,
              width: 'auto',
              marginBottom: 12,
              display: 'block',
              margin: '0 auto 12px'
            }}
          />
          <div style={{
            fontSize: 12,
            color: COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Mindset Platform
          </div>
        </div>

        {/* Contenido */}
        <div style={{ 
          padding: '40px 32px',
          color: COLORS.foreground, 
          fontSize: 15,
          lineHeight: '1.6'
        }}>
          <h1 style={{ 
            color: COLORS.primary,
            fontSize: 24,
            margin: '0 0 24px 0',
            fontWeight: 700
          }}>
            {title}
          </h1>
          <div style={{ 
            color: COLORS.foreground
          }}>
            {children}
          </div>
        </div>

        {/* Divisor */}
        <div style={{
          height: 1,
          backgroundColor: COLORS.border,
          margin: '32px 32px'
        }} />

        {/* Footer con Redes Sociales */}
        <div style={{
          padding: '32px',
          backgroundColor: '#FAFBFC',
          borderTop: `1px solid ${COLORS.border}`
        }}>
          {/* Redes Sociales */}
          <div style={{
            marginBottom: 24,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 12,
              color: COLORS.muted,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 600
            }}>
              Síguenos
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: COLORS.background,
                    color: COLORS.primary,
                    textDecoration: 'none',
                    fontSize: 16,
                    transition: 'background-color 0.2s',
                    border: `2px solid ${COLORS.primary}`
                  }}
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div style={{
            textAlign: 'center',
            paddingTop: 16,
            borderTop: `1px solid ${COLORS.border}`
          }}>
            <p style={{ 
              fontSize: 12, 
              color: COLORS.muted,
              margin: '12px 0 0 0',
              lineHeight: '1.5'
            }}>
              © {new Date().getFullYear()} LEAD Mindset<br />
              <a href="https://leadmindset.org" style={{
                color: COLORS.primary,
                textDecoration: 'none'
              }}>
                www.leadmindset.org
              </a>
            </p>
            <p style={{
              fontSize: 11,
              color: COLORS.muted,
              margin: '12px 0 0 0',
              fontStyle: 'italic'
            }}>
              Este correo fue enviado porque estás registrado en nuestra plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}