import { z } from 'zod'

export const growthReflectionSchema = z.object({
  participated_in: z.string().trim().min(2).max(160),
  learned: z.string().trim().min(2).max(600),
  skill_or_mindset: z.string().trim().min(2).max(240),
  goal_connection: z.string().trim().min(2).max(600),
  next_move: z.string().trim().min(2).max(300),
  status: z.enum(['draft', 'completed']),
  event_id: z.string().trim().optional(),
  recommendation_id: z.string().trim().optional(),
})

export function parseGrowthReflectionFormData(formData: FormData) {
  return growthReflectionSchema.safeParse({
    participated_in: formData.get('participated_in')?.toString() ?? '',
    learned: formData.get('learned')?.toString() ?? '',
    skill_or_mindset: formData.get('skill_or_mindset')?.toString() ?? '',
    goal_connection: formData.get('goal_connection')?.toString() ?? '',
    next_move: formData.get('next_move')?.toString() ?? '',
    status: formData.get('status')?.toString() ?? 'completed',
    event_id: formData.get('event_id')?.toString() || undefined,
    recommendation_id: formData.get('recommendation_id')?.toString() || undefined,
  })
}
