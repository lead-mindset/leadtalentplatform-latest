import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { logger } from '@/lib/logger'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'

export const FUNDING_REQUEST_STATUSES = [
  'draft',
  'submitted',
  'changes_requested',
  'approved',
  'rejected',
  'receipts_due',
  'closed',
] as const

export const FUNDING_OKR_KEYS = ['inspire', 'unite', 'empower', 'elevate'] as const

export const FUNDING_PILLAR_KEYS = [
  'lead_academia',
  'academic_excellence',
  'womens_excellence',
  'professional_development',
  'leadership_development',
  'community_outreach',
  'chapter_development',
] as const

export const FUNDING_BUDGET_CATEGORIES = [
  'food_refreshments',
  'event_materials',
  'minimal_decorations',
  'learning_materials',
  'recognition_items',
  'software_platforms',
  'speaker_support',
  'transportation_exception',
  'other',
] as const

export const FUNDING_SOURCE_KEYS = [
  'lead_peru_chapter_budget',
  'lead_wide_event_budget',
  'sponsor_partner',
  'hola_benevity',
  'other',
] as const

export type FundingRequestStatus = (typeof FUNDING_REQUEST_STATUSES)[number]
export type FundingOkrKey = (typeof FUNDING_OKR_KEYS)[number]
export type FundingPillarKey = (typeof FUNDING_PILLAR_KEYS)[number]
export type FundingBudgetCategory = (typeof FUNDING_BUDGET_CATEGORIES)[number]
export type FundingSourceKey = (typeof FUNDING_SOURCE_KEYS)[number]

export type FundingRequestRow = Database['public']['Tables']['funding_request']['Row']
export type FundingBudgetItemRow = Database['public']['Tables']['funding_request_budget_item']['Row']
export type FundingFileRow = Database['public']['Tables']['funding_request_file']['Row']
export type FundingStatusEventRow = Database['public']['Tables']['funding_request_status_event']['Row']

type FundingRequestInsert = Database['public']['Tables']['funding_request']['Insert']
type FundingRequestUpdate = Database['public']['Tables']['funding_request']['Update']
type FundingBudgetItemInsert = Database['public']['Tables']['funding_request_budget_item']['Insert']

export type FundingBudgetItemInput = {
  label: string
  category: FundingBudgetCategory
  amount: number
  notes?: string | null
}

export type FundingRequestInput = {
  chapterId: string
  requesterUserId: string
  title: string
  purpose: string
  expectedAudience: string
  expectedAttendeeCount?: number | null
  requestedAmount: number
  currency?: 'PEN' | 'USD'
  eventDate: string
  eventId?: string | null
  okrKeys: FundingOkrKey[]
  pillarKeys: FundingPillarKey[]
  partnerName?: string | null
  partnerDetails?: string | null
  supportingNotes?: string | null
  budgetItems: FundingBudgetItemInput[]
}

export type SaveFundingDraftInput = FundingRequestInput & {
  requestId: string
}

export type SubmitFundingRequestInput = {
  actorUserId: string
  requestId: string
  now?: Date
}

export type ReviewFundingDecision =
  | 'approve_full'
  | 'approve_partial'
  | 'request_changes'
  | 'reject'

export type ReviewFundingRequestInput = {
  actorUserId: string
  requestId: string
  decision: ReviewFundingDecision
  approvedAmount?: number | null
  note?: string | null
  fundingSource?: FundingSourceKey | null
}

export type UpdateFundingSourceInput = {
  actorUserId: string
  requestId: string
  fundingSource?: FundingSourceKey | null
  fundingSourceNote?: string | null
}

export type UpdateFundingAccountabilityInput = {
  actorUserId: string
  requestId: string
  actualSpendAmount?: number | null
  accountabilityNote?: string | null
  resultSummary?: string | null
  markReceiptsDue?: boolean
}

export type CloseFundingRequestInput = {
  actorUserId: string
  requestId: string
  closureNote?: string | null
}

export type FundingRequestDetail = {
  request: FundingRequestRow
  budgetItems: FundingBudgetItemRow[]
  files: FundingFileRow[]
  statusEvents: FundingStatusEventRow[]
}

type ServiceResult<T> = { success: true; data: T } | { success: false; error: string }
type EmptyResult = { success: true } | { success: false; error: string }

const MONEY_EPSILON = 0.01
const DAY_IN_MS = 24 * 60 * 60 * 1000

function normalizeOptionalText(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function requireText(value: string, label: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return `${label} is required.`
  return null
}

function toMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function sumBudgetItems(items: FundingBudgetItemInput[]): number {
  return toMoney(items.reduce((sum, item) => sum + item.amount, 0))
}

function isLessThanFourteenDaysAway(eventDate: string, now = new Date()): boolean {
  const eventStart = new Date(`${eventDate}T00:00:00.000Z`)
  if (Number.isNaN(eventStart.getTime())) return false
  const diffDays = (eventStart.getTime() - now.getTime()) / DAY_IN_MS
  return diffDays < 14
}

function validateRequestInput(input: FundingRequestInput): string | null {
  return (
    requireText(input.title, 'Title') ??
    requireText(input.purpose, 'Purpose') ??
    requireText(input.expectedAudience, 'Expected audience') ??
    requireText(input.eventDate, 'Event date') ??
    validateAmount(input.requestedAmount, 'Requested amount') ??
    validateKeyList(input.okrKeys, 'At least one OKR is required.') ??
    validateKeyList(input.pillarKeys, 'At least one LEAD pillar is required.') ??
    validateBudgetItems(input.budgetItems, input.requestedAmount)
  )
}

function validateAmount(value: number | null | undefined, label: string): string | null {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return `${label} must be greater than 0.`
  }

  return null
}

function validateKeyList(values: readonly string[], message: string): string | null {
  return values.length > 0 ? null : message
}

function validateBudgetItems(items: FundingBudgetItemInput[], requestedAmount: number): string | null {
  if (items.length === 0) return 'At least one budget item is required.'

  for (const item of items) {
    if (!item.label.trim()) return 'Every budget item needs a label.'
    const amountError = validateAmount(item.amount, 'Budget item amount')
    if (amountError) return amountError
  }

  const itemTotal = sumBudgetItems(items)
  if (Math.abs(itemTotal - toMoney(requestedAmount)) > MONEY_EPSILON) {
    return 'Budget item total must match the requested amount.'
  }

  return null
}

function mapFundingRequestInsert(input: FundingRequestInput, status: FundingRequestStatus): FundingRequestInsert {
  return {
    chapter_id: input.chapterId,
    requester_user_id: input.requesterUserId,
    event_id: input.eventId ?? null,
    title: input.title.trim(),
    purpose: input.purpose.trim(),
    expected_audience: input.expectedAudience.trim(),
    expected_attendee_count: input.expectedAttendeeCount ?? null,
    requested_amount: toMoney(input.requestedAmount),
    currency: input.currency ?? 'PEN',
    status,
    okr_keys: [...input.okrKeys],
    pillar_keys: [...input.pillarKeys],
    partner_name: normalizeOptionalText(input.partnerName),
    partner_details: normalizeOptionalText(input.partnerDetails),
    supporting_notes: normalizeOptionalText(input.supportingNotes),
    event_date: input.eventDate,
    is_late_request: false,
  }
}

function mapFundingRequestUpdate(input: SaveFundingDraftInput): FundingRequestUpdate {
  return {
    ...mapFundingRequestInsert(input, 'draft'),
    updated_at: new Date().toISOString(),
  }
}

function mapBudgetItems(requestId: string, items: FundingBudgetItemInput[]): FundingBudgetItemInsert[] {
  return items.map((item, index) => ({
    funding_request_id: requestId,
    label: item.label.trim(),
    category: item.category,
    amount: toMoney(item.amount),
    notes: normalizeOptionalText(item.notes),
    sort_order: index + 1,
  }))
}

async function getUserRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('user')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    logger.error({ context: 'funding/user-role', error, userId }, 'Failed to load user role')
    return null
  }

  return data?.role ?? null
}

async function isAdmin(supabase: SupabaseClient<Database>, userId: string): Promise<boolean> {
  return (await getUserRole(supabase, userId)) === 'admin'
}

async function requireFundingPermission(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string
    chapterId: string
    permissionKey: 'chapter.funding.view' | 'chapter.funding.submit'
  }
): Promise<EmptyResult> {
  const admin = await isAdmin(supabase, params.userId)
  if (admin) return { success: true }

  return ChapterPermissionService.requireChapterPermission(supabase, params)
}

async function fetchRequestById(
  supabase: SupabaseClient<Database>,
  requestId: string
): Promise<ServiceResult<FundingRequestRow>> {
  const { data, error } = await supabase
    .from('funding_request')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (error) {
    logger.error({ context: 'funding/request-load', error, requestId }, 'Failed to load funding request')
    return { success: false, error: 'Failed to load funding request.' }
  }

  if (!data) return { success: false, error: 'Funding request not found.' }
  return { success: true, data }
}

async function fetchBudgetItems(
  supabase: SupabaseClient<Database>,
  requestId: string
): Promise<ServiceResult<FundingBudgetItemRow[]>> {
  const { data, error } = await supabase
    .from('funding_request_budget_item')
    .select('*')
    .eq('funding_request_id', requestId)
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error({ context: 'funding/budget-load', error, requestId }, 'Failed to load funding budget items')
    return { success: false, error: 'Failed to load budget items.' }
  }

  return { success: true, data: data ?? [] }
}

async function replaceBudgetItems(
  supabase: SupabaseClient<Database>,
  requestId: string,
  budgetItems: FundingBudgetItemInput[]
): Promise<EmptyResult> {
  const { error: deleteError } = await supabase
    .from('funding_request_budget_item')
    .delete()
    .eq('funding_request_id', requestId)

  if (deleteError) {
    logger.error({ context: 'funding/budget-delete', error: deleteError, requestId }, 'Failed to replace budget items')
    return { success: false, error: 'Failed to save budget items.' }
  }

  const rows = mapBudgetItems(requestId, budgetItems)
  const { error: insertError } = await supabase
    .from('funding_request_budget_item')
    .insert(rows)

  if (insertError) {
    logger.error({ context: 'funding/budget-insert', error: insertError, requestId }, 'Failed to insert budget items')
    return { success: false, error: 'Failed to save budget items.' }
  }

  return { success: true }
}

async function writeStatusEvent(
  supabase: SupabaseClient<Database>,
  params: {
    requestId: string
    actorUserId: string
    fromStatus: FundingRequestStatus | null
    toStatus: FundingRequestStatus
    note?: string | null
    metadata?: Record<string, string | number | boolean | null>
  }
) {
  const { error } = await supabase.from('funding_request_status_event').insert({
    funding_request_id: params.requestId,
    actor_user_id: params.actorUserId,
    from_status: params.fromStatus,
    to_status: params.toStatus,
    note: normalizeOptionalText(params.note),
    metadata: params.metadata ?? {},
  })

  if (error) {
    logger.error({ context: 'funding/status-event', error, requestId: params.requestId }, 'Failed to write funding status event')
  }
}

async function loadDetail(
  supabase: SupabaseClient<Database>,
  request: FundingRequestRow
): Promise<ServiceResult<FundingRequestDetail>> {
  const budgetItems = await fetchBudgetItems(supabase, request.id)
  if (!budgetItems.success) return budgetItems

  const { data: files, error: filesError } = await supabase
    .from('funding_request_file')
    .select('*')
    .eq('funding_request_id', request.id)
    .order('created_at', { ascending: false })

  if (filesError) {
    logger.error({ context: 'funding/files-load', error: filesError, requestId: request.id }, 'Failed to load funding files')
    return { success: false, error: 'Failed to load funding files.' }
  }

  const { data: statusEvents, error: statusError } = await supabase
    .from('funding_request_status_event')
    .select('*')
    .eq('funding_request_id', request.id)
    .order('created_at', { ascending: true })

  if (statusError) {
    logger.error({ context: 'funding/status-load', error: statusError, requestId: request.id }, 'Failed to load funding status events')
    return { success: false, error: 'Failed to load funding history.' }
  }

  return {
    success: true,
    data: {
      request,
      budgetItems: budgetItems.data,
      files: files ?? [],
      statusEvents: statusEvents ?? [],
    },
  }
}

function canSubmitFromStatus(status: FundingRequestStatus): boolean {
  return status === 'draft' || status === 'changes_requested'
}

function canReviewFromStatus(status: FundingRequestStatus): boolean {
  return status === 'submitted'
}

function canUpdateAccountability(status: FundingRequestStatus): boolean {
  return status === 'approved' || status === 'receipts_due'
}

export const FundingService = {
  isLateRequest(eventDate: string, now = new Date()): boolean {
    return isLessThanFourteenDaysAway(eventDate, now)
  },

  async listChapterRequests(
    supabase: SupabaseClient<Database>,
    params: { actorUserId: string; chapterId: string }
  ): Promise<ServiceResult<FundingRequestRow[]>> {
    const permission = await requireFundingPermission(supabase, {
      userId: params.actorUserId,
      chapterId: params.chapterId,
      permissionKey: 'chapter.funding.view',
    })
    if (!permission.success) return permission

    const { data, error } = await supabase
      .from('funding_request')
      .select('*')
      .eq('chapter_id', params.chapterId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error({ context: 'funding/list-chapter', error, chapterId: params.chapterId }, 'Failed to list chapter funding requests')
      return { success: false, error: 'Failed to load funding requests.' }
    }

    return { success: true, data: data ?? [] }
  },

  async listAdminRequests(
    supabase: SupabaseClient<Database>,
    params: { actorUserId: string; status?: FundingRequestStatus | 'all' | null }
  ): Promise<ServiceResult<FundingRequestRow[]>> {
    const admin = await isAdmin(supabase, params.actorUserId)
    if (!admin) return { success: false, error: 'Only admins can review funding requests.' }

    let query = supabase
      .from('funding_request')
      .select('*')
      .order('created_at', { ascending: false })

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status)
    }

    const { data, error } = await query

    if (error) {
      logger.error({ context: 'funding/list-admin', error, status: params.status }, 'Failed to list admin funding requests')
      return { success: false, error: 'Failed to load funding requests.' }
    }

    return { success: true, data: data ?? [] }
  },

  async getRequestDetail(
    supabase: SupabaseClient<Database>,
    params: { actorUserId: string; requestId: string }
  ): Promise<ServiceResult<FundingRequestDetail>> {
    const loaded = await fetchRequestById(supabase, params.requestId)
    if (!loaded.success) return loaded

    const permission = await requireFundingPermission(supabase, {
      userId: params.actorUserId,
      chapterId: loaded.data.chapter_id,
      permissionKey: 'chapter.funding.view',
    })
    if (!permission.success) return permission

    return loadDetail(supabase, loaded.data)
  },

  async createDraft(
    supabase: SupabaseClient<Database>,
    input: FundingRequestInput
  ): Promise<ServiceResult<FundingRequestRow>> {
    const permission = await requireFundingPermission(supabase, {
      userId: input.requesterUserId,
      chapterId: input.chapterId,
      permissionKey: 'chapter.funding.submit',
    })
    if (!permission.success) return permission

    const validationError = validateRequestInput(input)
    if (validationError) return { success: false, error: validationError }

    const { data: created, error } = await supabase
      .from('funding_request')
      .insert(mapFundingRequestInsert(input, 'draft'))
      .select('*')
      .single()

    if (error || !created) {
      logger.error({ context: 'funding/create-draft', error, chapterId: input.chapterId }, 'Failed to create funding request')
      return { success: false, error: 'Failed to create funding request.' }
    }

    const budgetResult = await replaceBudgetItems(supabase, created.id, input.budgetItems)
    if (!budgetResult.success) {
      await supabase.from('funding_request').delete().eq('id', created.id)
      return budgetResult
    }

    await writeStatusEvent(supabase, {
      requestId: created.id,
      actorUserId: input.requesterUserId,
      fromStatus: null,
      toStatus: 'draft',
      note: 'Draft created.',
    })

    return { success: true, data: created }
  },

  async saveDraft(
    supabase: SupabaseClient<Database>,
    input: SaveFundingDraftInput
  ): Promise<ServiceResult<FundingRequestRow>> {
    const loaded = await fetchRequestById(supabase, input.requestId)
    if (!loaded.success) return loaded

    if (!['draft', 'changes_requested'].includes(loaded.data.status)) {
      return { success: false, error: 'Only draft or changes-requested funding requests can be edited.' }
    }

    const permission = await requireFundingPermission(supabase, {
      userId: input.requesterUserId,
      chapterId: loaded.data.chapter_id,
      permissionKey: 'chapter.funding.submit',
    })
    if (!permission.success) return permission

    if (input.chapterId !== loaded.data.chapter_id) {
      return { success: false, error: 'Funding request chapter cannot be changed.' }
    }

    const validationError = validateRequestInput(input)
    if (validationError) return { success: false, error: validationError }

    const { data: updated, error } = await supabase
      .from('funding_request')
      .update(mapFundingRequestUpdate(input))
      .eq('id', input.requestId)
      .select('*')
      .single()

    if (error || !updated) {
      logger.error({ context: 'funding/save-draft', error, requestId: input.requestId }, 'Failed to save funding request')
      return { success: false, error: 'Failed to save funding request.' }
    }

    const budgetResult = await replaceBudgetItems(supabase, input.requestId, input.budgetItems)
    if (!budgetResult.success) return budgetResult

    return { success: true, data: updated }
  },

  async submitRequest(
    supabase: SupabaseClient<Database>,
    params: SubmitFundingRequestInput
  ): Promise<ServiceResult<FundingRequestRow>> {
    const detail = await this.getRequestDetail(supabase, {
      actorUserId: params.actorUserId,
      requestId: params.requestId,
    })
    if (!detail.success) return detail

    const request = detail.data.request
    if (!canSubmitFromStatus(request.status as FundingRequestStatus)) {
      return { success: false, error: 'Only draft or changes-requested funding requests can be submitted.' }
    }

    const permission = await requireFundingPermission(supabase, {
      userId: params.actorUserId,
      chapterId: request.chapter_id,
      permissionKey: 'chapter.funding.submit',
    })
    if (!permission.success) return permission

    const validationError = validateRequestInput({
      chapterId: request.chapter_id,
      requesterUserId: request.requester_user_id,
      eventId: request.event_id,
      title: request.title,
      purpose: request.purpose,
      expectedAudience: request.expected_audience,
      expectedAttendeeCount: request.expected_attendee_count,
      requestedAmount: Number(request.requested_amount),
      currency: request.currency as 'PEN' | 'USD',
      eventDate: request.event_date,
      okrKeys: request.okr_keys as FundingOkrKey[],
      pillarKeys: request.pillar_keys as FundingPillarKey[],
      partnerName: request.partner_name,
      partnerDetails: request.partner_details,
      supportingNotes: request.supporting_notes,
      budgetItems: detail.data.budgetItems.map((item) => ({
        label: item.label,
        category: item.category as FundingBudgetCategory,
        amount: Number(item.amount),
        notes: item.notes,
      })),
    })
    if (validationError) return { success: false, error: validationError }

    const now = params.now ?? new Date()
    const isLate = isLessThanFourteenDaysAway(request.event_date, now)
    const update: FundingRequestUpdate = {
      status: 'submitted',
      submitted_at: now.toISOString(),
      is_late_request: isLate,
      updated_at: now.toISOString(),
    }

    const { data: updated, error } = await supabase
      .from('funding_request')
      .update(update)
      .eq('id', params.requestId)
      .select('*')
      .single()

    if (error || !updated) {
      logger.error({ context: 'funding/submit', error, requestId: params.requestId }, 'Failed to submit funding request')
      return { success: false, error: 'Failed to submit funding request.' }
    }

    await writeStatusEvent(supabase, {
      requestId: params.requestId,
      actorUserId: params.actorUserId,
      fromStatus: request.status as FundingRequestStatus,
      toStatus: 'submitted',
      note: isLate ? 'Submitted with late-request warning.' : 'Submitted for review.',
      metadata: { isLateRequest: isLate },
    })

    return { success: true, data: updated }
  },

  async reviewRequest(
    supabase: SupabaseClient<Database>,
    params: ReviewFundingRequestInput
  ): Promise<ServiceResult<FundingRequestRow>> {
    const admin = await isAdmin(supabase, params.actorUserId)
    if (!admin) return { success: false, error: 'Only admins can review funding requests.' }

    const loaded = await fetchRequestById(supabase, params.requestId)
    if (!loaded.success) return loaded

    const request = loaded.data
    if (!canReviewFromStatus(request.status as FundingRequestStatus)) {
      return { success: false, error: 'Only submitted funding requests can be reviewed.' }
    }

    const now = new Date().toISOString()
    const note = normalizeOptionalText(params.note)
    const update: FundingRequestUpdate = {
      reviewed_by_id: params.actorUserId,
      reviewed_at: now,
      admin_decision_note: note,
      updated_at: now,
    }
    let nextStatus: FundingRequestStatus

    if (params.decision === 'approve_full') {
      nextStatus = 'approved'
      update.status = nextStatus
      update.approved_amount = Number(request.requested_amount)
      update.internal_funding_source = params.fundingSource ?? request.internal_funding_source
      update.accountability_due_at = request.event_date
        ? new Date(new Date(`${request.event_date}T00:00:00.000Z`).getTime() + 7 * DAY_IN_MS).toISOString().slice(0, 10)
        : null
    } else if (params.decision === 'approve_partial') {
      const amountError = validateAmount(params.approvedAmount, 'Approved amount')
      if (amountError) return { success: false, error: amountError }
      if (!note) return { success: false, error: 'A note is required for partial approval.' }
      if ((params.approvedAmount ?? 0) > Number(request.requested_amount)) {
        return { success: false, error: 'Approved amount cannot be greater than requested amount.' }
      }
      nextStatus = 'approved'
      update.status = nextStatus
      update.approved_amount = toMoney(params.approvedAmount ?? 0)
      update.internal_funding_source = params.fundingSource ?? request.internal_funding_source
      update.accountability_due_at = new Date(new Date(`${request.event_date}T00:00:00.000Z`).getTime() + 7 * DAY_IN_MS)
        .toISOString()
        .slice(0, 10)
    } else if (params.decision === 'request_changes') {
      if (!note) return { success: false, error: 'A note is required when requesting changes.' }
      nextStatus = 'changes_requested'
      update.status = nextStatus
      update.approved_amount = null
    } else {
      if (!note) return { success: false, error: 'A note is required when rejecting a request.' }
      nextStatus = 'rejected'
      update.status = nextStatus
      update.approved_amount = null
    }

    const { data: updated, error } = await supabase
      .from('funding_request')
      .update(update)
      .eq('id', params.requestId)
      .select('*')
      .single()

    if (error || !updated) {
      logger.error({ context: 'funding/review', error, requestId: params.requestId }, 'Failed to review funding request')
      return { success: false, error: 'Failed to review funding request.' }
    }

    await writeStatusEvent(supabase, {
      requestId: params.requestId,
      actorUserId: params.actorUserId,
      fromStatus: request.status as FundingRequestStatus,
      toStatus: nextStatus,
      note,
      metadata: {
        decision: params.decision,
        approvedAmount: typeof update.approved_amount === 'number' ? update.approved_amount : null,
        fundingSource: update.internal_funding_source ?? null,
      },
    })

    return { success: true, data: updated }
  },

  async setFundingSource(
    supabase: SupabaseClient<Database>,
    params: UpdateFundingSourceInput
  ): Promise<ServiceResult<FundingRequestRow>> {
    const admin = await isAdmin(supabase, params.actorUserId)
    if (!admin) return { success: false, error: 'Only admins can set funding source.' }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('funding_request')
      .update({
        internal_funding_source: params.fundingSource ?? null,
        internal_funding_source_note: normalizeOptionalText(params.fundingSourceNote),
        updated_at: now,
      })
      .eq('id', params.requestId)
      .select('*')
      .single()

    if (error || !data) {
      logger.error({ context: 'funding/source', error, requestId: params.requestId }, 'Failed to set funding source')
      return { success: false, error: 'Failed to set funding source.' }
    }

    return { success: true, data }
  },

  async updateAccountability(
    supabase: SupabaseClient<Database>,
    params: UpdateFundingAccountabilityInput
  ): Promise<ServiceResult<FundingRequestRow>> {
    const loaded = await fetchRequestById(supabase, params.requestId)
    if (!loaded.success) return loaded

    const request = loaded.data
    if (!canUpdateAccountability(request.status as FundingRequestStatus)) {
      return { success: false, error: 'Only approved or receipts-due requests can update accountability.' }
    }

    const permission = await requireFundingPermission(supabase, {
      userId: params.actorUserId,
      chapterId: request.chapter_id,
      permissionKey: 'chapter.funding.submit',
    })
    if (!permission.success) return permission

    if (params.actualSpendAmount != null && params.actualSpendAmount < 0) {
      return { success: false, error: 'Actual spend amount cannot be negative.' }
    }

    const nextStatus: FundingRequestStatus =
      params.markReceiptsDue && request.status === 'approved' ? 'receipts_due' : (request.status as FundingRequestStatus)
    const now = new Date().toISOString()
    const update: FundingRequestUpdate = {
      actual_spend_amount: params.actualSpendAmount == null ? null : toMoney(params.actualSpendAmount),
      accountability_note: normalizeOptionalText(params.accountabilityNote),
      result_summary: normalizeOptionalText(params.resultSummary),
      accountability_submitted_at: now,
      status: nextStatus,
      updated_at: now,
    }

    const { data: updated, error } = await supabase
      .from('funding_request')
      .update(update)
      .eq('id', params.requestId)
      .select('*')
      .single()

    if (error || !updated) {
      logger.error({ context: 'funding/accountability', error, requestId: params.requestId }, 'Failed to update accountability')
      return { success: false, error: 'Failed to update accountability.' }
    }

    if (nextStatus !== request.status) {
      await writeStatusEvent(supabase, {
        requestId: params.requestId,
        actorUserId: params.actorUserId,
        fromStatus: request.status as FundingRequestStatus,
        toStatus: nextStatus,
        note: 'Receipts marked as pending.',
      })
    }

    return { success: true, data: updated }
  },

  async closeRequest(
    supabase: SupabaseClient<Database>,
    params: CloseFundingRequestInput
  ): Promise<ServiceResult<FundingRequestRow>> {
    const loaded = await fetchRequestById(supabase, params.requestId)
    if (!loaded.success) return loaded

    const request = loaded.data
    const admin = await isAdmin(supabase, params.actorUserId)
    if (!admin) {
      const permission = await requireFundingPermission(supabase, {
        userId: params.actorUserId,
        chapterId: request.chapter_id,
        permissionKey: 'chapter.funding.submit',
      })
      if (!permission.success) return permission

      if (!request.actual_spend_amount || !request.accountability_note || !request.result_summary) {
        return { success: false, error: 'Actual spend, accountability note, and result summary are required to close.' }
      }
    }

    if (!['approved', 'receipts_due'].includes(request.status)) {
      return { success: false, error: 'Only approved or receipts-due requests can be closed.' }
    }

    const now = new Date().toISOString()
    const { data: updated, error } = await supabase
      .from('funding_request')
      .update({
        status: 'closed',
        closed_by_id: params.actorUserId,
        closed_at: now,
        closure_note: normalizeOptionalText(params.closureNote),
        updated_at: now,
      })
      .eq('id', params.requestId)
      .select('*')
      .single()

    if (error || !updated) {
      logger.error({ context: 'funding/close', error, requestId: params.requestId }, 'Failed to close funding request')
      return { success: false, error: 'Failed to close funding request.' }
    }

    await writeStatusEvent(supabase, {
      requestId: params.requestId,
      actorUserId: params.actorUserId,
      fromStatus: request.status as FundingRequestStatus,
      toStatus: 'closed',
      note: params.closureNote,
    })

    return { success: true, data: updated }
  },
}

