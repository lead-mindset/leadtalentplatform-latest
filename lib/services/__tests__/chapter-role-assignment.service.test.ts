import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { ChapterRoleAssignmentService } from '../chapter-role-assignment.service'

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    hasChapterPermission: vi.fn(),
    grantRoleTemplatePermissions: vi.fn(),
    revokeChapterPermissions: vi.fn(),
  },
}))

type MockFn = ReturnType<typeof vi.fn>
type QueryResult = { data: unknown; error: { message?: string } | null }

type MockBuilder = {
  select: MockFn
  update: MockFn
  insert: MockFn
  eq: MockFn
  match: MockFn
  single: MockFn
  maybeSingle: MockFn
  then: MockFn
  _setResult: (value: QueryResult) => void
}

type TableName = 'user' | 'chapter_membership' | 'chapter_role_assignment' | 'chapter_audit_log'

function createBuilder(defaultValue: QueryResult = { data: null, error: null }): MockBuilder {
  const valueQueue: QueryResult[] = []
  let fallback = defaultValue

  const shiftValue = () => {
    if (valueQueue.length > 0) {
      return valueQueue.shift() ?? fallback
    }
    return fallback
  }

  const builder = {
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    match: vi.fn(() => builder),
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
    chapter_membership: createBuilder(),
    chapter_role_assignment: createBuilder(),
    chapter_audit_log: createBuilder(),
  }

  const mockSupabase = {
    from: vi.fn((table: TableName) => tableMocks[table]),
  } as unknown as SupabaseClient<Database>

  return { mockSupabase, tableMocks }
}

describe('ChapterRoleAssignmentService', () => {
  beforeEach(() => {
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockReset()
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(false)
    vi.mocked(ChapterPermissionService.grantRoleTemplatePermissions).mockReset()
    vi.mocked(ChapterPermissionService.grantRoleTemplatePermissions).mockResolvedValue({
      success: true,
      grantedPermissions: ['chapter.dashboard.access'],
    })
    vi.mocked(ChapterPermissionService.revokeChapterPermissions).mockReset()
    vi.mocked(ChapterPermissionService.revokeChapterPermissions).mockResolvedValue({ success: true })
  })

  it('allows admin to assign president and grants template permissions', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'admin-1', role: 'admin' }, error: null })
    tableMocks.chapter_membership._setResult({ data: { user_id: 'leader-1' }, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: { id: 'role-1' }, error: null })

    const result = await ChapterRoleAssignmentService.assignChapterRole(mockSupabase, {
      actorUserId: 'admin-1',
      targetUserId: 'leader-1',
      chapterId: 'leaduni',
      roleLevel: 'president',
      functionalArea: 'general_leadership',
      displayTitle: 'Presidenta',
    })

    expect(result).toEqual({
      success: true,
      roleAssignmentId: 'role-1',
      grantedPermissions: ['chapter.dashboard.access'],
    })
    expect(tableMocks.chapter_role_assignment.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'leader-1',
        chapter_id: 'leaduni',
        role_level: 'president',
        functional_area: 'general_leadership',
        display_title: 'Presidenta',
        source: 'manual_admin',
        is_primary: true,
        status: 'active',
      })
    )
    expect(ChapterPermissionService.grantRoleTemplatePermissions).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({
        userId: 'leader-1',
        chapterId: 'leaduni',
        roleLevel: 'president',
        grantedById: 'admin-1',
        sourceRoleAssignmentId: 'role-1',
      })
    )
    expect(tableMocks.chapter_audit_log.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'chapter.role.assigned',
        actor_user_id: 'admin-1',
        target_user_id: 'leader-1',
        chapter_id: 'leaduni',
        entity_type: 'chapter_role_assignment',
        entity_id: 'role-1',
        metadata: expect.objectContaining({
          role_level: 'president',
          functional_area: 'general_leadership',
          display_title: 'Presidenta',
          source: 'manual_admin',
        }),
      })
    )
  })

  it('allows president or VP-capable users to assign regular e-board roles', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'president-1', role: 'member' }, error: null })
    tableMocks.chapter_membership._setResult({ data: { user_id: 'member-1' }, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: { id: 'role-1' }, error: null })
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(true)

    const result = await ChapterRoleAssignmentService.assignChapterRole(mockSupabase, {
      actorUserId: 'president-1',
      targetUserId: 'member-1',
      chapterId: 'leaduni',
      roleLevel: 'director',
      functionalArea: 'marketing_communications',
      displayTitle: 'Directora de Marketing',
      rawTitle: 'Marketing',
    })

    expect(result).toEqual(expect.objectContaining({ success: true, roleAssignmentId: 'role-1' }))
    expect(ChapterPermissionService.hasChapterPermission).toHaveBeenCalledWith(mockSupabase, {
      userId: 'president-1',
      chapterId: 'leaduni',
      permissionKey: 'chapter.roles.assign_eboard',
    })
    expect(tableMocks.chapter_role_assignment.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        role_level: 'director',
        functional_area: 'marketing_communications',
        display_title: 'Directora de Marketing',
        raw_title: 'Marketing',
        source: 'manual',
      })
    )
    expect(tableMocks.chapter_audit_log.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'chapter.role.assigned',
        actor_user_id: 'president-1',
        target_user_id: 'member-1',
        entity_id: 'role-1',
        metadata: expect.objectContaining({
          role_level: 'director',
          raw_title: 'Marketing',
          source: 'manual',
        }),
      })
    )
  })

  it('rejects president or VP assignment by non-admin users', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'president-1', role: 'member' }, error: null })

    const result = await ChapterRoleAssignmentService.assignChapterRole(mockSupabase, {
      actorUserId: 'president-1',
      targetUserId: 'member-1',
      chapterId: 'leaduni',
      roleLevel: 'vice_president',
      functionalArea: 'general_leadership',
      displayTitle: 'Vicepresidente',
    })

    expect(result).toEqual({
      success: false,
      error: 'Only admins can assign president or vice president roles.',
    })
    expect(ChapterPermissionService.hasChapterPermission).not.toHaveBeenCalled()
    expect(tableMocks.chapter_role_assignment.insert).not.toHaveBeenCalled()
  })

  it('rejects regular e-board assignment without same-chapter assign permission', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'member-1', role: 'member' }, error: null })
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(false)

    const result = await ChapterRoleAssignmentService.assignChapterRole(mockSupabase, {
      actorUserId: 'member-1',
      targetUserId: 'target-1',
      chapterId: 'leaduni',
      roleLevel: 'coordinator',
      functionalArea: 'events_experience',
      displayTitle: 'Coordinador de Eventos',
    })

    expect(result).toEqual({
      success: false,
      error: 'You do not have permission to assign e-board roles for this chapter.',
    })
    expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
    expect(tableMocks.chapter_role_assignment.insert).not.toHaveBeenCalled()
  })

  it('rejects assignment when target user is not an approved same-chapter member', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'admin-1', role: 'admin' }, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })

    const result = await ChapterRoleAssignmentService.assignChapterRole(mockSupabase, {
      actorUserId: 'admin-1',
      targetUserId: 'target-1',
      chapterId: 'leaduni',
      roleLevel: 'director',
      functionalArea: 'events_experience',
      displayTitle: 'Coordinador de Eventos',
    })

    expect(result).toEqual({
      success: false,
      error: 'Target user must be an approved member of this chapter.',
    })
    expect(tableMocks.chapter_membership.match).toHaveBeenCalledWith({
      user_id: 'target-1',
      chapter_id: 'leaduni',
      status: 'approved',
    })
    expect(tableMocks.chapter_role_assignment.insert).not.toHaveBeenCalled()
  })

  it('deactivates an existing active primary role before inserting a new one', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'admin-1', role: 'admin' }, error: null })
    tableMocks.chapter_membership._setResult({ data: { user_id: 'target-1' }, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: { id: 'old-role', role_level: 'director' }, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: { id: 'new-role' }, error: null })

    const result = await ChapterRoleAssignmentService.assignChapterRole(mockSupabase, {
      actorUserId: 'admin-1',
      targetUserId: 'target-1',
      chapterId: 'leaduni',
      roleLevel: 'chief_of_staff',
      functionalArea: 'strategy_operations',
      displayTitle: 'Chief of Staff',
    })

    expect(result).toEqual(expect.objectContaining({ success: true, roleAssignmentId: 'new-role' }))
    expect(tableMocks.chapter_role_assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'inactive',
      })
    )
    expect(tableMocks.chapter_role_assignment.eq).toHaveBeenCalledWith('id', 'old-role')
  })

  it('deactivates a regular role and revokes permissions without touching membership', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_role_assignment._setResult({
      data: {
        id: 'role-1',
        user_id: 'member-1',
        chapter_id: 'leaduni',
        role_level: 'director',
        status: 'active',
      },
      error: null,
    })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.user._setResult({ data: { id: 'president-1', role: 'member' }, error: null })
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(true)

    const result = await ChapterRoleAssignmentService.deactivateChapterRole(mockSupabase, {
      actorUserId: 'president-1',
      roleAssignmentId: 'role-1',
      revokeReason: 'No longer on e-board',
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.chapter_role_assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'inactive' })
    )
    expect(ChapterPermissionService.revokeChapterPermissions).toHaveBeenCalledWith(mockSupabase, {
      userId: 'member-1',
      chapterId: 'leaduni',
      revokedById: 'president-1',
      revokeReason: 'No longer on e-board',
      sourceRoleAssignmentId: 'role-1',
    })
    expect(tableMocks.chapter_audit_log.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'chapter.role.deactivated',
        actor_user_id: 'president-1',
        target_user_id: 'member-1',
        entity_id: 'role-1',
        metadata: expect.objectContaining({
          role_level: 'director',
          reason: 'No longer on e-board',
        }),
      })
    )
    expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
  })

  it('rejects non-admin deactivation of protected president or VP roles', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_role_assignment._setResult({
      data: {
        id: 'role-1',
        user_id: 'leader-1',
        chapter_id: 'leaduni',
        role_level: 'president',
        status: 'active',
      },
      error: null,
    })
    tableMocks.user._setResult({ data: { id: 'vp-1', role: 'member' }, error: null })

    const result = await ChapterRoleAssignmentService.deactivateChapterRole(mockSupabase, {
      actorUserId: 'vp-1',
      roleAssignmentId: 'role-1',
      revokeReason: 'Trying to correct launch data',
    })

    expect(result).toEqual({
      success: false,
      error: 'Only admins can deactivate president or vice president roles.',
    })
    expect(tableMocks.chapter_role_assignment.update).not.toHaveBeenCalled()
    expect(ChapterPermissionService.revokeChapterPermissions).not.toHaveBeenCalled()
  })

  it('requires a revoke reason before deactivation', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    const result = await ChapterRoleAssignmentService.deactivateChapterRole(mockSupabase, {
      actorUserId: 'admin-1',
      roleAssignmentId: 'role-1',
      revokeReason: ' ',
    })

    expect(result).toEqual({ success: false, error: 'A revoke reason is required.' })
    expect(tableMocks.chapter_role_assignment.select).not.toHaveBeenCalled()
  })
})
