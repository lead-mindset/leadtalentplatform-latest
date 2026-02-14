import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    console.log('=== AUTH HOOK DEBUG ===');
    
    // Try multiple ways to get the auth header
    const authHeader = request.headers.get('authorization');
    const authHeaderLower = request.headers.get('Authorization');
    
    console.log('All headers:', Object.fromEntries(request.headers.entries()));
    console.log('auth (lowercase):', authHeader);
    console.log('Authorization (uppercase):', authHeaderLower);
    console.log('Expected:', `Bearer ${process.env.SUPABASE_HOOK_SECRET}`);
    
    const actualAuth = authHeader || authHeaderLower;
    
    if (!actualAuth) {
      console.error('❌ No authorization header found');
      return Response.json({ error: 'No authorization header' }, { status: 401 });
    }
    
    if (actualAuth !== `Bearer ${process.env.SUPABASE_HOOK_SECRET}`) {
      console.error('❌ Authorization mismatch');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Authorization passed');

    const payload = await request.json();
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const { user, email_data } = payload;
    const locale = user.user_metadata?.locale || 'en';
    
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