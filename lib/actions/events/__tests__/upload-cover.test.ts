import { beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadEventCover } from '../upload-cover'
import { requireChapterEditor } from '@/lib/auth'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { EventService } from '@/lib/services/event.service'

vi.mock('@/lib/auth', () => ({
  requireChapterEditor: vi.fn(),
}))

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    requireChapterPermission: vi.fn(),
  },
}))

vi.mock('@/lib/services/event.service', () => ({
  EventService: {
    uploadEventCover: vi.fn(),
  },
}))

function buildCoverFormData() {
  const formData = new FormData()
  formData.set('cover', new File(['image'], 'cover.png', { type: 'image/png' }))
  return formData
}

describe('uploadEventCover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(EventService.uploadEventCover).mockResolvedValue({
      publicUrl: 'https://example.com/cover.png',
    })
  })

  it('allows chapter e-board users with event management permission to upload covers', async () => {
    vi.mocked(requireChapterEditor).mockResolvedValue({
      supabase: {},
      user: { id: 'eboard-1', role: 'member' },
      chapter_id: 'leaduni',
      membership: { chapter_id: 'leaduni' },
    } as never)
    vi.mocked(ChapterPermissionService.requireChapterPermission).mockResolvedValue({ success: true })

    const result = await uploadEventCover(buildCoverFormData())

    expect(result).toEqual({ publicUrl: 'https://example.com/cover.png' })
    expect(ChapterPermissionService.requireChapterPermission).toHaveBeenCalledWith({}, {
      userId: 'eboard-1',
      chapterId: 'leaduni',
      permissionKey: 'chapter.events.manage',
    })
    expect(EventService.uploadEventCover).toHaveBeenCalledWith({}, 'eboard-1', expect.any(File))
  })

  it('rejects chapter users without event management permission', async () => {
    vi.mocked(requireChapterEditor).mockResolvedValue({
      supabase: {},
      user: { id: 'member-1', role: 'member' },
      chapter_id: 'leaduni',
      membership: { chapter_id: 'leaduni' },
    } as never)
    vi.mocked(ChapterPermissionService.requireChapterPermission).mockResolvedValue({
      success: false,
      error: 'You do not have permission to perform this chapter action.',
    })

    await expect(uploadEventCover(buildCoverFormData())).rejects.toThrow('You do not have permission')
    expect(EventService.uploadEventCover).not.toHaveBeenCalled()
  })
})
