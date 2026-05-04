import { describe, expect, it, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import {
  EventApplicationAnswerInput,
  EventApplicationQuestionInput,
  EventApplicationService,
} from '../event-application.service'
import type { Database } from '@/lib/database.generated'
import type { EventApplicationQuestionRow } from '@/lib/types'

type QueryResult = { data?: unknown; error?: unknown; count?: number | null }

function createChain(result: QueryResult = { data: null, error: null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: QueryResult) => unknown) => resolve(result),
  }

  return chain
}

function buildMockSupabase() {
  const questionSelect = createChain({ data: [], error: null })
  const questionUpsert = createChain({ data: null, error: null })
  const questionDelete = createChain({ data: null, error: null })
  const answerSelect = createChain({ data: null, error: null, count: 0 })
  const answerUpsert = createChain({ data: null, error: null })

  const questionTable = {
    select: vi.fn(() => questionSelect),
    upsert: vi.fn(() => {
      return questionUpsert
    }),
    delete: vi.fn(() => questionDelete),
    chains: { questionSelect, questionUpsert, questionDelete },
  }

  const answerTable = {
    select: vi.fn(() => answerSelect),
    upsert: vi.fn(() => {
      return answerUpsert
    }),
    chains: { answerSelect, answerUpsert },
  }

  const tableMocks = {
    event_application_question: questionTable,
    event_application_answer: answerTable,
  }

  const mockSupabase = {
    from: vi.fn((table: keyof typeof tableMocks) => tableMocks[table]),
  }

  return {
    mockSupabase: mockSupabase as unknown as SupabaseClient<Database>,
    tableMocks,
  }
}

function question(overrides: Partial<EventApplicationQuestionRow> = {}): EventApplicationQuestionRow {
  return {
    id: 'question-1',
    event_id: 'event-1',
    question_text: 'Why do you want to attend?',
    question_type: 'short_text',
    options: null,
    is_required: true,
    sort_order: 0,
    created_at: '2026-05-03T00:00:00.000Z',
    updated_at: '2026-05-03T00:00:00.000Z',
    ...overrides,
  }
}

describe('EventApplicationService', () => {
  it('normalizes questions into event order using sort_order', () => {
    const questions: EventApplicationQuestionInput[] = [
      { questionText: 'First', questionType: 'short_text' },
      { questionText: 'Second', questionType: 'long_text', isRequired: true },
    ]

    const normalized = EventApplicationService.normalizeQuestions('event-1', questions)

    expect(normalized).toEqual([
      expect.objectContaining({ event_id: 'event-1', question_text: 'First', sort_order: 0 }),
      expect.objectContaining({ event_id: 'event-1', question_text: 'Second', sort_order: 1 }),
    ])
  })

  it('requires options for single select and checkbox questions', () => {
    expect(
      EventApplicationService.validateQuestions([
        { questionText: 'Pick one', questionType: 'single_select', options: [] },
      ])
    ).toEqual({ success: false, error: 'Question 1 needs at least one option.' })

    expect(
      EventApplicationService.validateQuestions([
        { questionText: 'Pick many', questionType: 'checkbox', options: [''] },
      ])
    ).toEqual({ success: false, error: 'Question 1 needs at least one option.' })
  })

  it('rejects missing required answers', () => {
    const result = EventApplicationService.validateAnswers([question()], [])

    expect(result).toEqual({
      success: false,
      error: '"Why do you want to attend?" is required.',
    })
  })

  it('validates select options and URL answers', () => {
    const questions = [
      question({
        id: 'select-question',
        question_text: 'Track',
        question_type: 'single_select',
        options: ['Product', 'Engineering'],
      }),
      question({
        id: 'url-question',
        question_text: 'Portfolio',
        question_type: 'url',
        is_required: false,
      }),
    ]

    expect(
      EventApplicationService.validateAnswers(questions, [
        { questionId: 'select-question', value: 'Finance' },
      ])
    ).toEqual({ success: false, error: '"Track" has an invalid option.' })

    expect(
      EventApplicationService.validateAnswers(questions, [
        { questionId: 'select-question', value: 'Product' },
        { questionId: 'url-question', value: 'not-a-url' },
      ])
    ).toEqual({ success: false, error: '"Portfolio" must be a valid URL.' })
  })

  it('requires at least one checkbox option for required checkbox answers', () => {
    const result = EventApplicationService.validateAnswers(
      [
        question({
          question_text: 'Topics',
          question_type: 'checkbox',
          options: ['Mentoring', 'Workshops'],
          is_required: true,
        }),
      ],
      [{ questionId: 'question-1', value: [] }]
    )

    expect(result).toEqual({
      success: false,
      error: '"Topics" is required.',
    })
  })

  it('stores answers against registration_id and never user_id', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    const answers: EventApplicationAnswerInput[] = [
      { questionId: 'question-1', value: 'I love the topic.' },
    ]

    const result = await EventApplicationService.saveAnswersForRegistration(mockSupabase, {
      registrationId: 'registration-1',
      questions: [question()],
      answers,
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.event_application_answer.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          registration_id: 'registration-1',
          question_id: 'question-1',
          answer_text: 'I love the topic.',
          answer_json: null,
        }),
      ],
      { onConflict: 'registration_id,question_id' }
    )
    const [answerRows] = tableMocks.event_application_answer.upsert.mock.calls[0] as unknown as [Array<Record<string, unknown>>]
    expect(answerRows[0]).not.toHaveProperty('user_id')
  })

  it('stores checkbox answers in answer_json', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    const result = await EventApplicationService.saveAnswersForRegistration(mockSupabase, {
      registrationId: 'registration-1',
      questions: [
        question({
          question_type: 'checkbox',
          options: ['Mentoring', 'Workshops'],
        }),
      ],
      answers: [{ questionId: 'question-1', value: ['Mentoring', 'Workshops'] }],
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.event_application_answer.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          registration_id: 'registration-1',
          question_id: 'question-1',
          answer_text: null,
          answer_json: ['Mentoring', 'Workshops'],
        }),
      ],
      { onConflict: 'registration_id,question_id' }
    )
  })
})
