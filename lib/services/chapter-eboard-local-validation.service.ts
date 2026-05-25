export type LocalChapterRow = {
  id: string
  name: string | null
}

export type LocalChapterValidationStatus = 'passed' | 'failed' | 'not_requested'

export type LocalChapterValidationResult = {
  requested: boolean
  status: LocalChapterValidationStatus
  expectedChapterIds: string[]
  foundChapterIds: string[]
  missingChapterIds: string[]
  validatedChapterCount: number
  message: string
}

export const REQUIRED_CANONICAL_CHAPTER_IDS = [
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
] as const

const NON_CANONICAL_FALLBACK_IDS = new Set(['other'])

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right))
}

export const ChapterEboardLocalValidationService = {
  canonicalIdsFromMapping(chapterIds: string[]): string[] {
    return uniqueSorted(chapterIds.filter((id) => !NON_CANONICAL_FALLBACK_IDS.has(id)))
  },

  validateMappedChapters(input: {
    expectedChapterIds: string[]
    actualChapters: LocalChapterRow[]
  }): LocalChapterValidationResult {
    const expectedChapterIds = this.canonicalIdsFromMapping(input.expectedChapterIds)
    const actualChapterIds = new Set(input.actualChapters.map((chapter) => chapter.id))
    const foundChapterIds = uniqueSorted(expectedChapterIds.filter((id) => actualChapterIds.has(id)))
    const missingChapterIds = uniqueSorted(expectedChapterIds.filter((id) => !actualChapterIds.has(id)))
    const status: LocalChapterValidationStatus = missingChapterIds.length === 0 ? 'passed' : 'failed'

    return {
      requested: true,
      status,
      expectedChapterIds,
      foundChapterIds,
      missingChapterIds,
      validatedChapterCount: foundChapterIds.length,
      message:
        status === 'passed'
          ? `Local chapter validation passed (${foundChapterIds.length}/${expectedChapterIds.length}).`
          : `Local chapter validation failed. Missing canonical chapter ID(s): ${missingChapterIds.join(', ')}.`,
    }
  },

  notRequested(): LocalChapterValidationResult {
    return {
      requested: false,
      status: 'not_requested',
      expectedChapterIds: [],
      foundChapterIds: [],
      missingChapterIds: [],
      validatedChapterCount: 0,
      message: 'Local canonical chapter validation was not requested.',
    }
  },
}
