'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import {
  ChapterActivationInterestService,
  type ChapterActivationInterestInput,
} from '@/lib/services/chapter-activation-interest.service'

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function submitChapterActivationInterest(formData: FormData) {
  try {
    const { supabase, user } = await requireUser()
    const input: ChapterActivationInterestInput = {
      universityName: readText(formData, 'university_name'),
      motivation: readText(formData, 'motivation'),
      universityContext: readText(formData, 'university_context'),
      leadValue: readText(formData, 'lead_value'),
      teamStatus: readText(formData, 'team_status'),
      interestedPeopleContext: readText(formData, 'interested_people_context'),
      opportunities: readText(formData, 'opportunities'),
      longTermCommitment: readText(formData, 'long_term_commitment'),
    }

    const result = await ChapterActivationInterestService.submitInterest(supabase, {
      userId: user.id,
      input,
    })

    if (!result.success) {
      return result
    }

    revalidatePath('/student')
    return { success: true }
  } catch (error) {
    console.error('Chapter activation interest submission error:', error)
    return { success: false, error: 'No se pudo enviar el interes de activacion.' }
  }
}
