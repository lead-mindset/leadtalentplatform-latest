export const EMAIL_FROM = process.env.EMAIL_FROM || 'LEAD Americas <noreply@leadamericas.org>'
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'soporte@leadamericas.org'

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function logEmailFailure(context: {
  to: string | string[]
  subject: string
  error: string
  critical?: boolean
}) {
  console.error('[email]', {
    to: context.to,
    subject: context.subject,
    critical: context.critical ?? false,
    error: context.error,
  })
}
