import { createTransporter, isEmailConfigured, logEmail, EMAIL_FROM } from './config'
import WelcomeEmail from '../../emails/templates/WelcomeEmail'
import MemberApprovalEmail from '../../emails/templates/MemberApprovalEmail'
import ApplicationReceivedEmail from '../../emails/templates/ApplicationReceivedEmail'
import ApplicationApprovedEmail from '../../emails/templates/ApplicationApprovedEmail'
import ApplicationRejectedEmail from '../../emails/templates/ApplicationRejectedEmail'
import { render as renderEmail } from '@react-email/render'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  replyTo?: string
}

async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    logEmail(to, subject, html)
    return { success: true }
  }

  const transporter = createTransporter()
  if (!transporter) {
    logEmail(to, subject, html)
    return { success: true }
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      replyTo: replyTo || process.env.EMAIL_REPLY_TO,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: String(error) }
  }
}

// Welcome Email
export async function sendWelcomeEmail(
  to: string, 
  name: string, 
  chapter_name: string,
  locale: 'en' | 'es' = 'es'
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/student` 
  
  const html = await renderEmail(
    WelcomeEmail({ 
      name, 
      dashboardUrl, 
      locale,
      role: 'member' 
    })
  )
  
  return sendEmail({
    to,
    subject: locale === 'es' ? '¡Bienvenido/a a LEAD Mindset!' : 'Welcome to LEAD Mindset!',
    html,
  })
}

// Member Approval Email
export async function sendMemberApprovalEmail(
  to: string, 
  name: string, 
  memberId: string, 
  chapter_name: string,
  locale: 'en' | 'es' = 'es'
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/student` 
  
  const html = await renderEmail(
    MemberApprovalEmail({ 
      name, 
      memberId, 
      chapter_name, 
      dashboardUrl,
      locale 
    })
  )
  
  return sendEmail({
    to,
    subject: locale === 'es' ? '¡Felicidades! Tu membresía ha sido aprobada' : 'Congratulations! Your Membership is Approved',
    html,
  })
}

// Application Received Email
export async function sendApplicationReceivedEmail(
  to: string, 
  name: string, 
  eventTitle: string, 
  chapter_name: string,
  locale: 'en' | 'es' = 'es'
) {
  const eventsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/student/events` 
  
  const html = await renderEmail(
    ApplicationReceivedEmail({ 
      name, 
      eventTitle, 
      chapter_name, 
      eventsUrl,
      locale 
    })
  )
  
  return sendEmail({
    to,
    subject: locale === 'es' ? `Solicitud de evento recibida: ${eventTitle}` : `Event Application Received: ${eventTitle}`,
    html,
  })
}

// Application Approved Email
export async function sendApplicationApprovedEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string | null,
  meetingUrl: string | null,
  eventType: string,
  registrationId: string,
  locale: 'en' | 'es' = 'es'
) {
  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/student/events` 
  const eventsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/student/events` 
  
  const html = await renderEmail(
    ApplicationApprovedEmail({
      name,
      eventTitle,
      eventDate,
      eventLocation,
      meetingUrl,
      eventType,
      qrUrl,
      eventsUrl,
      locale,
    })
  )
  
  return sendEmail({
    to,
    subject: locale === 'es' ? `¡Estás dentro! Solicitud aprobada: ${eventTitle}` : `You're In! Application Approved: ${eventTitle}`,
    html,
  })
}

// Application Rejected Email
export async function sendApplicationRejectedEmail(
  to: string,
  name: string,
  eventTitle: string,
  chapter_name: string,
  locale: 'en' | 'es' = 'es'
) {
  const eventsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/student/events` 
  
  const html = await renderEmail(
    ApplicationRejectedEmail({ 
      name, 
      eventTitle, 
      chapter_name, 
      eventsUrl,
      locale 
    })
  )
  
  return sendEmail({
    to,
    subject: locale === 'es' ? `Actualización de solicitud: ${eventTitle}` : `Application Update: ${eventTitle}`,
    html,
  })
}
