import { Resend } from 'resend';
import { Webhook } from 'standardwebhooks';
import { render } from '@react-email/render';
import ConfirmSignupEmail from '@/emails/templates/ConfirmSignUpEmail';
import ResetPasswordEmail from '@/emails/templates/ResetPasswordEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function POST(request: Request) {
  try {
    const payload = await request.text();

    const headers = {
      'webhook-id': request.headers.get('webhook-id') || '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
      'webhook-signature': request.headers.get('webhook-signature') || ''
    };

    const hookSecret = process.env.SUPABASE_HOOK_SECRET?.replace('v1,whsec_', '') || '';

    if (!hookSecret) {
      console.error('SUPABASE_HOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const wh = new Webhook(hookSecret);

    let event: SupabaseEmailWebhookPayload;
    try {
      event = wh.verify(payload, headers) as SupabaseEmailWebhookPayload;
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { user, email_data } = event;

    if (!user || !user.email) {
      console.error('Missing user or email in payload');
      return new Response(
        JSON.stringify({ error: 'Missing user data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!email_data) {
      console.error('Missing email_data');
      return new Response(
        JSON.stringify({ error: 'Missing email data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const locale = (user.user_metadata?.locale || 'es') as 'en' | 'es';
    const appUrl = process.env.FRONTEND_URL || email_data.site_url;
    const emailType = email_data.email_action_type || 'signup';

    const confirmationUrl = `${appUrl}/${locale}/auth/confirm?token_hash=${email_data.token_hash}&type=${emailType}&next=${encodeURIComponent(email_data.redirect_to || `/${locale}/dashboard`)}`;

    let html = '';
    let subject = '';

    if (emailType === 'recovery') {
      html = await render(
        <ResetPasswordEmail resetUrl={confirmationUrl} locale={locale} />
      );
      subject = locale === 'es'
        ? 'Restablece tu contraseña - LEAD Mindset'
        : 'Reset your password - LEAD Mindset';
    } else {
      html = await render(
        <ConfirmSignupEmail confirmationUrl={confirmationUrl} locale={locale} />
      );
      subject = locale === 'es'
        ? 'Confirma tu registro en LEAD Mindset'
        : 'Confirm your registration - LEAD Mindset';
    }

    const result = await resend.emails.send({
      from: 'LEAD Mindset <noreply@leadmindset.org>',
      to: user.email,
      subject,
      html,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return new Response(
        JSON.stringify({
          error: 'Email service unavailable',
          details: result.error
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'retry-after': 'true'
          }
        }
      );
    }

    console.log('Email sent:', result.data?.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook failed:', error instanceof Error ? error.message : 'Unknown error');

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
