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

function createSelectMock(result: { data: unknown[] | null; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(async () => result),
  }
  return {
    supabase: { from: vi.fn(() => builder) } as unknown as SupabaseClient<Database>,
    builder,
  }
}

function createInsertAndRecommendationUpdateMock(
  insertResult: { error: unknown },
  updateResult: { error: unknown }
) {
  const insertBuilder = {
    insert: vi.fn(async () => insertResult),
  }
  const updateBuilder = {
    update: vi.fn(() => updateBuilder),
    eq: vi.fn(),
  }
  updateBuilder.eq.mockReturnValueOnce(updateBuilder).mockResolvedValueOnce(updateResult)

  return {
    supabase: {
      from: vi.fn((table: string) => table === 'growth_reflection' ? insertBuilder : updateBuilder),
    } as unknown as SupabaseClient<Database>,
    insertBuilder,
    updateBuilder,
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
      event_id: null,
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

  it('can link a private reflection to the related event', async () => {
    const { supabase, builder } = createInsertMock({ error: null })

    await GrowthReflectionService.createReflection(supabase, {
      userId: 'user-1',
      status: 'completed',
      data: {
        ...reflectionData,
        event_id: 'event-1',
      },
    })

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        event_id: 'event-1',
        visibility: 'private',
      })
    )
  })

  it('completes the linked recommendation when proof is completed', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T12:30:00Z'))
    const { supabase, updateBuilder } = createInsertAndRecommendationUpdateMock(
      { error: null },
      { error: null }
    )

    await expect(
      GrowthReflectionService.createReflection(supabase, {
        userId: 'user-1',
        status: 'completed',
        data: {
          ...reflectionData,
          event_id: 'event-1',
          recommendation_id: 'recommendation-1',
        },
      })
    ).resolves.toEqual({ success: true })

    expect(updateBuilder.update).toHaveBeenCalledWith({
      status: 'completed',
      updated_at: '2026-05-11T12:30:00.000Z',
    })
    expect(updateBuilder.eq).toHaveBeenNthCalledWith(1, 'id', 'recommendation-1')
    expect(updateBuilder.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-1')
    vi.useRealTimers()
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

  it('summarizes private reflection progress for the student only', async () => {
    const { supabase, builder } = createSelectMock({
      data: [
        { id: 'reflection-1', status: 'completed' },
        { id: 'reflection-2', status: 'draft' },
        { id: 'reflection-3', status: 'completed' },
      ],
      error: null,
    })

    await expect(GrowthReflectionService.getProgressForUser(supabase, 'user-1')).resolves.toEqual({
      completedReflections: 2,
      proofItemsCreated: 3,
    })

    expect(builder.select).toHaveBeenCalledWith('id, status')
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('returns empty progress when reflection progress cannot be loaded', async () => {
    const { supabase } = createSelectMock({ data: null, error: { message: 'failed' } })

    await expect(GrowthReflectionService.getProgressForUser(supabase, 'user-1')).resolves.toEqual({
      completedReflections: 0,
      proofItemsCreated: 0,
    })
  })
})
