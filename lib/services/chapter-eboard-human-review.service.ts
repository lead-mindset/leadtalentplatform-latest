export type CsvRecord = Record<string, string>

export type DuplicateReviewRecord = {
  email: string
  sourceRowNumbers: number[]
  hasConflict: boolean
  reasons: string[]
}

export type ReviewPackageInput = {
  normalizedRows: CsvRecord[]
  editorRows: CsvRecord[]
  chapterReviewerRows: CsvRecord[]
  duplicates: DuplicateReviewRecord[]
  generatedAt: string
}

export type ReviewPackageOutput = {
  readmeMarkdown: string
  reviewLedgerCsv: string
  executiveEditorApprovalCsv: string
  duplicateConflictReviewCsv: string
  chapterReviewerAssignmentSummaryCsv: string
  chapterPackets: Record<string, string>
  chapterReviewRequestTemplateMarkdown: string
  executiveApprovalRequestTemplateMarkdown: string
  summary: {
    totalRows: number
    chapterPacketCount: number
    editorApprovalCount: number
    duplicateGroupCount: number
    duplicateConflictCount: number
    upcReviewerGap: boolean
  }
}

export type ApprovedArtifactResult = {
  approvedImportCsv: string
  summaryJson: string
}

const HUMAN_REVIEW_STATUSES = ['approved', 'blocked', 'needs_correction', 'excluded'] as const
const EDITOR_ACCESS_DECISIONS = ['approved_editor', 'member_only', 'not_imported'] as const

const DECISION_HEADERS = [
  'human_review_status',
  'chapter_reviewer_decision',
  'executive_review_required',
  'editor_access_decision',
  'corrected_name',
  'corrected_email',
  'corrected_chapter_id',
  'corrected_role_title',
  'corrected_major',
  'review_owner',
  'review_notes',
]

const EXECUTIVE_APPROVAL_HEADERS = ['editor_access_decision', 'executive_approval_notes']

function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value)
  if (!/[",\r\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

function buildCsv(headers: string[], rows: CsvRecord[]): string {
  return [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n')
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right))
}

function isTrue(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true'
}

function reviewReasons(row: CsvRecord): string[] {
  return (row.review_reasons ?? '')
    .split('|')
    .map((reason) => reason.trim())
    .filter(Boolean)
}

function isDuplicateConflict(row: CsvRecord): boolean {
  return reviewReasons(row).includes('Duplicate email has conflicting row data')
}

function hasAmbiguousTitle(row: CsvRecord): boolean {
  return reviewReasons(row).includes('Unmapped or ambiguous title')
}

function isProposedEditor(row: CsvRecord): boolean {
  return row.proposed_app_role === 'editor' || isTrue(row.proposed_editor_requires_review)
}

function chapterHasPresident(chapterReviewerRows: CsvRecord[], chapterId: string): boolean {
  return Boolean(
    chapterReviewerRows.find(
      (row) => row.canonical_chapter_id === chapterId && (row.detected_president_emails ?? '').trim().length > 0
    )
  )
}

function reviewOwnerForRow(row: CsvRecord, chapterReviewerRows: CsvRecord[]): string {
  const chapterId = row.canonical_chapter_id
  if (chapterId === 'leadupc' && !chapterHasPresident(chapterReviewerRows, chapterId)) {
    return 'VP / executive-operations confirmation required because no president signal was detected.'
  }
  if (chapterHasPresident(chapterReviewerRows, chapterId)) {
    return 'Chapter president primary reviewer; VP backup reviewer.'
  }
  return 'Executive/operations reviewer should assign chapter reviewer.'
}

function executiveReviewRequired(row: CsvRecord, chapterReviewerRows: CsvRecord[]): boolean {
  return (
    isProposedEditor(row) ||
    isDuplicateConflict(row) ||
    hasAmbiguousTitle(row) ||
    (row.canonical_chapter_id === 'leadupc' && !chapterHasPresident(chapterReviewerRows, 'leadupc'))
  )
}

function buildReviewLedgerRows(input: ReviewPackageInput): CsvRecord[] {
  return input.normalizedRows.map((row) => ({
    ...row,
    human_review_status: 'pending_review',
    chapter_reviewer_decision: 'pending_review',
    executive_review_required: String(executiveReviewRequired(row, input.chapterReviewerRows)),
    editor_access_decision: isProposedEditor(row) ? 'pending_review' : 'member_only',
    corrected_name: '',
    corrected_email: '',
    corrected_chapter_id: '',
    corrected_role_title: '',
    corrected_major: '',
    review_owner: reviewOwnerForRow(row, input.chapterReviewerRows),
    review_notes: '',
  }))
}

function buildEditorApprovalRows(input: ReviewPackageInput): CsvRecord[] {
  return input.editorRows.map((row) => ({
    ...row,
    editor_access_decision: 'pending_review',
    executive_approval_notes: '',
  }))
}

function buildDuplicateRows(duplicates: DuplicateReviewRecord[]): CsvRecord[] {
  return duplicates.map((duplicate) => ({
    email: duplicate.email,
    source_row_numbers: duplicate.sourceRowNumbers.join('|'),
    has_conflict: String(duplicate.hasConflict),
    reasons: duplicate.reasons.join('|'),
    human_resolution: 'pending_review',
    resolution_notes: '',
  }))
}

function buildChapterReviewerSummaryRows(chapterReviewerRows: CsvRecord[]): CsvRecord[] {
  return chapterReviewerRows.map((row) => {
    const hasPresident = (row.detected_president_emails ?? '').trim().length > 0
    const isUpcGap = row.canonical_chapter_id === 'leadupc' && !hasPresident

    return {
      ...row,
      reviewer_gap: String(isUpcGap),
      recommended_primary_reviewer: isUpcGap ? 'VP or executive/operations confirmation' : 'Detected president',
      recommended_backup_reviewer: 'Detected VP; Chief of Staff if available',
      review_status: 'pending_review',
      review_notes: '',
    }
  })
}

function buildReadme(input: ReviewPackageInput, summary: ReviewPackageOutput['summary']): string {
  return [
    '# Chapter E-board Human Review Package',
    '',
    `Generated at: ${input.generatedAt}`,
    '',
    '## Purpose',
    '',
    'This package turns the validated dry-run outputs into files that chapter and executive/operations reviewers can approve before any local Docker import.',
    '',
    '## Review Rules',
    '',
    '- No database writes happen in this phase.',
    '- No Supabase auth users are created.',
    '- No member IDs are generated.',
    '- Company visibility stays false by default.',
    '- Chapter reviewers validate roster truth and recommend corrections.',
    '- Executive/operations reviewers approve editor access and sensitive cross-chapter decisions.',
    '- Do not import rows that remain `pending_review`.',
    '',
    '## Allowed Row Statuses',
    '',
    '- `approved`: import as-is or with explicit corrected fields.',
    '- `blocked`: do not import until a blocking issue is resolved.',
    '- `needs_correction`: data needs correction before import.',
    '- `excluded`: intentionally exclude from this import.',
    '',
    '## Required Decisions',
    '',
    `- Review ledger rows: ${summary.totalRows}`,
    `- Chapter packets: ${summary.chapterPacketCount}`,
    `- Proposed editor approvals: ${summary.editorApprovalCount}`,
    `- Duplicate groups: ${summary.duplicateGroupCount}`,
    `- Duplicate conflict groups: ${summary.duplicateConflictCount}`,
    summary.upcReviewerGap
      ? '- UPC reviewer gap: no clear president signal detected; use VP or executive/operations confirmation.'
      : '- UPC reviewer gap: none detected.',
    '',
    '## Next Step',
    '',
    'Send chapter packets to chapter reviewers and the executive approval file to Nicole, Antonny, Xiomara, Christopher, and Abigail. After all decisions are returned, run the approved artifact compiler.',
    '',
  ].join('\n')
}

function buildChapterMessage(): string {
  return [
    'Hola equipo,',
    '',
    'Estoy compartiendo el archivo de revisión de su chapter para validar la información antes de cualquier importación a LEAD Talent Platform.',
    '',
    'Les pido revisar nombres, correos, chapter, cargo, carrera, estado activo/inactivo y cualquier corrección necesaria. Esta revisión no otorga permisos finales de plataforma; solo confirma la verdad del roster y recomendaciones operativas.',
    '',
    'Por favor completen las columnas de decisión usando una de estas opciones: `approved`, `blocked`, `needs_correction` o `excluded`.',
    '',
    'Fecha límite sugerida: [AGREGAR FECHA].',
    '',
    'Gracias por ayudarnos a cuidar la calidad de la información antes de activar miembros reales.',
  ].join('\n')
}

function buildExecutiveMessage(): string {
  return [
    'Hola Nicole, Antonny, Xiomara, Christopher y Abigail,',
    '',
    'Comparto la cola de aprobación ejecutiva/operativa para el import de e-board en LEAD Talent Platform.',
    '',
    'Necesitamos confirmar qué personas deben recibir acceso de `editor`, cuáles deben entrar solo como `member`, y qué casos deben quedar bloqueados o excluidos. Ningún acceso elevado se importará sin aprobación explícita.',
    '',
    'También hay casos de duplicados/conflictos y el gap de UPC, donde no se detectó una señal clara de presidente y se requiere confirmación por VP o por este grupo.',
    '',
    'Opciones para `editor_access_decision`: `approved_editor`, `member_only`, `not_imported`.',
    '',
    'Fecha límite sugerida: [AGREGAR FECHA].',
  ].join('\n')
}

function headersFor(rows: CsvRecord[], extraHeaders: string[]): string[] {
  const baseHeaders = rows[0] ? Object.keys(rows[0]).filter((header) => !extraHeaders.includes(header)) : []
  return [...baseHeaders, ...extraHeaders]
}

function assertAllowed(value: string, allowed: readonly string[], field: string): void {
  if (!allowed.includes(value)) {
    throw new Error(`${field} has invalid value: ${value}`)
  }
}

function assertValidEmail(email: string, field: string): void {
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`${field} has invalid email: ${email}`)
  }
}

function countBy(rows: CsvRecord[], field: string): Record<string, number> {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const key = row[field] || 'blank'
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

export const ChapterEboardHumanReviewService = {
  buildReviewPackage(input: ReviewPackageInput): ReviewPackageOutput {
    const ledgerRows = buildReviewLedgerRows(input)
    const editorApprovalRows = buildEditorApprovalRows(input)
    const duplicateRows = buildDuplicateRows(input.duplicates)
    const chapterReviewerRows = buildChapterReviewerSummaryRows(input.chapterReviewerRows)
    const chapterIds = uniqueSorted(input.normalizedRows.map((row) => row.canonical_chapter_id))
    const chapterPackets = Object.fromEntries(
      chapterIds.map((chapterId) => {
        const rows = ledgerRows.filter((row) => row.canonical_chapter_id === chapterId)
        return [`${chapterId}-roster-review.csv`, buildCsv(headersFor(rows, DECISION_HEADERS), rows)]
      })
    )
    const summary = {
      totalRows: input.normalizedRows.length,
      chapterPacketCount: chapterIds.length,
      editorApprovalCount: editorApprovalRows.length,
      duplicateGroupCount: input.duplicates.length,
      duplicateConflictCount: input.duplicates.filter((duplicate) => duplicate.hasConflict).length,
      upcReviewerGap: chapterReviewerRows.some((row) => row.canonical_chapter_id === 'leadupc' && row.reviewer_gap === 'true'),
    }

    return {
      readmeMarkdown: buildReadme(input, summary),
      reviewLedgerCsv: buildCsv(headersFor(ledgerRows, DECISION_HEADERS), ledgerRows),
      executiveEditorApprovalCsv: buildCsv(headersFor(editorApprovalRows, EXECUTIVE_APPROVAL_HEADERS), editorApprovalRows),
      duplicateConflictReviewCsv: buildCsv(
        ['email', 'source_row_numbers', 'has_conflict', 'reasons', 'human_resolution', 'resolution_notes'],
        duplicateRows
      ),
      chapterReviewerAssignmentSummaryCsv: buildCsv(headersFor(chapterReviewerRows, ['reviewer_gap', 'recommended_primary_reviewer', 'recommended_backup_reviewer', 'review_status', 'review_notes']), chapterReviewerRows),
      chapterPackets,
      chapterReviewRequestTemplateMarkdown: buildChapterMessage(),
      executiveApprovalRequestTemplateMarkdown: buildExecutiveMessage(),
      summary,
    }
  },

  buildApprovedArtifact(ledgerRows: CsvRecord[]): ApprovedArtifactResult {
    const pendingRows = ledgerRows.filter((row) => row.human_review_status === 'pending_review')
    if (pendingRows.length > 0) {
      throw new Error(`Cannot build approved artifact while ${pendingRows.length} row(s) are still pending_review.`)
    }

    for (const row of ledgerRows) {
      assertAllowed(row.human_review_status, HUMAN_REVIEW_STATUSES, 'human_review_status')
      if (isProposedEditor(row)) {
        assertAllowed(row.editor_access_decision, EDITOR_ACCESS_DECISIONS, 'editor_access_decision')
      }
      if (row.human_review_status === 'approved') {
        assertValidEmail(row.corrected_email || row.normalized_email, 'approved row email')
        if (row.corrected_chapter_id && !row.corrected_chapter_id.startsWith('lead')) {
          throw new Error(`corrected_chapter_id has invalid canonical chapter ID: ${row.corrected_chapter_id}`)
        }
      }
    }

    const approvedRows = ledgerRows
      .filter((row) => row.human_review_status === 'approved')
      .map((row) => {
        const finalAppRole = row.editor_access_decision === 'member_only' ? 'member' : row.proposed_app_role
        return {
          ...row,
          final_name: row.corrected_name || row.normalized_name,
          final_email: row.corrected_email || row.normalized_email,
          final_chapter_id: row.corrected_chapter_id || row.canonical_chapter_id,
          final_role_title: row.corrected_role_title || row.raw_role_title,
          final_major: row.corrected_major || row.standardized_major,
          final_app_role: finalAppRole,
          is_recruiter_visible: 'false',
        }
      })

    const headers = headersFor(approvedRows, [
      'final_name',
      'final_email',
      'final_chapter_id',
      'final_role_title',
      'final_major',
      'final_app_role',
    ])
    const summary = {
      generatedAt: new Date().toISOString(),
      inputRows: ledgerRows.length,
      approvedRows: approvedRows.length,
      statusCounts: countBy(ledgerRows, 'human_review_status'),
      editorDecisionCounts: countBy(ledgerRows, 'editor_access_decision'),
      chapterCounts: countBy(approvedRows, 'final_chapter_id'),
    }

    return {
      approvedImportCsv: buildCsv(headers, approvedRows),
      summaryJson: JSON.stringify(summary, null, 2),
    }
  },
}
