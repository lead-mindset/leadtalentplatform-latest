import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createServiceClient: vi.fn(),
  getTranslations: vi.fn(),
  revalidatePath: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  requireUser: mocks.requireUser,
}))

vi.mock('@/lib/supabase/server-service', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('next-intl/server', () => ({
  getTranslations: mocks.getTranslations,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock('@/lib/services/student.service', () => ({
  StudentService: {
    updateProfile: mocks.updateProfile,
  },
}))

import { updateProfile } from './profile'

function buildValidProfileFormData() {
  const formData = new FormData()

  formData.set('full_name', 'Launch Member')
  formData.set('phone', '+51 999 999 999')
  formData.set('gender', 'woman')
  formData.set('career', 'Computer Science')
  formData.set('graduation_year', '2027')
  formData.set('skills', JSON.stringify(['TypeScript']))
  formData.set('linkedin_url', 'https://linkedin.com/in/launch-member')
  formData.set('portfolio_url', 'https://portfolio.example.com')
  formData.set('consentRecruiterVisibility', 'true')
  formData.set('emailNotificationsEnabled', 'true')

  return formData
}

describe('student profile actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({
      user: {
        id: 'user-123',
      },
    })
    mocks.createServiceClient.mockReturnValue({ from: vi.fn() })
    mocks.getTranslations.mockResolvedValue((key: string) => key)
    mocks.updateProfile.mockResolvedValue({ success: true })
  })

  it('ignores submitted chapter affiliation fields during profile updates', async () => {
    const formData = buildValidProfileFormData()
    formData.set('lead_chapter', 'leaduni')
    formData.set('chapter_id', 'leadupc')

    const result = await updateProfile(formData)

    expect(result).toEqual({
      success: true,
      message: 'Perfil actualizado correctamente',
    })
    expect(mocks.updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({
        leadChapter: expect.anything(),
        lead_chapter: expect.anything(),
        chapterId: expect.anything(),
        chapter_id: expect.anything(),
      })
    )
    expect(mocks.updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user-123',
        fullName: 'Launch Member',
        career: 'Computer Science',
      })
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/student/profile')
  })
})
