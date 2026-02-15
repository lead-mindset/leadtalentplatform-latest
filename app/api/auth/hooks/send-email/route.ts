import { Resend } from 'resend';
import { Webhook } from 'standardwebhooks';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    console.log('=== AUTH HOOK DEBUG ===');
    
    const payload = await request.text();
    const headers = {
      'webhook-id': request.headers.get('webhook-id') || '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
      'webhook-signature': request.headers.get('webhook-signature') || ''
    };
    
    console.log('Webhook headers:', headers);
        const hookSecret = process.env.SUPABASE_HOOK_SECRET?.replace('v1,whsec_', '') || '';
    const wh = new Webhook(hookSecret);
    
    let event;
    try {
      event = wh.verify(payload, headers) as any;
      console.log('✅ Webhook verified');
    } catch (err) {
      console.error('❌ Webhook verification failed:', err);
      return Response.json(
        { error: 'Invalid signature' }, 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { user, email_data } = event;
    const locale = user.user_metadata?.locale || 'en';
    
    console.log('User locale:', locale);
    console.log('Email type:', email_data.token_type);
    
    const emailContent = getEmailTemplate(email_data.token_type, locale, {
      confirmationUrl: email_data.confirmation_url,
      email: user.email,
      token: email_data.token
    });
    
    const result = await resend.emails.send({
      from: 'LeadMindset <noreply@leadmindset.org>',
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    console.log('✅ Email sent:', result);
    return Response.json(
      { success: true },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

type EmailType = 'signup' | 'magiclink' | 'recovery';
type Locale = 'en' | 'es';

function getEmailTemplate(
  type: string,
  locale: string,
  data: { confirmationUrl?: string; email?: string; token?: string }
) {
  const templates: Record<EmailType, Record<Locale, { subject: string; html: string; text: string }>> = {
    signup: {
      en: {
        subject: 'Confirm your email - LeadMindset',
        text: `Welcome to LeadMindset! Please confirm your email address by clicking the link below:\n\n${data.confirmationUrl}\n\nIf you didn't create an account, you can safely ignore this email.`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Welcome to LeadMindset!</h1>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Thanks for signing up. Please confirm your email address to get started.
              </p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #007bff;">
                    <a href="${data.confirmationUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                Or copy this link: <span style="color: #007bff;">${data.confirmationUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} LeadMindset. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      },
      es: {
        subject: 'Confirma tu correo electrónico - LeadMindset',
        text: `¡Bienvenido a LeadMindset! Por favor confirma tu dirección de correo electrónico haciendo clic en el enlace a continuación:\n\n${data.confirmationUrl}\n\nSi no creaste una cuenta, puedes ignorar este correo.`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">¡Bienvenido a LeadMindset!</h1>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Gracias por registrarte. Por favor confirma tu dirección de correo electrónico para comenzar.
              </p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #007bff;">
                    <a href="${data.confirmationUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Confirmar correo electrónico
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                Si no creaste una cuenta, puedes ignorar este correo.
              </p>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                O copia este enlace: <span style="color: #007bff;">${data.confirmationUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} LeadMindset. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }
    },
    magiclink: {
      en: {
        subject: 'Sign in to LeadMindset',
        text: `Here's your magic link to sign in:\n\n${data.confirmationUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email.`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Sign in to LeadMindset</h1>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Click the button below to securely sign in to your account.
              </p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #28a745;">
                    <a href="${data.confirmationUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Sign In
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
              </p>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                Or copy this link: <span style="color: #28a745;">${data.confirmationUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} LeadMindset. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      },
      es: {
        subject: 'Inicia sesión en LeadMindset',
        text: `Aquí está tu enlace mágico para iniciar sesión:\n\n${data.confirmationUrl}\n\nEste enlace expirará en 1 hora. Si no solicitaste esto, puedes ignorar este correo.`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Inicia sesión en LeadMindset</h1>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Haz clic en el botón a continuación para iniciar sesión de forma segura en tu cuenta.
              </p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #28a745;">
                    <a href="${data.confirmationUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Iniciar sesión
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                Este enlace expirará en 1 hora. Si no solicitaste esto, puedes ignorar este correo.
              </p>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                O copia este enlace: <span style="color: #28a745;">${data.confirmationUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} LeadMindset. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }
    },
    recovery: {
      en: {
        subject: 'Reset your LeadMindset password',
        text: `You requested to reset your password. Click the link below to create a new password:\n\n${data.confirmationUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email.`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Reset Your Password</h1>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                You requested to reset your password. Click the button below to create a new password.
              </p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #dc3545;">
                    <a href="${data.confirmationUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
              </p>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                Or copy this link: <span style="color: #dc3545;">${data.confirmationUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} LeadMindset. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      },
      es: {
        subject: 'Restablece tu contraseña de LeadMindset',
        text: `Solicitaste restablecer tu contraseña. Haz clic en el enlace a continuación para crear una nueva contraseña:\n\n${data.confirmationUrl}\n\nEste enlace expirará en 1 hora. Si no solicitaste esto, puedes ignorar este correo.`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Restablece tu contraseña</h1>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Solicitaste restablecer tu contraseña. Haz clic en el botón a continuación para crear una nueva contraseña.
              </p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #dc3545;">
                    <a href="${data.confirmationUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                Este enlace expirará en 1 hora. Si no solicitaste esto, puedes ignorar este correo.
              </p>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                O copia este enlace: <span style="color: #dc3545;">${data.confirmationUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} LeadMindset. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }
    }
  };

  const emailType = type as EmailType;
  const emailLocale = locale as Locale;

  return templates[emailType]?.[emailLocale] || 
         templates[emailType]?.en || 
         templates.signup.en;
}