import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import type { IdentityType, LeadIdentityRow } from '@/lib/types'
import { logger } from '@/lib/logger'

type ChapterScopedIdentityType = 'chapter_member' | 'chapter_editor' | 'alumni'
type GlobalIdentityType = 'founder' | 'staff'
type SupportedIdentityType = IdentityType | 'admin'

type IssueIdentityParams = {
  userId: string
  identityType: SupportedIdentityType
  chapterId?: string | null
  issuedById?: string | null
  makePrimary?: boolean
}

type MembershipIdentityParams = {
  userId: string
  chapterId: string
  issuedById?: string | null
  makePrimary?: boolean
}

type IdentityResult = { success: true; identity: LeadIdentityRow } | { success: false; error: string }
type IdentityListResult = { success: true; identities: LeadIdentityRow[] } | { success: false; error: string }
type NullableIdentityResult = { success: true; identity: LeadIdentityRow | null } | { success: false; error: string }
type ActionResult = { success: true } | { success: false; error: string }

const CHAPTER_SCOPED_TYPES = new Set<ChapterScopedIdentityType>([
  'chapter_member',
  'chapter_editor',
  'alumni',
])
const GLOBAL_TYPES = new Set<GlobalIdentityType>(['founder', 'staff'])
const IDENTITY_PRIORITY: Record<IdentityType, number> = {
  founder: 500,
  staff: 400,
  chapter_editor: 300,
  chapter_member: 200,
  alumni: 100,
}

function isChapterScopedIdentity(identityType: SupportedIdentityType): identityType is ChapterScopedIdentityType {
  return CHAPTER_SCOPED_TYPES.has(identityType as ChapterScopedIdentityType)
}

function isGlobalIdentity(identityType: SupportedIdentityType): identityType is GlobalIdentityType {
  return GLOBAL_TYPES.has(identityType as GlobalIdentityType)
}

function validateIdentityScope(identityType: SupportedIdentityType, chapterId?: string | null): string | null {
  if (identityType === 'admin') {
    return 'Admin is an authorization role, not a public LEAD identity.'
  }

  if (isChapterScopedIdentity(identityType) && !chapterId) {
    return `${identityType} identities require a chapter.`
  }

  if (isGlobalIdentity(identityType) && chapterId) {
    return `${identityType} identities must not be scoped to a chapter.`
  }

  return null
}

function sortPrimaryFallback(a: LeadIdentityRow, b: LeadIdentityRow) {
  const priorityDiff = IDENTITY_PRIORITY[b.identity_type] - IDENTITY_PRIORITY[a.identity_type]
  if (priorityDiff !== 0) return priorityDiff
  return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
}

export const LeadIdentityService = {
  async issueIdentity(
    supabase: SupabaseClient<Database>,
    params: IssueIdentityParams
  ): Promise<IdentityResult> {
    const chapterId = params.chapterId ?? null
    const scopeError = validateIdentityScope(params.identityType, chapterId)
    if (scopeError) {
      return { success: false, error: scopeError }
    }

    const identityType = params.identityType as IdentityType
    let existingQuery = supabase
      .from('lead_identity')
      .select('*')
      .eq('user_id', params.userId)
      .eq('identity_type', identityType)

    existingQuery = chapterId
      ? existingQuery.eq('chapter_id', chapterId)
      : existingQuery.is('chapter_id', null)

    const { data: existing, error: existingError } = await existingQuery.maybeSingle()
    if (existingError) {
      logger.error({ context: 'lead-identity/issue', error: existingError }, 'Failed to find existing identity')
      return { success: false, error: 'Failed to issue LEAD identity.' }
    }

    const issuedAt = new Date().toISOString()
    let identity: LeadIdentityRow | null = null

    if (existing) {
      const { data, error } = await supabase
        .from('lead_identity')
        .update({
          status: 'active',
          revoked_at: null,
          issued_by_id: params.issuedById ?? existing.issued_by_id,
          issued_at: existing.status === 'revoked' ? issuedAt : existing.issued_at,
          updated_at: issuedAt,
        })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) {
        logger.error({ context: 'lead-identity/issue', error }, 'Failed to reactivate identity')
        return { success: false, error: 'Failed to issue LEAD identity.' }
      }
      identity = data
    } else {
      const { data, error } = await supabase
        .from('lead_identity')
        .insert({
          user_id: params.userId,
          identity_type: identityType,
          chapter_id: chapterId,
          issued_by_id: params.issuedById ?? null,
          issued_at: issuedAt,
          is_primary: false,
          status: 'active',
        })
        .select('*')
        .single()

      if (error) {
        logger.error({ context: 'lead-identity/issue', error }, 'Failed to insert identity')
        return { success: false, error: 'Failed to issue LEAD identity.' }
      }
      identity = data
    }

    if (params.makePrimary) {
      const primaryResult = await this.setPrimaryIdentity(supabase, {
        userId: params.userId,
        identityId: identity.id,
      })
      if (!primaryResult.success) return primaryResult

      return {
        success: true,
        identity: { ...identity, is_primary: true },
      }
    }

    return { success: true, identity }
  },

  async issueForApprovedMembership(
    supabase: SupabaseClient<Database>,
    params: MembershipIdentityParams
  ): Promise<IdentityResult> {
    const { data: membership, error } = await supabase
      .from('chapter_membership')
      .select('user_id, chapter_id, status')
      .eq('user_id', params.userId)
      .eq('chapter_id', params.chapterId)
      .maybeSingle()

    if (error) {
      logger.error({ context: 'lead-identity/member', error }, 'Failed to verify approved membership')
      return { success: false, error: 'Failed to verify chapter membership.' }
    }

    if (!membership || membership.status !== 'approved') {
      return { success: false, error: 'Approved chapter membership is required before issuing this identity.' }
    }

    return this.issueIdentity(supabase, {
      userId: params.userId,
      identityType: 'chapter_member',
      chapterId: params.chapterId,
      issuedById: params.issuedById,
      makePrimary: params.makePrimary,
    })
  },

  async issueChapterEditorIdentity(
    supabase: SupabaseClient<Database>,
    params: MembershipIdentityParams
  ): Promise<IdentityResult> {
    const { data: membership, error } = await supabase
      .from('chapter_membership')
      .select('user_id, chapter_id, status')
      .eq('user_id', params.userId)
      .eq('chapter_id', params.chapterId)
      .maybeSingle()

    if (error) {
      logger.error({ context: 'lead-identity/editor', error }, 'Failed to verify editor membership')
      return { success: false, error: 'Failed to verify chapter membership.' }
    }

    if (!membership || membership.status !== 'approved') {
      return { success: false, error: 'Approved chapter membership is required before issuing this identity.' }
    }

    return this.issueIdentity(supabase, {
      userId: params.userId,
      identityType: 'chapter_editor',
      chapterId: params.chapterId,
      issuedById: params.issuedById,
      makePrimary: params.makePrimary,
    })
  },

  async setPrimaryIdentity(
    supabase: SupabaseClient<Database>,
    params: { userId: string; identityId: string }
  ): Promise<ActionResult> {
    const { data: identity, error: identityError } = await supabase
      .from('lead_identity')
      .select('id, user_id, status')
      .eq('id', params.identityId)
      .eq('user_id', params.userId)
      .maybeSingle()

    if (identityError) {
      logger.error({ context: 'lead-identity/primary', error: identityError }, 'Failed to load identity')
      return { success: false, error: 'Failed to set primary LEAD identity.' }
    }

    if (!identity || identity.status !== 'active') {
      return { success: false, error: 'Only an active LEAD identity can be marked primary.' }
    }

    const updatedAt = new Date().toISOString()
    const { error: clearError } = await supabase
      .from('lead_identity')
      .update({ is_primary: false, updated_at: updatedAt })
      .eq('user_id', params.userId)
      .eq('status', 'active')

    if (clearError) {
      logger.error({ context: 'lead-identity/primary', error: clearError }, 'Failed to clear primary identities')
      return { success: false, error: 'Failed to set primary LEAD identity.' }
    }

    const { error: updateError } = await supabase
      .from('lead_identity')
      .update({ is_primary: true, updated_at: updatedAt })
      .eq('id', params.identityId)
      .eq('user_id', params.userId)
      .eq('status', 'active')

    if (updateError) {
      logger.error({ context: 'lead-identity/primary', error: updateError }, 'Failed to update primary identity')
      return { success: false, error: 'Failed to set primary LEAD identity.' }
    }

    return { success: true }
  },

  async revokeIdentity(
    supabase: SupabaseClient<Database>,
    params: { userId: string; identityId: string }
  ): Promise<ActionResult> {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('lead_identity')
      .update({
        status: 'revoked',
        revoked_at: now,
        is_primary: false,
        updated_at: now,
      })
      .eq('id', params.identityId)
      .eq('user_id', params.userId)
      .eq('status', 'active')

    if (error) {
      logger.error({ context: 'lead-identity/revoke', error }, 'Failed to revoke identity')
      return { success: false, error: 'Failed to revoke LEAD identity.' }
    }

    return { success: true }
  },

  async getActiveIdentities(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<IdentityListResult> {
    const { data, error } = await supabase
      .from('lead_identity')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('issued_at', { ascending: false })

    if (error) {
      logger.error({ context: 'lead-identity/list', error }, 'Failed to list identities')
      return { success: false, error: 'Failed to load LEAD identities.' }
    }

    return { success: true, identities: data ?? [] }
  },

  async getPrimaryIdentity(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<NullableIdentityResult> {
    const { data: primary, error: primaryError } = await supabase
      .from('lead_identity')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('is_primary', true)
      .maybeSingle()

    if (primaryError) {
      logger.error({ context: 'lead-identity/display', error: primaryError }, 'Failed to load primary identity')
      return { success: false, error: 'Failed to load primary LEAD identity.' }
    }

    if (primary) {
      return { success: true, identity: primary }
    }

    const identitiesResult = await this.getActiveIdentities(supabase, userId)
    if (!identitiesResult.success) return identitiesResult

    const [fallback] = [...identitiesResult.identities].sort(sortPrimaryFallback)
    return { success: true, identity: fallback ?? null }
  },
}
