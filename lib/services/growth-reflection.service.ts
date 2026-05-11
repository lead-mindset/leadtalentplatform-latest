import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { logger } from '@/lib/logger'

export type GrowthReflectionStatus = 'draft' | 'completed'

export type GrowthReflectionInput = {
  event_id?: string | null
  participated_in: string
  learned: string
  skill_or_mindset: string
  goal_connection: string
  next_move: string
  recommendation_id?: string | null
}

export const GrowthReflectionService = {
  async createReflection(
    supabase: SupabaseClient<Database>,
    params: {
      userId: string
      status: GrowthReflectionStatus
      data: GrowthReflectionInput
    }
  ): Promise<{ success: true } | { success: false; error: string }> {
    const now = new Date().toISOString()
    const { error } = await supabase.from('growth_reflection').insert({
      user_id: params.userId,
      event_id: params.data.event_id ?? null,
      recommendation_id: params.data.recommendation_id ?? null,
      status: params.status,
      visibility: 'private',
      participated_in: params.data.participated_in,
      learned: params.data.learned,
      skill_or_mindset: params.data.skill_or_mindset,
      goal_connection: params.data.goal_connection,
      next_move: params.data.next_move,
      completed_at: params.status === 'completed' ? now : null,
      updated_at: now,
    })

    if (error) {
      logger.error(
        { context: 'GrowthReflectionService.createReflection', userId: params.userId, error },
        'Failed to create growth reflection'
      )
      return { success: false, error: 'Unable to create growth reflection' }
    }

    return { success: true }
  },
}
