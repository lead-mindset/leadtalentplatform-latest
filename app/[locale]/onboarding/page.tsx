import { redirect } from 'next/navigation'
import Onboarding from '@/components/onboarding'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server-service'
import { PersonProfileService } from '@/lib/services/person-profile.service'
import { ChapterInviteService } from '@/lib/services/chapter-invite.service'

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

  const serviceSupabase = createServiceClient()
  const pendingInvite = user.email
    ? await ChapterInviteService.findPendingInviteForEmail(serviceSupabase, user.email)
    : null

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
      pendingInvite={pendingInvite ? {
        chapterId: pendingInvite.chapter_id,
        displayTitle: pendingInvite.display_title,
      } : null}
    />
  )
}
