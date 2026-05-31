import { render as renderEmail } from '@react-email/render'
import { getConfiguredAppUrl } from '@/lib/app-url'
import WelcomeEmail from '../../emails/templates/WelcomeEmail'
import MemberApprovalEmail from '../../emails/templates/MemberApprovalEmail'
import ApplicationReceivedEmail from '../../emails/templates/ApplicationReceivedEmail'
import ApplicationApprovedEmail from '../../emails/templates/ApplicationApprovedEmail'
import ApplicationRejectedEmail from '../../emails/templates/ApplicationRejectedEmail'
import ChapterApplicationSubmittedEmail from '../../emails/templates/ChapterApplicationSubmittedEmail'
import ChapterApplicationRejectedEmail from '../../emails/templates/ChapterApplicationRejectedEmail'
import EventRegistrationConfirmedEmail from '../../emails/templates/EventRegistrationConfirmedEmail'
import CompanyInviteEmail from '../../emails/templates/CompanyInviteEmail'
import ChapterEboardInviteEmail from '../../emails/templates/ChapterEboardInviteEmail'
import { sendTransactionalEmail, type TransactionalEmailResult } from './provider'

type Locale = 'en' | 'es'

function appPath(locale: Locale, path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getConfiguredAppUrl()}/${locale}${normalizedPath}`
}

function safeLocale(locale?: Locale): Locale {
  return locale === 'en' ? 'en' : 'es'
}

function defaultName(email: string, name?: string | null) {
  return name || email.split('@')[0] || 'LEAD'
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  _chapterName?: string,
  locale: Locale = 'es'
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(locale)
  const html = await renderEmail(
    WelcomeEmail({
      name,
      dashboardUrl: appPath(resolvedLocale, '/student'),
      locale: resolvedLocale,
      role: 'member',
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? 'Tu perfil esta listo en LEAD Talent Platform'
      : 'Your profile is ready in LEAD Talent Platform',
    html,
  })
}

export async function sendChapterApplicationSubmittedEmail(
  to: string,
  name: string,
  chapterName: string,
  locale: Locale = 'es'
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(locale)
  const html = await renderEmail(
    ChapterApplicationSubmittedEmail({
      name,
      chapterName,
      dashboardUrl: appPath(resolvedLocale, '/student'),
      locale: resolvedLocale,
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? `Solicitud recibida: ${chapterName}`
      : `Application received: ${chapterName}`,
    html,
  })
}

export async function sendChapterApplicationRejectedEmail(
  to: string,
  name: string,
  chapterName: string,
  locale: Locale = 'es'
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(locale)
  const html = await renderEmail(
    ChapterApplicationRejectedEmail({
      name,
      chapterName,
      dashboardUrl: appPath(resolvedLocale, '/student'),
      locale: resolvedLocale,
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? `Actualizacion de solicitud: ${chapterName}`
      : `Application update: ${chapterName}`,
    html,
  })
}

export async function sendMemberApprovalEmail(
  to: string,
  name: string,
  memberId: string,
  chapterName: string,
  locale: Locale = 'es'
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(locale)
  const html = await renderEmail(
    MemberApprovalEmail({
      name,
      memberId,
      chapter_name: chapterName,
      dashboardUrl: appPath(resolvedLocale, '/student'),
      locale: resolvedLocale,
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? `Membresia aprobada: ${memberId}`
      : `Membership approved: ${memberId}`,
    html,
  })
}

export async function sendApplicationReceivedEmail(
  to: string,
  name: string,
  eventTitle: string,
  chapterName: string,
  locale: Locale = 'es'
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(locale)
  const html = await renderEmail(
    ApplicationReceivedEmail({
      name,
      eventTitle,
      chapter_name: chapterName,
      eventsUrl: appPath(resolvedLocale, '/student/events'),
      locale: resolvedLocale,
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? `Solicitud de evento recibida: ${eventTitle}`
      : `Event application received: ${eventTitle}`,
    html,
  })
}

export async function sendEventRegistrationConfirmedEmail(
  to: string,
  params: {
    name?: string | null
    eventTitle: string
    eventDate: string
    eventLocation?: string | null
    meetingUrl?: string | null
    eventType: string
    locale?: Locale
  }
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(params.locale)
  const html = await renderEmail(
    EventRegistrationConfirmedEmail({
      name: defaultName(to, params.name),
      eventTitle: params.eventTitle,
      eventDate: params.eventDate,
      eventLocation: params.eventLocation,
      meetingUrl: params.meetingUrl,
      eventType: params.eventType,
      eventsUrl: appPath(resolvedLocale, '/student/events'),
      locale: resolvedLocale,
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? `Registro confirmado: ${params.eventTitle}`
      : `Registration confirmed: ${params.eventTitle}`,
    html,
  })
}

export async function sendApplicationApprovedEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string | null,
  meetingUrl: string | null,
  eventType: string,
  registrationId: string,
  locale: Locale = 'es'
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(locale)
  const eventsPath = '/student/events'
  const html = await renderEmail(
    ApplicationApprovedEmail({
      name,
      eventTitle,
      eventDate,
      eventLocation,
      meetingUrl,
      eventType,
      qrUrl: `${appPath(resolvedLocale, eventsPath)}?registration=${registrationId}`,
      eventsUrl: appPath(resolvedLocale, eventsPath),
      locale: resolvedLocale,
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? `Solicitud aprobada: ${eventTitle}`
      : `Application approved: ${eventTitle}`,
    html,
  })
}

export async function sendApplicationRejectedEmail(
  to: string,
  name: string,
  eventTitle: string,
  chapterName: string,
  locale: Locale = 'es'
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(locale)
  const html = await renderEmail(
    ApplicationRejectedEmail({
      name,
      eventTitle,
      chapter_name: chapterName,
      eventsUrl: appPath(resolvedLocale, '/student/events'),
      locale: resolvedLocale,
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? `Actualizacion de solicitud: ${eventTitle}`
      : `Application update: ${eventTitle}`,
    html,
  })
}

export async function sendCompanyRepresentativeInviteEmail(
  to: string,
  inviteToken: string,
  companyName = 'la empresa',
  locale: Locale = 'es'
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(locale)
  const inviteUrl = `${appPath(resolvedLocale, '/recruiter/access')}?token=${encodeURIComponent(inviteToken)}`
  const html = await renderEmail(
    CompanyInviteEmail({
      companyName,
      inviteUrl,
      locale: resolvedLocale,
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? `Invitacion de ${companyName} a LEAD Talent Platform`
      : `${companyName} invitation to LEAD Talent Platform`,
    html,
    critical: true,
  })
}

export async function sendChapterEboardInviteEmail(
  to: string,
  params: {
    chapterName: string
    displayTitle: string
    token: string
    locale?: Locale
  }
): Promise<TransactionalEmailResult> {
  const resolvedLocale = safeLocale(params.locale)
  const inviteUrl = appPath(resolvedLocale, `/chapter/invites/accept?token=${encodeURIComponent(params.token)}`)
  const html = await renderEmail(
    ChapterEboardInviteEmail({
      chapterName: params.chapterName,
      displayTitle: params.displayTitle,
      invitedEmail: to,
      inviteUrl,
      locale: resolvedLocale,
    })
  )

  return sendTransactionalEmail({
    to,
    subject: resolvedLocale === 'es'
      ? 'Activa tu rol en LEAD Talent Platform'
      : 'Activate your LEAD Talent Platform role',
    html,
    critical: true,
  })
}
