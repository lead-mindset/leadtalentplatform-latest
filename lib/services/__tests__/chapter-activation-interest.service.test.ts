import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ChapterActivationInterestService } from '../chapter-activation-interest.service'

type MockFn = ReturnType<typeof vi.fn>

type TableMock = {
  select: MockFn
  insert: MockFn
  eq: MockFn
  order: MockFn
  limit: MockFn
  maybeSingle: MockFn
  single: MockFn
}

function buildMockSupabase() {
  const tableMocks: Record<string, TableMock> = {
    chapter_activation_interest: {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    },
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

const validInput = {
  universityName: 'Universidad Nacional de Ingenieria',
  motivation: 'Quiero conocer LEAD y traer oportunidades a mi universidad.',
  universityContext: 'Hay estudiantes interesados en carrera, mentorias y comunidad.',
  leadValue: 'LEAD podria ayudar a organizar eventos y conectar estudiantes con aliados.',
  teamStatus: 'Estoy explorando individualmente por ahora.',
  interestedPeopleContext: 'Conozco a dos companeros que podrian conversar.',
  opportunities: 'Charlas de carrera, mentorias y talleres de liderazgo.',
  longTermCommitment: 'Puedo dedicar tiempo semanal y aprender a construir el equipo.',
}

describe('ChapterActivationInterestService', () => {
  it('stores a submitted first-conversation activation interest', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_activation_interest.maybeSingle.mockResolvedValue({ data: null, error: null })
    tableMocks.chapter_activation_interest.single.mockResolvedValue({
      data: {
        id: 'interest-1',
        user_id: 'user-1',
        university_name: validInput.universityName,
        motivation: validInput.motivation,
        university_context: validInput.universityContext,
        lead_value: validInput.leadValue,
        team_status: validInput.teamStatus,
        interested_people_context: validInput.interestedPeopleContext,
        opportunities: validInput.opportunities,
        long_term_commitment: validInput.longTermCommitment,
        status: 'submitted',
        review_notes: null,
        created_at: '2026-06-06T00:00:00.000Z',
        updated_at: '2026-06-06T00:00:00.000Z',
      },
      error: null,
    })

    const result = await ChapterActivationInterestService.submitInterest(
      mockSupabase,
      { userId: 'user-1', input: validInput }
    )

    expect(result.success).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('chapter_activation_interest')
    expect(tableMocks.chapter_activation_interest.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        university_name: validInput.universityName,
        status: 'submitted',
      })
    )
  })

  it('rejects duplicate active submitted interest for the same user', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_activation_interest.maybeSingle.mockResolvedValue({
      data: { id: 'interest-1', status: 'submitted' },
      error: null,
    })

    const result = await ChapterActivationInterestService.submitInterest(
      mockSupabase,
      { userId: 'user-1', input: validInput }
    )

    expect(result).toEqual({
      success: false,
      error: 'Ya enviaste un interes de activacion. El equipo de LEAD revisara tu contexto y te contactara.',
    })
    expect(tableMocks.chapter_activation_interest.insert).not.toHaveBeenCalled()
  })

  it('requires all reviewer-useful fields before inserting', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    const result = await ChapterActivationInterestService.submitInterest(
      mockSupabase,
      {
        userId: 'user-1',
        input: { ...validInput, leadValue: '   ' },
      }
    )

    expect(result).toEqual({
      success: false,
      error: 'Completa todos los campos antes de enviar.',
    })
    expect(tableMocks.chapter_activation_interest.maybeSingle).not.toHaveBeenCalled()
    expect(tableMocks.chapter_activation_interest.insert).not.toHaveBeenCalled()
  })

  it('reads the latest activation interest for the student dashboard', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_activation_interest.maybeSingle.mockResolvedValue({
      data: { id: 'interest-2', user_id: 'user-1', status: 'submitted' },
      error: null,
    })

    const result = await ChapterActivationInterestService.getLatestForUser(mockSupabase, 'user-1')

    expect(result).toEqual({ id: 'interest-2', user_id: 'user-1', status: 'submitted' })
    expect(tableMocks.chapter_activation_interest.order).toHaveBeenCalledWith(
      'created_at',
      { ascending: false }
    )
    expect(tableMocks.chapter_activation_interest.limit).toHaveBeenCalledWith(1)
  })
})
