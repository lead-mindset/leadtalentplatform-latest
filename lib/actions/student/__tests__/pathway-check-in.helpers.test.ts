import { describe, expect, it } from 'vitest'
import { parsePathwayCheckInFormData } from '@/lib/actions/student/pathway-check-in.helpers'

function validFormData() {
  const formData = new FormData()
  formData.set('looking_for', 'prepare_for_opportunities')
  formData.set('current_blocker', 'need_career_prep')
  formData.set('study_interest', 'Computer Science')
  formData.set('confidence_level', '4')
  formData.set('monthly_time_commitment', 'two_to_four_hours')
  return formData
}

describe('pathway check-in helpers', () => {
  it('parses the five V1 answers', () => {
    const parsed = parsePathwayCheckInFormData(validFormData())

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data).toEqual({
      looking_for: 'prepare_for_opportunities',
      current_blocker: 'need_career_prep',
      study_interest: 'Computer Science',
      confidence_level: 4,
      monthly_time_commitment: 'two_to_four_hours',
    })
  })

  it('rejects missing required answers', () => {
    const parsed = parsePathwayCheckInFormData(new FormData())

    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(parsed.error.issues.length).toBeGreaterThan(0)
  })

  it('rejects confidence outside the 1 to 5 range', () => {
    const formData = validFormData()
    formData.set('confidence_level', '6')

    const parsed = parsePathwayCheckInFormData(formData)

    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(parsed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['confidence_level'],
        }),
      ])
    )
  })

  it('rejects unsupported option values', () => {
    const formData = validFormData()
    formData.set('looking_for', 'just_browsing')

    const parsed = parsePathwayCheckInFormData(formData)

    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(parsed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['looking_for'],
        }),
      ])
    )
  })
})
