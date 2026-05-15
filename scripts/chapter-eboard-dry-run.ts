import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { ChapterEboardArtifactService } from '@/lib/services/chapter-eboard-artifact.service'
import { ChapterEboardImportService } from '@/lib/services/chapter-eboard-import.service'
import {
  ChapterEboardLocalValidationService,
  REQUIRED_CANONICAL_CHAPTER_IDS,
  type LocalChapterValidationResult,
} from '@/lib/services/chapter-eboard-local-validation.service'
import type { Database } from '@/lib/database.generated'
import type {
  ChapterMappingConfig,
  MajorMappingConfig,
  RoleMappingConfig,
} from '@/lib/services/chapter-eboard-import.service'

const DEFAULT_SOURCE = 'docs/Registro de Junta Ejecutiva(Sheet1).csv'
const DEFAULT_OUTPUT = 'tmp/imports/chapter-eboard'
const CHAPTER_MAPPING_PATH = 'docs/data-import/chapter-eboard-chapter-mapping.json'
const ROLE_MAPPING_PATH = 'docs/data-import/chapter-eboard-role-mapping.json'
const MAJOR_MAPPING_PATH = 'docs/data-import/chapter-eboard-major-mapping.json'
const ENV_LOCAL_PATH = '.env.local'

const ARTIFACT_FILENAMES = {
  normalizedCsv: 'chapter-eboard-normalized.csv',
  reviewQueueCsv: 'chapter-eboard-review-queue.csv',
  editorApprovalCsv: 'chapter-eboard-editor-approval.csv',
  chapterReviewersCsv: 'chapter-eboard-chapter-reviewers.csv',
  validationReportMarkdown: 'chapter-eboard-validation-report.md',
  validationSummaryJson: 'chapter-eboard-validation-summary.json',
}

type CliOptions = {
  source: string
  out: string
  validateLocal: boolean
  help: boolean
}

type LocalEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

function printHelp(): void {
  console.log(`Chapter e-board dry-run

Usage:
  pnpm chapter-eboard:dry-run
  pnpm chapter-eboard:dry-run -- --source "docs/Registro de Junta Ejecutiva(Sheet1).csv" --out tmp/imports/chapter-eboard
  pnpm chapter-eboard:dry-run -- --validate-local

Options:
  --source <path>       CSV input path. Default: ${DEFAULT_SOURCE}
  --out <path>          Output directory. Default: ${DEFAULT_OUTPUT}
  --validate-local      Validate canonical chapter IDs against local Supabase Docker before writing artifacts.
  --help                Show this help text.
`)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    source: DEFAULT_SOURCE,
    out: DEFAULT_OUTPUT,
    validateLocal: false,
    help: false,
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    if (arg === '--validate-local') {
      options.validateLocal = true
      continue
    }

    if (arg === '--source') {
      const value = argv[index + 1]
      if (!value) throw new Error('--source requires a path value')
      options.source = value
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

async function readJson<T>(path: string): Promise<T> {
  const absolutePath = resolve(process.cwd(), path)
  if (!existsSync(absolutePath)) {
    throw new Error(`Required config file not found: ${path}`)
  }

  return JSON.parse(await readFile(absolutePath, 'utf8')) as T
}

function parseEnvFile(text: string): LocalEnv {
  const env: LocalEnv = {}

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    if (key === 'NEXT_PUBLIC_SUPABASE_URL') env.NEXT_PUBLIC_SUPABASE_URL = value
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') env.SUPABASE_SERVICE_ROLE_KEY = value
  }

  return env
}

function assertLocalSupabaseUrl(url: string): void {
  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    throw new Error('Refusing local validation because NEXT_PUBLIC_SUPABASE_URL is not localhost or 127.0.0.1.')
  }
}

async function loadLocalEnv(): Promise<Required<LocalEnv>> {
  const envPath = resolve(process.cwd(), ENV_LOCAL_PATH)
  if (!existsSync(envPath)) {
    throw new Error(`Local validation requires ${ENV_LOCAL_PATH}.`)
  }

  const env = parseEnvFile(await readFile(envPath, 'utf8'))
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(`Local validation requires NEXT_PUBLIC_SUPABASE_URL in ${ENV_LOCAL_PATH}.`)
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(`Local validation requires SUPABASE_SERVICE_ROLE_KEY in ${ENV_LOCAL_PATH}.`)
  }

  assertLocalSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL)

  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

function expectedCanonicalChapterIds(chapterMapping: ChapterMappingConfig): string[] {
  const mappedIds = ChapterEboardLocalValidationService.canonicalIdsFromMapping(
    chapterMapping.chapters.map((chapter) => chapter.canonicalChapterId)
  )
  const missingRequiredIds = REQUIRED_CANONICAL_CHAPTER_IDS.filter((id) => !mappedIds.includes(id))

  if (missingRequiredIds.length > 0) {
    throw new Error(`Chapter mapping is missing required canonical chapter ID(s): ${missingRequiredIds.join(', ')}.`)
  }

  return mappedIds
}

async function validateLocalChapters(chapterMapping: ChapterMappingConfig): Promise<LocalChapterValidationResult> {
  const env = await loadLocalEnv()
  const expectedChapterIds = expectedCanonicalChapterIds(chapterMapping)
  const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase.from('chapter').select('id,name').in('id', expectedChapterIds)

  if (error) {
    throw new Error(`Local Supabase validation failed. Is local Docker running? ${error.message}`)
  }

  const validation = ChapterEboardLocalValidationService.validateMappedChapters({
    expectedChapterIds,
    actualChapters: data ?? [],
  })

  if (validation.status === 'failed') {
    throw new Error(validation.message)
  }

  return validation
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const sourcePath = resolve(process.cwd(), options.source)
  const outputDirectory = resolve(process.cwd(), options.out)

  if (!existsSync(sourcePath)) {
    throw new Error(`Source CSV not found: ${options.source}`)
  }

  const [csvText, chapterMapping, roleMapping, majorMapping] = await Promise.all([
    readFile(sourcePath, 'utf8'),
    readJson<ChapterMappingConfig>(CHAPTER_MAPPING_PATH),
    readJson<RoleMappingConfig>(ROLE_MAPPING_PATH),
    readJson<MajorMappingConfig>(MAJOR_MAPPING_PATH),
  ])

  const result = ChapterEboardImportService.normalizeCsv({
    csvText,
    chapterMapping,
    roleMapping,
    majorMapping,
  })

  const localValidation = options.validateLocal
    ? await validateLocalChapters(chapterMapping)
    : ChapterEboardLocalValidationService.notRequested()

  const artifactPaths = {
    normalizedCsv: resolve(outputDirectory, ARTIFACT_FILENAMES.normalizedCsv),
    reviewQueueCsv: resolve(outputDirectory, ARTIFACT_FILENAMES.reviewQueueCsv),
    editorApprovalCsv: resolve(outputDirectory, ARTIFACT_FILENAMES.editorApprovalCsv),
    chapterReviewersCsv: resolve(outputDirectory, ARTIFACT_FILENAMES.chapterReviewersCsv),
    validationReportMarkdown: resolve(outputDirectory, ARTIFACT_FILENAMES.validationReportMarkdown),
    validationSummaryJson: resolve(outputDirectory, ARTIFACT_FILENAMES.validationSummaryJson),
  }

  const artifacts = ChapterEboardArtifactService.buildAllArtifacts({
    result,
    sourcePath,
    outputDirectory,
    generatedAt: new Date().toISOString(),
    validateLocalRequested: options.validateLocal,
    localValidation,
    artifactPaths,
  })

  await mkdir(outputDirectory, { recursive: true })
  await Promise.all([
    writeFile(artifactPaths.normalizedCsv, artifacts.normalizedCsv, 'utf8'),
    writeFile(artifactPaths.reviewQueueCsv, artifacts.reviewQueueCsv, 'utf8'),
    writeFile(artifactPaths.editorApprovalCsv, artifacts.editorApprovalCsv, 'utf8'),
    writeFile(artifactPaths.chapterReviewersCsv, artifacts.chapterReviewersCsv, 'utf8'),
    writeFile(artifactPaths.validationReportMarkdown, artifacts.validationReportMarkdown, 'utf8'),
    writeFile(artifactPaths.validationSummaryJson, artifacts.validationSummaryJson, 'utf8'),
  ])

  const editorApprovalCount = result.rows.filter((row) => row.normalized.proposedAppRole === 'editor').length

  console.log('Chapter e-board dry-run complete')
  console.log(`Source: ${sourcePath}`)
  console.log(`Output: ${outputDirectory}`)
  console.log(
    `Rows: total=${result.summary.totalRows}, ready=${result.summary.readyCount}, review=${result.summary.reviewCount}, blocked=${result.summary.blockedCount}`
  )
  console.log(`Duplicate email groups: ${result.summary.duplicateEmailCount}`)
  console.log(`Proposed editor approvals: ${editorApprovalCount}`)
  if (localValidation.requested) {
    console.log(
      `Local chapter validation: ${localValidation.status} (${localValidation.validatedChapterCount}/${localValidation.expectedChapterIds.length})`
    )
  }
  console.log('Artifacts:')
  for (const filename of Object.values(ARTIFACT_FILENAMES)) {
    console.log(`- ${filename}`)
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Chapter e-board dry-run failed: ${message}`)
  process.exit(1)
})
