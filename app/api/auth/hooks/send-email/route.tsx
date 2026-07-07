import { Webhook } from 'standardwebhooks'
import { render } from '@react-email/render'
import ConfirmSignupEmail from '@/emails/templates/ConfirmSignUpEmail'
import ResetPasswordEmail from '@/emails/templates/ResetPasswordEmail'
import MagicLinkEmail from '@/emails/templates/MagicLinkEmail'
import { getConfiguredAppUrl } from '@/lib/app-url'
import { sendTransactionalEmail } from '@/lib/emails/provider'

type SupabaseEmailUser = {
  email: string
  user_metadata?: {
    locale?: 'en' | 'es'
  }
}

type SupabaseEmailData = {
  site_url: string
  token_hash: string
  redirect_to?: string | null
  email_action_type?: 'signup' | 'recovery' | string
}

type SupabaseEmailWebhookPayload = {
  user?: SupabaseEmailUser
  email_data?: SupabaseEmailData
}

function parsePathFromUrl(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url.startsWith('/') ? url : `/${url}`
  }
}

function getRequestOrigin(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host')

  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

function getLocale(user: SupabaseEmailUser) {
  return user.user_metadata?.locale === 'en' ? 'en' : 'es'
}

export async function POST(request: Request) {
  console.time('auth-hook-total')

  try {
    const payload = await request.text()

    const headers = {
      'webhook-id': request.headers.get('webhook-id') || '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
      'webhook-signature': request.headers.get('webhook-signature') || '',
    }

    const hookSecret = (
      process.env.SUPABASE_HOOK_SECRET || ''
    ).replace('v1,whsec_', '')

    if (!hookSecret) {
      console.error('SUPABASE_HOOK_SECRET not configured')

      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    let event: SupabaseEmailWebhookPayload

    try {
      event = new Webhook(hookSecret).verify(
        payload,
        headers
      ) as SupabaseEmailWebhookPayload
    } catch (error) {
      console.error('Webhook verification failed:', error)

      return Response.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const { user, email_data } = event

    if (!user?.email) {
      console.error('Missing user or email in payload')

      return Response.json(
        { error: 'Missing user data' },
        { status: 400 }
      )
    }

    if (!email_data?.token_hash) {
      console.error('Missing email data')

      return Response.json(
        { error: 'Missing email data' },
        { status: 400 }
      )
    }

    const locale = getLocale(user)

    const appUrl = getConfiguredAppUrl(
      getRequestOrigin(request)
    )

    const emailType =
      email_data.email_action_type || 'signup'

    const nextPath = email_data.redirect_to
      ? parsePathFromUrl(email_data.redirect_to)
      : `/${locale}/dashboard`

    const confirmationUrl =
      `${appUrl}/${locale}/auth/confirm?token_hash=${email_data.token_hash}&type=${emailType}&next=${encodeURIComponent(nextPath)}`


    const isRecruiterInvite =
      email_data.redirect_to?.includes('/recruiter/access')

    const isMagicLink =
      emailType === 'magiclink'

    const isRecovery =
      emailType === 'recovery'

    const html =
      isRecruiterInvite || isMagicLink
        ? await render(
            <MagicLinkEmail
              magicLinkUrl={confirmationUrl}
              locale={locale}
            />
          )
        : isRecovery
          ? await render(
              <ResetPasswordEmail
                resetUrl={confirmationUrl}
                locale={locale}
              />
            )
          : await render(
              <ConfirmSignupEmail
                confirmationUrl={confirmationUrl}
                locale={locale}
              />
            )


    const subject =
      isRecruiterInvite
        ? locale === 'es'
          ? 'Inicia sesión para aceptar tu invitación'
          : 'Sign in to accept your invitation'
        : isMagicLink
          ? locale === 'es'
            ? 'Tu enlace de inicio de sesión en LEAD Talent Platform'
            : 'Your LEAD Talent Platform sign-in link'
          : isRecovery
          ? locale === 'es'
            ? 'Restablece tu contraseña de LEAD Talent Platform'
            : 'Reset your LEAD Talent Platform password'
          : locale === 'es'
            ? 'Confirma tu cuenta en LEAD Talent Platform'
            : 'Confirm your LEAD Talent Platform account'


    // Do not block Supabase waiting for Resend.
    // Supabase only needs a successful webhook response.
    sendTransactionalEmail({
      to: user.email,
      subject,
      html,
      critical: true,
    })
      .then((result) => {
        if (!result.success) {
          console.error(
            'Email provider failed:',
            result.error
          )
          return
        }

        console.log(
          'Auth email sent:',
          result.id
        )
      })
      .catch((error) => {
        console.error(
          'Email sending failed:',
          error
        )
      })


    console.timeEnd('auth-hook-total')

    return Response.json(
      { success: true },
      { status: 200 }
    )

  } catch (error) {
    console.timeEnd('auth-hook-total')

    console.error(
      'Webhook failed:',
      error instanceof Error
        ? error.message
        : 'Unknown error'
    )

    return Response.json(
      {
        error: 'Internal server error',
        details:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      { status: 500 }
    )
  }
}