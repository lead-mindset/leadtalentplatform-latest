'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getApprovedChapterMembership, requireAdmin, requireUser } from '@/lib/auth'
import { ChapterRoleAssignmentService } from '@/lib/services/chapter-role-assignment.service'
import {
  ADMIN_ASSIGNABLE_CHAPTER_ROLE_LEVELS,
  CHAPTER_FUNCTIONAL_AREAS,
  REGULAR_EBOARD_ROLE_LEVELS,
} from '@/lib/chapter-role-options'

type ActionResult =
  | { success: true; roleAssignmentId?: string }
  | { success: false; error: string }

const BaseAssignmentSchema = z.object({
  targetUserId: z.string().uuid(),
  chapterId: z.string().trim().min(1).max(80).optional(),
  functionalArea: z.enum(CHAPTER_FUNCTIONAL_AREAS),
  displayTitle: z.string().trim().min(2).max(120),
})

const RegularAssignmentSchema = BaseAssignmentSchema.extend({
  roleLevel: z.enum(REGULAR_EBOARD_ROLE_LEVELS),
})

const AdminAssignmentSchema = BaseAssignmentSchema.extend({
  chapterId: z.string().trim().min(1).max(80),
  roleLevel: z.enum(ADMIN_ASSIGNABLE_CHAPTER_ROLE_LEVELS),
})

const DeactivateSchema = z.object({
  roleAssignmentId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
})

function revalidateRoleAssignmentPaths(targetUserId?: string, chapterId?: string) {
  revalidatePath('/chapter/members')
  revalidatePath('/chapter')
  revalidatePath('/admin/users')
  revalidatePath('/admin/chapters')
  if (targetUserId) revalidatePath(`/admin/users/${targetUserId}`)
  if (chapterId) revalidatePath(`/admin/chapters/${chapterId}`)
}

export async function assignRegularChapterRole(input: unknown): Promise<ActionResult> {
  const parsed = RegularAssignmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid role assignment.' }
  }

  const { supabase, user } = await requireUser()
  if (user.role === 'admin') {
    return { success: false, error: 'Use the admin correction path for admin role assignments.' }
  }

  const membership = await getApprovedChapterMembership(supabase, user.id)
  if (!membership?.chapter_id) {
    return { success: false, error: 'No approved chapter membership found.' }
  }

  const result = await ChapterRoleAssignmentService.assignChapterRole(supabase, {
    actorUserId: user.id,
    targetUserId: parsed.data.targetUserId,
    chapterId: membership.chapter_id,
    roleLevel: parsed.data.roleLevel,
    functionalArea: parsed.data.functionalArea,
    displayTitle: parsed.data.displayTitle,
    rawTitle: parsed.data.displayTitle,
  })

  if (!result.success) return result

  revalidateRoleAssignmentPaths(parsed.data.targetUserId, membership.chapter_id)
  return { success: true, roleAssignmentId: result.roleAssignmentId }
}

export async function assignAdminChapterRole(input: unknown): Promise<ActionResult> {
  const parsed = AdminAssignmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid admin role assignment.' }
  }

  const { supabase, user } = await requireAdmin()
  const result = await ChapterRoleAssignmentService.assignChapterRole(supabase, {
    actorUserId: user.id,
    targetUserId: parsed.data.targetUserId,
    chapterId: parsed.data.chapterId,
    roleLevel: parsed.data.roleLevel,
    functionalArea: parsed.data.functionalArea,
    displayTitle: parsed.data.displayTitle,
    rawTitle: parsed.data.displayTitle,
  })

  if (!result.success) return result

  revalidateRoleAssignmentPaths(parsed.data.targetUserId, parsed.data.chapterId)
  return { success: true, roleAssignmentId: result.roleAssignmentId }
}

export async function deactivateChapterRoleAssignment(input: unknown): Promise<ActionResult> {
  const parsed = DeactivateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid role assignment removal.' }
  }

  const { supabase, user } = await requireUser()
  const result = await ChapterRoleAssignmentService.deactivateChapterRole(supabase, {
    actorUserId: user.id,
    roleAssignmentId: parsed.data.roleAssignmentId,
    revokeReason: parsed.data.reason,
  })

  if (!result.success) return result

  revalidateRoleAssignmentPaths()
  return { success: true }
}
