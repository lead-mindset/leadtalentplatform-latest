import { Resend } from 'resend'
import { EMAIL_FROM, EMAIL_REPLY_TO, logEmailFailure } from './config'

export type TransactionalEmailResult =
  | { success: true; id?: string }
  | { success: false; error: string }

export type TransactionalEmailParams = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  critical?: boolean
}

let resendClient: Resend | null = null

type ResendClientResult =
  | { ok: true; client: Resend }
  | { ok: false; error: string }

function getResendClient(): ResendClientResult {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' }
  }

  resendClient ??= new Resend(apiKey)
  return { ok: true, client: resendClient }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return JSON.stringify(error)
}

export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  critical = false,
}: TransactionalEmailParams): Promise<TransactionalEmailResult> {
  const resend = getResendClient()

  if (!resend.ok) {
    logEmailFailure({ to, subject, error: resend.error, critical })
    return { success: false, error: resend.error }
  }

  try {
    const result = await resend.client.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || EMAIL_REPLY_TO,
    })

    if (result.error) {
      const error = getErrorMessage(result.error)
      logEmailFailure({ to, subject, error, critical })
      return { success: false, error }
    }

    return { success: true, id: result.data?.id }
} catch (error) {
  console.error("RESEND RAW ERROR:", error)

  const message = getErrorMessage(error)
  logEmailFailure({ to, subject, error: message, critical })

  return { success: false, error: message }
}
}
