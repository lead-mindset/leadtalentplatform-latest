import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { FundingService, type FundingRequestRow } from '../funding.service'

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    requireChapterPermission: vi.fn(),
  },
}))

type MockFn = ReturnType<typeof vi.fn>
type QueryResult = { data: unknown; error: { message?: string } | null }

type MockBuilder = {
  select: MockFn
  insert: MockFn
  update: MockFn
  delete: MockFn
  eq: MockFn
  in: MockFn
  order: MockFn
  single: MockFn
  maybeSingle: MockFn
  then: MockFn
  _setResult: (value: QueryResult) => void
}

type StorageMock = {
  upload: MockFn
  remove: MockFn
  createSignedUrl: MockFn
}

type TableName =
  | 'user'
  | 'chapter'
  | 'funding_request'
  | 'funding_request_budget_item'
  | 'funding_request_file'
  | 'funding_request_status_event'

function createBuilder(defaultValue: QueryResult = { data: null, error: null }): MockBuilder {
  const valueQueue: QueryResult[] = []
  let fallback = defaultValue

  const shiftValue = () => {
    if (valueQueue.length > 0) return valueQueue.shift() ?? fallback
    return fallback
  }

  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(shiftValue())),
    maybeSingle: vi.fn(() => Promise.resolve(shiftValue())),
    then: vi.fn((resolve: (value: QueryResult) => unknown) => resolve(shiftValue())),
    _setResult: (value: QueryResult) => {
      valueQueue.push(value)
      fallback = value
    },
  }

  return builder
}

function buildMockSupabase() {
  const tableMocks: Record<TableName, MockBuilder> = {
    user: createBuilder(),
    chapter: createBuilder({ data: [], error: null }),
    funding_request: createBuilder(),
    funding_request_budget_item: createBuilder(),
    funding_request_file: createBuilder({ data: [], error: null }),
    funding_request_status_event: createBuilder({ data: [], error: null }),
  }
  const storageMocks: Record<string, StorageMock> = {
    'funding-files': {
      upload: vi.fn(() => Promise.resolve({ error: null })),
      remove: vi.fn(() => Promise.resolve({ error: null })),
      createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://signed.example/file' }, error: null })),
    },
  }

  const mockSupabase = {
    from: vi.fn((table: TableName) => tableMocks[table]),
    storage: {
      from: vi.fn((bucket: string) => storageMocks[bucket]),
    },
  } as unknown as SupabaseClient<Database>

  return { mockSupabase, tableMocks, storageMocks }
}

function buildRequest(overrides: Partial<FundingRequestRow> = {}): FundingRequestRow {
  return {
    id: 'f1000000-0000-4000-8000-000000000001',
    chapter_id: 'leaduni',
    requester_user_id: 'president-1',
    event_id: null,
    title: 'Materiales para taller',
    purpose: 'Fortalecer liderazgo en nuevos miembros.',
    expected_audience: 'Miembros nuevos',
    expected_attendee_count: 40,
    requested_amount: 300,
    approved_amount: null,
    actual_spend_amount: null,
    currency: 'PEN',
    status: 'draft',
    okr_keys: ['unite', 'empower'],
    pillar_keys: ['leadership_development'],
    partner_name: null,
    partner_details: null,
    supporting_notes: null,
    event_date: '2026-06-15',
    is_late_request: false,
    submitted_at: null,
    reviewed_by_id: null,
    reviewed_at: null,
    admin_decision_note: null,
    internal_funding_source: null,
    internal_funding_source_note: null,
    accountability_due_at: null,
    accountability_submitted_at: null,
    accountability_note: null,
    result_summary: null,
    closed_by_id: null,
    closed_at: null,
    closure_note: null,
    created_at: '2026-05-25T00:00:00.000Z',
    updated_at: '2026-05-25T00:00:00.000Z',
    ...overrides,
  }
}

const validInput = {
  chapterId: 'leaduni',
  requesterUserId: 'president-1',
  title: 'Materiales para taller',
  purpose: 'Fortalecer liderazgo en nuevos miembros.',
  expectedAudience: 'Miembros nuevos',
  expectedAttendeeCount: 40,
  requestedAmount: 300,
  currency: 'PEN' as const,
  eventDate: '2026-06-15',
  okrKeys: ['unite', 'empower'] as const,
  pillarKeys: ['leadership_development'] as const,
  budgetItems: [
    { label: 'Materiales', category: 'event_materials' as const, amount: 200 },
    { label: 'Snacks', category: 'food_refreshments' as const, amount: 100 },
  ],
}

describe('FundingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ChapterPermissionService.requireChapterPermission).mockResolvedValue({ success: true })
  })

  it('rejects chapter draft creation without submit permission', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'president-1', role: 'member' }, error: null })
    vi.mocked(ChapterPermissionService.requireChapterPermission).mockResolvedValue({
      success: false,
      error: 'No permission.',
    })

    const result = await FundingService.createDraft(mockSupabase, validInput)

    expect(result).toEqual({ success: false, error: 'No permission.' })
    expect(ChapterPermissionService.requireChapterPermission).toHaveBeenCalledWith(mockSupabase, {
      userId: 'president-1',
      chapterId: 'leaduni',
      permissionKey: 'chapter.funding.submit',
    })
    expect(tableMocks.funding_request.insert).not.toHaveBeenCalled()
  })

  it('creates a draft funding request with itemized budget and status event', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    const created = buildRequest()
    tableMocks.user._setResult({ data: { id: 'president-1', role: 'member' }, error: null })
    tableMocks.funding_request._setResult({ data: created, error: null })
    tableMocks.funding_request_budget_item._setResult({ data: null, error: null })
    tableMocks.funding_request_budget_item._setResult({ data: null, error: null })
    tableMocks.funding_request_status_event._setResult({ data: null, error: null })

    const result = await FundingService.createDraft(mockSupabase, validInput)

    expect(result).toEqual({ success: true, data: created })
    expect(tableMocks.funding_request.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        chapter_id: 'leaduni',
        requester_user_id: 'president-1',
        title: 'Materiales para taller',
        requested_amount: 300,
        status: 'draft',
        okr_keys: ['unite', 'empower'],
      })
    )
    expect(tableMocks.funding_request_budget_item.insert).toHaveBeenCalledWith([
      expect.objectContaining({ label: 'Materiales', amount: 200, sort_order: 1 }),
      expect.objectContaining({ label: 'Snacks', amount: 100, sort_order: 2 }),
    ])
    expect(tableMocks.funding_request_status_event.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        funding_request_id: created.id,
        from_status: null,
        to_status: 'draft',
      })
    )
  })

  it('rejects submit when budget items no longer match requested amount', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    const request = buildRequest({ status: 'draft', requested_amount: 300 })
    tableMocks.user._setResult({ data: { id: 'president-1', role: 'member' }, error: null })
    tableMocks.funding_request._setResult({ data: request, error: null })
    tableMocks.funding_request_budget_item._setResult({
      data: [{ id: 'item-1', funding_request_id: request.id, label: 'Only one', category: 'event_materials', amount: 100, notes: null, sort_order: 1 }],
      error: null,
    })

    const result = await FundingService.submitRequest(mockSupabase, {
      actorUserId: 'president-1',
      requestId: request.id,
      now: new Date('2026-06-01T00:00:00.000Z'),
    })

    expect(result).toEqual({
      success: false,
      error: 'Budget item total must match the requested amount.',
    })
    expect(tableMocks.funding_request.update).not.toHaveBeenCalled()
  })

  it('submits eligible requests and computes late-request warning', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    const request = buildRequest({ status: 'draft', event_date: '2026-06-10' })
    const updated = buildRequest({ status: 'submitted', event_date: '2026-06-10', is_late_request: true })
    tableMocks.user._setResult({ data: { id: 'president-1', role: 'member' }, error: null })
    tableMocks.funding_request._setResult({ data: request, error: null })
    tableMocks.funding_request_budget_item._setResult({
      data: [
        { id: 'item-1', funding_request_id: request.id, label: 'Materiales', category: 'event_materials', amount: 300, notes: null, sort_order: 1 },
      ],
      error: null,
    })
    tableMocks.funding_request._setResult({ data: updated, error: null })

    const result = await FundingService.submitRequest(mockSupabase, {
      actorUserId: 'president-1',
      requestId: request.id,
      now: new Date('2026-06-01T00:00:00.000Z'),
    })

    expect(result).toEqual({ success: true, data: updated })
    expect(tableMocks.funding_request.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'submitted',
        is_late_request: true,
      })
    )
    expect(tableMocks.funding_request_status_event.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        from_status: 'draft',
        to_status: 'submitted',
        metadata: { isLateRequest: true },
      })
    )
  })

  it('loads admin request context with chapter, requester, and budget rows', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    const request = buildRequest({ status: 'submitted' })
    const budgetItem = {
      id: 'item-1',
      funding_request_id: request.id,
      label: 'Materiales',
      category: 'event_materials',
      amount: 300,
      notes: null,
      sort_order: 1,
    }
    tableMocks.user._setResult({ data: { id: 'admin-1', role: 'admin' }, error: null })
    tableMocks.user._setResult({
      data: [{ id: 'president-1', name: 'Test President', email: 'president@test.com' }],
      error: null,
    })
    tableMocks.funding_request._setResult({ data: [request], error: null })
    tableMocks.funding_request_budget_item._setResult({ data: [budgetItem], error: null })
    tableMocks.chapter._setResult({
      data: [{ id: 'leaduni', name: 'LEAD UNI', university: 'Universidad Nacional de Ingenieria' }],
      error: null,
    })

    const result = await FundingService.listAdminRequestContexts(mockSupabase, {
      actorUserId: 'admin-1',
      status: 'submitted',
    })

    expect(result).toEqual({
      success: true,
      data: [
        {
          request,
          budgetItems: [budgetItem],
          chapter: { id: 'leaduni', name: 'LEAD UNI', university: 'Universidad Nacional de Ingenieria' },
          requester: { id: 'president-1', name: 'Test President', email: 'president@test.com' },
        },
      ],
    })
    expect(tableMocks.funding_request.eq).toHaveBeenCalledWith('status', 'submitted')
    expect(tableMocks.funding_request_budget_item.in).toHaveBeenCalledWith('funding_request_id', [request.id])
    expect(tableMocks.chapter.in).toHaveBeenCalledWith('id', ['leaduni'])
    expect(tableMocks.user.in).toHaveBeenCalledWith('id', ['president-1'])
  })

  it('uploads funding files only after submit permission and writes metadata', async () => {
    const { mockSupabase, tableMocks, storageMocks } = buildMockSupabase()
    const request = buildRequest({ status: 'approved' })
    const file = new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' })
    const fileRow = {
      id: 'file-1',
      funding_request_id: request.id,
      chapter_id: request.chapter_id,
      uploaded_by_id: 'president-1',
      file_type: 'receipt',
      storage_bucket: 'funding-files',
      storage_path: `${request.id}/receipt.pdf`,
      external_url: null,
      original_name: 'receipt.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: file.size,
      notes: 'Boleta',
      created_at: '2026-05-25T00:00:00.000Z',
    }
    tableMocks.funding_request._setResult({ data: request, error: null })
    tableMocks.funding_request_file._setResult({ data: fileRow, error: null })

    const result = await FundingService.uploadFundingFile(mockSupabase, {
      actorUserId: 'president-1',
      requestId: request.id,
      fileType: 'receipt',
      file,
      notes: 'Boleta',
    })

    expect(result).toEqual({ success: true, data: fileRow })
    expect(ChapterPermissionService.requireChapterPermission).toHaveBeenCalledWith(mockSupabase, {
      userId: 'president-1',
      chapterId: 'leaduni',
      permissionKey: 'chapter.funding.submit',
    })
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('funding-files')
    expect(storageMocks['funding-files'].upload).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^${request.id}/`)),
      file,
      expect.objectContaining({ contentType: 'application/pdf', upsert: false })
    )
    expect(tableMocks.funding_request_file.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        funding_request_id: request.id,
        chapter_id: 'leaduni',
        file_type: 'receipt',
        original_name: 'receipt.pdf',
        notes: 'Boleta',
      })
    )
  })

  it('does not sign funding files when the viewer lacks chapter access', async () => {
    const { mockSupabase, tableMocks, storageMocks } = buildMockSupabase()
    vi.mocked(ChapterPermissionService.requireChapterPermission).mockResolvedValue({
      success: false,
      error: 'No permission.',
    })
    tableMocks.funding_request_file._setResult({
      data: {
        id: 'file-1',
        funding_request_id: 'request-1',
        chapter_id: 'leaduni',
        uploaded_by_id: 'president-1',
        file_type: 'receipt',
        storage_bucket: 'funding-files',
        storage_path: 'request-1/file.pdf',
        external_url: null,
        original_name: 'file.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 120,
        notes: null,
        created_at: '2026-05-25T00:00:00.000Z',
      },
      error: null,
    })

    const result = await FundingService.createFundingFileAccessUrl(mockSupabase, {
      actorUserId: 'other-member',
      fileId: 'file-1',
    })

    expect(result).toEqual({ success: false, error: 'No permission.' })
    expect(storageMocks['funding-files'].createSignedUrl).not.toHaveBeenCalled()
  })

  it('rejects admin review by non-admin users', async () => {
    const { mockSupabase } = buildMockSupabase()
    mockSupabase.from('user').select().eq().maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: 'member-1', role: 'member' }, error: null })

    const result = await FundingService.reviewRequest(mockSupabase, {
      actorUserId: 'member-1',
      requestId: 'request-1',
      decision: 'approve_full',
    })

    expect(result).toEqual({ success: false, error: 'Only admins can review funding requests.' })
  })

  it('requires note for partial approval', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'admin-1', role: 'admin' }, error: null })
    tableMocks.funding_request._setResult({ data: buildRequest({ status: 'submitted' }), error: null })

    const result = await FundingService.reviewRequest(mockSupabase, {
      actorUserId: 'admin-1',
      requestId: 'request-1',
      decision: 'approve_partial',
      approvedAmount: 200,
    })

    expect(result).toEqual({ success: false, error: 'A note is required for partial approval.' })
    expect(tableMocks.funding_request.update).not.toHaveBeenCalled()
  })

  it('allows admin to approve partial amount with funding source', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    const request = buildRequest({ status: 'submitted', requested_amount: 300 })
    const updated = buildRequest({
      status: 'approved',
      requested_amount: 300,
      approved_amount: 200,
      internal_funding_source: 'lead_peru_chapter_budget',
    })
    tableMocks.user._setResult({ data: { id: 'admin-1', role: 'admin' }, error: null })
    tableMocks.funding_request._setResult({ data: request, error: null })
    tableMocks.funding_request._setResult({ data: updated, error: null })

    const result = await FundingService.reviewRequest(mockSupabase, {
      actorUserId: 'admin-1',
      requestId: request.id,
      decision: 'approve_partial',
      approvedAmount: 200,
      note: 'Aprobado parcialmente.',
      fundingSource: 'lead_peru_chapter_budget',
    })

    expect(result).toEqual({ success: true, data: updated })
    expect(tableMocks.funding_request.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved',
        approved_amount: 200,
        admin_decision_note: 'Aprobado parcialmente.',
        internal_funding_source: 'lead_peru_chapter_budget',
      })
    )
    expect(tableMocks.funding_request_status_event.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        from_status: 'submitted',
        to_status: 'approved',
        metadata: expect.objectContaining({
          decision: 'approve_partial',
          approvedAmount: 200,
        }),
      })
    )
  })

  it('keeps accountability updates limited to approved or receipts-due requests', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.funding_request._setResult({ data: buildRequest({ status: 'submitted' }), error: null })

    const result = await FundingService.updateAccountability(mockSupabase, {
      actorUserId: 'president-1',
      requestId: 'request-1',
      actualSpendAmount: 150,
    })

    expect(result).toEqual({
      success: false,
      error: 'Only approved or receipts-due requests can update accountability.',
    })
    expect(tableMocks.funding_request.update).not.toHaveBeenCalled()
  })
})
