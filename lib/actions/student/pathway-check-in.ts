'use server'

import { revalidatePath } from 'next/cache'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentDashboardService } from '@/lib/services/student-dashboard.service'
import { PathwayRolloutService } from '@/lib/services/pathway-rollout.service'
import {
  parsePathwayCheckInFormData,
  saveCompletedPathwayCheckIn,
} from '@/lib/actions/student/pathway-check-in.helpers'

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

export async function submitPathwayCheckIn(formData: FormData): Promise<void> {
  const locale = await getRequestLocale()

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) redirect(`/${locale}/auth/login`)

    const dashboard = await StudentDashboardService.getActivationDashboard(supabase, user.id)
    const chapterId = dashboard.membership?.chapter_id ?? null
    const flags = await PathwayRolloutService.getFlagsForChapter(supabase, chapterId)

    if (!flags.enable_check_in) {
      redirect(`/${locale}/student/pathway-check-in?error=disabled`)
    }

    const parsed = parsePathwayCheckInFormData(formData)
    if (!parsed.success) {
      redirect(`/${locale}/student/pathway-check-in?error=invalid`)
    }

    const result = await saveCompletedPathwayCheckIn(supabase, {
      userId: user.id,
      chapterId,
      answers: parsed.data,
    })

    if (!result.success) redirect(`/${locale}/student/pathway-check-in?error=save`)
  } catch (error) {
    if (isRedirectError(error)) throw error

    console.error('Pathway check-in submission error:', error)
    redirect(`/${locale}/student/pathway-check-in?error=server`)
  }

  revalidatePath('/student')
  revalidatePath('/student/pathway-check-in')
  redirect(`/${locale}/student/pathway-check-in?completed=1`)
}
