'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server-service'
import {
  parseBasicOnboardingFormData,
  saveBasicOnboarding,
} from '@/lib/actions/student/onboarding.helpers'

const SUPPORTED_LOCALES = new Set(['en', 'es'])

async function getRequestLocale() {
  const referer = (await headers()).get('referer')
  if (!referer) return 'en'

  try {
    const locale = new URL(referer).pathname.split('/').filter(Boolean)[0]
    return SUPPORTED_LOCALES.has(locale) ? locale : 'en'
  } catch {
    return 'en'
  }
}

export async function submitOnboarding(formData: FormData) {
  const locale = await getRequestLocale()
  let redirectPath = '/student'

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id || !user?.email) {
      return { error: 'Unauthorized' }
    }

    const t = await getTranslations()
    const parsed = parseBasicOnboardingFormData(formData, t)

    if (!parsed.success) {
      return { error: 'Validation failed', details: parsed.error.flatten() }
    }

    const serviceSupabase = createServiceClient()
    const result = await saveBasicOnboarding(supabase, {
      userId: user.id,
      email: user.email,
      data: parsed.data,
      preapprovalSupabase: serviceSupabase,
    })

    if (!result.success) {
      return { error: result.error }
    }

    redirectPath = result.postOnboardingRedirectPath ?? redirectPath
  } catch (error) {
    console.error('Onboarding submission error:', error)
    return { error: 'Internal server error' }
  }

  revalidatePath('/onboarding')
  revalidatePath('/events')
  revalidatePath('/student')
  revalidatePath('/student/profile')
  revalidatePath('/chapter')
  redirect(`/${locale}${redirectPath}`)
}
