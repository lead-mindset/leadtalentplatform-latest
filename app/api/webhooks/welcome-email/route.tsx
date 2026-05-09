import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createServiceClient } from '@/lib/supabase/server-service';
import WelcomeEmail from '@/emails/templates/WelcomeEmail';
import { getConfiguredAppUrl } from '@/lib/app-url';

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  return new Resend(apiKey);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await request.json();
  const record = payload.record;

  if (!record?.email) {
    return new Response(JSON.stringify({ skipped: 'no email' }), { status: 200 });
  }

  let resend: Resend;
  try {
    resend = createResendClient();
  } catch (err) {
    console.error(err instanceof Error ? err.message : 'Email service not configured');
    return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500 });
  }

  const supabase = createServiceClient();
  const { data: authUser, error } = await supabase.auth.admin.getUserById(record.id);

  if (error || !authUser) {
    console.error('Could not fetch auth user:', error);
  }

  const meta = authUser?.user?.user_metadata ?? {};
  const locale = (['en', 'es'].includes(meta.locale) ? meta.locale : 'es') as 'en' | 'es';

  const appUrl = getConfiguredAppUrl();

  const role = record.role ?? 'member';
  const dashboardPath =
    role === 'admin' ? 'admin' :
    role === 'recruiter' ? 'company' :
    'student/profile';

  const dashboardUrl = `${appUrl}/${locale}/${dashboardPath}`;

  const html = await render(
    <WelcomeEmail
      dashboardUrl={dashboardUrl}
      name={record.name}
      role={role}
      locale={locale}
    />
  );

  const subject = locale === 'es'
    ? '¡Bienvenido/a a LEAD Mindset! 🚀'
    : 'Welcome to LEAD Mindset! 🚀';

  const result = await resend.emails.send({
    from: 'LEAD Mindset <noreply@leadmindset.org>',
    to: record.email,
    subject,
    html,
  });

  if (result.error) {
    console.error('Welcome email failed:', result.error);
    return new Response(JSON.stringify({ error: result.error }), { status: 503 });
  }

  console.log('Welcome email sent:', result.data?.id);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
