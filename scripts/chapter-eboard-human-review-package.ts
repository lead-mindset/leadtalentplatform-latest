import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ChapterEboardHumanReviewService } from '@/lib/services/chapter-eboard-human-review.service'
import type { CsvRecord, DuplicateReviewRecord } from '@/lib/services/chapter-eboard-human-review.service'

const DEFAULT_SOURCE_DIR = 'tmp/imports/chapter-eboard'
const DEFAULT_OUTPUT_DIR = 'tmp/imports/chapter-eboard-human-review'

const SOURCE_FILES = {
  normalized: 'chapter-eboard-normalized.csv',
  editorApproval: 'chapter-eboard-editor-approval.csv',
  chapterReviewers: 'chapter-eboard-chapter-reviewers.csv',
  validationSummary: 'chapter-eboard-validation-summary.json',
}

type CliOptions = {
  sourceDir: string
  out: string
  help: boolean
}

type ValidationSummary = {
  duplicates?: Array<{
    email: string
    sourceRowNumbers: number[]
    hasConflict: boolean
    reasons: string[]
  }>
}

function printHelp(): void {
  console.log(`Chapter e-board human review package

Usage:
  pnpm chapter-eboard:review-package
  pnpm chapter-eboard:review-package -- --source-dir tmp/imports/chapter-eboard --out tmp/imports/chapter-eboard-human-review

Options:
  --source-dir <path>  Dry-run artifact directory. Default: ${DEFAULT_SOURCE_DIR}
  --out <path>         Human review output directory. Default: ${DEFAULT_OUTPUT_DIR}
  --help               Show this help text.
`)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    sourceDir: DEFAULT_SOURCE_DIR,
    out: DEFAULT_OUTPUT_DIR,
    help: false,
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    if (arg === '--source-dir') {
      const value = argv[index + 1]
      if (!value) throw new Error('--source-dir requires a path value')
      options.sourceDir = value
      index++
      continue
    }

    if (arg === '--out') {
      const value = argv[index + 1]
      if (!value) throw new Error('--out requires a path value')
      options.out = value
      index++
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

function parseCsv(text: string): CsvRecord[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        index++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  row.push(field)
  if (row.some((cell) => cell.length > 0)) rows.push(row)

  const [headers, ...dataRows] = rows
  if (!headers) return []

  return dataRows
    .filter((dataRow) => dataRow.some((cell) => cell.trim().length > 0))
    .map((dataRow) => {
      const record: CsvRecord = {}
      headers.forEach((header, index) => {
        record[header] = dataRow[index] ?? ''
      })
      return record
    })
}

async function readRequiredText(path: string): Promise<string> {
  if (!existsSync(path)) {
    throw new Error(`Required source artifact not found: ${path}`)
  }
  return readFile(path, 'utf8')
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const sourceDir = resolve(process.cwd(), options.sourceDir)
  const outputDir = resolve(process.cwd(), options.out)
  const chapterPacketsDir = resolve(outputDir, 'chapter-packets')
  const messagesDir = resolve(outputDir, 'messages')

  const [normalizedCsv, editorCsv, chapterReviewersCsv, summaryJson] = await Promise.all([
    readRequiredText(resolve(sourceDir, SOURCE_FILES.normalized)),
    readRequiredText(resolve(sourceDir, SOURCE_FILES.editorApproval)),
    readRequiredText(resolve(sourceDir, SOURCE_FILES.chapterReviewers)),
    readRequiredText(resolve(sourceDir, SOURCE_FILES.validationSummary)),
  ])

  const summary = JSON.parse(summaryJson) as ValidationSummary
  const output = ChapterEboardHumanReviewService.buildReviewPackage({
    normalizedRows: parseCsv(normalizedCsv),
    editorRows: parseCsv(editorCsv),
    chapterReviewerRows: parseCsv(chapterReviewersCsv),
    duplicates: (summary.duplicates ?? []) as DuplicateReviewRecord[],
    generatedAt: new Date().toISOString(),
  })

  await Promise.all([mkdir(outputDir, { recursive: true }), mkdir(chapterPacketsDir, { recursive: true }), mkdir(messagesDir, { recursive: true })])
  await Promise.all([
    writeFile(resolve(outputDir, 'README.md'), output.readmeMarkdown, 'utf8'),
    writeFile(resolve(outputDir, 'review-ledger.csv'), output.reviewLedgerCsv, 'utf8'),
    writeFile(resolve(outputDir, 'executive-editor-approval.csv'), output.executiveEditorApprovalCsv, 'utf8'),
    writeFile(resolve(outputDir, 'duplicate-conflict-review.csv'), output.duplicateConflictReviewCsv, 'utf8'),
    writeFile(resolve(outputDir, 'chapter-reviewer-assignment-summary.csv'), output.chapterReviewerAssignmentSummaryCsv, 'utf8'),
    writeFile(resolve(messagesDir, 'chapter-review-request-template.md'), output.chapterReviewRequestTemplateMarkdown, 'utf8'),
    writeFile(resolve(messagesDir, 'executive-approval-request-template.md'), output.executiveApprovalRequestTemplateMarkdown, 'utf8'),
    ...Object.entries(output.chapterPackets).map(([filename, csv]) => writeFile(resolve(chapterPacketsDir, filename), csv, 'utf8')),
  ])

  console.log('Chapter e-board human review package generated')
  console.log(`Source: ${sourceDir}`)
  console.log(`Output: ${outputDir}`)
  console.log(`Review ledger rows: ${output.summary.totalRows}`)
  console.log(`Chapter packets: ${output.summary.chapterPacketCount}`)
  console.log(`Executive editor approvals: ${output.summary.editorApprovalCount}`)
  console.log(`Duplicate groups: ${output.summary.duplicateGroupCount}`)
  console.log(`Duplicate conflict groups: ${output.summary.duplicateConflictCount}`)
  console.log(`UPC reviewer gap: ${output.summary.upcReviewerGap ? 'yes' : 'no'}`)
  console.log('No database writes were performed.')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Chapter e-board human review package failed: ${message}`)
  process.exit(1)
})
