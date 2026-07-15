import { render } from '@react-email/render'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import WelcomeEmail from '../emails/templates/WelcomeEmail'
import ConfirmSignUpEmail from '../emails/templates/ConfirmSignUpEmail'
import MagicLinkEmail from '../emails/templates/MagicLinkEmail'
import ResetPasswordEmail from '../emails/templates/ResetPasswordEmail'
import CompanyInviteEmail from '../emails/templates/CompanyInviteEmail'
import ChapterEboardInviteEmail from '../emails/templates/ChapterEboardInviteEmail'
import MemberApprovalEmail from '../emails/templates/MemberApprovalEmail'
import ApplicationReceivedEmail from '../emails/templates/ApplicationReceivedEmail'
import ApplicationApprovedEmail from '../emails/templates/ApplicationApprovedEmail'
import ApplicationRejectedEmail from '../emails/templates/ApplicationRejectedEmail'
import ChapterApplicationSubmittedEmail from '../emails/templates/ChapterApplicationSubmittedEmail'
import ChapterApplicationRejectedEmail from '../emails/templates/ChapterApplicationRejectedEmail'
import EventRegistrationConfirmedEmail from '../emails/templates/EventRegistrationConfirmedEmail'

const OUT = join(__dirname, '..', 'emails', 'screenshots')
const LOCALE = 'es'

interface EmailFile {
  name: string
  filename: string
  html: string
}

async function renderAll() {
  const files: EmailFile[] = []

  files.push({
    name: 'Welcome',
    filename: '01-welcome.html',
    html: await render(
      WelcomeEmail({
        name: 'María García',
        dashboardUrl: 'https://leadqa.vercel.app/es/student',
        locale: LOCALE,
        role: 'member',
      })
    ),
  })

  files.push({
    name: 'ConfirmSignUp',
    filename: '02-confirm-signup.html',
    html: await render(
      ConfirmSignUpEmail({
        name: 'María García',
        confirmationUrl: 'https://leadqa.vercel.app/es/auth/confirm?token=demo-token',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'MagicLink',
    filename: '03-magic-link.html',
    html: await render(
      MagicLinkEmail({
        name: 'María García',
        magicLinkUrl: 'https://leadqa.vercel.app/es/auth/magic?token=demo-token',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'ResetPassword',
    filename: '04-reset-password.html',
    html: await render(
      ResetPasswordEmail({
        name: 'María García',
        resetUrl: 'https://leadqa.vercel.app/es/auth/reset?token=demo-token',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'CompanyInvite',
    filename: '05-company-invite.html',
    html: await render(
      CompanyInviteEmail({
        companyName: 'TechCorp Perú',
        inviteUrl: 'https://leadqa.vercel.app/es/recruiter/access?token=demo-token',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'ChapterEboardInvite',
    filename: '06-chapter-eboard-invite.html',
    html: await render(
      ChapterEboardInviteEmail({
        chapterName: 'LEAD PUCP',
        displayTitle: 'Directora de Eventos',
        invitedEmail: 'maria.garcia@pucp.edu.pe',
        inviteUrl: 'https://leadqa.vercel.app/es/chapter/invites/accept?token=demo-token',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'MemberApproval',
    filename: '07-member-approval.html',
    html: await render(
      MemberApprovalEmail({
        name: 'María García',
        memberId: 'LEAD-2026-0042',
        chapterName: 'LEAD PUCP',
        dashboardUrl: 'https://leadqa.vercel.app/es/student',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'ApplicationReceived',
    filename: '08-application-received.html',
    html: await render(
      ApplicationReceivedEmail({
        name: 'María García',
        eventTitle: 'Networking Night Lima 2026',
        chapterName: 'LEAD PUCP',
        eventsUrl: 'https://leadqa.vercel.app/es/student/events',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'ApplicationApproved',
    filename: '09-application-approved.html',
    html: await render(
      ApplicationApprovedEmail({
        name: 'María García',
        eventTitle: 'Networking Night Lima 2026',
        eventDate: '20 de mayo, 2026',
        eventLocation: 'PUCP - Campus Principal',
        meetingUrl: null,
        eventType: 'in_person',
        qrUrl: 'https://leadqa.vercel.app/es/student/events?registration=demo-reg',
        eventsUrl: 'https://leadqa.vercel.app/es/student/events',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'ApplicationRejected',
    filename: '10-application-rejected.html',
    html: await render(
      ApplicationRejectedEmail({
        name: 'María García',
        eventTitle: 'Networking Night Lima 2026',
        chapterName: 'LEAD PUCP',
        eventsUrl: 'https://leadqa.vercel.app/es/student/events',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'ChapterApplicationSubmitted',
    filename: '11-chapter-application-submitted.html',
    html: await render(
      ChapterApplicationSubmittedEmail({
        name: 'María García',
        chapterName: 'LEAD PUCP',
        dashboardUrl: 'https://leadqa.vercel.app/es/student',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'ChapterApplicationRejected',
    filename: '12-chapter-application-rejected.html',
    html: await render(
      ChapterApplicationRejectedEmail({
        name: 'María García',
        chapterName: 'LEAD PUCP',
        dashboardUrl: 'https://leadqa.vercel.app/es/student',
        locale: LOCALE,
      })
    ),
  })

  files.push({
    name: 'EventRegistrationConfirmed',
    filename: '13-event-registration-confirmed.html',
    html: await render(
      EventRegistrationConfirmedEmail({
        name: 'María García',
        eventTitle: 'Networking Night Lima 2026',
        eventDate: '20 de mayo, 2026',
        eventLocation: 'PUCP - Campus Principal',
        meetingUrl: null,
        eventType: 'in_person',
        eventsUrl: 'https://leadqa.vercel.app/es/student/events',
        locale: LOCALE,
      })
    ),
  })

  return files
}

async function main() {
  const files = await renderAll()
  mkdirSync(OUT, { recursive: true })

  for (const f of files) {
    const htmlPath = join(OUT, f.filename)
    writeFileSync(htmlPath, f.html, 'utf-8')
    console.log(`  Rendered: ${f.filename}`)
  }
  console.log(`\nAll ${files.length} emails rendered to: ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
