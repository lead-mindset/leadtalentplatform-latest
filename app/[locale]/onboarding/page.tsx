import { redirect } from 'next/navigation'
import Onboarding from '@/components/onboarding'
import { createClient } from '@/lib/supabase/server'
import { PersonProfileService } from '@/lib/services/person-profile.service'

type OnboardingPageProps = {
  params: Promise<{ locale: string }>
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    redirect(`/${locale}/auth/error?error=Unauthorized`)
  }

  const profile = await PersonProfileService.getBasicProfile(supabase, user.id)

  if (profile) {
    redirect(`/${locale}/events`)
  }

  return (
    <Onboarding
      initialValues={{
        full_name:
          typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === 'string'
              ? user.user_metadata.name
              : '',
      }}
    />
  )
}
