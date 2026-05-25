import { z } from 'zod'
import { PathwayCheckInService, type PathwayCheckInAnswers } from '@/lib/services/pathway-check-in.service'

export const LOOKING_FOR_OPTIONS = [
  'explore_career_paths',
  'build_technical_experience',
  'prepare_for_opportunities',
  'find_community_mentorship',
  'start_leading',
] as const

export const CURRENT_BLOCKER_OPTIONS = [
  'dont_know_where_to_start',
  'dont_know_what_fits',
  'need_more_experience',
  'need_career_prep',
  'need_people_to_guide_me',
] as const

export const MONTHLY_TIME_COMMITMENT_OPTIONS = [
  'one_hour',
  'two_to_four_hours',
  'five_plus_hours',
] as const

const pathwayCheckInSchema = z.object({
  looking_for: z.enum(LOOKING_FOR_OPTIONS),
  current_blocker: z.enum(CURRENT_BLOCKER_OPTIONS),
  study_interest: z.string().trim().min(2).max(120),
  confidence_level: z.coerce.number().int().min(1).max(5),
  monthly_time_commitment: z.enum(MONTHLY_TIME_COMMITMENT_OPTIONS),
})

export function parsePathwayCheckInFormData(formData: FormData) {
  return pathwayCheckInSchema.safeParse({
    looking_for: formData.get('looking_for')?.toString() ?? '',
    current_blocker: formData.get('current_blocker')?.toString() ?? '',
    study_interest: formData.get('study_interest')?.toString() ?? '',
    confidence_level: formData.get('confidence_level')?.toString() ?? '',
    monthly_time_commitment: formData.get('monthly_time_commitment')?.toString() ?? '',
  })
}

export async function saveCompletedPathwayCheckIn(
  ...params: Parameters<typeof PathwayCheckInService.saveCompletedCheckIn>
): Promise<Awaited<ReturnType<typeof PathwayCheckInService.saveCompletedCheckIn>>> {
  return PathwayCheckInService.saveCompletedCheckIn(...params)
}

export type ParsedPathwayCheckInAnswers = PathwayCheckInAnswers
