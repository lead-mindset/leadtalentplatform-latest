'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ChapterRoleAssignmentService } from '@/lib/services/chapter-role-assignment.service'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
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
  const adminClient = createAdminClient()

  const { data: chapter, error: chapterError } = await supabase
    .from('chapter')
    .select('id, name')
    .eq('id', parsed.data.chapterId)
    .maybeSingle()

  if (chapterError || !chapter) {
    return { success: false, error: 'Chapter not found.' }
  }

  const now = new Date().toISOString()

  const targetUser = await resolveTargetUser(supabase, adminClient, parsed.data.email)
  if (!targetUser.ok) return { success: false, error: targetUser.error }

  const crossChapter = await hasApprovedMembershipInOtherChapter(supabase, targetUser.userId, chapter.id)
  if (!crossChapter.ok) return { success: false, error: crossChapter.error }
  if (crossChapter.blocked) {
    return {
      success: false,
      error: 'This account already belongs to another chapter. Contact support before onboarding.',
    }
  }

  const { data: existingMembership } = await supabase
    .from('chapter_membership')
    .select('id, status, member_id, joined_at')
    .match({ user_id: targetUser.userId, chapter_id: chapter.id })
    .maybeSingle()

  const { data: existingPresidentRole } = await supabase
    .from('chapter_role_assignment')
    .select('id, role_level, status')
    .match({ user_id: targetUser.userId, chapter_id: chapter.id, role_level: 'president' })
    .maybeSingle()

  // Idempotent no-op: already approved membership and active president role.
  if (existingMembership?.status === 'approved' && existingMembership.member_id && existingPresidentRole?.status === 'active') {
    revalidatePath('/admin')
    return { success: true }
  }

  // Reactivation path: approved membership + previously deactivated president role.
  if (existingMembership?.status === 'approved' && existingMembership.member_id && existingPresidentRole) {
    return reactivatePresidentRole(supabase, {
      roleAssignmentId: existingPresidentRole.id,
      userId: targetUser.userId,
      chapterId: chapter.id,
      grantedById: adminUser.id,
    })
  }

  const leadIdResult = await PersonProfileService.getOrIssueLeadId(supabase, targetUser.userId)
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
        position: 'president',
        updated_at: now,
      })
      .eq('id', existingMembership.id)

    if (updateError) {
      logger.error({ context: 'onboard-president/membership-update', error: updateError })
      return { success: false, error: 'Failed to update chapter membership.' }
    }
  } else {
    const { error: insertError } = await supabase.from('chapter_membership').insert({
      user_id: targetUser.userId,
      chapter_id: chapter.id,
      status: 'approved',
      member_id: memberId,
      approved_by_id: adminUser.id,
      joined_at: now,
      position: 'president',
    })

    if (insertError) {
      logger.error({ context: 'onboard-president/membership-insert', error: insertError })
      return { success: false, error: 'Failed to create chapter membership.' }
    }
  }

  const roleResult = await ChapterRoleAssignmentService.assignChapterRole(supabase, {
    actorUserId: adminUser.id,
    targetUserId: targetUser.userId,
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
    userId: targetUser.userId,
    chapterId: chapter.id,
    grantedById: adminUser.id,
  })

  if (!presidentResult.success) {
    return presidentResult
  }

  revalidatePath('/admin')
  return { success: true }
}

type ResolvedTarget = { ok: true; userId: string } | { ok: false; error: string }

async function resolveTargetUser(
  supabase: SupabaseClient<Database>,
  adminClient: ReturnType<typeof createAdminClient>,
  email: string
): Promise<ResolvedTarget> {
  const { data: existingUser, error: userError } = await supabase
    .from('user')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()

  if (userError) {
    logger.error({ context: 'onboard-president/user', error: userError })
    return { ok: false, error: 'Failed to look up the user.' }
  }

  if (existingUser) {
    // Ensure the auth account is email-confirmed so the president can log in.
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(existingUser.id)
    if (authError) {
      logger.error({ context: 'onboard-president/auth-get', error: authError })
      return { ok: false, error: 'Failed to confirm the account.' }
    }
    if (authUser.user && !authUser.user.email_confirmed_at) {
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
      })
      if (confirmError) {
        logger.error({ context: 'onboard-president/auth-confirm', error: confirmError })
        return { ok: false, error: 'Failed to confirm the account.' }
      }
    }
    return { ok: true, userId: existingUser.id }
  }

  const { data: createdAuth, error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (createError || !createdAuth.user) {
    logger.error({ context: 'onboard-president/auth-create', error: createError })
    return { ok: false, error: 'Failed to create the account.' }
  }

  const createdUserId = createdAuth.user.id

  // handle_new_user() trigger should insert public.user; fall back to a manual insert.
  const { data: createdUser } = await supabase
    .from('user')
    .select('id, email')
    .eq('id', createdUserId)
    .maybeSingle()

  if (!createdUser) {
    const { error: insertError } = await adminClient.from('user').insert({
      id: createdUserId,
      email,
      name: '',
      role: 'member',
    })
    if (insertError) {
      logger.error({ context: 'onboard-president/user-fallback', error: insertError })
      return { ok: false, error: 'Failed to create the account.' }
    }
  }

  return { ok: true, userId: createdUserId }
}

type CrossChapterResult = { ok: true; blocked: boolean } | { ok: false; error: string }

async function hasApprovedMembershipInOtherChapter(
  supabase: SupabaseClient<Database>,
  userId: string,
  chapterId: string
): Promise<CrossChapterResult> {
  const { data: memberships, error } = await supabase
    .from('chapter_membership')
    .select('chapter_id')
    .eq('user_id', userId)
    .eq('status', 'approved')

  if (error) {
    logger.error({ context: 'onboard-president/cross-chapter', error, userId })
    return { ok: false, error: 'Failed to validate chapter membership.' }
  }

  const blocked = (memberships ?? []).some((membership) => membership.chapter_id !== chapterId)
  return { ok: true, blocked }
}

async function reactivatePresidentRole(
  supabase: SupabaseClient<Database>,
  params: {
    roleAssignmentId: string
    userId: string
    chapterId: string
    grantedById: string
  }
): Promise<ActionResult> {
  const now = new Date().toISOString()

  const { error: reactivateError } = await supabase
    .from('chapter_role_assignment')
    .update({ status: 'active', ends_at: null, updated_at: now })
    .eq('id', params.roleAssignmentId)

  if (reactivateError) {
    logger.error({ context: 'onboard-president/role-reactivate', error: reactivateError })
    return { success: false, error: 'Failed to reactivate president role.' }
  }

  const grantResult = await ChapterPermissionService.grantRoleTemplatePermissions(supabase, {
    userId: params.userId,
    chapterId: params.chapterId,
    roleLevel: 'president',
    grantedById: params.grantedById,
    source: 'role_template',
    sourceRoleAssignmentId: params.roleAssignmentId,
  })

  if (!grantResult.success) return grantResult

  const presidentResult = await onboardPresident(supabase, {
    userId: params.userId,
    chapterId: params.chapterId,
    grantedById: params.grantedById,
  })

  if (!presidentResult.success) return presidentResult

  revalidatePath('/admin')
  return { success: true }
}
