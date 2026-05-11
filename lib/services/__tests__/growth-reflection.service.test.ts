import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { GrowthReflectionService } from '../growth-reflection.service'

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

function createInsertMock(result: { error: unknown }) {
  const builder = {
    insert: vi.fn(async () => result),
  }
  return {
    supabase: { from: vi.fn(() => builder) } as unknown as SupabaseClient<Database>,
    builder,
  }
}

const reflectionData = {
  participated_in: 'AI workshop',
  learned: 'How to frame an AI product problem',
  skill_or_mindset: 'Curiosity and product thinking',
  goal_connection: 'This connects to my goal of becoming a builder',
  next_move: 'Create a small prototype note',
}

describe('GrowthReflectionService', () => {
  it('creates completed reflections as private proof by default', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T12:00:00Z'))
    const { supabase, builder } = createInsertMock({ error: null })

    await expect(
      GrowthReflectionService.createReflection(supabase, {
        userId: 'user-1',
        status: 'completed',
        data: reflectionData,
      })
    ).resolves.toEqual({ success: true })

    expect(builder.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      recommendation_id: null,
      status: 'completed',
      visibility: 'private',
      participated_in: reflectionData.participated_in,
      learned: reflectionData.learned,
      skill_or_mindset: reflectionData.skill_or_mindset,
      goal_connection: reflectionData.goal_connection,
      next_move: reflectionData.next_move,
      completed_at: '2026-05-11T12:00:00.000Z',
      updated_at: '2026-05-11T12:00:00.000Z',
    })
    vi.useRealTimers()
  })

  it('creates draft reflections without completed_at', async () => {
    const { supabase, builder } = createInsertMock({ error: null })

    await GrowthReflectionService.createReflection(supabase, {
      userId: 'user-1',
      status: 'draft',
      data: reflectionData,
    })

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'draft',
        visibility: 'private',
        completed_at: null,
      })
    )
  })

  it('returns an error when the reflection cannot be created', async () => {
    const { supabase } = createInsertMock({ error: { message: 'failed' } })

    await expect(
      GrowthReflectionService.createReflection(supabase, {
        userId: 'user-1',
        status: 'completed',
        data: reflectionData,
      })
    ).resolves.toEqual({ success: false, error: 'Unable to create growth reflection' })
  })
})
