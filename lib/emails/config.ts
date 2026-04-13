import nodemailer from 'nodemailer'

export const EMAIL_FROM = process.env.EMAIL_FROM || 'LEAD Talent Platform <noreply@lead.org.pe>'
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@lead.org.pe'

export const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP not configured. Emails will be logged instead of sent.')
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export const isEmailConfigured = (): boolean => {
  return !!process.env.SMTP_HOST && !!process.env.SMTP_USER
}

export const logEmail = (to: string, subject: string, html: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 [EMAIL] To: ${to}`)
    console.log(`📧 [EMAIL] Subject: ${subject}`)
    console.log(`📧 [EMAIL] HTML length: ${html.length} chars`)
  }
}
