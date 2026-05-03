import { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.generated'
import type {
  EventApplicationAnswerInsert,
  EventApplicationAnswerRow,
  EventApplicationQuestionInsert,
  EventApplicationQuestionRow,
  EventApplicationQuestionType,
} from '@/lib/types'

type ActionResult = { success: true } | { success: false; error: string }

export type EventApplicationQuestionInput = {
  id?: string
  questionText: string
  questionType: EventApplicationQuestionType
  options?: string[] | null
  isRequired?: boolean
}

export type EventApplicationAnswerInput = {
  questionId: string
  value: string | string[] | null | undefined
}

export type EventApplicationAnswerWithQuestion = EventApplicationAnswerRow & {
  event_application_question: Pick<
    EventApplicationQuestionRow,
    'id' | 'question_text' | 'question_type' | 'options' | 'sort_order'
  > | null
}

type ExistingQuestion = Pick<EventApplicationQuestionRow, 'id'>

const optionQuestionTypes = new Set<EventApplicationQuestionType>(['single_select', 'checkbox'])

function cleanOptions(options: string[] | null | undefined): string[] | null {
  const cleaned = Array.from(new Set((options ?? []).map((option) => option.trim()).filter(Boolean)))
  return cleaned.length > 0 ? cleaned : null
}

function isPresent(value: string | string[] | null | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'string' && value.trim().length > 0
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function findAnswer(
  answers: EventApplicationAnswerInput[],
  questionId: string
): EventApplicationAnswerInput | undefined {
  return answers.find((answer) => answer.questionId === questionId)
}

export const EventApplicationService = {
  normalizeQuestions(
    eventId: string,
    questions: EventApplicationQuestionInput[]
  ): EventApplicationQuestionInsert[] {
    return questions.map((question, index) => ({
      id: question.id,
      event_id: eventId,
      question_text: question.questionText.trim(),
      question_type: question.questionType,
      options: cleanOptions(question.options),
      is_required: question.isRequired ?? false,
      sort_order: index,
      updated_at: new Date().toISOString(),
    }))
  },

  validateQuestions(questions: EventApplicationQuestionInput[]): ActionResult {
    for (const [index, question] of questions.entries()) {
      if (!question.questionText.trim()) {
        return { success: false, error: `Question ${index + 1} needs text.` }
      }

      const options = cleanOptions(question.options)
      if (optionQuestionTypes.has(question.questionType) && !options) {
        return {
          success: false,
          error: `Question ${index + 1} needs at least one option.`,
        }
      }
    }

    return { success: true }
  },

  async getQuestionsForEvent(
    supabase: SupabaseClient<Database>,
    eventId: string
  ): Promise<EventApplicationQuestionRow[]> {
    const { data, error } = await supabase
      .from('event_application_question')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    if (error) return []
    return data ?? []
  },

  async upsertQuestionsForEvent(
    supabase: SupabaseClient<Database>,
    params: { eventId: string; questions: EventApplicationQuestionInput[] }
  ): Promise<ActionResult> {
    const validation = this.validateQuestions(params.questions)
    if (!validation.success) return validation

    const normalized = this.normalizeQuestions(params.eventId, params.questions)
    const { data: existing, error: existingError } = await supabase
      .from('event_application_question')
      .select('id')
      .eq('event_id', params.eventId)

    if (existingError) {
      return { success: false, error: 'Could not load existing application questions.' }
    }

    const incomingIds = new Set(normalized.map((question) => question.id).filter(Boolean))
    const deletedIds = ((existing ?? []) as ExistingQuestion[])
      .map((question) => question.id)
      .filter((id) => !incomingIds.has(id))

    if (deletedIds.length > 0) {
      const { count, error: countError } = await supabase
        .from('event_application_answer')
        .select('id', { count: 'exact', head: true })
        .in('question_id', deletedIds)

      if (countError) {
        return { success: false, error: 'Could not verify existing application answers.' }
      }

      if ((count ?? 0) > 0) {
        return {
          success: false,
          error: 'Questions with submitted answers cannot be deleted.',
        }
      }

      const { error: deleteError } = await supabase
        .from('event_application_question')
        .delete()
        .in('id', deletedIds)

      if (deleteError) {
        return { success: false, error: 'Could not remove old application questions.' }
      }
    }

    if (normalized.length === 0) return { success: true }

    const { error } = await supabase
      .from('event_application_question')
      .upsert(normalized, { onConflict: 'id' })

    if (error) return { success: false, error: 'Could not save application questions.' }
    return { success: true }
  },

  validateAnswers(
    questions: EventApplicationQuestionRow[],
    answers: EventApplicationAnswerInput[]
  ): ActionResult {
    for (const question of questions) {
      const answer = findAnswer(answers, question.id)
      const value = answer?.value

      if (question.is_required && !isPresent(value)) {
        return { success: false, error: `"${question.question_text}" is required.` }
      }

      if (!isPresent(value)) continue

      const options = cleanOptions(question.options)

      if (question.question_type === 'single_select') {
        if (typeof value !== 'string' || !options?.includes(value.trim())) {
          return { success: false, error: `"${question.question_text}" has an invalid option.` }
        }
      }

      if (question.question_type === 'checkbox') {
        if (!Array.isArray(value)) {
          return { success: false, error: `"${question.question_text}" has an invalid answer.` }
        }

        const invalidOption = value.some((selected) => !options?.includes(selected.trim()))
        if (invalidOption) {
          return { success: false, error: `"${question.question_text}" has an invalid option.` }
        }
      }

      if (question.question_type === 'url') {
        if (typeof value !== 'string' || !isValidUrl(value.trim())) {
          return { success: false, error: `"${question.question_text}" must be a valid URL.` }
        }
      }
    }

    return { success: true }
  },

  buildAnswerRows(
    registrationId: string,
    questions: EventApplicationQuestionRow[],
    answers: EventApplicationAnswerInput[]
  ): EventApplicationAnswerInsert[] {
    const rows: EventApplicationAnswerInsert[] = []

    for (const question of questions) {
      const answer = findAnswer(answers, question.id)
      const value = answer?.value

      if (!isPresent(value)) continue

      if (question.question_type === 'checkbox') {
        rows.push({
          registration_id: registrationId,
          question_id: question.id,
          answer_text: null,
          answer_json: (Array.isArray(value) ? value.map((item) => item.trim()) : []) as Json,
        })
        continue
      }

      if (typeof value === 'string') {
        rows.push({
          registration_id: registrationId,
          question_id: question.id,
          answer_text: value.trim(),
          answer_json: null,
        })
      }
    }

    return rows
  },

  async saveAnswersForRegistration(
    supabase: SupabaseClient<Database>,
    params: {
      registrationId: string
      questions: EventApplicationQuestionRow[]
      answers: EventApplicationAnswerInput[]
    }
  ): Promise<ActionResult> {
    const validation = this.validateAnswers(params.questions, params.answers)
    if (!validation.success) return validation

    const rows = this.buildAnswerRows(params.registrationId, params.questions, params.answers)
    if (rows.length === 0) return { success: true }

    const { error } = await supabase
      .from('event_application_answer')
      .upsert(rows, { onConflict: 'registration_id,question_id' })

    if (error) return { success: false, error: 'Could not save application answers.' }
    return { success: true }
  },

  async getAnswersForRegistrations(
    supabase: SupabaseClient<Database>,
    registrationIds: string[]
  ): Promise<EventApplicationAnswerWithQuestion[]> {
    if (registrationIds.length === 0) return []

    const { data, error } = await supabase
      .from('event_application_answer')
      .select(`
        *,
        event_application_question (
          id,
          question_text,
          question_type,
          options,
          sort_order
        )
      `)
      .in('registration_id', registrationIds)

    if (error) return []

    return ((data ?? []) as EventApplicationAnswerWithQuestion[]).sort((a, b) => {
      const aOrder = a.event_application_question?.sort_order ?? 0
      const bOrder = b.event_application_question?.sort_order ?? 0
      return aOrder - bOrder
    })
  },
}
