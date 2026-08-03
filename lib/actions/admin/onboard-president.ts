'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { ChapterRoleAssignmentService } from '@/lib/services/chapter-role-assignment.service'
import { PersonProfileService } from '@/lib/services/person-profile.service'
import { onboardPresident } from '@/lib/services/chapter-president.service'
import { logger } from '@/lib/logger'

type ActionResult = { success: true } | { success: false; error: string }

const onboardPresidentSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  chapterId: z.string().trim().min(1),
  functionalArea: z
    .enum([
      'general_leadership',
      'strategy_operations',
      'marketing_communications',
      'events_experience',
      'finance_legal',
      'chapter_development',
      'academic_excellence',
      'professional_development',
      'leadership',
      'women_in_stem',
      'research',
      'projects',
      'partnerships_external_relations',
      'people_talent',
      'other',
    ])
    .default('general_leadership'),
  displayTitle: z.string().trim().min(1).max(120).default('President'),
})

export async function onboardPresidentAction(
  input: z.infer<typeof onboardPresidentSchema>
): Promise<ActionResult> {
  const parsed = onboardPresidentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid email and select a chapter.' }
  }

  const { supabase, user: adminUser } = await requireAdmin()

  const { data: targetUser, error: userError } = await supabase
    .from('user')
    .select('id, email, role')
    .eq('email', parsed.data.email)
    .maybeSingle()

  if (userError || !targetUser) {
    return { success: false, error: 'User not found with that email.' }
  }

  const { data: chapter, error: chapterError } = await supabase
    .from('chapter')
    .select('id, name')
    .eq('id', parsed.data.chapterId)
    .maybeSingle()

  if (chapterError || !chapter) {
    return { success: false, error: 'Chapter not found.' }
  }

  const now = new Date().toISOString()

  const { data: existingMembership } = await supabase
    .from('chapter_membership')
    .select('id, status, member_id, joined_at')
    .match({ user_id: targetUser.id, chapter_id: chapter.id })
    .maybeSingle()

  if (existingMembership?.status === 'approved' && existingMembership.member_id) {
    return { success: false, error: 'User already has an approved membership in this chapter.' }
  }

  const leadIdResult = await PersonProfileService.getOrIssueLeadId(supabase, targetUser.id)
  if (!leadIdResult.success) {
    return { success: false, error: leadIdResult.error }
  }

  const memberId = leadIdResult.data

  if (existingMembership) {
    const { error: updateError } = await supabase
      .from('chapter_membership')
      .update({
        status: 'approved',
        member_id: memberId,
        approved_by_id: adminUser.id,
        joined_at: existingMembership.joined_at ?? now,
        position: 'member',
        updated_at: now,
      })
      .eq('id', existingMembership.id)

    if (updateError) {
      logger.error({ context: 'onboard-president/membership-update', error: updateError })
      return { success: false, error: 'Failed to update chapter membership.' }
    }
  } else {
    const { error: insertError } = await supabase.from('chapter_membership').insert({
      user_id: targetUser.id,
      chapter_id: chapter.id,
      status: 'approved',
      member_id: memberId,
      approved_by_id: adminUser.id,
      joined_at: now,
      position: 'member',
    })

    if (insertError) {
      logger.error({ context: 'onboard-president/membership-insert', error: insertError })
      return { success: false, error: 'Failed to create chapter membership.' }
    }
  }

  const roleResult = await ChapterRoleAssignmentService.assignChapterRole(supabase, {
    actorUserId: adminUser.id,
    targetUserId: targetUser.id,
    chapterId: chapter.id,
    roleLevel: 'president',
    functionalArea: parsed.data.functionalArea,
    displayTitle: parsed.data.displayTitle,
    rawTitle: parsed.data.displayTitle,
  })

  if (!roleResult.success) {
    return roleResult
  }

  const presidentResult = await onboardPresident(supabase, {
    userId: targetUser.id,
    chapterId: chapter.id,
    grantedById: adminUser.id,
  })

  if (!presidentResult.success) {
    return presidentResult
  }

  revalidatePath('/admin')
  return { success: true }
}
