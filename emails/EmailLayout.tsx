import { getConfiguredAppUrl } from '@/lib/app-url'

type EmailLayoutProps = {
  title: string
  children: React.ReactNode
  preview?: string
}

const COLORS = {
  primary: '#7A57D1',
  primaryDark: '#5D41B0',
  primaryLight: '#F3F0FF',
  primaryBorder: '#D8CFFF',
  primarySoft: '#F8F6FF',
  secondary: '#BA4E5E',
  magenta: '#9B2E8B',
  accent: '#7E56E2',
  foreground: '#080D3B',
  card: '#0A0E35',
  surface: '#1A1F4B',
  background: '#080D3B',
  muted: '#635F77',
  mutedBg: '#F7F6FB',
  border: '#E5E1F0',
  white: '#FFFFFF',
}

const BRAND_URL = 'https://www.leadmindset.org'
const ASSET_BASE_URL = getConfiguredAppUrl('https://leadtalentplatform-latest.vercel.app')
const LOGO_URL = `${ASSET_BASE_URL}/emails/logo.png`
export const SUPPORT_EMAIL = 'soporte@leadamericas.org'

export const SOCIAL_LINKS = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/leadmindsetorg/posts/?feedView=all',
    icon: `${ASSET_BASE_URL}/emails/linkedin.png`,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/lead_americas/',
    icon: `${ASSET_BASE_URL}/emails/instagram.png`,
  },
]

export function EmailLayout({ title, children, preview }: EmailLayoutProps) {
  return (
    <div
      style={{
        fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
        backgroundColor: COLORS.background,
        padding: '40px 16px',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Raleway:wght@600;700;800&display=swap');
      `}</style>

      {preview && (
        <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden', opacity: 0 }}>
          {preview}
        </div>
      )}

      <div
        style={{
          maxWidth: 600,
          margin: '0 auto',
          backgroundColor: COLORS.white,
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid rgba(122, 87, 209, 0.24)`,
          boxShadow: '0 24px 70px rgba(3, 6, 31, 0.34)',
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${COLORS.background} 0%, #0E1442 45%, ${COLORS.surface} 100%)`,
            padding: '34px 32px 26px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 5,
              background: `linear-gradient(90deg, ${COLORS.secondary} 0%, ${COLORS.magenta} 45%, ${COLORS.accent} 100%)`,
            }}
          />

          <img
            src={LOGO_URL}
            alt="LEAD Americas"
            width={140}
            height={48}
            style={{ display: 'block', margin: '0 auto 12px', objectFit: 'contain' }}
          />

          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.70)',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
            }}
          >
            LEAD Talent Platform
          </div>
        </div>

        <div
          style={{
            backgroundColor: COLORS.white,
            borderBottom: `1px solid ${COLORS.border}`,
            padding: '22px 32px',
          }}
        >
          <h1
            style={{
              margin: 0,
              color: COLORS.foreground,
              fontSize: 23,
              fontWeight: 800,
              lineHeight: 1.3,
              fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
            }}
          >
            {title}
          </h1>
        </div>

        <div
          style={{
            padding: '34px 32px 36px',
            color: COLORS.foreground,
            fontSize: 15,
            lineHeight: 1.7,
            fontFamily: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {children}
        </div>

        <div
          style={{
            backgroundColor: COLORS.mutedBg,
            borderTop: `1px solid ${COLORS.border}`,
            padding: '28px 32px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: 11,
                color: COLORS.muted,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: 700,
                fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              Síguenos
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  title={social.name}
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
                  <img src={social.icon} alt={social.name} width={34} height={34} style={{ display: 'block' }} />
                </a>
              ))}
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: COLORS.border, margin: '0 0 20px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: '0 0 6px 0',
                fontSize: 12,
                color: COLORS.muted,
                fontFamily: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              Copyright {new Date().getFullYear()}{' '}
              <a href={BRAND_URL} style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 600 }}>
                LEAD Americas
              </a>
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: COLORS.muted,
                fontStyle: 'italic',
                fontFamily: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              Este correo fue enviado porque tienes una cuenta o invitación en LEAD Talent Platform.
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
  background: `linear-gradient(135deg, ${COLORS.magenta} 0%, ${COLORS.secondary} 24%, ${COLORS.magenta} 46%, ${COLORS.accent} 74%, ${COLORS.primaryDark} 100%)`,
  color: COLORS.white,
  padding: '14px 28px',
  borderRadius: 999,
  textDecoration: 'none',
  display: 'inline-block',
  minWidth: 174,
  textAlign: 'center',
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: '0px',
  boxShadow: '0 8px 24px rgba(122, 87, 209, 0.30)',
  fontFamily: '"Raleway", "Helvetica Neue", Arial, sans-serif',
}

export const infoBoxStyle: React.CSSProperties = {
  backgroundColor: COLORS.primaryLight,
  padding: '16px 18px',
  borderRadius: 8,
  borderLeft: `4px solid ${COLORS.primary}`,
  fontSize: 13,
  lineHeight: 1.6,
  marginTop: 24,
  fontFamily: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
}

export const featureBoxStyle: React.CSSProperties = {
  backgroundColor: COLORS.mutedBg,
  padding: '20px 22px',
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  marginBottom: 24,
}

export const featureItemStyle: React.CSSProperties = {
  padding: '12px 0',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  lineHeight: 1.5,
  borderBottom: `1px solid ${COLORS.border}`,
  fontFamily: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
}

export const helpTextStyle: React.CSSProperties = {
  marginTop: 24,
  fontSize: 13,
  color: COLORS.muted,
  fontFamily: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
}

export const bulletDotStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 8,
  height: 8,
  minWidth: 8,
  marginTop: 7,
  borderRadius: 999,
  backgroundColor: COLORS.primary,
  boxShadow: `0 0 0 4px ${COLORS.primaryLight}`,
}

export const detailBoxStyle: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: '18px 20px',
  margin: '24px 0',
  boxShadow: '0 1px 0 rgba(8, 13, 59, 0.04)',
}

export const sectionLabelStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 12,
  fontWeight: 800,
  color: COLORS.primary,
  textTransform: 'uppercase',
  letterSpacing: '1px',
}
