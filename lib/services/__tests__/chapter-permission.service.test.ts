import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import {
  CHAPTER_PERMISSION_KEYS,
  ChapterPermissionService,
} from '../chapter-permission.service'

type MockFn = ReturnType<typeof vi.fn>
type QueryResult = { data: unknown; error: { message?: string } | null }

type MockBuilder = {
  select: MockFn
  update: MockFn
  insert: MockFn
  eq: MockFn
  match: MockFn
  is: MockFn
  in: MockFn
  maybeSingle: MockFn
  then: MockFn
  _setResult: (value: QueryResult) => void
}

type TableName = 'user' | 'chapter_membership' | 'chapter_permission_grant'

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
    is: vi.fn(() => builder),
    in: vi.fn(() => builder),
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
    chapter_permission_grant: createBuilder({ data: [], error: null }),
  }

  const mockSupabase = {
    from: vi.fn((table: TableName) => tableMocks[table]),
  } as unknown as SupabaseClient<Database>

  return { mockSupabase, tableMocks }
}

describe('ChapterPermissionService', () => {
  describe('role templates', () => {
    it('gives president and vice president the full launch permission set', () => {
      const presidentPermissions = ChapterPermissionService.getTemplatePermissions('president')
      const vicePresidentPermissions = ChapterPermissionService.getTemplatePermissions('vice_president')

      for (const permission of [
        'chapter.dashboard.access',
        'chapter.members.view_approved',
        'chapter.members.view_alumni',
        'chapter.members.view_member_contact',
        'chapter.members.view_applicants',
        'chapter.members.view_rejected',
        'chapter.members.view_inactive',
        'chapter.members.manage_applications',
        'chapter.members.revoke',
        'chapter.roles.assign_eboard',
        'chapter.events.manage',
        'chapter.events.view_registrations',
        'chapter.events.check_in',
        'chapter.events.archive',
      ] as const) {
        expect(presidentPermissions).toContain(permission)
        expect(vicePresidentPermissions).toContain(permission)
      }
    })

    it('keeps chief of staff below president and VP for revoke and e-board assignment', () => {
      const permissions = ChapterPermissionService.getTemplatePermissions('chief_of_staff')

      expect(permissions).toContain('chapter.members.view_applicants')
      expect(permissions).toContain('chapter.members.manage_applications')
      expect(permissions).toContain('chapter.events.archive')
      expect(permissions).not.toContain('chapter.members.revoke')
      expect(permissions).not.toContain('chapter.roles.assign_eboard')
    })

    it('gives regular e-board event and approved-member visibility without applicant powers', () => {
      const permissions = ChapterPermissionService.getTemplatePermissions('director')

      expect(permissions).toEqual([
        'chapter.dashboard.access',
        'chapter.members.view_approved',
        'chapter.members.view_alumni',
        'chapter.members.view_member_contact',
        'chapter.events.manage',
        'chapter.events.view_registrations',
        'chapter.events.check_in',
      ])
      expect(permissions).not.toContain('chapter.members.view_applicants')
      expect(permissions).not.toContain('chapter.members.revoke')
      expect(permissions).not.toContain('chapter.roles.assign_eboard')
    })

    it('does not grant chapter dashboard powers to the plain member template', () => {
      expect(ChapterPermissionService.getTemplatePermissions('member')).toEqual([])
    })
  })

  describe('hasChapterPermission', () => {
    it('allows admin users without requiring chapter membership or grants', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.user._setResult({ data: { id: 'admin-1', role: 'admin' }, error: null })

      const result = await ChapterPermissionService.hasChapterPermission(mockSupabase, {
        userId: 'admin-1',
        chapterId: 'leaduni',
        permissionKey: 'chapter.dashboard.access',
      })

      expect(result).toBe(true)
      expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
      expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_permission_grant')
    })

    it('denies recruiters even when a chapter permission key is requested', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.user._setResult({ data: { id: 'recruiter-1', role: 'recruiter' }, error: null })

      const result = await ChapterPermissionService.hasChapterPermission(mockSupabase, {
        userId: 'recruiter-1',
        chapterId: 'leaduni',
        permissionKey: 'chapter.dashboard.access',
      })

      expect(result).toBe(false)
      expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_permission_grant')
    })

    it('allows approved members with an active same-chapter grant', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.user._setResult({ data: { id: 'leader-1', role: 'member' }, error: null })
      tableMocks.chapter_membership._setResult({ data: { user_id: 'leader-1' }, error: null })
      tableMocks.chapter_permission_grant._setResult({
        data: { permission_key: 'chapter.dashboard.access' },
        error: null,
      })

      const result = await ChapterPermissionService.hasChapterPermission(mockSupabase, {
        userId: 'leader-1',
        chapterId: 'leaduni',
        permissionKey: 'chapter.dashboard.access',
      })

      expect(result).toBe(true)
      expect(tableMocks.chapter_membership.match).toHaveBeenCalledWith({
        user_id: 'leader-1',
        chapter_id: 'leaduni',
        status: 'approved',
      })
      expect(tableMocks.chapter_permission_grant.match).toHaveBeenCalledWith({
        user_id: 'leader-1',
        chapter_id: 'leaduni',
        permission_key: 'chapter.dashboard.access',
      })
      expect(tableMocks.chapter_permission_grant.is).toHaveBeenCalledWith('revoked_at', null)
    })

    it('denies approved members without an active grant', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.user._setResult({ data: { id: 'member-1', role: 'member' }, error: null })
      tableMocks.chapter_membership._setResult({ data: { user_id: 'member-1' }, error: null })
      tableMocks.chapter_permission_grant._setResult({ data: null, error: null })

      const result = await ChapterPermissionService.hasChapterPermission(mockSupabase, {
        userId: 'member-1',
        chapterId: 'leaduni',
        permissionKey: 'chapter.dashboard.access',
      })

      expect(result).toBe(false)
    })

    it('denies users without approved same-chapter membership before checking grants', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.user._setResult({ data: { id: 'member-1', role: 'member' }, error: null })
      tableMocks.chapter_membership._setResult({ data: null, error: null })

      const result = await ChapterPermissionService.hasChapterPermission(mockSupabase, {
        userId: 'member-1',
        chapterId: 'leaduni',
        permissionKey: 'chapter.dashboard.access',
      })

      expect(result).toBe(false)
      expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_permission_grant')
    })
  })

  describe('getChapterPermissionSet', () => {
    it('returns all known permissions for admins', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.user._setResult({ data: { id: 'admin-1', role: 'admin' }, error: null })

      const result = await ChapterPermissionService.getChapterPermissionSet(mockSupabase, {
        userId: 'admin-1',
        chapterId: 'leaduni',
      })

      expect(result).toEqual([...CHAPTER_PERMISSION_KEYS])
    })

    it('returns only active valid grant keys for approved members', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.user._setResult({ data: { id: 'leader-1', role: 'member' }, error: null })
      tableMocks.chapter_membership._setResult({ data: { user_id: 'leader-1' }, error: null })
      tableMocks.chapter_permission_grant._setResult({
        data: [
          { permission_key: 'chapter.dashboard.access' },
          { permission_key: 'chapter.dashboard.access' },
          { permission_key: 'not.real' },
          { permission_key: 'chapter.events.check_in' },
        ],
        error: null,
      })

      const result = await ChapterPermissionService.getChapterPermissionSet(mockSupabase, {
        userId: 'leader-1',
        chapterId: 'leaduni',
      })

      expect(result).toEqual(['chapter.dashboard.access', 'chapter.events.check_in'])
    })
  })

  describe('grantRoleTemplatePermissions', () => {
    it('creates only missing active grants for a role template', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_permission_grant._setResult({
        data: [{ permission_key: 'chapter.dashboard.access' }],
        error: null,
      })
      tableMocks.chapter_permission_grant._setResult({ data: null, error: null })

      const result = await ChapterPermissionService.grantRoleTemplatePermissions(mockSupabase, {
        userId: 'leader-1',
        chapterId: 'leaduni',
        roleLevel: 'director',
        grantedById: 'admin-1',
        sourceRoleAssignmentId: 'assignment-1',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.grantedPermissions).not.toContain('chapter.dashboard.access')
        expect(result.grantedPermissions).toContain('chapter.events.check_in')
      }

      expect(tableMocks.chapter_permission_grant.in).toHaveBeenCalledWith(
        'permission_key',
        ChapterPermissionService.getTemplatePermissions('director')
      )
      expect(tableMocks.chapter_permission_grant.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'leader-1',
            chapter_id: 'leaduni',
            permission_key: 'chapter.events.check_in',
            source: 'role_template',
            source_role_assignment_id: 'assignment-1',
            granted_by_id: 'admin-1',
          }),
        ])
      )
    })

    it('is idempotent when every template grant is already active', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_permission_grant._setResult({
        data: ChapterPermissionService
          .getTemplatePermissions('director')
          .map((permission_key) => ({ permission_key })),
        error: null,
      })

      const result = await ChapterPermissionService.grantRoleTemplatePermissions(mockSupabase, {
        userId: 'leader-1',
        chapterId: 'leaduni',
        roleLevel: 'director',
      })

      expect(result).toEqual({ success: true, grantedPermissions: [] })
      expect(tableMocks.chapter_permission_grant.insert).not.toHaveBeenCalled()
    })
  })

  describe('revokeChapterPermissions', () => {
    it('requires a revoke reason', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      const result = await ChapterPermissionService.revokeChapterPermissions(mockSupabase, {
        userId: 'leader-1',
        chapterId: 'leaduni',
        revokedById: 'admin-1',
        revokeReason: ' ',
        permissionKeys: ['chapter.dashboard.access'],
      })

      expect(result).toEqual({ success: false, error: 'A revoke reason is required.' })
      expect(tableMocks.chapter_permission_grant.update).not.toHaveBeenCalled()
    })

    it('revokes active grants by permission keys and source assignment', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_permission_grant._setResult({ data: null, error: null })

      const result = await ChapterPermissionService.revokeChapterPermissions(mockSupabase, {
        userId: 'leader-1',
        chapterId: 'leaduni',
        revokedById: 'president-1',
        revokeReason: 'Role assignment ended',
        permissionKeys: ['chapter.dashboard.access', 'chapter.events.manage'],
        sourceRoleAssignmentId: 'assignment-1',
      })

      expect(result).toEqual({ success: true })
      expect(tableMocks.chapter_permission_grant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          revoked_by_id: 'president-1',
          revoke_reason: 'Role assignment ended',
        })
      )
      expect(tableMocks.chapter_permission_grant.match).toHaveBeenCalledWith({
        user_id: 'leader-1',
        chapter_id: 'leaduni',
      })
      expect(tableMocks.chapter_permission_grant.is).toHaveBeenCalledWith('revoked_at', null)
      expect(tableMocks.chapter_permission_grant.in).toHaveBeenCalledWith('permission_key', [
        'chapter.dashboard.access',
        'chapter.events.manage',
      ])
      expect(tableMocks.chapter_permission_grant.eq).toHaveBeenCalledWith(
        'source_role_assignment_id',
        'assignment-1'
      )
    })
  })
})
