import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { logger } from '@/lib/logger'

export type PathwayFeatureFlags = {
  enable_check_in: boolean
  enable_recommendation_card: boolean
  enable_growth_reflection: boolean
  enable_chapter_insights: boolean
}

type PathwayFeatureFlagRow = Pick<
  Database['public']['Tables']['pathway_feature_flag']['Row'],
  | 'chapter_id'
  | 'enable_check_in'
  | 'enable_recommendation_card'
  | 'enable_growth_reflection'
  | 'enable_chapter_insights'
>

export const DEFAULT_PATHWAY_FEATURE_FLAGS: PathwayFeatureFlags = {
  enable_check_in: false,
  enable_recommendation_card: false,
  enable_growth_reflection: false,
  enable_chapter_insights: false,
}

const FLAG_SELECT = `
  chapter_id,
  enable_check_in,
  enable_recommendation_card,
  enable_growth_reflection,
  enable_chapter_insights
`

function toFeatureFlags(row: PathwayFeatureFlagRow | null): PathwayFeatureFlags {
  if (!row) return DEFAULT_PATHWAY_FEATURE_FLAGS

  return {
    enable_check_in: row.enable_check_in,
    enable_recommendation_card: row.enable_recommendation_card,
    enable_growth_reflection: row.enable_growth_reflection,
    enable_chapter_insights: row.enable_chapter_insights,
  }
}

export const PathwayRolloutService = {
  async getFlagsForChapter(
    supabase: SupabaseClient<Database>,
    chapterId: string | null | undefined
  ): Promise<PathwayFeatureFlags> {
    if (!chapterId?.trim()) return DEFAULT_PATHWAY_FEATURE_FLAGS

    const [globalResult, chapterResult] = await Promise.all([
      supabase
        .from('pathway_feature_flag')
        .select(FLAG_SELECT)
        .is('chapter_id', null)
        .maybeSingle(),
      supabase
        .from('pathway_feature_flag')
        .select(FLAG_SELECT)
        .eq('chapter_id', chapterId)
        .maybeSingle(),
    ])

    if (globalResult.error || chapterResult.error) {
      logger.error(
        {
          context: 'PathwayRolloutService.getFlagsForChapter',
          chapterId,
          error: globalResult.error ?? chapterResult.error,
        },
        'Failed to resolve pathway rollout flags'
      )
      return DEFAULT_PATHWAY_FEATURE_FLAGS
    }

    return toFeatureFlags(
      (chapterResult.data as PathwayFeatureFlagRow | null) ??
        (globalResult.data as PathwayFeatureFlagRow | null)
    )
  },
}
