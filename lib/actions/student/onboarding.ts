'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
  parseBasicOnboardingFormData,
  saveBasicOnboarding,
} from '@/lib/actions/student/onboarding.helpers'

export async function submitOnboarding(formData: FormData) {
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

    const result = await saveBasicOnboarding(supabase, {
      userId: user.id,
      email: user.email,
      data: parsed.data,
    })

    if (!result.success) {
      return { error: result.error }
    }
  } catch (error) {
    console.error('Onboarding submission error:', error)
    return { error: 'Internal server error' }
  }

  revalidatePath('/onboarding')
  revalidatePath('/events')
  revalidatePath('/student')
  revalidatePath('/student/profile')
  redirect('/student')
}
