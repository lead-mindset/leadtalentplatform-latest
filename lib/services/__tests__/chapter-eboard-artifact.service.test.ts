import { describe, expect, it } from 'vitest'
import { ChapterEboardArtifactService } from '../chapter-eboard-artifact.service'
import { REQUIRED_CANONICAL_CHAPTER_IDS } from '../chapter-eboard-local-validation.service'
import type { NormalizeCsvResult, NormalizedEboardRow } from '../chapter-eboard-import.service'

function row(overrides: Partial<NormalizedEboardRow>): NormalizedEboardRow {
  return {
    sourceRowNumber: 2,
    sourceRowNumbers: [2],
    status: 'ready',
    reviewReasons: [],
    raw: {
      name: 'Ready Member',
      email: 'ready@example.com',
      confirmEmail: 'ready@example.com',
      chapter: 'UNI',
      roleTitle: 'Voluntario',
      major: 'Marketing',
      phone: '+51 999 000 111',
    },
    normalized: {
      name: 'Ready Member',
      email: 'ready@example.com',
      phone: '+51 999 000 111',
      canonicalChapterId: 'leaduni',
      canonicalChapterName: 'LEAD UNI',
      roleLevel: 'volunteer',
      functionalArea: 'other',
      proposedAppRole: 'member',
      proposedMembershipPosition: 'member',
      proposedIdentityType: 'chapter_member',
      standardizedMajor: 'Marketing',
      majorFamily: 'Marketing',
      isRecruiterVisible: false,
      memberIdStrategy: 'generate_on_import',
    },
    mapping: {
      chapterConfidence: 'high',
      roleConfidence: 'medium',
      majorConfidence: 'high',
      proposedEditorRequiresReview: false,
    },
    ...overrides,
  }
}

const readyRow = row({})
const reviewRow = row({
  sourceRowNumber: 3,
  sourceRowNumbers: [3],
  status: 'needs_review',
  reviewReasons: ['Editor access requires human approval'],
  raw: {
    ...readyRow.raw,
    name: 'President, With Comma',
    email: 'president@example.com',
    roleTitle: 'Presidenta',
  },
  normalized: {
    ...readyRow.normalized,
    name: 'President, With Comma',
    email: 'president@example.com',
    roleLevel: 'president',
    proposedAppRole: 'editor',
    proposedMembershipPosition: 'president',
    proposedIdentityType: 'chapter_editor',
  },
  mapping: {
    ...readyRow.mapping,
    roleConfidence: 'high',
    proposedEditorRequiresReview: true,
  },
})
const blockedRow = row({
  sourceRowNumber: 4,
  sourceRowNumbers: [4],
  status: 'blocked',
  reviewReasons: ['Unmapped chapter'],
  raw: {
    ...readyRow.raw,
    name: 'Blocked "Quoted"\nMember',
    email: 'blocked@example.com',
    chapter: 'Unknown',
  },
  normalized: {
    ...readyRow.normalized,
    name: 'Blocked "Quoted"\nMember',
    email: 'blocked@example.com',
    canonicalChapterId: null,
    canonicalChapterName: null,
  },
  mapping: {
    ...readyRow.mapping,
    chapterConfidence: 'none',
  },
})

const result: NormalizeCsvResult = {
  rows: [readyRow, reviewRow, blockedRow],
  readyRows: [readyRow],
  reviewRows: [reviewRow],
  blockedRows: [blockedRow],
  duplicates: [
    {
      email: 'president@example.com',
      sourceRowNumbers: [3, 8],
      hasConflict: true,
      reasons: ['Duplicate email has conflicting row data'],
    },
  ],
  summary: {
    totalRows: 4,
    readyCount: 1,
    reviewCount: 1,
    blockedCount: 1,
    duplicateEmailCount: 1,
  },
}

const params = {
  result,
  sourcePath: 'docs/Registro de Junta Ejecutiva(Sheet1).csv',
  outputDirectory: 'tmp/imports/chapter-eboard-test',
  generatedAt: '2026-05-10T15:00:00.000Z',
  validateLocalRequested: false,
  artifactPaths: {
    normalizedCsv: 'tmp/imports/chapter-eboard-test/chapter-eboard-normalized.csv',
    reviewQueueCsv: 'tmp/imports/chapter-eboard-test/chapter-eboard-review-queue.csv',
    editorApprovalCsv: 'tmp/imports/chapter-eboard-test/chapter-eboard-editor-approval.csv',
    chapterReviewersCsv: 'tmp/imports/chapter-eboard-test/chapter-eboard-chapter-reviewers.csv',
    validationReportMarkdown: 'tmp/imports/chapter-eboard-test/chapter-eboard-validation-report.md',
    validationSummaryJson: 'tmp/imports/chapter-eboard-test/chapter-eboard-validation-summary.json',
  },
}

describe('ChapterEboardArtifactService', () => {
  it('builds normalized CSV with escaping for commas, quotes, and newlines', () => {
    const csv = ChapterEboardArtifactService.buildNormalizedCsv(result)

    expect(csv).toContain('source_row_numbers,status,review_reasons')
    expect(csv).toContain('"President, With Comma"')
    expect(csv).toContain('"Blocked ""Quoted""\nMember"')
  })

  it('builds review queue and editor approval CSV subsets', () => {
    const reviewCsv = ChapterEboardArtifactService.buildReviewQueueCsv(result)
    const editorCsv = ChapterEboardArtifactService.buildEditorApprovalCsv(result)

    expect(reviewCsv).toContain('president@example.com')
    expect(reviewCsv).toContain('blocked@example.com')
    expect(reviewCsv).not.toContain('Ready Member')
    expect(editorCsv).toContain('approval_status')
    expect(editorCsv).toContain('pending_review')
    expect(editorCsv).toContain('president@example.com')
    expect(editorCsv).not.toContain('blocked@example.com')
  })

  it('builds chapter reviewer grouping with leadership signals', () => {
    const csv = ChapterEboardArtifactService.buildChapterReviewersCsv(result)

    expect(csv).toContain('canonical_chapter_id,canonical_chapter_name,total_rows')
    expect(csv).toContain('leaduni,LEAD UNI,2,1,1,0,1')
    expect(csv).toContain('president@example.com')
    expect(csv).toContain('unmapped,Unmapped,1,0,0,1,0')
  })

  it('builds validation markdown report with counts and safety notes', () => {
    const markdown = ChapterEboardArtifactService.buildValidationReportMarkdown(params)

    expect(markdown).toContain('Total raw rows: 4')
    expect(markdown).toContain('Duplicate email groups: 1')
    expect(markdown).toContain('No database writes were performed.')
    expect(markdown).toContain('Local canonical chapter validation was not requested.')
    expect(markdown).toContain('Run with `--validate-local`')
  })

  it('builds validation summary JSON with artifact paths and counts', () => {
    const summary = JSON.parse(ChapterEboardArtifactService.buildValidationSummaryJson(params))

    expect(summary.summary.readyCount).toBe(1)
    expect(summary.editorApprovalCount).toBe(1)
    expect(summary.blockedCount).toBe(1)
    expect(summary.artifactPaths.normalizedCsv).toContain('chapter-eboard-normalized.csv')
    expect(summary.duplicates[0].hasConflict).toBe(true)
    expect(summary.localValidation.status).toBe('not_requested')
  })

  it('includes passed local validation in markdown and summary JSON', () => {
    const validationParams = {
      ...params,
      validateLocalRequested: true,
      localValidation: {
        requested: true,
        status: 'passed' as const,
        expectedChapterIds: [...REQUIRED_CANONICAL_CHAPTER_IDS],
        foundChapterIds: [...REQUIRED_CANONICAL_CHAPTER_IDS],
        missingChapterIds: [],
        validatedChapterCount: REQUIRED_CANONICAL_CHAPTER_IDS.length,
        message: 'Local chapter validation passed (14/14).',
      },
    }

    const markdown = ChapterEboardArtifactService.buildValidationReportMarkdown(validationParams)
    const summary = JSON.parse(ChapterEboardArtifactService.buildValidationSummaryJson(validationParams))

    expect(markdown).toContain('Local canonical chapter validation passed (14/14).')
    expect(markdown).toContain('Proceed to #129')
    expect(summary.localValidation.status).toBe('passed')
    expect(summary.localValidation.expectedChapterIds).toHaveLength(14)
  })

  it('builds all required artifacts', () => {
    const artifacts = ChapterEboardArtifactService.buildAllArtifacts(params)

    expect(Object.keys(artifacts).sort()).toEqual([
      'chapterReviewersCsv',
      'editorApprovalCsv',
      'normalizedCsv',
      'reviewQueueCsv',
      'validationReportMarkdown',
      'validationSummaryJson',
    ])
  })
})
