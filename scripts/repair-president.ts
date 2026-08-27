import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'

const ENV_LOCAL_PATH = '.env.local'
const CHAPTER_SCOPED_IDENTITY_TYPES = ['chapter_member', 'chapter_editor', 'alumni'] as const
const MEMBERSHIP_STATUSES_REQUIRED_FOR_IDENTITY = new Set(['approved', 'alumni'])

type CliOptions = {
  confirm: boolean
  flush: boolean
  help: boolean
}

type LocalEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

function printHelp(): void {
  console.log(`Repair invalid chapter-scoped LEAD identities

Detects and repairs active chapter-scoped LEAD identities
(chapter_member, chapter_editor, alumni) that were issued without an
approved or alumni chapter membership. By default this only reports what
would change (dry-run) and never writes.

Usage:
  pnpm repair:president --flush     Dry-run report, then exit. Always safe.
  pnpm repair:president --confirm   Revoke invalid identities.
  pnpm repair:president --help      Show this help text.

Options:
  --confirm     Perform the repair (revokes invalid identities). Required for writes.
  --flush       Force dry-run and exit. Overrides --confirm.
  --help        Show this help text.
`)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { confirm: false, flush: false, help: false }

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }
    if (arg === '--confirm') {
      options.confirm = true
      continue
    }
    if (arg === '--flush') {
      options.flush = true
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

async function loadEnv(): Promise<Required<LocalEnv>> {
  const envPath = resolve(process.cwd(), ENV_LOCAL_PATH)
  if (existsSync(envPath)) {
    const env = parseEnvFile(await readFile(envPath, 'utf8'))
    if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      }
    }
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  }

  throw new Error('Missing Supabase credentials. Provide NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
}

type InvalidIdentity = {
  id: string
  user_id: string
  identity_type: string
  chapter_id: string
  issued_at: string
  membership_status: string | null
}

async function findInvalidIdentities(
  supabase: ReturnType<typeof createClient<Database>>
): Promise<InvalidIdentity[]> {
  const { data: identities, error: identitiesError } = await supabase
    .from('lead_identity')
    .select('id, user_id, identity_type, chapter_id, issued_at, status')
    .in('identity_type', [...CHAPTER_SCOPED_IDENTITY_TYPES])
    .eq('status', 'active')
    .not('chapter_id', 'is', null)

  if (identitiesError) {
    throw new Error(`Failed to load identities: ${identitiesError.message}`)
  }

  const keys = (data: Array<{ user_id: string; chapter_id: string; status: string }>) =>
    new Map(
      data.map((row) => [
        `${row.user_id}:${row.chapter_id}`,
        row.status,
      ])
    )

  const { data: memberships, error: membershipsError } = await supabase
    .from('chapter_membership')
    .select('user_id, chapter_id, status')
    .in('status', [...MEMBERSHIP_STATUSES_REQUIRED_FOR_IDENTITY])

  if (membershipsError) {
    throw new Error(`Failed to load memberships: ${membershipsError.message}`)
  }

  const eligibleKeys = keys(memberships ?? [])

  return (identities ?? []).flatMap((identity) => {
    if (!identity.chapter_id) return []
    const membershipStatus = eligibleKeys.get(`${identity.user_id}:${identity.chapter_id}`) ?? null
    if (membershipStatus) return []

    return [
      {
        id: identity.id,
        user_id: identity.user_id,
        identity_type: identity.identity_type,
        chapter_id: identity.chapter_id,
        issued_at: identity.issued_at,
        membership_status: membershipStatus,
      },
    ]
  })
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const dryRun = options.flush || !options.confirm

  const env = await loadEnv()
  const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const invalidIdentities = await findInvalidIdentities(supabase)

  console.log(
    `Found ${invalidIdentities.length} active chapter-scoped LEAD identit${invalidIdentities.length === 1 ? 'y' : 'ies'} without an eligible membership.`
  )
  if (invalidIdentities.length === 0) {
    console.log('Nothing to repair.')
    return
  }

  for (const identity of invalidIdentities) {
    console.log(
      `- identity=${identity.id} user=${identity.user_id} type=${identity.identity_type} chapter=${identity.chapter_id} issued=${identity.issued_at}`
    )
  }

  if (dryRun) {
    console.log('\nDry-run: no changes made. Re-run with --confirm to revoke these identities.')
    return
  }

  const now = new Date().toISOString()
  for (const identity of invalidIdentities) {
    const { error } = await supabase
      .from('lead_identity')
      .update({
        status: 'revoked',
        revoked_at: now,
        is_primary: false,
        updated_at: now,
      })
      .eq('id', identity.id)
      .eq('user_id', identity.user_id)
      .eq('status', 'active')

    if (error) {
      console.error(`Failed to revoke identity=${identity.id}: ${error.message}`)
      process.exitCode = 1
      continue
    }

    console.log(`Revoked identity=${identity.id} (${identity.identity_type}, chapter=${identity.chapter_id})`)
  }

  if (process.exitCode === undefined) {
    console.log('\nRepair complete.')
  } else {
    console.error('\nRepair finished with errors.')
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`repair-president failed: ${message}`)
  process.exit(1)
})
