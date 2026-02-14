import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server-service';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    console.log('=== AUTH HOOK DEBUG ===');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('HOOK_SECRET exists:', !!process.env.SUPABASE_HOOK_SECRET);
    console.log('HOOK_SECRET value:', process.env.SUPABASE_HOOK_SECRET);
    
    const authHeader = request.headers.get('authorization');
    console.log('Auth header received:', authHeader);
    console.log('Expected:', `Bearer ${process.env.SUPABASE_HOOK_SECRET}`);
    console.log('Match:', authHeader === `Bearer ${process.env.SUPABASE_HOOK_SECRET}`);
    
    if (authHeader !== `Bearer ${process.env.SUPABASE_HOOK_SECRET}`) {
      console.error('❌ Authorization failed');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Authorization passed');

    const payload = await request.json();
    console.log('Payload received:', JSON.stringify(payload, null, 2));
    
    const { user, email_data } = payload;
    
    const locale = user.user_metadata?.locale || 'en';
    console.log('User locale:', locale);
    console.log('Email type:', email_data.token_type);
    
    const emailContent = getEmailTemplate(email_data.token_type, locale, {
      confirmationUrl: email_data.confirmation_url,
      email: user.email,
      token: email_data.token
    });
    
    console.log('Email template:', emailContent.subject);
    
    const result = await resend.emails.send({
      from: 'noreply@leadmindset.org', // UPDATE THIS to your verified domain
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    console.log('✅ Email sent successfully:', result);
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error in auth hook:', error);
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