import { render } from '@react-email/render'
import WelcomeEmail from '@/emails/templates/WelcomeEmail'
import { getConfiguredAppUrl } from '@/lib/app-url'
import { sendTransactionalEmail } from '@/lib/emails/provider'
import { createServiceClient } from '@/lib/supabase/server-service'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await request.json()
  const record = payload.record

  if (!record?.email) {
    return Response.json({ skipped: 'no email' }, { status: 200 })
  }

  const supabase = createServiceClient()
  const { data: authUser, error } = await supabase.auth.admin.getUserById(record.id)

  if (error || !authUser) {
    console.error('Could not fetch auth user:', error)
  }

  const meta = authUser?.user?.user_metadata ?? {}
  const locale = meta.locale === 'en' ? 'en' : 'es'
  const role = record.role ?? 'member'
  const dashboardPath =
    role === 'admin' ? 'admin' :
    role === 'recruiter' ? 'company' :
    'student/profile'

  const dashboardUrl = `${getConfiguredAppUrl()}/${locale}/${dashboardPath}`
  const html = await render(
    <WelcomeEmail dashboardUrl={dashboardUrl} name={record.name} role={role} locale={locale} />
  )

  const result = await sendTransactionalEmail({
    to: record.email,
    subject: locale === 'es'
      ? 'Tu perfil esta listo en LEAD Talent Platform'
      : 'Your profile is ready in LEAD Talent Platform',
    html,
  })

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 503 })
  }

  console.log('Welcome email sent:', result.id)
  return Response.json({ success: true }, { status: 200 })
}
