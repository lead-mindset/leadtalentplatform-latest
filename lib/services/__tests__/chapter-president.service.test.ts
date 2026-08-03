import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { onboardPresident } from '../chapter-president.service'
import { LeadIdentityService } from '@/lib/services/lead-identity.service'

vi.mock('@/lib/services/lead-identity.service', () => ({
  LeadIdentityService: {
    issueChapterEditorIdentity: vi.fn(),
  },
}))

const mockSupabase = {} as unknown as SupabaseClient<Database>

describe('onboardPresident', () => {
  beforeEach(() => {
    vi.mocked(LeadIdentityService.issueChapterEditorIdentity).mockReset()
  })

  it('issues chapter editor identity', async () => {
    vi.mocked(LeadIdentityService.issueChapterEditorIdentity).mockResolvedValue({
      success: true,
      identity: {
        id: 'identity-1',
        user_id: 'user-1',
        identity_type: 'chapter_editor',
        chapter_id: 'leaduni',
        issued_by_id: 'admin-1',
        issued_at: '2026-07-01T00:00:00.000Z',
        is_primary: true,
        status: 'active',
        revoked_at: null,
        updated_at: '2026-07-01T00:00:00.000Z',
      },
    })

    const result = await onboardPresident(mockSupabase, {
      userId: 'user-1',
      chapterId: 'leaduni',
      grantedById: 'admin-1',
    })

    expect(result).toEqual({ success: true })
    expect(LeadIdentityService.issueChapterEditorIdentity).toHaveBeenCalledWith(
      mockSupabase,
      {
        userId: 'user-1',
        chapterId: 'leaduni',
        issuedById: 'admin-1',
        makePrimary: true,
      }
    )
  })

  it('fails if issueChapterEditorIdentity fails', async () => {
    vi.mocked(LeadIdentityService.issueChapterEditorIdentity).mockResolvedValue({
      success: false,
      error: 'Approved chapter membership is required before issuing this identity.',
    })

    const result = await onboardPresident(mockSupabase, {
      userId: 'user-1',
      chapterId: 'leaduni',
      grantedById: 'admin-1',
    })

    expect(result).toEqual({
      success: false,
      error: 'Approved chapter membership is required before issuing this identity.',
    })
  })

  it('works without grantedById', async () => {
    vi.mocked(LeadIdentityService.issueChapterEditorIdentity).mockResolvedValue({
      success: true,
      identity: {
        id: 'identity-1',
        user_id: 'user-1',
        identity_type: 'chapter_editor',
        chapter_id: 'leaduni',
        issued_by_id: null,
        issued_at: '2026-07-01T00:00:00.000Z',
        is_primary: true,
        status: 'active',
        revoked_at: null,
        updated_at: '2026-07-01T00:00:00.000Z',
      },
    })

    const result = await onboardPresident(mockSupabase, {
      userId: 'user-1',
      chapterId: 'leaduni',
    })

    expect(result).toEqual({ success: true })
    expect(LeadIdentityService.issueChapterEditorIdentity).toHaveBeenCalledWith(
      mockSupabase,
      {
        userId: 'user-1',
        chapterId: 'leaduni',
        issuedById: undefined,
        makePrimary: true,
      }
    )
  })
})
