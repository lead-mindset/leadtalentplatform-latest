import { describe, expect, it, vi } from 'vitest'
import {
  classifyPathwayCheckIn,
  generatePathwayRecommendations,
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
    in: vi.fn(() => builder),
    order: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
  }
  return {
    supabase: {
      from: vi.fn(() => builder),
    } as unknown as SupabaseClient<Database>,
    builder,
  }
}

function createDashboardMock(params: {
  checkIn: { data: unknown; error: unknown }
  recommendations?: { data: unknown; error: unknown }
}) {
  const checkInBuilder = {
    select: vi.fn(() => checkInBuilder),
    eq: vi.fn(() => checkInBuilder),
    maybeSingle: vi.fn(async () => params.checkIn),
  }
  const recommendationBuilder = {
    select: vi.fn(() => recommendationBuilder),
    eq: vi.fn(() => recommendationBuilder),
    in: vi.fn(() => recommendationBuilder),
    order: vi.fn(async () => params.recommendations ?? { data: [], error: null }),
  }
  const from = vi.fn((table: string) =>
    table === 'pathway_check_in' ? checkInBuilder : recommendationBuilder
  )
  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    recommendationBuilder,
  }
}

function createSaveMock(params?: {
  checkInResult?: { data: unknown; error: unknown }
  deleteError?: unknown
  insertError?: unknown
}) {
  const checkInBuilder = {
    upsert: vi.fn(() => checkInBuilder),
    select: vi.fn(() => checkInBuilder),
    single: vi.fn(async () => params?.checkInResult ?? { data: { id: 'check-in-1' }, error: null }),
  }
  const recommendationBuilder = {
    delete: vi.fn(() => recommendationBuilder),
    eq: vi.fn(async () => ({ error: params?.deleteError ?? null })),
    insert: vi.fn(async () => ({ error: params?.insertError ?? null })),
  }
  const from = vi.fn((table: string) =>
    table === 'pathway_check_in' ? checkInBuilder : recommendationBuilder
  )
  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    checkInBuilder,
    recommendationBuilder,
  }
}

function createChapterInsightsMock(params: {
  members: { data: unknown; error: unknown }
  checkIns: { data: unknown; error: unknown }
  reflections?: { data: unknown; error: unknown }
}) {
  const membershipBuilder = {
    select: vi.fn(() => membershipBuilder),
    eq: vi.fn(() => membershipBuilder),
    then: (resolve: (value: unknown) => unknown) => resolve(params.members),
  }
  const checkInBuilder = {
    select: vi.fn(() => checkInBuilder),
    eq: vi.fn(() => checkInBuilder),
    then: (resolve: (value: unknown) => unknown) => resolve(params.checkIns),
  }
  const reflectionBuilder = {
    select: vi.fn(() => reflectionBuilder),
    in: vi.fn(async () => params.reflections ?? { data: [], error: null }),
  }
  const from = vi.fn((table: string) => {
    if (table === 'chapter_membership') return membershipBuilder
    if (table === 'pathway_check_in') return checkInBuilder
    return reflectionBuilder
  })
  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    membershipBuilder,
    checkInBuilder,
    reflectionBuilder,
  }
}

function createAdminPilotMetricsMock(params: {
  members: { data: unknown; error: unknown }
  checkIns: { data: unknown; error: unknown }
  recommendations: { data: unknown; error: unknown }
  reflections: { data: unknown; error: unknown }
}) {
  const makeBuilder = (result: { data: unknown; error: unknown }) => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      then: (resolve: (value: unknown) => unknown) => resolve(result),
    }
    return builder
  }
  const builders = {
    chapter_membership: makeBuilder(params.members),
    pathway_check_in: makeBuilder(params.checkIns),
    pathway_recommendation: makeBuilder(params.recommendations),
    growth_reflection: makeBuilder(params.reflections),
  }
  const from = vi.fn((table: keyof typeof builders) => builders[table])
  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    builders,
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
    const { supabase, checkInBuilder, recommendationBuilder } = createSaveMock()

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

    expect(checkInBuilder.upsert).toHaveBeenCalledWith(
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
    expect(recommendationBuilder.delete).toHaveBeenCalled()
    expect(recommendationBuilder.eq).toHaveBeenCalledWith('check_in_id', 'check-in-1')
    expect(recommendationBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ category: 'learn', status: 'active', sort_order: 1 }),
      expect.objectContaining({ category: 'connect', status: 'active', sort_order: 2 }),
      expect.objectContaining({ category: 'prove', status: 'active', sort_order: 3 }),
    ])
    vi.useRealTimers()
  })

  it('returns an error when completed check-in cannot be saved', async () => {
    const { supabase } = createSaveMock({
      checkInResult: { data: null, error: { message: 'failed' } },
    })

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

  it('generates exactly one Learn, one Connect, and one Prove recommendation', () => {
    const answers: PathwayCheckInAnswers = {
      looking_for: 'build_technical_experience',
      current_blocker: 'need_more_experience',
      study_interest: 'AI',
      confidence_level: 3,
      monthly_time_commitment: 'two_to_four_hours',
    }
    const recommendations = generatePathwayRecommendations({
      answers,
      classification: classifyPathwayCheckIn(answers),
    })

    expect(recommendations).toHaveLength(3)
    expect(recommendations.map((recommendation) => recommendation.category)).toEqual([
      'learn',
      'connect',
      'prove',
    ])
    expect(recommendations.every((recommendation) => recommendation.reason.length > 20)).toBe(true)
  })

  it('returns an error when recommendations cannot be saved', async () => {
    const { supabase } = createSaveMock({ insertError: { message: 'failed' } })

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
    ).resolves.toEqual({ success: false, error: 'Unable to save pathway recommendations' })
  })

  it('assembles completed dashboard guidance with active recommendations', async () => {
    const checkIn = {
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
    const recommendations = [
      { id: 'rec-1', category: 'learn', status: 'active', sort_order: 1 },
      { id: 'rec-2', category: 'connect', status: 'started', sort_order: 2 },
      { id: 'rec-3', category: 'prove', status: 'completed', sort_order: 3 },
    ]
    const { supabase, recommendationBuilder } = createDashboardMock({
      checkIn: { data: checkIn, error: null },
      recommendations: { data: recommendations, error: null },
    })

    await expect(PathwayCheckInService.getDashboardGuidanceForUser(supabase, 'user-1')).resolves.toEqual({
      status: 'completed',
      row: checkIn,
      recommendations,
      progress: { actionable: 3, completed: 1 },
    })
    expect(recommendationBuilder.in).toHaveBeenCalledWith('status', [
      'active',
      'started',
      'completed',
    ])
    expect(recommendationBuilder.order).toHaveBeenCalledWith('sort_order', { ascending: true })
  })

  it('does not query recommendations before check-in completion', async () => {
    const { supabase, recommendationBuilder } = createDashboardMock({
      checkIn: { data: null, error: null },
    })

    await expect(PathwayCheckInService.getDashboardGuidanceForUser(supabase, 'user-1')).resolves.toEqual({
      status: 'not_started',
      row: null,
      recommendations: [],
      progress: { actionable: 0, completed: 0 },
    })
    expect(recommendationBuilder.select).not.toHaveBeenCalled()
  })

  it('updates a recommendation status for the owning student', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T12:00:00Z'))
    const eq = vi.fn()
    const builder = {
      update: vi.fn(() => builder),
      eq,
    }
    eq.mockReturnValueOnce(builder).mockResolvedValueOnce({ error: null })
    const supabase = {
      from: vi.fn(() => builder),
    } as unknown as SupabaseClient<Database>

    await expect(
      PathwayCheckInService.updateRecommendationStatus(supabase, {
        userId: 'user-1',
        recommendationId: 'rec-1',
        status: 'completed',
      })
    ).resolves.toEqual({ success: true })

    expect(builder.update).toHaveBeenCalledWith({
      status: 'completed',
      updated_at: '2026-05-11T12:00:00.000Z',
    })
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'id', 'rec-1')
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-1')
    vi.useRealTimers()
  })

  it('returns an error when recommendation status update fails', async () => {
    const eq = vi.fn()
    const builder = {
      update: vi.fn(() => builder),
      eq,
    }
    eq.mockReturnValueOnce(builder).mockResolvedValueOnce({ error: { message: 'failed' } })
    const supabase = {
      from: vi.fn(() => builder),
    } as unknown as SupabaseClient<Database>

    await expect(
      PathwayCheckInService.updateRecommendationStatus(supabase, {
        userId: 'user-1',
        recommendationId: 'rec-1',
        status: 'dismissed',
      })
    ).resolves.toEqual({ success: false, error: 'Unable to update recommendation' })
  })

  it('returns chapter aggregate insights without exposing private reflection text', async () => {
    const { supabase, membershipBuilder, checkInBuilder, reflectionBuilder } =
      createChapterInsightsMock({
        members: {
          data: [{ user_id: 'user-1' }, { user_id: 'user-2' }, { user_id: 'user-3' }],
          error: null,
        },
        checkIns: {
          data: [
            {
              id: 'check-in-1',
              user_id: 'user-1',
              status: 'completed',
              looking_for: 'prepare_for_opportunities',
              current_blocker: 'need_career_prep',
              growth_stage: 'candidate',
              primary_focus: 'opportunity_readiness',
            },
            {
              id: 'check-in-2',
              user_id: 'user-2',
              status: 'completed',
              looking_for: 'prepare_for_opportunities',
              current_blocker: 'need_more_experience',
              growth_stage: 'builder',
              primary_focus: 'opportunity_readiness',
            },
          ],
          error: null,
        },
        reflections: {
          data: [
            { id: 'reflection-1', user_id: 'user-1', status: 'completed' },
            { id: 'reflection-2', user_id: 'user-2', status: 'draft' },
          ],
          error: null,
        },
      })

    await expect(
      PathwayCheckInService.getChapterAggregateInsights(supabase, 'chapter-1')
    ).resolves.toEqual({
      totalMembers: 3,
      completedCheckIns: 2,
      completionRate: 67,
      topNeeds: [{ value: 'prepare_for_opportunities', count: 2 }],
      topBlockers: [
        { value: 'need_career_prep', count: 1 },
        { value: 'need_more_experience', count: 1 },
      ],
      growthStages: [
        { value: 'builder', count: 1 },
        { value: 'candidate', count: 1 },
      ],
      primaryFocuses: [{ value: 'opportunity_readiness', count: 2 }],
      completedReflections: 1,
      proofItemsCreated: 2,
    })

    expect(membershipBuilder.eq).toHaveBeenNthCalledWith(1, 'chapter_id', 'chapter-1')
    expect(membershipBuilder.eq).toHaveBeenNthCalledWith(2, 'status', 'approved')
    expect(checkInBuilder.eq).toHaveBeenNthCalledWith(1, 'chapter_id', 'chapter-1')
    expect(checkInBuilder.eq).toHaveBeenNthCalledWith(2, 'status', 'completed')
    expect(reflectionBuilder.select).toHaveBeenCalledWith('id, status, user_id')
    expect(reflectionBuilder.select).not.toHaveBeenCalledWith(
      expect.stringContaining('learned')
    )
    expect(reflectionBuilder.in).toHaveBeenCalledWith('user_id', ['user-1', 'user-2', 'user-3'])
  })

  it('does not query reflections when a chapter has no approved members', async () => {
    const { supabase, reflectionBuilder } = createChapterInsightsMock({
      members: { data: [], error: null },
      checkIns: { data: [], error: null },
    })

    await expect(
      PathwayCheckInService.getChapterAggregateInsights(supabase, 'chapter-1')
    ).resolves.toEqual({
      totalMembers: 0,
      completedCheckIns: 0,
      completionRate: 0,
      topNeeds: [],
      topBlockers: [],
      growthStages: [],
      primaryFocuses: [],
      completedReflections: 0,
      proofItemsCreated: 0,
    })
    expect(reflectionBuilder.select).not.toHaveBeenCalled()
  })

  it('calculates admin pilot metrics and risk signals', async () => {
    const { supabase, builders } = createAdminPilotMetricsMock({
      members: {
        data: [
          { user_id: 'user-1' },
          { user_id: 'user-2' },
          { user_id: 'user-3' },
          { user_id: 'user-4' },
          { user_id: 'user-5' },
        ],
        error: null,
      },
      checkIns: {
        data: [{ id: 'check-in-1', status: 'completed' }],
        error: null,
      },
      recommendations: {
        data: [
          {
            id: 'rec-1',
            status: 'completed',
            created_at: '2026-05-01T00:00:00Z',
            updated_at: '2026-05-10T00:00:00Z',
          },
          {
            id: 'rec-2',
            status: 'completed',
            created_at: '2026-05-01T00:00:00Z',
            updated_at: '2026-05-20T00:00:00Z',
          },
          {
            id: 'rec-3',
            status: 'started',
            created_at: '2026-05-01T00:00:00Z',
            updated_at: '2026-05-02T00:00:00Z',
          },
        ],
        error: null,
      },
      reflections: {
        data: [{ id: 'reflection-1', status: 'draft' }],
        error: null,
      },
    })

    await expect(PathwayCheckInService.getAdminPilotMetrics(supabase)).resolves.toEqual({
      totalApprovedMembers: 5,
      completedCheckIns: 1,
      checkInCompletionRate: 20,
      totalNextMoves: 3,
      nextMovesCompletedWithin14Days: 1,
      nextMoveCompletionRate14Days: 33,
      proofItemsCreated: 1,
      completedReflections: 0,
      growthReflectionCompletionRate: 0,
      riskSignals: [
        {
          key: 'low_check_in_adoption',
          label: 'Check-In adoption is below pilot target',
          severity: 'risk',
          value: 20,
          threshold: 40,
        },
        {
          key: 'low_reflection_conversion',
          label: 'Check-Ins are not converting into Growth Reflections',
          severity: 'risk',
          value: 0,
          threshold: 20,
        },
      ],
    })

    expect(builders.chapter_membership.eq).toHaveBeenCalledWith('status', 'approved')
    expect(builders.pathway_check_in.eq).toHaveBeenCalledWith('status', 'completed')
    expect(builders.growth_reflection.select).toHaveBeenCalledWith('id, status')
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
