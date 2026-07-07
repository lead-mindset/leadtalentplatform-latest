import { describe, expect, it } from 'vitest'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

type SourceFile = {
  relativePath: string
  content: string
}

const ROOT = process.cwd()
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])
const IGNORED_DIRS = new Set([
  '.git',
  '.next',
  'coverage',
  'node_modules',
  'supabase',
])

const FOUNDATION_SERVICES = [
  'person-profile.service.ts',
  'chapter-membership.service.ts',
  'lead-identity.service.ts',
  'newsletter-subscription.service.ts',
  'event-application.service.ts',
] as const

const ACTION_DIRECT_DB_ALLOWLIST = new Map([
  [
    'lib/actions/student/generate-member-ids.ts',
    'Legacy admin utility; move to a service when member ID workflows are next touched.',
  ],
  [
    'lib/actions/events/event-chapter.ts',
    'Existing collaborator lookup path; candidate for EventService consolidation.',
  ],
  [
    'lib/actions/events/register.ts',
    'Existing registration preflight lookup; candidate for EventService consolidation.',
  ],
])

const UI_DIRECT_DB_ALLOWLIST = new Map([
  ['app/api/chapter/members/route.ts', 'Existing API route backed by ChapterService plus route-local auth.'],
  ['app/api/events/[eventId]/applications/[applicationId]/approve/route.ts', 'Existing application review API route; migrate to service wrapper when event review is next touched.'],
  ['app/api/events/[eventId]/applications/[applicationId]/reject/route.ts', 'Existing application review API route; migrate to service wrapper when event review is next touched.'],
  ['app/api/webhooks/welcome-email/route.tsx', 'Webhook route needs service-role client boundary.'],
  ['app/[locale]/(public)/_components/navbar.tsx', 'Existing server navigation user lookup.'],
  ['app/[locale]/admin/chapters/new/page.tsx', 'Existing admin form bootstrap lookup.'],
  ['app/[locale]/admin/companies/new/page.tsx', 'Existing admin form bootstrap lookup.'],
  ['app/[locale]/admin/events/[id]/page.tsx', 'Existing admin event edit bootstrap lookup.'],
  ['app/[locale]/admin/users/[id]/page.tsx', 'Existing admin user detail bootstrap lookup.'],
  ['app/[locale]/auth/callback/route.ts', 'Auth callback creates first-party user/profile records.'],
  ['app/[locale]/auth/confirm/route.ts', 'Auth confirm creates first-party user/profile records.'],
  ['app/[locale]/(public)/chapter/[id]/page.tsx', 'Existing public chapter detail read path.'],
  ['app/[locale]/chapter/events/[id]/page.tsx', 'Existing chapter event editor bootstrap lookup.'],
  ['app/[locale]/chapter/events/new/page.tsx', 'Existing chapter event form bootstrap lookup.'],
  ['app/[locale]/chapter/layout.tsx', 'Existing chapter sidebar membership gate.'],
  ['app/[locale]/chapter/members/page.tsx', 'Existing chapter members page bootstrap lookup.'],
  ['app/[locale]/chapter/page.tsx', 'Existing chapter dashboard bootstrap lookup.'],
  ['app/[locale]/discover/page.tsx', 'Existing public discovery read path.'],
  ['app/[locale]/events/[id]/page.tsx', 'Existing event detail registration/application bootstrap lookup.'],
  ['app/[locale]/onboarding/page.tsx', 'Existing onboarding auth/client bootstrap.'],
  ['app/[locale]/recruiter/access/page.tsx', 'Existing recruiter access page bootstrap lookup.'],
  ['app/[locale]/student/layout.tsx', 'Existing student sidebar membership gate.'],
  ['app/[locale]/student/profile/page.tsx', 'Existing student profile membership display lookup.'],
  ['components/auth/auth-button.tsx', 'Existing server auth button lookup.'],
  ['app/[locale]/(public)/_components/user-button.tsx', 'Existing server user button auth lookup.'],
  ['app/[locale]/company/login/page.tsx', 'Existing company auth redirect/client bootstrap.'],
  ['app/[locale]/recruiter/access/google-invite-signin-button.tsx', 'Existing recruiter invite auth client flow.'],
  ['components/auth/forgot-password.tsx', 'Existing auth client flow.'],
  ['components/auth/google-button.tsx', 'Existing auth client flow.'],
  ['components/auth/login.tsx', 'Existing auth client flow.'],
  ['components/auth/logout-button.tsx', 'Existing auth client flow.'],
  ['components/auth/sign-up.tsx', 'Existing auth client flow.'],
  ['components/auth/update-password.tsx', 'Existing auth client flow.'],
  ['components/global/navigation/NavHeader.tsx', 'Existing server navigation lookup.'],
  ['app/[locale]/recruiter/access/invite-email-signin-button.tsx', 'Recruiter invite auth client flow — uses supabase.auth.signInWithOtp().'],
])

async function collectSourceFiles(rootRelativePath: string): Promise<SourceFile[]> {
  const rootPath = path.join(ROOT, rootRelativePath)
  const files: SourceFile[] = []

  async function walk(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue

      const entryPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        await walk(entryPath)
        continue
      }

      if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue
      if (entry.name === 'database.generated.ts') continue

      files.push({
        relativePath: normalizePath(path.relative(ROOT, entryPath)),
        content: await readFile(entryPath, 'utf8'),
      })
    }
  }

  await walk(rootPath)
  return files
}

async function collectMigrationFiles(): Promise<SourceFile[]> {
  const migrationPath = path.join(ROOT, 'supabase', 'migrations')
  const entries = await readdir(migrationPath, { withFileTypes: true })

  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => ({
        relativePath: normalizePath(path.join('supabase', 'migrations', entry.name)),
        content: await readFile(path.join(migrationPath, entry.name), 'utf8'),
      }))
  )
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/')
}

function findDirectDbFiles(files: SourceFile[]): string[] {
  return files
    .filter(({ content }) =>
      /\.(from)\s*\(\s*['"`]/.test(content) ||
      /storage\s*\.\s*from\s*\(\s*['"`]/.test(content)
    )
    .map(({ relativePath }) => relativePath)
    .sort()
}

function findDirectSupabaseBoundaryFiles(files: SourceFile[]): string[] {
  return files
    .filter(({ content }) =>
      /\.(from)\s*\(\s*['"`]/.test(content) ||
      /storage\s*\.\s*from\s*\(\s*['"`]/.test(content) ||
      /from\s+['"]@\/lib\/supabase\//.test(content) ||
      /from\s+['"]@\/lib\/supabase\/server-service['"]/.test(content)
    )
    .map(({ relativePath }) => relativePath)
    .sort()
}

function expectNoUnlistedFiles(
  actualFiles: string[],
  allowlist: Map<string, string>,
  message: string
): void {
  const unlisted = actualFiles.filter((file) => !allowlist.has(file))

  expect(
    unlisted,
    `${message}\n\nUnlisted files:\n${unlisted.join('\n') || '(none)'}\n\nAllowed baseline:\n${[...allowlist.entries()]
      .map(([file, reason]) => `- ${file}: ${reason}`)
      .join('\n')}`
  ).toEqual([])
}

describe('architecture boundaries', () => {
  it('keeps services framework-agnostic and independent from UI/actions', async () => {
    const serviceFiles = await collectSourceFiles('lib/services')
    const forbiddenImports = serviceFiles.flatMap(({ relativePath, content }) => {
      const matches = content.matchAll(
        /from\s+['"](@\/app|@\/components|@\/lib\/actions|next\/(?:cache|navigation|headers|server))[^'"]*['"]/g
      )

      return [...matches].map((match) => `${relativePath}: ${match[0]}`)
    })

    expect(
      forbiddenImports,
      'Architecture rule: services must stay framework-agnostic and cannot import UI/actions/routes.'
    ).toEqual([])
  })

  it('keeps server actions thin by blocking new direct database access', async () => {
    const actionFiles = await collectSourceFiles('lib/actions')
    const directDbFiles = findDirectDbFiles(actionFiles)

    expectNoUnlistedFiles(
      directDbFiles,
      ACTION_DIRECT_DB_ALLOWLIST,
      'Architecture rule: server actions should delegate DB/business logic to services. Move this query into `lib/services/` or add a documented allowlist entry.'
    )
  })

  it('blocks new direct database access from UI and routes', async () => {
    const uiFiles = [
      ...(await collectSourceFiles('app')),
      ...(await collectSourceFiles('components')),
    ]
    const directDbFiles = findDirectSupabaseBoundaryFiles(uiFiles)

    expectNoUnlistedFiles(
      directDbFiles,
      UI_DIRECT_DB_ALLOWLIST,
      'Architecture rule: UI/routes should call actions/services instead of adding direct DB queries.'
    )
  }, 20_000)

  it('keeps foundation domain services present and tested', async () => {
    const missing = FOUNDATION_SERVICES.flatMap((serviceFile) => {
      const testFile = serviceFile.replace('.service.ts', '.service.test.ts')
      const servicePath = path.join(ROOT, 'lib/services', serviceFile)
      const testPath = path.join(ROOT, 'lib/services/__tests__', testFile)

      return [
        { label: serviceFile, path: servicePath },
        { label: testFile, path: testPath },
      ]
    })

    const missingLabels: string[] = []

    for (const file of missing) {
      try {
        await readFile(file.path, 'utf8')
      } catch {
        missingLabels.push(file.label)
      }
    }

    expect(
      missingLabels,
      'Architecture rule: foundation domain services must have service tests.'
    ).toEqual([])
  })

  it('keeps student_profile legacy-only in live code', async () => {
    const files = [
      ...(await collectSourceFiles('app')),
      ...(await collectSourceFiles('components')),
      ...(await collectSourceFiles('lib')),
    ]
    const violations = files.flatMap(({ relativePath, content }) => {
      const patterns = [
        /\.from\s*\(\s*['"`]student_profile['"`]/,
        /\.from\s*\(\s*['"`]StudentProfile['"`]/,
        /student_profile\s*:/,
      ]

      return patterns.some((pattern) => pattern.test(content)) ? [relativePath] : []
    })

    expect(
      violations.sort(),
      'Architecture rule: `student_profile` is legacy/migration-only. Do not add live table access or compatibility aliases.'
    ).toEqual([])
  }, 20_000)

  it('keeps admin RLS tied to the canonical app role', async () => {
    const migrationFiles = await collectMigrationFiles()
    const definitions = migrationFiles.flatMap(({ relativePath, content }) => {
      const matches = content.matchAll(
        /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.is_admin\s*\(\)\s+RETURNS\s+boolean[\s\S]*?\$\$([\s\S]*?)\$\$/gi
      )

      return [...matches].map((match) => ({
        relativePath,
        body: match[1] ?? '',
      }))
    })

    const finalDefinition = definitions.at(-1)

    expect(
      finalDefinition,
      'Architecture rule: public.is_admin() must exist because RLS admin policies depend on it.'
    ).toBeDefined()

    expect(
      finalDefinition?.body,
      `Architecture rule: final public.is_admin() must check public."user".role, not the Supabase JWT role. Last definition: ${finalDefinition?.relativePath ?? '(missing)'}`
    ).toMatch(/FROM\s+public\."user"\s+\w+/i)

    expect(finalDefinition?.body).toMatch(/\.role\s*=\s*'admin'/i)
    expect(finalDefinition?.body).not.toMatch(/request\.jwt\.claims|auth\.jwt\(\)\s*->>\s*'role'/i)
  })

  it('keeps transactional email on Resend without legacy SMTP imports', async () => {
    const files = [
      ...(await collectSourceFiles('app')),
      ...(await collectSourceFiles('components')),
      ...(await collectSourceFiles('lib')),
      ...(await collectSourceFiles('emails')),
    ]

    const violations = files.flatMap(({ relativePath, content }) => {
      if (/from\s+['"]nodemailer['"]|require\(['"]nodemailer['"]\)/.test(content)) {
        return [relativePath]
      }
      return []
    })

    expect(
      violations.sort(),
      'Architecture rule: transactional email must use lib/emails/provider.ts and Resend, not Nodemailer/SMTP imports.'
    ).toEqual([])
  })

  it('keeps email templates free of mojibake and old brand copy', async () => {
    const files = await collectSourceFiles('emails')
    const forbidden = [/LEAD Mindset/, /Ã/, /Â/, /ðŸ/, /âœ/, /â€”/, /â€“/]
    const violations = files.flatMap(({ relativePath, content }) =>
      forbidden.some((pattern) => pattern.test(content)) ? [relativePath] : []
    )

    expect(
      violations.sort(),
      'Architecture rule: email copy must use clean LEAD Americas / LEAD Talent Platform text without mojibake.'
    ).toEqual([])
  })
})
