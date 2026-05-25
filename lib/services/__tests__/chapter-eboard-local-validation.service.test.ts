import { describe, expect, it } from 'vitest'
import {
  ChapterEboardLocalValidationService,
  REQUIRED_CANONICAL_CHAPTER_IDS,
} from '../chapter-eboard-local-validation.service'

describe('ChapterEboardLocalValidationService', () => {
  it('passes when all expected canonical chapter IDs exist locally', () => {
    const result = ChapterEboardLocalValidationService.validateMappedChapters({
      expectedChapterIds: [...REQUIRED_CANONICAL_CHAPTER_IDS],
      actualChapters: REQUIRED_CANONICAL_CHAPTER_IDS.map((id) => ({ id, name: id })),
    })

    expect(result.status).toBe('passed')
    expect(result.validatedChapterCount).toBe(14)
    expect(result.missingChapterIds).toEqual([])
  })

  it('fails when expected canonical chapter IDs are missing locally', () => {
    const result = ChapterEboardLocalValidationService.validateMappedChapters({
      expectedChapterIds: [...REQUIRED_CANONICAL_CHAPTER_IDS],
      actualChapters: REQUIRED_CANONICAL_CHAPTER_IDS.filter((id) => id !== 'leaduni').map((id) => ({ id, name: id })),
    })

    expect(result.status).toBe('failed')
    expect(result.missingChapterIds).toEqual(['leaduni'])
    expect(result.message).toContain('leaduni')
  })

  it('ignores non-canonical fallback IDs like other', () => {
    const result = ChapterEboardLocalValidationService.validateMappedChapters({
      expectedChapterIds: ['leaduni', 'other'],
      actualChapters: [{ id: 'leaduni', name: 'LEAD UNI' }],
    })

    expect(result.status).toBe('passed')
    expect(result.expectedChapterIds).toEqual(['leaduni'])
    expect(result.foundChapterIds).toEqual(['leaduni'])
  })

  it('keeps the required canonical chapter ID list explicit', () => {
    expect(REQUIRED_CANONICAL_CHAPTER_IDS).toEqual([
      'leadpacifico',
      'leadpucp',
      'leadtecsup',
      'leaducsur',
      'leaduni',
      'leadunmsm',
      'leadunsa',
      'leadupc',
      'leadupn',
      'leadupntrujillo',
      'leadusil',
      'leadutec',
      'leadutp',
      'leadvillareal',
    ])
  })
})
