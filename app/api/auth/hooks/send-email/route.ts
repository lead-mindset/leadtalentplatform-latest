import { Resend } from 'resend';
import { createHmac } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    console.log('=== AUTH HOOK DEBUG ===');
    
    // Get webhook headers
    const signature = request.headers.get('webhook-signature');
    const timestamp = request.headers.get('webhook-timestamp');
    const webhookId = request.headers.get('webhook-id');
    
    console.log('Webhook signature:', signature);
    console.log('Webhook timestamp:', timestamp);
    console.log('Webhook ID:', webhookId);
    
    if (!signature || !timestamp) {
      console.error('❌ Missing webhook headers');
      return Response.json({ error: 'Missing webhook headers' }, { status: 401 });
    }
    
    // Get the raw body
    const body = await request.text();
    const payload = JSON.parse(body);
    
    // Verify the signature
    const secret = process.env.SUPABASE_HOOK_SECRET?.replace('v1,whsec_', '') || '';
    const signedContent = `${webhookId}.${timestamp}.${body}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signedContent)
      .digest('base64');
    
    const signatures = signature.split(',');
    const versionedSignature = signatures.find(sig => sig.startsWith('v1,'));
    const actualSignature = versionedSignature?.replace('v1,', '');
    
    console.log('Expected signature:', expectedSignature);
    console.log('Actual signature:', actualSignature);
    
    if (actualSignature !== expectedSignature) {
      console.error('❌ Signature verification failed');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ Signature verified');
    
    const { user, email_data } = payload;
    const locale = user.user_metadata?.locale || 'en';
    
    console.log('User locale:', locale);
    console.log('Email type:', email_data.token_type);
    
    const emailContent = getEmailTemplate(email_data.token_type, locale, {
      confirmationUrl: email_data.confirmation_url,
      email: user.email,
      token: email_data.token
    });
    
    const result = await resend.emails.send({
      from: 'noreply@leadmindset.org',
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    console.log('✅ Email sent:', result);
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

type EmailType = 'signup' | 'magiclink' | 'recovery';
type Locale = 'en' | 'es';

function getEmailTemplate(
  type: string,
  locale: string,
  data: { confirmationUrl?: string; email?: string; token?: string }
) {
  const templates: Record<EmailType, Record<Locale, { subject: string; html: string }>> = {
    signup: {
      en: {
        subject: 'Confirm your email',
        html: `<p>Click here to confirm: <a href="${data.confirmationUrl}">Confirm Email</a></p>`
      },
      es: {
        subject: 'Confirma tu correo electrónico',
        html: `<p>Haz clic aquí para confirmar: <a href="${data.confirmationUrl}">Confirmar correo</a></p>`
      }
    },
    magiclink: {
      en: {
        subject: 'Your magic link',
        html: `<p>Click here to sign in: <a href="${data.confirmationUrl}">Sign In</a></p>`
      },
      es: {
        subject: 'Tu enlace mágico',
        html: `<p>Haz clic aquí para iniciar sesión: <a href="${data.confirmationUrl}">Iniciar sesión</a></p>`
      }
    },
    recovery: {
      en: {
        subject: 'Reset your password',
        html: `<p>Click here to reset: <a href="${data.confirmationUrl}">Reset Password</a></p>`
      },
      es: {
        subject: 'Restablece tu contraseña',
        html: `<p>Haz clic aquí para restablecer: <a href="${data.confirmationUrl}">Restablecer contraseña</a></p>`
      }
    }
  };

  const emailType = type as EmailType;
  const emailLocale = locale as Locale;

  return templates[emailType]?.[emailLocale] || 
         templates[emailType]?.en || 
         templates.signup.en;
}