import { describe, expect, it } from 'vitest'
import { ChapterEboardHumanReviewService } from '../chapter-eboard-human-review.service'
import type { CsvRecord, ReviewPackageInput } from '../chapter-eboard-human-review.service'

function normalizedRow(overrides: Partial<CsvRecord> = {}): CsvRecord {
  return {
    source_row_numbers: '2',
    status: 'ready',
    review_reasons: '',
    raw_name: 'Ready Member',
    normalized_name: 'Ready Member',
    raw_email: 'ready@example.com',
    normalized_email: 'ready@example.com',
    raw_confirm_email: 'ready@example.com',
    raw_chapter: 'UNI',
    canonical_chapter_id: 'leaduni',
    canonical_chapter_name: 'LEAD UNI',
    raw_role_title: 'Voluntario',
    role_level: 'volunteer',
    functional_area: 'other',
    proposed_app_role: 'member',
    proposed_membership_position: 'member',
    proposed_identity_type: 'chapter_member',
    proposed_editor_requires_review: 'false',
    raw_major: 'Marketing',
    standardized_major: 'Marketing',
    major_family: 'Marketing',
    raw_phone: '',
    normalized_phone: '',
    is_recruiter_visible: 'false',
    member_id_strategy: 'generate_on_import',
    ...overrides,
  }
}

const input: ReviewPackageInput = {
  generatedAt: '2026-05-10T15:40:00.000Z',
  normalizedRows: [
    normalizedRow(),
    normalizedRow({
      source_row_numbers: '3',
      normalized_email: 'president@example.com',
      raw_email: 'president@example.com',
      review_reasons: 'Editor access requires human approval',
      raw_role_title: 'Presidenta',
      role_level: 'president',
      proposed_app_role: 'editor',
      proposed_membership_position: 'president',
      proposed_identity_type: 'chapter_editor',
      proposed_editor_requires_review: 'true',
    }),
    normalizedRow({
      source_row_numbers: '4|8',
      normalized_email: 'duplicate@example.com',
      raw_email: 'duplicate@example.com',
      review_reasons: 'Duplicate email has conflicting row data',
      canonical_chapter_id: 'leadupc',
      canonical_chapter_name: 'LEAD UPC',
    }),
  ],
  editorRows: [
    normalizedRow({
      source_row_numbers: '3',
      normalized_email: 'president@example.com',
      raw_email: 'president@example.com',
      proposed_app_role: 'editor',
      proposed_editor_requires_review: 'true',
    }),
  ],
  chapterReviewerRows: [
    {
      canonical_chapter_id: 'leaduni',
      canonical_chapter_name: 'LEAD UNI',
      total_rows: '2',
      ready_count: '1',
      review_count: '1',
      blocked_count: '0',
      proposed_editor_count: '1',
      detected_president_emails: 'president@example.com',
      detected_vp_emails: 'vp@example.com',
      detected_chief_of_staff_emails: '',
      reviewer_note: '',
    },
    {
      canonical_chapter_id: 'leadupc',
      canonical_chapter_name: 'LEAD UPC',
      total_rows: '1',
      ready_count: '1',
      review_count: '0',
      blocked_count: '0',
      proposed_editor_count: '0',
      detected_president_emails: '',
      detected_vp_emails: 'vp-upc@example.com',
      detected_chief_of_staff_emails: '',
      reviewer_note: '',
    },
  ],
  duplicates: [
    {
      email: 'duplicate@example.com',
      sourceRowNumbers: [4, 8],
      hasConflict: true,
      reasons: ['Duplicate email has conflicting row data'],
    },
  ],
}

describe('ChapterEboardHumanReviewService', () => {
  it('builds review package rows with pending human decisions', () => {
    const result = ChapterEboardHumanReviewService.buildReviewPackage(input)

    expect(result.summary.totalRows).toBe(3)
    expect(result.reviewLedgerCsv).toContain('human_review_status')
    expect(result.reviewLedgerCsv).toContain('pending_review')
    expect(result.reviewLedgerCsv).toContain('is_recruiter_visible')
    expect(result.reviewLedgerCsv).toContain('false')
  })

  it('groups chapter packets and flags the UPC reviewer gap', () => {
    const result = ChapterEboardHumanReviewService.buildReviewPackage(input)

    expect(Object.keys(result.chapterPackets).sort()).toEqual(['leaduni-roster-review.csv', 'leadupc-roster-review.csv'])
    expect(result.summary.upcReviewerGap).toBe(true)
    expect(result.chapterReviewerAssignmentSummaryCsv).toContain('VP or executive/operations confirmation')
  })

  it('filters proposed editors into executive approval output', () => {
    const result = ChapterEboardHumanReviewService.buildReviewPackage(input)

    expect(result.summary.editorApprovalCount).toBe(1)
    expect(result.executiveEditorApprovalCsv).toContain('editor_access_decision')
    expect(result.executiveEditorApprovalCsv).toContain('pending_review')
    expect(result.executiveEditorApprovalCsv).toContain('president@example.com')
  })

  it('builds duplicate conflict review output', () => {
    const result = ChapterEboardHumanReviewService.buildReviewPackage(input)

    expect(result.summary.duplicateGroupCount).toBe(1)
    expect(result.summary.duplicateConflictCount).toBe(1)
    expect(result.duplicateConflictReviewCsv).toContain('duplicate@example.com')
    expect(result.duplicateConflictReviewCsv).toContain('true')
  })

  it('blocks approved artifact generation while rows are pending review', () => {
    expect(() =>
      ChapterEboardHumanReviewService.buildApprovedArtifact([
        {
          ...input.normalizedRows[0],
          human_review_status: 'pending_review',
          editor_access_decision: 'member_only',
        },
      ])
    ).toThrow('pending_review')
  })

  it('builds approved artifact from completed human decisions', () => {
    const result = ChapterEboardHumanReviewService.buildApprovedArtifact([
      {
        ...input.normalizedRows[1],
        human_review_status: 'approved',
        editor_access_decision: 'member_only',
        corrected_name: '',
        corrected_email: '',
        corrected_chapter_id: '',
        corrected_role_title: '',
        corrected_major: '',
      },
      {
        ...input.normalizedRows[2],
        human_review_status: 'excluded',
        editor_access_decision: 'not_imported',
      },
    ])

    expect(result.approvedImportCsv).toContain('final_app_role')
    expect(result.approvedImportCsv).toContain('member')
    expect(result.approvedImportCsv).not.toContain('duplicate@example.com')
    expect(JSON.parse(result.summaryJson).approvedRows).toBe(1)
  })
})
