import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resolveRecruiterAccess } from '@/lib/auth'
import type { Database } from '@/lib/database.generated'
import { CompanyService } from '@/lib/services/company.service'
import { RecruiterService } from '@/lib/services/recruiter.service'

const DEFAULT_OUTPUT = 'tmp/company-portal-118'
const ENV_LOCAL_PATH = '.env.local'
const CHAPTER_ID = 'leaduni'
const ADMIN_EMAIL = 'admin@test.com'

const COMPANY_ID = '11800000-0000-4000-8000-000000000001'

const USERS = {
  activeRep: { id: '11800000-0000-4000-8000-000000000010', email: 'company-active-118@test.com', name: 'Issue 118 Active Company Rep', role: 'recruiter' },
  missingRep: { id: '11800000-0000-4000-8000-000000000011', email: 'company-missing-118@test.com', name: 'Issue 118 Missing Company Rep', role: 'recruiter' },
  inactiveRep: { id: '11800000-0000-4000-8000-000000000012', email: 'company-inactive-118@test.com', name: 'Issue 118 Inactive Company Rep', role: 'recruiter' },
  revokedRep: { id: '11800000-0000-4000-8000-000000000013', email: 'company-revoked-118@test.com', name: 'Issue 118 Revoked Company Rep', role: 'recruiter' },
  expiredRep: { id: '11800000-0000-4000-8000-000000000014', email: 'company-expired-118@test.com', name: 'Issue 118 Expired Company Rep', role: 'recruiter' },
  visibleMember: { id: '11800000-0000-4000-8000-000000000101', email: 'visible-member-118@test.com', name: 'Issue118 Visible Approved Member', role: 'member' },
  hiddenMember: { id: '11800000-0000-4000-8000-000000000102', email: 'hidden-member-118@test.com', name: 'Issue118 Hidden Approved Member', role: 'member' },
  publicParticipant: { id: '11800000-0000-4000-8000-000000000103', email: 'public-participant-118@test.com', name: 'Issue118 Public Participant', role: 'member' },
  pendingMember: { id: '11800000-0000-4000-8000-000000000104', email: 'pending-member-118@test.com', name: 'Issue118 Pending Member', role: 'member' },
  rejectedMember: { id: '11800000-0000-4000-8000-000000000105', email: 'rejected-member-118@test.com', name: 'Issue118 Rejected Member', role: 'member' },
  alumniMember: { id: '11800000-0000-4000-8000-000000000106', email: 'alumni-member-118@test.com', name: 'Issue118 Alumni Member', role: 'member' },
} as const

const USER_IDS = Object.values(USERS).map((user) => user.id)
const TALENT_IDS = [
  USERS.visibleMember.id,
  USERS.hiddenMember.id,
  USERS.publicParticipant.id,
  USERS.pendingMember.id,
  USERS.rejectedMember.id,
  USERS.alumniMember.id,
]

type CliOptions = {
  out: string
  keepData: boolean
  help: boolean
}

type LocalEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

type FlowResult = {
  name: string
  status: 'passed' | 'failed'
  detail: string
}

type Summary = {
  issue: number
  status: 'passed' | 'failed'
  recommendation: 'Ready for controlled local/company QA' | 'Ready with caveats' | 'Not ready'
  localOnly: true
  generatedAt: string
  outputDirectory: string
  disposableData: {
    cleanedUp: boolean
    keptForDebugging: boolean
    companyId: string
    userIds: string[]
  }
  preconditions: FlowResult[]
  flows: FlowResult[]
  evidence: {
    summaryJson: string
    reportMarkdown: string
  }
}

function printHelp(): void {
  console.log(`Company portal readiness validation

Usage:
  pnpm company-portal:readiness
  pnpm company-portal:readiness -- --out tmp/company-portal-118
  pnpm company-portal:readiness -- --keep-data

Options:
  --out <path>     Output directory. Default: ${DEFAULT_OUTPUT}
  --keep-data      Keep disposable #118 local rows for debugging.
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
    throw new Error(`Company portal validation requires ${ENV_LOCAL_PATH}.`)
  }

  const env = parseEnvFile(await readFile(envPath, 'utf8'))
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(`Company portal validation requires NEXT_PUBLIC_SUPABASE_URL in ${ENV_LOCAL_PATH}.`)
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(`Company portal validation requires SUPABASE_SERVICE_ROLE_KEY in ${ENV_LOCAL_PATH}.`)
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

function assertResult(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function verifyPreconditions(
  supabase: SupabaseClient<Database>
): Promise<{ adminId: string; results: FlowResult[] }> {
  const [{ data: chapter, error: chapterError }, { data: admin, error: adminError }] = await Promise.all([
    supabase.from('chapter').select('id,name').eq('id', CHAPTER_ID).maybeSingle(),
    supabase.from('user').select('id,email').eq('email', ADMIN_EMAIL).maybeSingle(),
  ])

  if (chapterError) throw new Error(`Could not load ${CHAPTER_ID}. Is local Docker running? ${chapterError.message}`)
  if (!chapter) throw new Error(`Missing canonical chapter: ${CHAPTER_ID}`)
  if (adminError) throw new Error(`Could not load ${ADMIN_EMAIL}: ${adminError.message}`)
  if (!admin) throw new Error(`Missing seed admin user: ${ADMIN_EMAIL}`)

  return {
    adminId: admin.id,
    results: [
      {
        name: 'Local Supabase connection',
        status: 'passed',
        detail: 'Connected to local Supabase and queried seed tables.',
      },
      {
        name: 'Canonical chapter',
        status: 'passed',
        detail: `${chapter.name} (${chapter.id}) exists locally.`,
      },
      {
        name: 'Seed admin',
        status: 'passed',
        detail: `${ADMIN_EMAIL} exists for disposable company ownership.`,
      },
    ],
  }
}

async function cleanupDisposableRows(supabase: SupabaseClient<Database>): Promise<void> {
  const deletions = [
    supabase.from('resume_download_log').delete().in('student_id', TALENT_IDS),
    supabase.from('saved_student').delete().or(`recruiter_id.in.(${USER_IDS.join(',')}),student_id.in.(${USER_IDS.join(',')})`),
    supabase.from('recruiter_access').delete().eq('company_id', COMPANY_ID),
    supabase.from('resume').delete().in('student_id', TALENT_IDS),
    supabase.from('chapter_membership').delete().in('user_id', USER_IDS),
    supabase.from('person_profile').delete().in('user_id', USER_IDS),
  ]

  for (const deletion of deletions) {
    const { error } = await deletion
    if (error) throw new Error(`Could not clean disposable #118 rows: ${error.message}`)
  }

  const userDelete = await supabase.from('user').delete().in('id', USER_IDS)
  if (userDelete.error) throw new Error(`Could not clean disposable #118 users: ${userDelete.error.message}`)

  for (const userId of USER_IDS) {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error && !error.message.toLowerCase().includes('user not found')) {
      throw new Error(`Could not clean disposable #118 auth user ${userId}: ${error.message}`)
    }
  }

  const companyDelete = await supabase.from('company').delete().eq('id', COMPANY_ID)
  if (companyDelete.error) throw new Error(`Could not clean disposable #118 company: ${companyDelete.error.message}`)
}

function daysFromNow(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

async function seedDisposableRows(supabase: SupabaseClient<Database>, adminId: string): Promise<void> {
  const now = new Date().toISOString()
  const userRows = Object.values(USERS).map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: null,
    role: user.role as 'member' | 'recruiter',
    created_at: now,
    updated_at: now,
  }))

  for (const user of Object.values(USERS)) {
    const { error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: user.name,
      },
    } as Parameters<typeof supabase.auth.admin.createUser>[0] & { id: string })

    if (error) throw new Error(`Could not seed #118 auth user ${user.email}: ${error.message}`)
  }

  const { error: userError } = await supabase.from('user').upsert(userRows, { onConflict: 'id' })
  if (userError) throw new Error(`Could not seed #118 users: ${userError.message}`)

  const { error: companyError } = await supabase.from('company').insert({
    id: COMPANY_ID,
    name: 'Issue 118 Test Company',
    created_by_id: adminId,
    created_at: now,
  })
  if (companyError) throw new Error(`Could not seed #118 company: ${companyError.message}`)

  const { error: accessError } = await supabase.from('recruiter_access').insert([
    {
      id: '11800000-0000-4000-8000-000000000201',
      company_id: COMPANY_ID,
      recruiter_email: USERS.activeRep.email,
      invite_token: '11800000-0000-4000-8000-000000000301',
      granted_by_id: adminId,
      accepted_by_user_id: USERS.activeRep.id,
      accepted_at: now,
      is_active: true,
      invite_expires_at: daysFromNow(30),
      revoked_at: null,
      revoked_by_id: null,
    },
    {
      id: '11800000-0000-4000-8000-000000000202',
      company_id: COMPANY_ID,
      recruiter_email: USERS.inactiveRep.email,
      invite_token: '11800000-0000-4000-8000-000000000302',
      granted_by_id: adminId,
      accepted_by_user_id: USERS.inactiveRep.id,
      accepted_at: now,
      is_active: false,
      invite_expires_at: daysFromNow(30),
      revoked_at: null,
      revoked_by_id: null,
    },
    {
      id: '11800000-0000-4000-8000-000000000203',
      company_id: COMPANY_ID,
      recruiter_email: USERS.revokedRep.email,
      invite_token: '11800000-0000-4000-8000-000000000303',
      granted_by_id: adminId,
      accepted_by_user_id: USERS.revokedRep.id,
      accepted_at: now,
      is_active: false,
      invite_expires_at: daysFromNow(30),
      revoked_at: now,
      revoked_by_id: adminId,
    },
    {
      id: '11800000-0000-4000-8000-000000000204',
      company_id: COMPANY_ID,
      recruiter_email: USERS.expiredRep.email,
      invite_token: '11800000-0000-4000-8000-000000000304',
      granted_by_id: adminId,
      accepted_by_user_id: USERS.expiredRep.id,
      accepted_at: now,
      is_active: true,
      invite_expires_at: daysFromNow(-1),
      revoked_at: null,
      revoked_by_id: null,
    },
  ])
  if (accessError) throw new Error(`Could not seed #118 recruiter access: ${accessError.message}`)

  const { error: profileError } = await supabase.from('person_profile').insert([
    profileRow(USERS.visibleMember.id, true, 'Computer Science'),
    profileRow(USERS.hiddenMember.id, false, 'Computer Science'),
    profileRow(USERS.publicParticipant.id, true, 'Computer Science'),
    profileRow(USERS.pendingMember.id, true, 'Computer Science'),
    profileRow(USERS.rejectedMember.id, true, 'Computer Science'),
    profileRow(USERS.alumniMember.id, true, 'Computer Science'),
  ])
  if (profileError) throw new Error(`Could not seed #118 profiles: ${profileError.message}`)

  const { error: membershipError } = await supabase.from('chapter_membership').insert([
    membershipRow(USERS.visibleMember.id, 'approved', 'member', 'LEAD-118-0001', adminId),
    membershipRow(USERS.hiddenMember.id, 'approved', 'member', 'LEAD-118-0002', adminId),
    membershipRow(USERS.pendingMember.id, 'pending', 'member', null, null),
    membershipRow(USERS.rejectedMember.id, 'rejected', 'member', null, null),
    membershipRow(USERS.alumniMember.id, 'alumni', 'member', 'LEAD-118-0003', adminId),
  ])
  if (membershipError) throw new Error(`Could not seed #118 memberships: ${membershipError.message}`)

  const { error: saveError } = await supabase.from('saved_student').insert([
    {
      recruiter_id: USERS.activeRep.id,
      student_id: USERS.visibleMember.id,
      saved_at: now,
      notes: null,
    },
    {
      recruiter_id: USERS.activeRep.id,
      student_id: USERS.hiddenMember.id,
      saved_at: now,
      notes: null,
    },
  ])
  if (saveError) throw new Error(`Could not seed #118 saved profiles: ${saveError.message}`)

  const { error: resumeError } = await supabase.from('resume').insert({
    student_id: USERS.hiddenMember.id,
    file_name: 'hidden-member-118.pdf',
    file_size: 1024,
    file_url: 'https://example.supabase.co/storage/v1/object/public/resumes/hidden-member-118/resume.pdf',
    uploaded_at: now,
    parsed_data: null,
  })
  if (resumeError) throw new Error(`Could not seed #118 resume: ${resumeError.message}`)
}

function profileRow(userId: string, visible: boolean, major: string) {
  const now = new Date().toISOString()
  return {
    user_id: userId,
    university: 'Issue 118 University',
    major_or_interest: major,
    graduation_year: 2027,
    linkedin_url: `https://linkedin.com/in/${userId}`,
    portfolio_url: `https://portfolio.example.com/${userId}`,
    skills: ['Leadership', 'Data'],
    is_recruiter_visible: visible,
    gender: null,
    created_at: now,
    updated_at: now,
  }
}

function membershipRow(
  userId: string,
  status: 'approved' | 'pending' | 'rejected' | 'alumni',
  position: string,
  memberId: string | null,
  approvedById: string | null
) {
  const now = new Date().toISOString()
  return {
    user_id: userId,
    chapter_id: CHAPTER_ID,
    status,
    position,
    member_id: memberId,
    approved_by_id: approvedById,
    joined_at: status === 'approved' || status === 'alumni' ? now : null,
    created_at: now,
    updated_at: now,
  }
}

async function runReadinessFlows(supabase: SupabaseClient<Database>): Promise<FlowResult[]> {
  const flows: FlowResult[] = []

  const visibleStudents = await CompanyService.getVisibleStudents(supabase)
  const disposableVisible = visibleStudents.filter((student) => TALENT_IDS.includes(student.id))
  assertResult(
    disposableVisible.length === 1 && disposableVisible[0].id === USERS.visibleMember.id,
    `CompanyService.getVisibleStudents exposed unexpected #118 users: ${disposableVisible.map((student) => student.id).join(', ')}`
  )
  flows.push({
    name: 'Company visible talent eligibility',
    status: 'passed',
    detail: 'Only the approved opted-in #118 member appeared in CompanyService.getVisibleStudents.',
  })

  for (const hiddenUser of [
    USERS.hiddenMember,
    USERS.publicParticipant,
    USERS.pendingMember,
    USERS.rejectedMember,
    USERS.alumniMember,
  ]) {
    const direct = await CompanyService.getStudentById(supabase, hiddenUser.id)
    assertResult(!direct, `${hiddenUser.email} should not be visible through CompanyService.getStudentById.`)

    const searchResults = await CompanyService.searchStudents(supabase, {
      query: hiddenUser.name,
    })
    assertResult(
      !searchResults.some((student) => student.id === hiddenUser.id),
      `${hiddenUser.email} should not be visible through CompanyService.searchStudents.`
    )
  }
  flows.push({
    name: 'Hidden and ineligible company talent exclusion',
    status: 'passed',
    detail: 'Hidden, public participant, pending, rejected, and alumni #118 users were excluded from direct lookup and search.',
  })

  const visibleDetail = await CompanyService.getStudentById(supabase, USERS.visibleMember.id)
  assertResult(visibleDetail?.id === USERS.visibleMember.id, 'Visible approved member should load through CompanyService.getStudentById.')
  flows.push({
    name: 'Visible approved member direct detail',
    status: 'passed',
    detail: 'Approved opted-in #118 member loaded through direct company detail lookup.',
  })

  const savedStudents = await CompanyService.getSavedStudents(supabase, USERS.activeRep.id)
  const disposableSaved = savedStudents.filter((saved) => TALENT_IDS.includes(saved.student_id))
  assertResult(
    disposableSaved.length === 1 && disposableSaved[0].student_id === USERS.visibleMember.id,
    `Saved profiles should re-check visibility and return only visible #118 member; got ${disposableSaved.map((saved) => saved.student_id).join(', ')}`
  )
  flows.push({
    name: 'Saved profiles current visibility re-check',
    status: 'passed',
    detail: 'Saved hidden #118 row remained hidden; saved visible #118 member appeared.',
  })

  const saveHidden = await CompanyService.toggleSaveStudent(supabase, USERS.activeRep.id, USERS.pendingMember.id)
  assertResult(!saveHidden.success, 'CompanyService.toggleSaveStudent should reject pending/ineligible members.')
  flows.push({
    name: 'Save action visibility guard',
    status: 'passed',
    detail: 'Company representative could not save an ineligible pending #118 member.',
  })

  const hiddenResume = await CompanyService.createResumeDownloadUrl(supabase, USERS.activeRep.id, USERS.hiddenMember.id)
  assertResult(!hiddenResume.success, 'Resume download should be denied for hidden/ineligible talent.')
  flows.push({
    name: 'Resume download visibility guard',
    status: 'passed',
    detail: 'Hidden #118 member resume download was denied before any successful download URL.',
  })

  const talentPool = await RecruiterService.getTalentPool(supabase, { query: 'Issue118' }, { page: 1, pageSize: 20 })
  const disposableTalent = talentPool.students.filter((student) => TALENT_IDS.includes(student.id))
  assertResult(
    disposableTalent.length === 1 && disposableTalent[0].id === USERS.visibleMember.id,
    `RecruiterService.getTalentPool exposed unexpected #118 users: ${disposableTalent.map((student) => student.id).join(', ')}`
  )

  const recruiterHiddenDetail = await RecruiterService.getStudentProfile(supabase, USERS.hiddenMember.id)
  const recruiterVisibleDetail = await RecruiterService.getStudentProfile(supabase, USERS.visibleMember.id)
  assertResult(!recruiterHiddenDetail, 'RecruiterService.getStudentProfile should deny hidden #118 member.')
  assertResult(recruiterVisibleDetail?.id === USERS.visibleMember.id, 'RecruiterService.getStudentProfile should allow visible #118 member.')
  flows.push({
    name: 'Recruiter service visibility parity',
    status: 'passed',
    detail: 'Recruiter talent pool/detail returned only the approved opted-in #118 member.',
  })

  const accessCases = [
    { name: 'active accepted access', userId: USERS.activeRep.id, allowed: true as const },
    { name: 'missing access', userId: USERS.missingRep.id, allowed: false as const, reason: 'missing' },
    { name: 'inactive access', userId: USERS.inactiveRep.id, allowed: false as const, reason: 'inactive' },
    { name: 'revoked access', userId: USERS.revokedRep.id, allowed: false as const, reason: 'revoked' },
    { name: 'expired access', userId: USERS.expiredRep.id, allowed: false as const, reason: 'expired' },
  ]

  for (const accessCase of accessCases) {
    const result = await resolveRecruiterAccess(supabase, accessCase.userId)
    if (accessCase.allowed) {
      assertResult(result.allowed, `${accessCase.name} should be allowed.`)
      continue
    }

    assertResult(
      !result.allowed && result.reason === accessCase.reason,
      `${accessCase.name} should be denied with reason ${accessCase.reason}.`
    )
  }
  flows.push({
    name: 'Invite-only company portal access states',
    status: 'passed',
    detail: 'Active accepted access was allowed; missing, inactive, revoked, and expired access were denied.',
  })

  return flows
}

function markdownStatus(result: FlowResult): string {
  return `| ${result.name} | ${result.status} | ${result.detail} |`
}

function buildReport(summary: Summary): string {
  const preconditions = summary.preconditions.map(markdownStatus).join('\n')
  const flows = summary.flows.map(markdownStatus).join('\n')

  return `# Issue #118 - Company Visibility and Invite-only Portal Validation Report

## Recommendation

${summary.recommendation}

## Scope

This validation was run against local Supabase Docker only. QA and production were not touched.

## Disposable Data

| Item | Value |
| --- | --- |
| Cleaned up | ${summary.disposableData.cleanedUp ? 'yes' : 'no'} |
| Kept for debugging | ${summary.disposableData.keptForDebugging ? 'yes' : 'no'} |
| Company ID | ${summary.disposableData.companyId} |
| User IDs | ${summary.disposableData.userIds.join(', ')} |

## Preconditions

| Check | Status | Detail |
| --- | --- | --- |
${preconditions}

## Validated Flows

| Flow | Status | Detail |
| --- | --- | --- |
${flows}

## Known Gaps

- This is local service/access validation, not production smoke.
- Production auth and schema blockers remain tracked separately in #119, #120, #121, and #123.
- Real company access should not be opened until executive go/no-go clears.

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
  const { adminId, results: preconditions } = await verifyPreconditions(supabase)
  const summaryJson = resolve(outputDirectory, 'company-portal-readiness-summary.json')
  const reportMarkdown = resolve(outputDirectory, 'company-portal-readiness-report.md')

  let cleanedUp = false
  let flows: FlowResult[] = []

  try {
    await cleanupDisposableRows(supabase)
    await seedDisposableRows(supabase, adminId)
    flows = await runReadinessFlows(supabase)

    if (!options.keepData) {
      await cleanupDisposableRows(supabase)
      cleanedUp = true
    }

    const summary: Summary = {
      issue: 118,
      status: 'passed',
      recommendation: 'Ready for controlled local/company QA',
      localOnly: true,
      generatedAt: new Date().toISOString(),
      outputDirectory,
      disposableData: {
        cleanedUp,
        keptForDebugging: options.keepData,
        companyId: COMPANY_ID,
        userIds: USER_IDS,
      },
      preconditions,
      flows,
      evidence: {
        summaryJson,
        reportMarkdown,
      },
    }

    await writeEvidence(summary, outputDirectory)
    console.log(`Company portal readiness: passed (${flows.length}/${flows.length} flows)`)
    console.log(`Evidence written to ${outputDirectory}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const failedSummary: Summary = {
      issue: 118,
      status: 'failed',
      recommendation: 'Not ready',
      localOnly: true,
      generatedAt: new Date().toISOString(),
      outputDirectory,
      disposableData: {
        cleanedUp,
        keptForDebugging: options.keepData,
        companyId: COMPANY_ID,
        userIds: USER_IDS,
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
  console.error(`Company portal readiness failed: ${message}`)
  process.exitCode = 1
})
