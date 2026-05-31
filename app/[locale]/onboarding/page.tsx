import { redirect } from 'next/navigation'
import Onboarding from '@/components/onboarding'
import { createClient } from '@/lib/supabase/server'
import { PersonProfileService } from '@/lib/services/person-profile.service'

type OnboardingPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}

function getSafeNextPath(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  if (value.startsWith('/auth/')) return null
  return value
}

export default async function OnboardingPage({ params, searchParams }: OnboardingPageProps) {
  const { locale } = await params
  const { next } = await searchParams
  const nextPath = getSafeNextPath(next)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    redirect(`/${locale}/auth/error?error=Unauthorized`)
  }

  const profile = await PersonProfileService.getBasicProfile(supabase, user.id)

  if (profile) {
    redirect(`/${locale}${nextPath ?? '/events'}`)
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
      nextPath={nextPath}
    />
  )
}
