'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GrowthReflectionService } from '@/lib/services/growth-reflection.service'
import { parseGrowthReflectionFormData } from '@/lib/actions/student/growth-reflection.helpers'

export async function submitGrowthReflection(formData: FormData) {
  const parsed = parseGrowthReflectionFormData(formData)
  if (!parsed.success) {
    return { error: 'Validation failed', details: parsed.error.flatten() }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) return { error: 'Unauthorized' }

    const result = await GrowthReflectionService.createReflection(supabase, {
      userId: user.id,
      status: parsed.data.status,
      data: parsed.data,
    })

    if (!result.success) return { error: result.error }
  } catch (error) {
    console.error('Growth reflection submission error:', error)
    return { error: 'Internal server error' }
  }

  revalidatePath('/student')
  redirect('/student')
}
