import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Pool } from 'pg'
import { ChapterInviteService } from '@/lib/services/chapter-invite.service'
import { ChapterMembershipService } from '@/lib/services/chapter-membership.service'
import { ChapterPreapprovalService } from '@/lib/services/chapter-preapproval.service'
import { onboardPresident } from '@/lib/services/chapter-president.service'
import { createAdminClient } from '@/lib/supabase/admin'

const ENV_LOCAL_PATH = '.env.local'
const ADMIN_USER_ID = '44444444-4444-4444-4444-444444444444'
const CHAPTER_ID = 'leaduni'
const LEAD_ID_PATTERN = /^LEAD-\d{6}$/
const LOCAL_DATABASE_URL =
  process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54332/postgres'
const TEST_PASSWORD_HASH = '$2b$10$d04rJdM2Gfm5OHSN2PpRzeYiXF00LKzkV//rhHDPW2CI07z/t8Wr.'

type LocalEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
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

type CheckSummary = {
  name: string
  assertions: number
  passed: boolean
}

class Verifier {
  private readonly checks: CheckSummary[] = []
  private readonly createdUserIds: string[] = []
  private readonly createdEmails: string[] = []
  private supabase: ReturnType<typeof createAdminClient>
  private pool: Pool
  private counter = 0

  constructor(supabase: ReturnType<typeof createAdminClient>, pool: Pool) {
    this.supabase = supabase
    this.pool = pool
  }

  private nextEmail(): string {
    const timestamp = Date.now()
    this.counter += 1
    return `memberid-${timestamp}-${this.counter}@test.com`
  }

  private nextUserId(): string {
    return randomUUID()
  }

  async createFixtureUser(email: string): Promise<{ userId: string }> {
    const userId = this.nextUserId()

    const { rows } = await this.pool.query(
      `INSERT INTO auth.users (
         id, instance_id, aud, role, email, encrypted_password,
         email_confirmed_at, created_at, updated_at,
         confirmation_token, email_change, email_change_token_new, recovery_token
       )
       VALUES (
         $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         $2, $3, now(), now(), now(), '', '', '', ''
       )
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [userId, email, TEST_PASSWORD_HASH]
    )
    if (rows.length === 0) throw new Error(`Fixture auth.users insert failed for ${email}`)

    const { data: appUser, error: appUserError } = await this.supabase
      .from('user')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (appUserError || !appUser) {
      throw new Error(`handle_new_user trigger did not create public.user for ${email}`)
    }

    const { error: profileError } = await this.supabase.from('person_profile').insert({
      id: userId,
      user_id: userId,
      university: 'Universidad Nacional de Ingenieria',
      major_or_interest: 'Ingenieria de software',
      is_recruiter_visible: false,
    })
    if (profileError) throw new Error(`Fixture profile insert failed: ${profileError.message}`)

    this.createdUserIds.push(userId)
    this.createdEmails.push(email)
    return { userId }
  }

  async readLeadId(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('person_profile')
      .select('lead_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new Error(`lead_id read failed: ${error.message}`)
    return (data?.lead_id as string | null) ?? null
  }

  async readMembership(userId: string): Promise<{ status: string; member_id: string | null } | null> {
    const { data, error } = await this.supabase
      .from('chapter_membership')
      .select('status, member_id')
      .match({ user_id: userId, chapter_id: CHAPTER_ID })
      .maybeSingle()
    if (error) throw new Error(`membership read failed: ${error.message}`)
    return data as { status: string; member_id: string | null } | null
  }

  async assertApprovedMembershipEqualsLeadId(name: string, userId: string, memberId: string): Promise<void> {
    const leadId = await this.readLeadId(userId)
    const membership = await this.readMembership(userId)

    const assertions: Array<[string, boolean]> = [
      [`${name}: lead_id matches returned member_id`, leadId === memberId],
      [`${name}: membership.member_id matches returned member_id`, membership?.member_id === memberId],
      [`${name}: membership.status is approved`, membership?.status === 'approved'],
      [`${name}: member_id matches LEAD-\\d{6} format`, LEAD_ID_PATTERN.test(memberId)],
    ]

    const passed = assertions.every(([, ok]) => ok)
    this.checks.push({ name, assertions: assertions.length, passed })

    if (!passed) {
      throw new Error(
        `${name}: assertion failed. member_id=${memberId}, lead_id=${leadId}, membership=${JSON.stringify(membership)}`
      )
    }
  }

  async insertMemberPreapproval(email: string): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase()
    const { data, error } = await this.supabase
      .from('chapter_preapproval')
      .insert({
        email,
        normalized_email: normalizedEmail,
        chapter_id: CHAPTER_ID,
        preapproval_type: 'member',
        created_by_id: ADMIN_USER_ID,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()
    if (error) throw new Error(`Preapproval insert failed: ${error.message}`)
    return (data as { id: string }).id
  }

  async insertEboardPresidentPreapproval(email: string): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase()
    const { data, error } = await this.supabase
      .from('chapter_preapproval')
      .insert({
        email,
        normalized_email: normalizedEmail,
        chapter_id: CHAPTER_ID,
        preapproval_type: 'eboard',
        role_level: 'president',
        functional_area: 'general_leadership',
        display_title: 'Presidenta',
        raw_title: 'Presidenta',
        created_by_id: ADMIN_USER_ID,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()
    if (error) throw new Error(`Preapproval insert failed: ${error.message}`)
    return (data as { id: string }).id
  }

  async flowApproveAndIdempotent(): Promise<void> {
    const email = this.nextEmail()
    const { userId } = await this.createFixtureUser(email)

    const applyResult = await ChapterMembershipService.applyToChapter(this.supabase, {
      userId,
      chapterId: CHAPTER_ID,
    })
    if (!applyResult.success) throw new Error(`applyToChapter failed: ${applyResult.error}`)

    const preMintLeadId = await this.readLeadId(userId)
    const approveResult = await ChapterMembershipService.approveMembership(this.supabase, {
      approverId: ADMIN_USER_ID,
      userId,
      chapterId: CHAPTER_ID,
    })
    if (!approveResult.success) throw new Error(`approveMembership failed: ${approveResult.error}`)

    const reapproveResult = await ChapterMembershipService.approveMembership(this.supabase, {
      approverId: ADMIN_USER_ID,
      userId,
      chapterId: CHAPTER_ID,
    })
    if (!reapproveResult.success) throw new Error(`idempotent re-approve failed: ${reapproveResult.error}`)

    const assertions: Array<[string, boolean]> = [
      ['inline mint: lead_id was null before approve', preMintLeadId === null],
      ['approve: returns member_id', approveResult.member_id !== undefined],
      ['idempotent re-approve: same member_id', reapproveResult.member_id === approveResult.member_id],
    ]
    const passed = assertions.every(([, ok]) => ok)
    this.checks.push({ name: 'approve + idempotent re-approve', assertions: assertions.length, passed })
    if (!passed) {
      throw new Error(
        `approve flow assertion failed. preMintLeadId=${preMintLeadId}, approve=${JSON.stringify(approveResult)}, reapprove=${JSON.stringify(reapproveResult)}`
      )
    }

    await this.assertApprovedMembershipEqualsLeadId('approve + idempotent re-approve', userId, approveResult.member_id!)
  }

  async flowConcurrentDualApproval(): Promise<void> {
    const email = this.nextEmail()
    const { userId } = await this.createFixtureUser(email)

    const applyResult = await ChapterMembershipService.applyToChapter(this.supabase, {
      userId,
      chapterId: CHAPTER_ID,
    })
    if (!applyResult.success) throw new Error(`applyToChapter failed: ${applyResult.error}`)

    const [first, second] = await Promise.all([
      ChapterMembershipService.approveMembership(this.supabase, {
        approverId: ADMIN_USER_ID,
        userId,
        chapterId: CHAPTER_ID,
      }),
      ChapterMembershipService.approveMembership(this.supabase, {
        approverId: ADMIN_USER_ID,
        userId,
        chapterId: CHAPTER_ID,
      }),
    ])

    const assertions: Array<[string, boolean]> = [
      ['Promise.all: first approve succeeds', first.success === true],
      ['Promise.all: second approve succeeds', second.success === true],
      [
        'Promise.all: both approve return the same member_id',
        first.success === true && second.success === true && first.member_id === second.member_id,
      ],
    ]
    const passed = assertions.every(([, ok]) => ok)
    this.checks.push({ name: 'Promise.all dual approval', assertions: assertions.length, passed })
    if (!passed) {
      throw new Error(`dual approval assertion failed: first=${JSON.stringify(first)}, second=${JSON.stringify(second)}`)
    }

    await this.assertApprovedMembershipEqualsLeadId('Promise.all dual approval', userId, first.member_id!)
  }

  async flowInlineMint(): Promise<void> {
    const email = this.nextEmail()
    const { userId } = await this.createFixtureUser(email)

    const applyResult = await ChapterMembershipService.applyToChapter(this.supabase, {
      userId,
      chapterId: CHAPTER_ID,
    })
    if (!applyResult.success) throw new Error(`applyToChapter failed: ${applyResult.error}`)

    const preMintLeadId = await this.readLeadId(userId)
    const approveResult = await ChapterMembershipService.approveMembership(this.supabase, {
      approverId: ADMIN_USER_ID,
      userId,
      chapterId: CHAPTER_ID,
    })
    if (!approveResult.success) throw new Error(`approveMembership failed: ${approveResult.error}`)

    const assertions: Array<[string, boolean]> = [
      ['inline mint: lead_id was null before approve', preMintLeadId === null],
      ['inline mint: member_id returned after approve', LEAD_ID_PATTERN.test(approveResult.member_id!)],
    ]
    const passed = assertions.every(([, ok]) => ok)
    this.checks.push({ name: 'inline mint on approve', assertions: assertions.length, passed })
    if (!passed) {
      throw new Error(`inline mint assertion failed: preMintLeadId=${preMintLeadId}, approve=${JSON.stringify(approveResult)}`)
    }

    await this.assertApprovedMembershipEqualsLeadId('inline mint on approve', userId, approveResult.member_id!)
  }

  async flowInviteAcceptance(): Promise<void> {
    const email = this.nextEmail()
    const { userId } = await this.createFixtureUser(email)

    const inviteResult = await ChapterInviteService.createInvite(this.supabase, {
      actorUserId: ADMIN_USER_ID,
      chapterId: CHAPTER_ID,
      email,
      inviteType: 'member',
      roleLevel: 'member',
      functionalArea: 'general_leadership',
      displayTitle: 'Miembro',
    })
    if (!inviteResult.success) throw new Error(`createInvite failed: ${inviteResult.error}`)

    const acceptResult = await ChapterInviteService.acceptInvite(this.supabase, {
      token: inviteResult.token,
      userId,
      email,
    })
    if (!acceptResult.success || !('memberId' in acceptResult)) {
      throw new Error(`acceptInvite failed: ${JSON.stringify(acceptResult)}`)
    }

    await this.assertApprovedMembershipEqualsLeadId('invite acceptance', userId, acceptResult.memberId)
  }

  async flowPreapprovalMember(): Promise<void> {
    const email = this.nextEmail()
    const { userId } = await this.createFixtureUser(email)
    await this.insertMemberPreapproval(email)

    const activation = await ChapterPreapprovalService.activatePreapprovalForUser(this.supabase, {
      userId,
      email,
      activatedById: ADMIN_USER_ID,
    })

    const assertions: Array<[string, boolean]> = [
      ['preapproval(member): activated', activation.success === true && activation.activated === true],
      ['preapproval(member): preapprovalType is member', activation.success === true && activation.preapprovalType === 'member'],
    ]
    const passed = assertions.every(([, ok]) => ok)
    this.checks.push({ name: 'preapproval member activation', assertions: assertions.length, passed })
    if (!passed) {
      throw new Error(`preapproval(member) assertion failed: ${JSON.stringify(activation)}`)
    }

    if (!activation.success || !activation.activated) return
    await this.assertApprovedMembershipEqualsLeadId('preapproval member activation', userId, activation.memberId)
  }

  async flowPreapprovalEboardPresident(): Promise<void> {
    const email = this.nextEmail()
    const { userId } = await this.createFixtureUser(email)
    await this.insertEboardPresidentPreapproval(email)

    const activation = await ChapterPreapprovalService.activatePreapprovalForUser(this.supabase, {
      userId,
      email,
      activatedById: ADMIN_USER_ID,
    })

    const granted = activation.success && activation.activated ? (activation.grantedPermissions ?? []) : []
    const assertions: Array<[string, boolean]> = [
      ['preapproval(eboard/president): activated', activation.success === true && activation.activated === true],
      ['preapproval(eboard/president): roleAssignmentId present', activation.success === true && Boolean(activation.roleAssignmentId)],
      ['preapproval(eboard/president): grantedPermissions include chapter.members.revoke', granted.includes('chapter.members.revoke')],
      ['preapproval(eboard/president): grantedPermissions include chapter.roles.assign_eboard', granted.includes('chapter.roles.assign_eboard')],
    ]
    const passed = assertions.every(([, ok]) => ok)
    this.checks.push({ name: 'preapproval eboard/president activation', assertions: assertions.length, passed })
    if (!passed) {
      throw new Error(`preapproval(eboard/president) assertion failed: ${JSON.stringify(activation)}`)
    }

    if (!activation.success || !activation.activated) return
    await this.assertApprovedMembershipEqualsLeadId('preapproval eboard/president activation', userId, activation.memberId)

    const { data: identity, error: identityError } = await this.supabase
      .from('lead_identity')
      .select('identity_type, chapter_id')
      .match({ user_id: userId, chapter_id: CHAPTER_ID })
      .eq('identity_type', 'chapter_editor')
      .maybeSingle()
    if (identityError) throw new Error(`lead_identity read failed: ${identityError.message}`)

    const identityPassed = Boolean(identity)
    this.checks.push({ name: 'onboard-president identity issuance', assertions: 1, passed: identityPassed })
    if (!identityPassed) {
      throw new Error('onboard-president did not issue chapter_editor identity for president preapproval activation.')
    }
  }

  async flowOnboardPresidentDirect(): Promise<void> {
    const email = this.nextEmail()
    const { userId } = await this.createFixtureUser(email)

    const applyResult = await ChapterMembershipService.applyToChapter(this.supabase, {
      userId,
      chapterId: CHAPTER_ID,
    })
    if (!applyResult.success) throw new Error(`applyToChapter failed: ${applyResult.error}`)

    const approveResult = await ChapterMembershipService.approveMembership(this.supabase, {
      approverId: ADMIN_USER_ID,
      userId,
      chapterId: CHAPTER_ID,
    })
    if (!approveResult.success) throw new Error(`approveMembership failed: ${approveResult.error}`)

    const onboardResult = await onboardPresident(this.supabase, {
      userId,
      chapterId: CHAPTER_ID,
      grantedById: ADMIN_USER_ID,
    })
    if (!onboardResult.success) throw new Error(`onboardPresident failed: ${onboardResult.error}`)

    const { data: identity, error: identityError } = await this.supabase
      .from('lead_identity')
      .select('identity_type, chapter_id')
      .match({ user_id: userId, chapter_id: CHAPTER_ID })
      .eq('identity_type', 'chapter_editor')
      .maybeSingle()
    if (identityError) throw new Error(`lead_identity read failed: ${identityError.message}`)

    const identityPassed = Boolean(identity)
    this.checks.push({ name: 'onboard-president direct identity issuance', assertions: 1, passed: identityPassed })
    if (!identityPassed) {
      throw new Error('onboardPresident did not issue chapter_editor identity.')
    }

    await this.assertApprovedMembershipEqualsLeadId('onboard-president direct', userId, approveResult.member_id!)
  }

  async cleanup(): Promise<void> {
    if (this.createdEmails.length > 0) {
      await this.pool.query(`DELETE FROM public.chapter_invite WHERE email = ANY($1)`, [this.createdEmails])
      await this.pool.query(`DELETE FROM public.chapter_preapproval WHERE email = ANY($1)`, [this.createdEmails])
    }

    for (const userId of this.createdUserIds) {
      await this.supabase.from('chapter_permission_grant').delete().eq('user_id', userId)
      await this.supabase.from('lead_identity').delete().eq('user_id', userId)
      await this.supabase.from('chapter_role_assignment').delete().eq('user_id', userId)
      await this.supabase.from('chapter_membership').delete().eq('user_id', userId)

      await this.pool.query(`DELETE FROM auth.users WHERE id = $1`, [userId])
      await this.pool.query(`DELETE FROM public."user" WHERE id = $1`, [userId])
    }
  }

  summary(): void {
    let totalAssertions = 0
    let passedChecks = 0
    for (const check of this.checks) {
      totalAssertions += check.assertions
      if (check.passed) passedChecks += 1
      console.log(`${check.passed ? 'PASS' : 'FAIL'}  ${check.name} (${check.assertions} assertion${check.assertions === 1 ? '' : 's'})`)
    }
    console.log(`\n${passedChecks}/${this.checks.length} flow checks passed, ${totalAssertions} total assertions.`)
    if (passedChecks !== this.checks.length) {
      process.exitCode = 1
    }
  }
}

async function main(): Promise<void> {
  const env = await loadLocalEnv()
  process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

  const pool = new Pool({ connectionString: LOCAL_DATABASE_URL })
  const supabase = createAdminClient()
  const verifier = new Verifier(supabase, pool)

  try {
    await verifier.flowApproveAndIdempotent()
    await verifier.flowConcurrentDualApproval()
    await verifier.flowInlineMint()
    await verifier.flowInviteAcceptance()
    await verifier.flowPreapprovalMember()
    await verifier.flowPreapprovalEboardPresident()
    await verifier.flowOnboardPresidentDirect()
  } finally {
    await verifier.cleanup()
    await pool.end()
  }

  verifier.summary()
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`member-id real-flow verification failed: ${message}`)
  process.exit(1)
})
