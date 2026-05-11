import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { EventApplicationService } from '@/lib/services/event-application.service'
import { EventService } from '@/lib/services/event.service'
import type { Database } from '@/lib/database.generated'
import type { EventRegistrationRow } from '@/lib/types'

const DEFAULT_OUTPUT = 'tmp/event-ops-132'
const ENV_LOCAL_PATH = '.env.local'
const CHAPTER_ID = 'leaduni'

const OPEN_EVENT_ID = '13200000-0000-4000-8000-000000000001'
const APPLICATION_EVENT_ID = '13200000-0000-4000-8000-000000000002'
const REQUIRED_QUESTION_ID = '13200000-0000-4000-8000-000000000101'
const OPTIONAL_URL_QUESTION_ID = '13200000-0000-4000-8000-000000000102'

const EVENT_IDS = [OPEN_EVENT_ID, APPLICATION_EVENT_ID]
const QUESTION_IDS = [REQUIRED_QUESTION_ID, OPTIONAL_URL_QUESTION_ID]

const SEED_EMAILS = {
  participant: 'participant@test.com',
  member: 'member@test.com',
  editor: 'editor@test.com',
  admin: 'admin@test.com',
}

type CliOptions = {
  out: string
  keepData: boolean
  help: boolean
}

type LocalEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

type SeedUser = {
  id: string
  email: string
  name: string | null
  role: string | null
}

type FlowResult = {
  name: string
  status: 'passed' | 'failed'
  detail: string
}

type Summary = {
  issue: number
  status: 'passed' | 'failed'
  recommendation: 'Ready for controlled event ops pilot' | 'Ready with caveats' | 'Not ready'
  localOnly: true
  generatedAt: string
  outputDirectory: string
  disposableData: {
    cleanedUp: boolean
    keptForDebugging: boolean
    eventIds: string[]
    questionIds: string[]
  }
  preconditions: FlowResult[]
  flows: FlowResult[]
  evidence: {
    summaryJson: string
    reportMarkdown: string
  }
}

function printHelp(): void {
  console.log(`Event operations readiness validation

Usage:
  pnpm event-ops:readiness
  pnpm event-ops:readiness -- --out tmp/event-ops-132
  pnpm event-ops:readiness -- --keep-data

Options:
  --out <path>     Output directory. Default: ${DEFAULT_OUTPUT}
  --keep-data      Keep disposable #132 local rows for debugging.
  --help           Show this help text.
`)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    out: DEFAULT_OUTPUT,
    keepData: false,
    help: false,
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    if (arg === '--keep-data') {
      options.keepData = true
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
    throw new Error('Refusing to run because NEXT_PUBLIC_SUPABASE_URL is not localhost or 127.0.0.1.')
  }
}

async function loadLocalEnv(): Promise<Required<LocalEnv>> {
  const envPath = resolve(process.cwd(), ENV_LOCAL_PATH)
  if (!existsSync(envPath)) {
    throw new Error(`Event ops validation requires ${ENV_LOCAL_PATH}.`)
  }

  const env = parseEnvFile(await readFile(envPath, 'utf8'))
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(`Event ops validation requires NEXT_PUBLIC_SUPABASE_URL in ${ENV_LOCAL_PATH}.`)
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(`Event ops validation requires SUPABASE_SERVICE_ROLE_KEY in ${ENV_LOCAL_PATH}.`)
  }

  assertLocalSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL)

  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

function createLocalClient(env: Required<LocalEnv>): SupabaseClient<Database> {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function getSeedUser(
  supabase: SupabaseClient<Database>,
  email: string,
  label: string
): Promise<SeedUser> {
  const { data, error } = await supabase
    .from('user')
    .select('id,email,name,role')
    .eq('email', email)
    .maybeSingle()

  if (error) throw new Error(`Could not load ${label} seed user. Is local Docker running? ${error.message}`)
  if (!data) throw new Error(`Missing ${label} seed user: ${email}`)

  return data
}

async function verifyPreconditions(
  supabase: SupabaseClient<Database>
): Promise<{ users: Record<keyof typeof SEED_EMAILS, SeedUser>; results: FlowResult[] }> {
  const [participant, member, editor, admin] = await Promise.all([
    getSeedUser(supabase, SEED_EMAILS.participant, 'participant'),
    getSeedUser(supabase, SEED_EMAILS.member, 'member'),
    getSeedUser(supabase, SEED_EMAILS.editor, 'editor'),
    getSeedUser(supabase, SEED_EMAILS.admin, 'admin'),
  ])

  const { data: chapter, error: chapterError } = await supabase
    .from('chapter')
    .select('id,name')
    .eq('id', CHAPTER_ID)
    .maybeSingle()

  if (chapterError) throw new Error(`Could not load ${CHAPTER_ID}. Is local Docker running? ${chapterError.message}`)
  if (!chapter) throw new Error(`Missing canonical chapter: ${CHAPTER_ID}`)

  const { data: editorMembership, error: editorMembershipError } = await supabase
    .from('chapter_membership')
    .select('user_id,chapter_id,position,status')
    .eq('user_id', editor.id)
    .eq('chapter_id', CHAPTER_ID)
    .eq('status', 'approved')
    .eq('position', 'editor')
    .maybeSingle()

  if (editorMembershipError) {
    throw new Error(`Could not verify editor membership: ${editorMembershipError.message}`)
  }
  if (!editorMembership) {
    throw new Error(`${SEED_EMAILS.editor} must have approved editor membership in ${CHAPTER_ID}.`)
  }

  return {
    users: { participant, member, editor, admin },
    results: [
      {
        name: 'Local Supabase connection',
        status: 'passed',
        detail: 'Connected to local Supabase and queried seed tables.',
      },
      {
        name: 'Seed users',
        status: 'passed',
        detail: 'Participant, member, editor, and admin seed users exist.',
      },
      {
        name: 'Canonical chapter',
        status: 'passed',
        detail: `${chapter.name} (${chapter.id}) exists locally.`,
      },
      {
        name: 'Chapter editor authority',
        status: 'passed',
        detail: `${SEED_EMAILS.editor} has approved editor membership in ${CHAPTER_ID}.`,
      },
    ],
  }
}

async function cleanupDisposableRows(supabase: SupabaseClient<Database>): Promise<void> {
  const answerDelete = await supabase
    .from('event_application_answer')
    .delete()
    .in('question_id', QUESTION_IDS)
  if (answerDelete.error) throw new Error(`Could not clean application answers: ${answerDelete.error.message}`)

  const registrationDelete = await supabase
    .from('event_registration')
    .delete()
    .in('event_id', EVENT_IDS)
  if (registrationDelete.error) throw new Error(`Could not clean registrations: ${registrationDelete.error.message}`)

  const questionDelete = await supabase
    .from('event_application_question')
    .delete()
    .in('id', QUESTION_IDS)
  if (questionDelete.error) throw new Error(`Could not clean application questions: ${questionDelete.error.message}`)

  const eventChapterDelete = await supabase
    .from('event_chapter')
    .delete()
    .in('event_id', EVENT_IDS)
  if (eventChapterDelete.error) throw new Error(`Could not clean event chapter rows: ${eventChapterDelete.error.message}`)

  const eventDelete = await supabase
    .from('event')
    .delete()
    .in('id', EVENT_IDS)
  if (eventDelete.error) throw new Error(`Could not clean events: ${eventDelete.error.message}`)
}

function futureIso(daysFromNow: number, hourUtc: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + daysFromNow)
  date.setUTCHours(hourUtc, 0, 0, 0)
  return date.toISOString()
}

async function createDisposableEvents(
  supabase: SupabaseClient<Database>,
  editorUserId: string
): Promise<void> {
  const now = new Date().toISOString()
  const openStart = futureIso(30, 20)
  const openEnd = futureIso(30, 23)
  const applicationStart = futureIso(45, 20)
  const applicationEnd = futureIso(45, 23)

  const { error: insertError } = await supabase.from('event').insert([
    {
      id: OPEN_EVENT_ID,
      title: '[Issue 132] Open Registration Validation Event',
      description: 'Disposable local validation event for open registration, check-in, and event ops readiness.',
      cover_image: null,
      start_at: openStart,
      end_at: openEnd,
      location: 'Universidad Nacional de Ingenieria (UNI)',
      meeting_url: null,
      event_type: 'in_person',
      capacity: 80,
      is_published: true,
      chapter_id: CHAPTER_ID,
      access_model: 'open',
      application_form_url: null,
      location_name: 'Universidad Nacional de Ingenieria (UNI)',
      location_address: null,
      location_city: 'Lima',
      location_region: 'Lima',
      location_latitude: -12.0247,
      location_longitude: -77.0483,
      created_by_id: editorUserId,
      created_at: now,
      updated_at: now,
    },
    {
      id: APPLICATION_EVENT_ID,
      title: '[Issue 132] Application Validation Event',
      description: 'Disposable local validation event for native application questions, review, approval, and rejection.',
      cover_image: null,
      start_at: applicationStart,
      end_at: applicationEnd,
      location: 'Online',
      meeting_url: 'https://meet.google.com/lead-issue-132-validation',
      event_type: 'online',
      capacity: 30,
      is_published: true,
      chapter_id: CHAPTER_ID,
      access_model: 'application',
      application_form_url: null,
      location_name: 'Online',
      location_address: null,
      location_city: null,
      location_region: null,
      location_latitude: null,
      location_longitude: null,
      created_by_id: editorUserId,
      created_at: now,
      updated_at: now,
    },
  ])

  if (insertError) throw new Error(`Could not create disposable events: ${insertError.message}`)

  const questionResult = await EventApplicationService.upsertQuestionsForEvent(supabase, {
    eventId: APPLICATION_EVENT_ID,
    questions: [
      {
        id: REQUIRED_QUESTION_ID,
        questionText: 'Why do you want to join this LEAD event?',
        questionType: 'long_text',
        isRequired: true,
      },
      {
        id: OPTIONAL_URL_QUESTION_ID,
        questionText: 'Portfolio or LinkedIn URL',
        questionType: 'url',
        isRequired: false,
      },
    ],
  })

  if (!questionResult.success) {
    throw new Error(`Could not create native application questions: ${questionResult.error}`)
  }
}

async function approveApplication(
  supabase: SupabaseClient<Database>,
  eventId: string,
  registrationId: string,
  approvedBy: string
): Promise<void> {
  const { data, error } = await supabase.rpc('bulk_approve_applications', {
    p_event_id: eventId,
    p_application_ids: [registrationId],
    p_approved_by: approvedBy,
  })

  if (error) throw new Error(`Could not approve application: ${error.message}`)

  const result = data as { updated_count?: number } | null
  if ((result?.updated_count ?? 0) !== 1) {
    throw new Error('Approval RPC did not update exactly one application.')
  }
}

function assertResult(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function runReadinessFlows(
  supabase: SupabaseClient<Database>,
  users: Record<keyof typeof SEED_EMAILS, SeedUser>
): Promise<FlowResult[]> {
  const flows: FlowResult[] = []

  const publishedEvents = await EventService.getPublishedEvents(supabase)
  assertResult(
    publishedEvents.some((event) => event.id === OPEN_EVENT_ID) &&
      publishedEvents.some((event) => event.id === APPLICATION_EVENT_ID),
    'Disposable events were not visible in public published event listing.'
  )
  flows.push({
    name: 'Public event discovery',
    status: 'passed',
    detail: 'Open and application events are visible through EventService.getPublishedEvents.',
  })

  const openEventDetail = await EventService.getEventByIdWithDetails(supabase, OPEN_EVENT_ID)
  const applicationEventDetail = await EventService.getEventByIdWithDetails(supabase, APPLICATION_EVENT_ID)
  assertResult(!!openEventDetail && !!applicationEventDetail, 'Disposable event detail lookup failed.')
  flows.push({
    name: 'Public event detail',
    status: 'passed',
    detail: 'Both disposable events can be loaded by ID with details.',
  })

  const chapterEvents = await EventService.getChapterEvents(supabase, CHAPTER_ID)
  assertResult(
    chapterEvents.some((event) => event.id === OPEN_EVENT_ID && event.is_owned_by_chapter) &&
      chapterEvents.some((event) => event.id === APPLICATION_EVENT_ID && event.is_owned_by_chapter),
    'Chapter editor event list did not include owned disposable events.'
  )
  flows.push({
    name: 'Chapter editor event ownership',
    status: 'passed',
    detail: `${CHAPTER_ID} can see both disposable events as owned chapter events.`,
  })

  const registrationResult = await EventService.registerForEvent(
    supabase,
    OPEN_EVENT_ID,
    users.participant.id
  )
  assertResult(registrationResult.success, 'Public participant could not register for open event.')
  assertResult(
    registrationResult.success && !!registrationResult.registration.qr_token,
    'Open registration did not create a QR token.'
  )
  const openRegistration = registrationResult.registration
  flows.push({
    name: 'Open event registration',
    status: 'passed',
    detail: 'Public participant registered for an open event without chapter membership.',
  })

  const questions = await EventApplicationService.getQuestionsForEvent(supabase, APPLICATION_EVENT_ID)
  assertResult(questions.length === 2, 'Application event did not expose native questions.')

  const participantApplication = await EventService.applyForEvent(
    supabase,
    APPLICATION_EVENT_ID,
    users.participant.id,
    {
      applicationAnswers: [
        {
          questionId: REQUIRED_QUESTION_ID,
          value: 'I want to practice leadership and contribute to the LEAD community.',
        },
        {
          questionId: OPTIONAL_URL_QUESTION_ID,
          value: 'https://linkedin.com/in/lead-validation',
        },
      ],
    }
  )
  assertResult(participantApplication.success, 'Public participant could not apply to application event.')

  const memberApplication = await EventService.applyForEvent(
    supabase,
    APPLICATION_EVENT_ID,
    users.member.id,
    {
      applicationAnswers: [
        {
          questionId: REQUIRED_QUESTION_ID,
          value: 'I want to support the event and learn from the community.',
        },
      ],
    }
  )
  assertResult(memberApplication.success, 'Member could not apply to application event.')

  const applicationRegistrations = [
    participantApplication.registration,
    memberApplication.registration,
  ] satisfies EventRegistrationRow[]
  flows.push({
    name: 'Application event submission',
    status: 'passed',
    detail: 'Public participant and member submitted application answers through native question storage.',
  })

  await approveApplication(
    supabase,
    APPLICATION_EVENT_ID,
    applicationRegistrations[0].id,
    users.editor.id
  )
  const rejectResult = await EventService.bulkRejectApplications(
    supabase,
    APPLICATION_EVENT_ID,
    [applicationRegistrations[1].id]
  )
  assertResult(rejectResult.success, rejectResult.error ?? 'Application rejection failed.')

  const { data: reviewedRows, error: reviewLookupError } = await supabase
    .from('event_registration')
    .select('id,status,qr_token')
    .in('id', applicationRegistrations.map((registration) => registration.id))

  if (reviewLookupError) throw new Error(`Could not verify review outcomes: ${reviewLookupError.message}`)

  const approvedRow = reviewedRows?.find((row) => row.id === applicationRegistrations[0].id)
  const rejectedRow = reviewedRows?.find((row) => row.id === applicationRegistrations[1].id)
  assertResult(approvedRow?.status === 'registered' && !!approvedRow.qr_token, 'Approved application did not become a registered attendee with QR token.')
  assertResult(rejectedRow?.status === 'rejected', 'Rejected application did not become rejected.')
  flows.push({
    name: 'Application review',
    status: 'passed',
    detail: 'Chapter editor approval and rejection paths were validated through service/RPC behavior.',
  })

  const candidate = await EventService.resolveCheckInCandidate(
    supabase,
    OPEN_EVENT_ID,
    openRegistration.qr_token ?? ''
  )
  assertResult(candidate.ok && candidate.status === 'ready', 'Open registration QR token did not resolve to a ready check-in candidate.')
  if (!candidate.ok || candidate.status !== 'ready') {
    throw new Error('Check-in candidate narrowing failed.')
  }

  const checkInResult = await EventService.checkInAttendee(
    supabase,
    candidate.registrationId,
    OPEN_EVENT_ID,
    users.editor.id
  )
  assertResult('success' in checkInResult && checkInResult.success, 'Check-in did not succeed.')

  const counter = await EventService.getCheckInCounter(supabase, OPEN_EVENT_ID)
  assertResult(counter?.checkedIn === 1 && counter.total === 1, 'Check-in counter did not reflect one attended registration.')
  flows.push({
    name: 'Check-in evidence',
    status: 'passed',
    detail: 'QR candidate resolution, attendee check-in, and check-in counter passed.',
  })

  const adminEvents = await EventService.getAllEventsAdmin(supabase)
  assertResult(
    adminEvents.some((event) => event.id === OPEN_EVENT_ID) &&
      adminEvents.some((event) => event.id === APPLICATION_EVENT_ID),
    'Admin event listing did not include disposable events.'
  )
  flows.push({
    name: 'Admin event oversight',
    status: 'passed',
    detail: 'Admin event listing includes both disposable events.',
  })

  return flows
}

function markdownStatus(result: FlowResult): string {
  return `| ${result.name} | ${result.status} | ${result.detail} |`
}

function buildReport(summary: Summary): string {
  const preconditions = summary.preconditions.map(markdownStatus).join('\n')
  const flows = summary.flows.map(markdownStatus).join('\n')

  return `# Issue #132 - Multi-event Operations Readiness Validation Report

## Recommendation

${summary.recommendation}

## Scope

This validation was run against local Supabase Docker only. QA and production were not touched.

## Disposable Data

| Item | Value |
| --- | --- |
| Cleaned up | ${summary.disposableData.cleanedUp ? 'yes' : 'no'} |
| Kept for debugging | ${summary.disposableData.keptForDebugging ? 'yes' : 'no'} |
| Event IDs | ${summary.disposableData.eventIds.join(', ')} |
| Question IDs | ${summary.disposableData.questionIds.join(', ')} |

## Preconditions

| Check | Status | Detail |
| --- | --- | --- |
${preconditions}

## Validated Flows

| Flow | Status | Detail |
| --- | --- | --- |
${flows}

## Known Gaps

- This is service-level/local operational validation, not a full browser QA pass.
- This does not create a LEAD SPARK production event.
- This does not import real members or open company access.

## Evidence

- Summary JSON: \`${summary.evidence.summaryJson}\`
- Report Markdown: \`${summary.evidence.reportMarkdown}\`
`
}

async function writeEvidence(summary: Summary, outputDirectory: string): Promise<void> {
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(summary.evidence.summaryJson, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  await writeFile(summary.evidence.reportMarkdown, buildReport(summary), 'utf8')
}

async function clearOutputDirectory(outputDirectory: string): Promise<void> {
  await rm(outputDirectory, { recursive: true, force: true })
  await mkdir(outputDirectory, { recursive: true })
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const outputDirectory = resolve(process.cwd(), options.out)
  await clearOutputDirectory(outputDirectory)

  const env = await loadLocalEnv()
  const supabase = createLocalClient(env)
  const { users, results: preconditions } = await verifyPreconditions(supabase)
  const summaryJson = resolve(outputDirectory, 'event-ops-readiness-summary.json')
  const reportMarkdown = resolve(outputDirectory, 'event-ops-readiness-report.md')

  let cleanedUp = false
  let flows: FlowResult[] = []

  try {
    await cleanupDisposableRows(supabase)
    await createDisposableEvents(supabase, users.editor.id)
    flows = await runReadinessFlows(supabase, users)

    if (!options.keepData) {
      await cleanupDisposableRows(supabase)
      cleanedUp = true
    }

    const summary: Summary = {
      issue: 132,
      status: 'passed',
      recommendation: 'Ready for controlled event ops pilot',
      localOnly: true,
      generatedAt: new Date().toISOString(),
      outputDirectory,
      disposableData: {
        cleanedUp,
        keptForDebugging: options.keepData,
        eventIds: EVENT_IDS,
        questionIds: QUESTION_IDS,
      },
      preconditions,
      flows,
      evidence: {
        summaryJson,
        reportMarkdown,
      },
    }

    await writeEvidence(summary, outputDirectory)
    console.log(`Event ops readiness: passed (${flows.length}/${flows.length} flows)`)
    console.log(`Evidence written to ${outputDirectory}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const failedSummary: Summary = {
      issue: 132,
      status: 'failed',
      recommendation: 'Not ready',
      localOnly: true,
      generatedAt: new Date().toISOString(),
      outputDirectory,
      disposableData: {
        cleanedUp,
        keptForDebugging: options.keepData,
        eventIds: EVENT_IDS,
        questionIds: QUESTION_IDS,
      },
      preconditions,
      flows: [
        ...flows,
        {
          name: 'Validation failure',
          status: 'failed',
          detail: message,
        },
      ],
      evidence: {
        summaryJson,
        reportMarkdown,
      },
    }

    await writeEvidence(failedSummary, outputDirectory)

    if (!options.keepData) {
      await cleanupDisposableRows(supabase).catch((cleanupError: unknown) => {
        const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
        console.error(`Cleanup after failure did not complete: ${cleanupMessage}`)
      })
    }

    throw error
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Event ops readiness failed: ${message}`)
  process.exitCode = 1
})
