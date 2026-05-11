import type {
  DuplicateGroup,
  NormalizedEboardRow,
  NormalizeCsvResult,
} from './chapter-eboard-import.service'
import { ChapterEboardLocalValidationService } from './chapter-eboard-local-validation.service'
import type { LocalChapterValidationResult } from './chapter-eboard-local-validation.service'

export type ChapterEboardArtifactPaths = {
  normalizedCsv: string
  reviewQueueCsv: string
  editorApprovalCsv: string
  chapterReviewersCsv: string
  validationReportMarkdown: string
  validationSummaryJson: string
}

export type ChapterEboardArtifactParams = {
  result: NormalizeCsvResult
  sourcePath: string
  outputDirectory: string
  generatedAt: string
  validateLocalRequested: boolean
  localValidation?: LocalChapterValidationResult
  artifactPaths: ChapterEboardArtifactPaths
}

export type ChapterEboardArtifacts = {
  normalizedCsv: string
  reviewQueueCsv: string
  editorApprovalCsv: string
  chapterReviewersCsv: string
  validationReportMarkdown: string
  validationSummaryJson: string
}

type ReviewReasonCounts = Record<string, number>

const NORMALIZED_HEADERS = [
  'source_row_numbers',
  'status',
  'review_reasons',
  'raw_name',
  'normalized_name',
  'raw_email',
  'normalized_email',
  'raw_confirm_email',
  'raw_chapter',
  'canonical_chapter_id',
  'canonical_chapter_name',
  'raw_role_title',
  'role_level',
  'functional_area',
  'proposed_app_role',
  'proposed_membership_position',
  'proposed_identity_type',
  'proposed_editor_requires_review',
  'raw_major',
  'standardized_major',
  'major_family',
  'raw_phone',
  'normalized_phone',
  'is_recruiter_visible',
  'member_id_strategy',
]

function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value)
  if (!/[",\r\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n')
}

function rowToNormalizedCsvValues(row: NormalizedEboardRow): unknown[] {
  return [
    row.sourceRowNumbers.join('|'),
    row.status,
    row.reviewReasons.join('|'),
    row.raw.name,
    row.normalized.name,
    row.raw.email,
    row.normalized.email,
    row.raw.confirmEmail,
    row.raw.chapter,
    row.normalized.canonicalChapterId,
    row.normalized.canonicalChapterName,
    row.raw.roleTitle,
    row.normalized.roleLevel,
    row.normalized.functionalArea,
    row.normalized.proposedAppRole,
    row.normalized.proposedMembershipPosition,
    row.normalized.proposedIdentityType,
    row.mapping.proposedEditorRequiresReview,
    row.raw.major,
    row.normalized.standardizedMajor,
    row.normalized.majorFamily,
    row.raw.phone,
    row.normalized.phone,
    row.normalized.isRecruiterVisible,
    row.normalized.memberIdStrategy,
  ]
}

function countReviewReasons(rows: NormalizedEboardRow[]): ReviewReasonCounts {
  return rows.reduce<ReviewReasonCounts>((counts, row) => {
    for (const reason of row.reviewReasons) {
      counts[reason] = (counts[reason] ?? 0) + 1
    }
    return counts
  }, {})
}

function editorRows(result: NormalizeCsvResult): NormalizedEboardRow[] {
  return result.rows.filter((row) => row.normalized.proposedAppRole === 'editor')
}

function groupRowsByChapter(rows: NormalizedEboardRow[]): Map<string, NormalizedEboardRow[]> {
  const groups = new Map<string, NormalizedEboardRow[]>()
  for (const row of rows) {
    const key = row.normalized.canonicalChapterId ?? 'unmapped'
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  return groups
}

function emailsForRole(rows: NormalizedEboardRow[], roleLevel: string): string {
  return rows
    .filter((row) => row.normalized.roleLevel === roleLevel)
    .map((row) => row.normalized.email)
    .filter(Boolean)
    .join('|')
}

function duplicateSummary(duplicates: DuplicateGroup[]): Array<Record<string, unknown>> {
  return duplicates.map((duplicate) => ({
    email: duplicate.email,
    sourceRowNumbers: duplicate.sourceRowNumbers,
    hasConflict: duplicate.hasConflict,
    reasons: duplicate.reasons,
  }))
}

function buildValidationSummaryObject(params: ChapterEboardArtifactParams) {
  const { result } = params
  const reviewReasonCounts = countReviewReasons(result.rows)
  const editorApprovalCount = editorRows(result).length
  const localValidation = params.localValidation ?? ChapterEboardLocalValidationService.notRequested()
  const validateLocalNote =
    localValidation.status === 'passed'
      ? `Local canonical chapter validation passed (${localValidation.validatedChapterCount}/${localValidation.expectedChapterIds.length}).`
      : localValidation.message

  return {
    generatedAt: params.generatedAt,
    sourcePath: params.sourcePath,
    outputDirectory: params.outputDirectory,
    summary: result.summary,
    artifactPaths: params.artifactPaths,
    duplicates: duplicateSummary(result.duplicates),
    statusCounts: {
      ready: result.summary.readyCount,
      needs_review: result.summary.reviewCount,
      blocked: result.summary.blockedCount,
    },
    reviewReasonCounts,
    editorApprovalCount,
    blockedCount: result.summary.blockedCount,
    validateLocalRequested: params.validateLocalRequested,
    validateLocalNote,
    localValidation,
  }
}

export const ChapterEboardArtifactService = {
  buildNormalizedCsv(result: NormalizeCsvResult): string {
    return buildCsv(NORMALIZED_HEADERS, result.rows.map(rowToNormalizedCsvValues))
  },

  buildReviewQueueCsv(result: NormalizeCsvResult): string {
    const rows = result.rows
      .filter((row) => row.status === 'needs_review' || row.status === 'blocked')
      .map(rowToNormalizedCsvValues)
    return buildCsv(NORMALIZED_HEADERS, rows)
  },

  buildEditorApprovalCsv(result: NormalizeCsvResult): string {
    const headers = [...NORMALIZED_HEADERS, 'approval_status']
    const rows = editorRows(result).map((row) => [...rowToNormalizedCsvValues(row), 'pending_review'])
    return buildCsv(headers, rows)
  },

  buildChapterReviewersCsv(result: NormalizeCsvResult): string {
    const headers = [
      'canonical_chapter_id',
      'canonical_chapter_name',
      'total_rows',
      'ready_count',
      'review_count',
      'blocked_count',
      'proposed_editor_count',
      'detected_president_emails',
      'detected_vp_emails',
      'detected_chief_of_staff_emails',
      'reviewer_note',
    ]

    const rows = Array.from(groupRowsByChapter(result.rows).entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([chapterId, rowsForChapter]) => {
        const readyCount = rowsForChapter.filter((row) => row.status === 'ready').length
        const reviewCount = rowsForChapter.filter((row) => row.status === 'needs_review').length
        const blockedCount = rowsForChapter.filter((row) => row.status === 'blocked').length
        const proposedEditorCount = rowsForChapter.filter((row) => row.normalized.proposedAppRole === 'editor').length
        const chapterName = rowsForChapter.find((row) => row.normalized.canonicalChapterName)
          ?.normalized.canonicalChapterName

        return [
          chapterId,
          chapterName ?? 'Unmapped',
          rowsForChapter.length,
          readyCount,
          reviewCount,
          blockedCount,
          proposedEditorCount,
          emailsForRole(rowsForChapter, 'president'),
          emailsForRole(rowsForChapter, 'vice_president'),
          emailsForRole(rowsForChapter, 'chief_of_staff'),
          'Chapter roster reviewer should confirm active status and operator recommendations in Phase 2.0.',
        ]
      })

    return buildCsv(headers, rows)
  },

  buildValidationReportMarkdown(params: ChapterEboardArtifactParams): string {
    const summary = buildValidationSummaryObject(params)
    const reasonRows = Object.entries(summary.reviewReasonCounts)
      .sort(([, left], [, right]) => right - left)
      .map(([reason, count]) => `| ${reason} | ${count} |`)
      .join('\n')

    return [
      '# Chapter E-board Import Dry-run Validation Report',
      '',
      `Generated at: ${params.generatedAt}`,
      '',
      '## Inputs',
      '',
      `- Source: \`${params.sourcePath}\``,
      `- Output directory: \`${params.outputDirectory}\``,
      '',
      '## Summary',
      '',
      `- Total raw rows: ${params.result.summary.totalRows}`,
      `- Normalized unique rows: ${params.result.rows.length}`,
      `- Ready rows: ${params.result.summary.readyCount}`,
      `- Review rows: ${params.result.summary.reviewCount}`,
      `- Blocked rows: ${params.result.summary.blockedCount}`,
      `- Duplicate email groups: ${params.result.summary.duplicateEmailCount}`,
      `- Proposed editor approvals: ${summary.editorApprovalCount}`,
      '',
      '## Review Reasons',
      '',
      reasonRows ? ['| Reason | Count |', '| --- | --- |', reasonRows].join('\n') : 'No review reasons found.',
      '',
      '## Safety Notes',
      '',
      '- No database writes were performed.',
      '- No Supabase auth users were created.',
      '- No member IDs were generated.',
      '- Company visibility remains opt-in and defaults to false in normalized rows.',
      `- ${summary.validateLocalNote}`,
      '',
      '## Next Step',
      '',
      summary.localValidation.status === 'passed'
        ? 'Proceed to #129 for final real-data output generation.'
        : 'Run with `--validate-local` before final real-data output generation in #129.',
      '',
    ].join('\n')
  },

  buildValidationSummaryJson(params: ChapterEboardArtifactParams): string {
    return JSON.stringify(buildValidationSummaryObject(params), null, 2)
  },

  buildAllArtifacts(params: ChapterEboardArtifactParams): ChapterEboardArtifacts {
    return {
      normalizedCsv: this.buildNormalizedCsv(params.result),
      reviewQueueCsv: this.buildReviewQueueCsv(params.result),
      editorApprovalCsv: this.buildEditorApprovalCsv(params.result),
      chapterReviewersCsv: this.buildChapterReviewersCsv(params.result),
      validationReportMarkdown: this.buildValidationReportMarkdown(params),
      validationSummaryJson: this.buildValidationSummaryJson(params),
    }
  },
}
