'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { parseGrowthReflectionFormData } from './growth-reflection.helpers'
import { GrowthReflectionService } from '@/lib/services/growth-reflection.service'

export async function submitGrowthReflection(formData: FormData): Promise<void> {
  const parsed = parseGrowthReflectionFormData(formData)

  if (!parsed.success) {
    redirect('/student/growth-reflection?error=invalid')
  }

  const { supabase, user } = await requireUser()
  const result = await GrowthReflectionService.createReflection(supabase, {
    userId: user.id,
    status: parsed.data.status,
    data: parsed.data,
  })

  if (!result.success) {
    redirect('/student/growth-reflection?error=save')
  }

  redirect('/student?reflection=saved')
}
