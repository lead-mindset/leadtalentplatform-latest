import React from 'react'

type EmailLayoutProps = {
  title: string
  children: React.ReactNode
  preview?: string
}

// ── Color tokens ────────────────────────────────────────────────────────────
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
  // Flat fallback for gradient buttons — Outlook desktop (Word engine) cannot
  // render CSS gradients at all, so VML/MSO fallback paints this solid color.
  buttonFallback: '#9B2E8B',
}

// ── Spacing scale ────────────────────────────────────────────────────────────
// Every template should pull from this instead of hand-writing margin/padding
// numbers, so a spacing change is a one-line edit here instead of a
// find-and-replace across 12 files.
export const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
}

const BRAND_URL = 'https://www.leadmindset.org'
export const SUPPORT_EMAIL = 'abriones@leadmindset.org'

// ── Margin shorthand ──────────────────────────────────────────────────────────
// Convenience objects matching how every template already reaches for these
// values.  Built from SPACING so there is one source of truth.
export const mb = {
  sm: `0 0 ${SPACING.xs}px 0`,
  md: `0 0 ${SPACING.sm}px 0`,
  lg: `0 0 ${SPACING.md}px 0`,
  xl: `0 0 ${SPACING.lg}px 0`,
  xxl: `0 0 ${SPACING.lg}px 0`,
  xxxl: `0 0 ${SPACING.lg}px 0`,
}

export const my = {
  lg: `${SPACING.lg}px 0`,
  xl: `${SPACING.xl}px 0`,
  button: `${SPACING.xl}px 0`,
}

// ── Fonts ────────────────────────────────────────────────────────────────────
// NOTE ON FONT LOADING: `@import` inside a <style> tag (the old approach) is
// stripped or silently ignored by a large share of inboxes (Gmail app,
// many Outlook builds), so it was quietly falling back to Arial most of the
// time anyway. `<link rel="preload">`/`<link rel="stylesheet">` tags need to
// live in the document <head>, which this component doesn't render — it's
// almost certainly wrapped by a parent (react-email's <Html>/<Head>, or a
// render() call that injects a <head>). Two font-face declarations are kept
// in the inline <style> block below as a working fallback for the clients
// that do respect embedded <style> (Apple Mail, many Outlook.com/Gmail-web
// contexts), but for reliable delivery, add this to the parent <Head>:
//
//   <link rel="preconnect" href="https://fonts.googleapis.com" />
//   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
//   <link
//     href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Raleway:wght@600;700;800&display=swap"
//     rel="stylesheet"
//   />
//
// Everywhere else, the stack still degrades gracefully to system fonts
// (Helvetica/Arial) rather than breaking layout.
const FONT_DISPLAY = '"Raleway", "Helvetica Neue", Arial, sans-serif'
const FONT_BODY = '"Montserrat", "Helvetica Neue", Arial, sans-serif'

export function EmailLayout({ title, children, preview }: EmailLayoutProps) {
  return (
    <>
      {/* Client hints for dark mode + mobile. If a parent <Head> exists, move
          these tags there — they only work from <head>. Left here as a
          fallback in case this component is rendered standalone. */}
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Raleway:wght@600;700;800&display=swap');

        /* Force light rendering even in dark-mode clients that try to invert
           colors automatically (iOS Mail, some Outlook dark mode builds).
           Without this, the dark header can flip to white-on-white. */
        :root { color-scheme: light only; supported-color-schemes: light only; }
        [data-ogsc] .force-bg-white { background-color: ${COLORS.white} !important; }
        [data-ogsc] .force-text-dark { color: ${COLORS.foreground} !important; }

        /* Mobile: tighten padding, let the button go full width, drop the
           header's letter-spacing slightly so the eyebrow label doesn't wrap. */
        @media only screen and (max-width: 480px) {
          .email-shell { width: 100% !important; }
          .email-header { padding: 26px 20px 20px !important; }
          .email-body { padding: 26px 20px 28px !important; }
          .email-footer { padding: 22px 20px !important; }
          .email-button { width: 100% !important; box-sizing: border-box; }
        }
      `}</style>

      {preview && (
        <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden', opacity: 0 }}>
          {preview}
        </div>
      )}

      {/*
        Outer 100%-width table centers the shell and gives every email
        client — including Outlook's Word rendering engine, which ignores
        flexbox/grid and mishandles centered block divs — a predictable box
        model to work with.
      */}
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ backgroundColor: COLORS.background, width: '100%' }}
      >
        <tbody>
          <tr>
            <td align="center" style={{ padding: '40px 16px' }}>
              {/*
                MSO conditional wrapper: Outlook desktop doesn't respect
                max-width on tables, so without this the shell renders at
                whatever width the content forces. The ghost table below
                pins it to 600px specifically for Outlook; everything else
                just uses the width attribute + inline max-width.
              */}
              <div dangerouslySetInnerHTML={{ __html: '<!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->' }} />

              <table
                role="presentation"
                width="600"
                cellPadding={0}
                cellSpacing={0}
                className="email-shell force-bg-white"
                style={{
                  width: '100%',
                  maxWidth: 600,
                  backgroundColor: COLORS.white,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid rgba(122, 87, 209, 0.24)',
                  boxShadow: '0 24px 70px rgba(3, 6, 31, 0.34)',
                }}
              >
                <tbody>
                  {/* Header */}
                  <tr>
                    <td
                      className="email-header"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.background} 0%, #0E1442 45%, ${COLORS.surface} 100%)`,
                        backgroundColor: COLORS.background, // flat fallback if gradients are stripped
                        padding: '34px 32px 26px',
                        textAlign: 'center',
                      }}
                    >
                      {/* Top accent bar — flat colors, no gradient, so this
                          survives clients that strip background gradients. */}
                      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                        <tbody>
                          <tr>
                            <td style={{ height: 5, backgroundColor: COLORS.magenta, fontSize: 0, lineHeight: 0 }}>
                              &nbsp;
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div
                        style={{
                          marginTop: 22,
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.70)',
                          textTransform: 'uppercase',
                          letterSpacing: '3px',
                          fontFamily: FONT_DISPLAY,
                        }}
                      >
                        LEAD Talent Platform
                      </div>
                    </td>
                  </tr>

                  {/* Body */}
                  <tr>
                    <td
                      className="email-body force-text-dark"
                      style={{
                        padding: '34px 32px 36px',
                        color: COLORS.foreground,
                        fontSize: 15,
                        lineHeight: 1.7,
                        fontFamily: FONT_BODY,
                      }}
                    >
                      {children}
                    </td>
                  </tr>

                  {/* Footer */}
                  <tr>
                    <td
                      className="email-footer"
                      style={{
                        backgroundColor: COLORS.mutedBg,
                        borderTop: `1px solid ${COLORS.border}`,
                        padding: '28px 32px',
                      }}
                    >
                      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                        <tbody>
                          <tr>
                            <td style={{ borderTop: `1px solid ${COLORS.border}`, fontSize: 0, lineHeight: 0, paddingBottom: 20 }}>
                              &nbsp;
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: 12, color: COLORS.muted, fontFamily: FONT_BODY }}>
                          Copyright {new Date().getFullYear()}{' '}
                          <a href={BRAND_URL} style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 600 }}>
                            LEAD Americas
                          </a>
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: COLORS.muted, fontStyle: 'italic', fontFamily: FONT_BODY }}>
                          Este correo fue enviado porque tienes una cuenta o invitación en LEAD Talent Platform.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div dangerouslySetInnerHTML={{ __html: '<!--[if mso]></td></tr></table><![endif]-->' }} />
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export const EMAIL_COLORS = COLORS

// ── Buttons ──────────────────────────────────────────────────────────────────
// Primary: the main call to action. Gradient + shadow for modern clients;
// `backgroundColor` fallback so Outlook (which drops the gradient) still
// shows a solid on-brand color instead of white-on-white or transparent.
export const buttonStyle: React.CSSProperties = {
  backgroundColor: COLORS.buttonFallback,
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
  boxShadow: '0 8px 24px rgba(122, 87, 209, 0.30)',
  fontFamily: FONT_DISPLAY,
}

// Secondary: for templates like ApplicationApprovedEmail that show two
// stacked actions. Outline style instead of a second filled gradient button,
// so there's a visible primary/secondary hierarchy instead of two
// equal-weight CTAs competing for attention.
export const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: COLORS.primaryDark,
  padding: '13px 28px',
  borderRadius: 999,
  border: `1.5px solid ${COLORS.primaryBorder}`,
  textDecoration: 'none',
  display: 'inline-block',
  minWidth: 174,
  textAlign: 'center',
  fontWeight: 700,
  fontSize: 15,
  fontFamily: FONT_DISPLAY,
}

export const infoBoxStyle: React.CSSProperties = {
  backgroundColor: COLORS.primaryLight,
  padding: '16px 18px',
  borderRadius: 8,
  borderLeft: `4px solid ${COLORS.primary}`,
  fontSize: 13,
  lineHeight: 1.6,
  marginTop: SPACING.lg,
  fontFamily: FONT_BODY,
}

export const featureBoxStyle: React.CSSProperties = {
  backgroundColor: COLORS.mutedBg,
  padding: '20px 22px',
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  marginBottom: SPACING.lg,
}

export const featureItemStyle: React.CSSProperties = {
  padding: '12px 0',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  lineHeight: 1.5,
  borderBottom: `1px solid ${COLORS.border}`,
  fontFamily: FONT_BODY,
}

export const helpTextStyle: React.CSSProperties = {
  marginTop: SPACING.lg,
  fontSize: 13,
  color: COLORS.muted,
  fontFamily: FONT_BODY,
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
  margin: `${SPACING.lg}px 0`,
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

// ── Reusable child components ────────────────────────────────────────────────
// Every email template uses the same handful of structural patterns (greeting
// line, CTA button row, closing + signature pair, help footer).  Extracting
// them here means a typo or style tweak in one place fixes all 13 templates
// instead of needing a 13-file grep-and-replace.

type GreetingProps = { children: React.ReactNode }
export function Greeting({ children }: GreetingProps) {
  const C = EMAIL_COLORS
  return (
    <p style={{ fontSize: 20, fontWeight: 700, margin: mb.lg, color: C.foreground }}>
      {children}
    </p>
  )
}

type ButtonRowProps = { children: React.ReactNode; style?: React.CSSProperties }
export function ButtonRow({ children, style: extraStyle }: ButtonRowProps) {
  return (
    <div style={{ textAlign: 'center', margin: my.button, ...extraStyle }}>
      {children}
    </div>
  )
}

type ClosingSignatureProps = {
  closing: string
  signature: string
}
export function ClosingSignature({ closing, signature }: ClosingSignatureProps) {
  const C = EMAIL_COLORS
  return (
    <>
      <p style={{ margin: `${SPACING.lg}px 0 4px 0` }}>{closing}</p>
      <p style={{ margin: 0, fontWeight: 600, color: C.foreground }}>{signature}</p>
    </>
  )
}

type HelpFooterProps = {
  children: React.ReactNode
}
export function HelpFooter({ children }: HelpFooterProps) {
  return (
    <p style={{ marginTop: SPACING.lg, fontSize: 13, color: COLORS.muted, fontFamily: FONT_BODY }}>
      {children}
    </p>
  )
}
