import { beforeEach, describe, expect, it, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentDashboardService } from '@/lib/services/student-dashboard.service'
import { PathwayRolloutService } from '@/lib/services/pathway-rollout.service'
import {
  parsePathwayCheckInFormData,
  saveCompletedPathwayCheckIn,
} from '@/lib/actions/student/pathway-check-in.helpers'
import { submitPathwayCheckIn } from '../pathway-check-in'

const answers = {
  looking_for: 'prepare_for_opportunities',
  current_blocker: 'need_career_prep',
  study_interest: 'Computer Science',
  confidence_level: 4,
  monthly_time_commitment: 'two_to_four_hours',
} as const

function redirectError(path: string) {
  const error = new Error(`NEXT_REDIRECT:${path}`) as Error & {
    digest: string
    target: string
  }
  error.digest = `NEXT_REDIRECT;replace;${path};307;`
  error.target = path
  return error
}

function validFormData() {
  const formData = new FormData()
  formData.set('looking_for', answers.looking_for)
  formData.set('current_blocker', answers.current_blocker)
  formData.set('study_interest', answers.study_interest)
  formData.set('confidence_level', String(answers.confidence_level))
  formData.set('monthly_time_commitment', answers.monthly_time_commitment)
  return formData
}

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw redirectError(path)
  }),
}))

vi.mock('next/dist/client/components/redirect-error', () => ({
  isRedirectError: (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    String((error as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT'),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/student-dashboard.service', () => ({
  StudentDashboardService: {
    getActivationDashboard: vi.fn(),
  },
}))

vi.mock('@/lib/services/pathway-rollout.service', () => ({
  PathwayRolloutService: {
    getFlagsForChapter: vi.fn(),
  },
}))

vi.mock('@/lib/actions/student/pathway-check-in.helpers', () => ({
  parsePathwayCheckInFormData: vi.fn(),
  saveCompletedPathwayCheckIn: vi.fn(),
}))

describe('submitPathwayCheckIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(headers).mockResolvedValue({
      get: vi.fn(() => 'http://localhost:3000/es/student/pathway-check-in'),
    } as never)
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } } })),
      },
    } as never)
    vi.mocked(StudentDashboardService.getActivationDashboard).mockResolvedValue({
      membership: {
        chapter_id: 'leaduni',
      },
    } as never)
    vi.mocked(PathwayRolloutService.getFlagsForChapter).mockResolvedValue({
      enable_check_in: true,
    } as never)
    vi.mocked(parsePathwayCheckInFormData).mockReturnValue({
      success: true,
      data: answers,
    } as never)
    vi.mocked(saveCompletedPathwayCheckIn).mockResolvedValue({
      success: true,
    })
  })

  it('saves the Check-In and redirects to the completed state', async () => {
    await expect(submitPathwayCheckIn(validFormData())).rejects.toMatchObject({
      target: '/es/student/pathway-check-in?completed=1',
    })

    expect(saveCompletedPathwayCheckIn).toHaveBeenCalledWith(expect.anything(), {
      userId: 'user-1',
      chapterId: 'leaduni',
      answers,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/student')
    expect(revalidatePath).toHaveBeenCalledWith('/student/pathway-check-in')
    expect(redirect).toHaveBeenCalledWith('/es/student/pathway-check-in?completed=1')
  })

  it('redirects unauthenticated users to login', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null } })),
      },
    } as never)

    await expect(submitPathwayCheckIn(validFormData())).rejects.toMatchObject({
      target: '/es/auth/login',
    })

    expect(StudentDashboardService.getActivationDashboard).not.toHaveBeenCalled()
    expect(saveCompletedPathwayCheckIn).not.toHaveBeenCalled()
  })

  it('preserves the disabled feature redirect instead of converting it to server error', async () => {
    vi.mocked(PathwayRolloutService.getFlagsForChapter).mockResolvedValue({
      enable_check_in: false,
    } as never)

    await expect(submitPathwayCheckIn(validFormData())).rejects.toMatchObject({
      target: '/es/student/pathway-check-in?error=disabled',
    })

    expect(saveCompletedPathwayCheckIn).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('preserves the invalid form redirect', async () => {
    vi.mocked(parsePathwayCheckInFormData).mockReturnValue({
      success: false,
      error: new Error('invalid form'),
    } as never)

    await expect(submitPathwayCheckIn(validFormData())).rejects.toMatchObject({
      target: '/es/student/pathway-check-in?error=invalid',
    })

    expect(saveCompletedPathwayCheckIn).not.toHaveBeenCalled()
  })

  it('preserves the save failure redirect', async () => {
    vi.mocked(saveCompletedPathwayCheckIn).mockResolvedValue({
      success: false,
      error: 'save failed',
    })

    await expect(submitPathwayCheckIn(validFormData())).rejects.toMatchObject({
      target: '/es/student/pathway-check-in?error=save',
    })
  })

  it('routes unexpected failures to the server error state', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(StudentDashboardService.getActivationDashboard).mockRejectedValue(new Error('db unavailable'))

    await expect(submitPathwayCheckIn(validFormData())).rejects.toMatchObject({
      target: '/es/student/pathway-check-in?error=server',
    })

    expect(consoleError).toHaveBeenCalledWith(
      'Pathway check-in submission error:',
      expect.any(Error)
    )
    consoleError.mockRestore()
  })
})
