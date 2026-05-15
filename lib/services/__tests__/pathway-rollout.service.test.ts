import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_PATHWAY_FEATURE_FLAGS,
  PathwayRolloutService,
  type PathwayFeatureFlags,
} from '../pathway-rollout.service'
import type { Database } from '@/lib/database.generated'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

type QueryResult = {
  data: (PathwayFeatureFlags & { chapter_id: string | null }) | null
  error: { message: string } | null
}

function row(
  chapterId: string | null,
  flags: Partial<PathwayFeatureFlags>
): PathwayFeatureFlags & { chapter_id: string | null } {
  return {
    chapter_id: chapterId,
    enable_check_in: flags.enable_check_in ?? false,
    enable_recommendation_card: flags.enable_recommendation_card ?? false,
    enable_growth_reflection: flags.enable_growth_reflection ?? false,
    enable_chapter_insights: flags.enable_chapter_insights ?? false,
  }
}

function createSupabaseMock(results: QueryResult[]) {
  const from = vi.fn(() => {
    const result = results.shift() ?? { data: null, error: null }
    const builder = {
      select: vi.fn(() => builder),
      is: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => result),
    }
    return builder
  })

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    from,
  }
}

describe('PathwayRolloutService', () => {
  it('returns defaults when chapter id is missing', async () => {
    const { supabase, from } = createSupabaseMock([])

    await expect(PathwayRolloutService.getFlagsForChapter(supabase, '')).resolves.toEqual(
      DEFAULT_PATHWAY_FEATURE_FLAGS
    )
    expect(from).not.toHaveBeenCalled()
  })

  it('returns defaults when no global or chapter rows exist', async () => {
    const { supabase } = createSupabaseMock([
      { data: null, error: null },
      { data: null, error: null },
    ])

    await expect(PathwayRolloutService.getFlagsForChapter(supabase, 'leaduni')).resolves.toEqual(
      DEFAULT_PATHWAY_FEATURE_FLAGS
    )
  })

  it('returns global flags when no chapter row exists', async () => {
    const globalFlags = row(null, {
      enable_check_in: true,
      enable_recommendation_card: true,
    })
    const { supabase } = createSupabaseMock([
      { data: globalFlags, error: null },
      { data: null, error: null },
    ])

    await expect(PathwayRolloutService.getFlagsForChapter(supabase, 'leaduni')).resolves.toEqual({
      enable_check_in: true,
      enable_recommendation_card: true,
      enable_growth_reflection: false,
      enable_chapter_insights: false,
    })
  })

  it('returns chapter flags over global flags', async () => {
    const { supabase } = createSupabaseMock([
      {
        data: row(null, {
          enable_check_in: true,
          enable_recommendation_card: true,
        }),
        error: null,
      },
      {
        data: row('leaduni', {
          enable_growth_reflection: true,
          enable_chapter_insights: true,
        }),
        error: null,
      },
    ])

    await expect(PathwayRolloutService.getFlagsForChapter(supabase, 'leaduni')).resolves.toEqual({
      enable_check_in: false,
      enable_recommendation_card: false,
      enable_growth_reflection: true,
      enable_chapter_insights: true,
    })
  })

  it('fails closed to defaults on query error', async () => {
    const { supabase } = createSupabaseMock([
      { data: null, error: { message: 'database unavailable' } },
      {
        data: row('leaduni', {
          enable_check_in: true,
          enable_recommendation_card: true,
          enable_growth_reflection: true,
          enable_chapter_insights: true,
        }),
        error: null,
      },
    ])

    await expect(PathwayRolloutService.getFlagsForChapter(supabase, 'leaduni')).resolves.toEqual(
      DEFAULT_PATHWAY_FEATURE_FLAGS
    )
  })
})
