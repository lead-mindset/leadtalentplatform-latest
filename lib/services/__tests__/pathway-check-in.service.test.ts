import { describe, expect, it, vi } from 'vitest'
import {
  classifyPathwayCheckIn,
  PathwayCheckInService,
  type PathwayCheckInAnswers,
} from '../pathway-check-in.service'
import type { Database } from '@/lib/database.generated'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

function createSelectMock(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
  }
  return {
    supabase: {
      from: vi.fn(() => builder),
    } as unknown as SupabaseClient<Database>,
    builder,
  }
}

function createUpsertMock(result: { error: unknown }) {
  const builder = {
    upsert: vi.fn(async () => result),
  }
  return {
    supabase: {
      from: vi.fn(() => builder),
    } as unknown as SupabaseClient<Database>,
    builder,
  }
}

describe('PathwayCheckInService', () => {
  it('returns not_started when no row exists', async () => {
    const { supabase } = createSelectMock({ data: null, error: null })

    await expect(PathwayCheckInService.getForUser(supabase, 'user-1')).resolves.toEqual({
      status: 'not_started',
      row: null,
    })
  })

  it('returns completed when a completed row exists', async () => {
    const row = {
      id: 'check-in-1',
      user_id: 'user-1',
      chapter_id: 'chapter-1',
      status: 'completed',
      looking_for: 'prepare_for_opportunities',
      current_blocker: 'need_career_prep',
      study_interest: 'Computer Science',
      confidence_level: 4,
      monthly_time_commitment: 'two_to_four_hours',
      growth_stage: 'candidate',
      primary_focus: 'opportunity_readiness',
      submitted_at: '2026-05-11T12:00:00Z',
      created_at: '2026-05-11T12:00:00Z',
      updated_at: '2026-05-11T12:00:00Z',
    }
    const { supabase } = createSelectMock({ data: row, error: null })

    await expect(PathwayCheckInService.getForUser(supabase, 'user-1')).resolves.toEqual({
      status: 'completed',
      row,
    })
  })

  it('fails closed to not_started when loading errors', async () => {
    const { supabase } = createSelectMock({
      data: null,
      error: { message: 'database unavailable' },
    })

    await expect(PathwayCheckInService.getForUser(supabase, 'user-1')).resolves.toEqual({
      status: 'not_started',
      row: null,
    })
  })

  it('upserts a completed check-in for the user', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T12:00:00Z'))
    const { supabase, builder } = createUpsertMock({ error: null })

    await expect(
      PathwayCheckInService.saveCompletedCheckIn(supabase, {
        userId: 'user-1',
        chapterId: 'chapter-1',
        answers: {
          looking_for: 'prepare_for_opportunities',
          current_blocker: 'need_career_prep',
          study_interest: 'Computer Science',
          confidence_level: 4,
          monthly_time_commitment: 'two_to_four_hours',
        },
      })
    ).resolves.toEqual({ success: true })

    expect(builder.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        chapter_id: 'chapter-1',
        status: 'completed',
        looking_for: 'prepare_for_opportunities',
        current_blocker: 'need_career_prep',
        study_interest: 'Computer Science',
        confidence_level: 4,
        monthly_time_commitment: 'two_to_four_hours',
        growth_stage: 'candidate',
        primary_focus: 'opportunity_readiness',
        submitted_at: '2026-05-11T12:00:00.000Z',
        updated_at: '2026-05-11T12:00:00.000Z',
      },
      { onConflict: 'user_id' }
    )
    vi.useRealTimers()
  })

  it('returns an error when completed check-in cannot be saved', async () => {
    const { supabase } = createUpsertMock({ error: { message: 'failed' } })

    await expect(
      PathwayCheckInService.saveCompletedCheckIn(supabase, {
        userId: 'user-1',
        chapterId: null,
        answers: {
          looking_for: 'start_leading',
          current_blocker: 'dont_know_where_to_start',
          study_interest: 'AI',
          confidence_level: 3,
          monthly_time_commitment: 'one_hour',
        },
      })
    ).resolves.toEqual({ success: false, error: 'Unable to save pathway check-in' })
  })

  it.each([
    [
      'explorer',
      {
        looking_for: 'explore_career_paths',
        current_blocker: 'dont_know_where_to_start',
        study_interest: 'AI',
        confidence_level: 2,
        monthly_time_commitment: 'one_hour',
      },
      { growth_stage: 'explorer', primary_focus: 'career_exploration' },
    ],
    [
      'builder',
      {
        looking_for: 'build_technical_experience',
        current_blocker: 'need_more_experience',
        study_interest: 'Data',
        confidence_level: 3,
        monthly_time_commitment: 'two_to_four_hours',
      },
      { growth_stage: 'builder', primary_focus: 'technical_experience' },
    ],
    [
      'leader',
      {
        looking_for: 'start_leading',
        current_blocker: 'need_people_to_guide_me',
        study_interest: 'Leadership',
        confidence_level: 4,
        monthly_time_commitment: 'five_plus_hours',
      },
      { growth_stage: 'leader', primary_focus: 'leadership' },
    ],
    [
      'candidate',
      {
        looking_for: 'prepare_for_opportunities',
        current_blocker: 'need_career_prep',
        study_interest: 'Cybersecurity',
        confidence_level: 4,
        monthly_time_commitment: 'two_to_four_hours',
      },
      { growth_stage: 'candidate', primary_focus: 'opportunity_readiness' },
    ],
    [
      'emerging professional',
      {
        looking_for: 'find_community_mentorship',
        current_blocker: 'need_people_to_guide_me',
        study_interest: 'Product',
        confidence_level: 5,
        monthly_time_commitment: 'five_plus_hours',
      },
      { growth_stage: 'emerging_professional', primary_focus: 'community_mentorship' },
    ],
  ])('classifies %s check-ins without using membership status', (_label, answers, expected) => {
    expect(classifyPathwayCheckIn(answers as PathwayCheckInAnswers)).toEqual(expected)
  })
})
