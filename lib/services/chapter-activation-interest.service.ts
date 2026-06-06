import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import type {
  ChapterActivationInterestInsert,
  ChapterActivationInterestRow,
} from '@/lib/types'

export type ChapterActivationInterestInput = {
  universityName: string
  motivation: string
  universityContext: string
  leadValue: string
  teamStatus: string
  interestedPeopleContext: string
  opportunities: string
  longTermCommitment: string
}

type ActionResult =
  | { success: true; interest: ChapterActivationInterestRow }
  | { success: false; error: string }

const REQUIRED_FIELDS: Array<keyof ChapterActivationInterestInput> = [
  'universityName',
  'motivation',
  'universityContext',
  'leadValue',
  'teamStatus',
  'interestedPeopleContext',
  'opportunities',
  'longTermCommitment',
]

function normalizeInput(input: ChapterActivationInterestInput): ChapterActivationInterestInput {
  return {
    universityName: input.universityName.trim(),
    motivation: input.motivation.trim(),
    universityContext: input.universityContext.trim(),
    leadValue: input.leadValue.trim(),
    teamStatus: input.teamStatus.trim(),
    interestedPeopleContext: input.interestedPeopleContext.trim(),
    opportunities: input.opportunities.trim(),
    longTermCommitment: input.longTermCommitment.trim(),
  }
}

function hasMissingRequiredField(input: ChapterActivationInterestInput): boolean {
  return REQUIRED_FIELDS.some((field) => input[field].length === 0)
}

function friendlyInterestError(error: { code?: string; message?: string } | null): string {
  if (
    error?.code === '23505' ||
    error?.message?.includes('idx_chapter_activation_interest_one_submitted_per_user')
  ) {
    return 'Ya enviaste un interes de activacion. El equipo de LEAD revisara tu contexto y te contactara.'
  }

  return error?.message ?? 'No se pudo enviar el interes de activacion.'
}

export const ChapterActivationInterestService = {
  async submitInterest(
    supabase: SupabaseClient<Database>,
    params: { userId: string; input: ChapterActivationInterestInput }
  ): Promise<ActionResult> {
    const input = normalizeInput(params.input)

    if (!params.userId.trim()) {
      return { success: false, error: 'Usuario requerido.' }
    }

    if (hasMissingRequiredField(input)) {
      return { success: false, error: 'Completa todos los campos antes de enviar.' }
    }

    const { data: existingInterest, error: existingError } = await supabase
      .from('chapter_activation_interest')
      .select('id, status')
      .eq('user_id', params.userId)
      .eq('status', 'submitted')
      .maybeSingle()

    if (existingError) {
      return { success: false, error: friendlyInterestError(existingError) }
    }

    if (existingInterest) {
      return {
        success: false,
        error: 'Ya enviaste un interes de activacion. El equipo de LEAD revisara tu contexto y te contactara.',
      }
    }

    const now = new Date().toISOString()
    const payload: ChapterActivationInterestInsert = {
      user_id: params.userId,
      university_name: input.universityName,
      motivation: input.motivation,
      university_context: input.universityContext,
      lead_value: input.leadValue,
      team_status: input.teamStatus,
      interested_people_context: input.interestedPeopleContext,
      opportunities: input.opportunities,
      long_term_commitment: input.longTermCommitment,
      status: 'submitted',
      updated_at: now,
    }

    const { data, error } = await supabase
      .from('chapter_activation_interest')
      .insert(payload)
      .select('*')
      .single()

    if (error || !data) {
      return { success: false, error: friendlyInterestError(error) }
    }

    return { success: true, interest: data as ChapterActivationInterestRow }
  },

  async getLatestForUser(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<ChapterActivationInterestRow | null> {
    if (!userId.trim()) return null

    const { data, error } = await supabase
      .from('chapter_activation_interest')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return null
    return (data ?? null) as ChapterActivationInterestRow | null
  },
}
