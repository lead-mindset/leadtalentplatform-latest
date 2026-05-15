import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ChapterEboardHumanReviewService } from '@/lib/services/chapter-eboard-human-review.service'
import type { CsvRecord } from '@/lib/services/chapter-eboard-human-review.service'

const DEFAULT_LEDGER = 'tmp/imports/chapter-eboard-human-review/review-ledger.csv'
const DEFAULT_OUTPUT_DIR = 'tmp/imports/chapter-eboard-approved'

type CliOptions = {
  ledger: string
  out: string
  help: boolean
}

function printHelp(): void {
  console.log(`Chapter e-board approved artifact compiler

Usage:
  pnpm chapter-eboard:approved-artifact
  pnpm chapter-eboard:approved-artifact -- --ledger tmp/imports/chapter-eboard-human-review/review-ledger.csv --out tmp/imports/chapter-eboard-approved

Options:
  --ledger <path>  Completed human review ledger. Default: ${DEFAULT_LEDGER}
  --out <path>     Approved artifact output directory. Default: ${DEFAULT_OUTPUT_DIR}
  --help           Show this help text.
`)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    ledger: DEFAULT_LEDGER,
    out: DEFAULT_OUTPUT_DIR,
    help: false,
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    if (arg === '--ledger') {
      const value = argv[index + 1]
      if (!value) throw new Error('--ledger requires a path value')
      options.ledger = value
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

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const ledgerPath = resolve(process.cwd(), options.ledger)
  const outputDir = resolve(process.cwd(), options.out)

  if (!existsSync(ledgerPath)) {
    throw new Error(`Review ledger not found: ${ledgerPath}`)
  }

  const output = ChapterEboardHumanReviewService.buildApprovedArtifact(parseCsv(await readFile(ledgerPath, 'utf8')))

  await mkdir(outputDir, { recursive: true })
  await Promise.all([
    writeFile(resolve(outputDir, 'chapter-eboard-approved-import.csv'), output.approvedImportCsv, 'utf8'),
    writeFile(resolve(outputDir, 'chapter-eboard-approved-import-summary.json'), output.summaryJson, 'utf8'),
  ])

  console.log('Chapter e-board approved import artifact generated')
  console.log(`Ledger: ${ledgerPath}`)
  console.log(`Output: ${outputDir}`)
  console.log('No database writes were performed.')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Chapter e-board approved artifact failed: ${message}`)
  process.exit(1)
})
