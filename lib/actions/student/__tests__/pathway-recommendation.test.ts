import { beforeEach, describe, expect, it, vi } from 'vitest'
import { startPathwayRecommendation } from '../pathway-recommendation'
import { createClient } from '@/lib/supabase/server'
import { PathwayCheckInService } from '@/lib/services/pathway-check-in.service'
import { redirect } from 'next/navigation'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/pathway-check-in.service', () => ({
  PathwayCheckInService: {
    updateRecommendationStatus: vi.fn(),
  },
}))

describe('startPathwayRecommendation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } } })),
      },
    } as never)
    vi.mocked(PathwayCheckInService.updateRecommendationStatus).mockResolvedValue({
      success: true,
    })
  })

  it('marks a recommendation started before redirecting to a safe target', async () => {
    const formData = new FormData()
    formData.set('recommendation_id', 'recommendation-1')
    formData.set('target_path', '/events/event-1')

    await startPathwayRecommendation(formData)

    expect(PathwayCheckInService.updateRecommendationStatus).toHaveBeenCalledWith(
      expect.anything(),
      {
        userId: 'user-1',
        recommendationId: 'recommendation-1',
        status: 'started',
      }
    )
    expect(redirect).toHaveBeenCalledWith('/events/event-1')
  })

  it('does not redirect to unsafe targets', async () => {
    const formData = new FormData()
    formData.set('recommendation_id', 'recommendation-1')
    formData.set('target_path', 'https://example.com')

    await startPathwayRecommendation(formData)

    expect(PathwayCheckInService.updateRecommendationStatus).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })
})
