import { expect, test, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '../../lib/database.generated'

const PASSWORD = 'password123'
const LOGIN_REDIRECT_TIMEOUT_MS = 60_000
const CHAPTER_ID = 'leaduni'
const QA_EMAIL_PREFIX = 'qa-e2e-chapter-leader-'
const ADMIN_APPROVER_ID = '44444444-4444-4444-4444-444444444444'

type SupabaseAdmin = SupabaseClient<Database>
type MembershipStatus = Database['public']['Enums']['membership_status']
type TestMember = {
  id: string
  email: string
  name: string
}
type TestMemberState = {
  status: MembershipStatus
  member_id: string | null
  approved_by_id: string | null
}
type ActiveRoleAssignment = {
  role_level: string
  display_title: string
  status: string
}

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    const rawValue = trimmed.slice(equalsIndex + 1).trim()
    if (!key || process.env[key]) continue

    process.env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
}

function getAdminClient(): SupabaseAdmin {
  loadLocalEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing local Supabase credentials for chapter leader E2E setup.')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function assertNoDbError(result: { error: { message: string } | null }, context: string) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`)
  }
}

async function cleanupUserIds(admin: SupabaseAdmin, userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds)]
  if (uniqueUserIds.length === 0) return

  assertNoDbError(
    await admin.from('chapter_audit_log').delete().in('target_user_id', uniqueUserIds),
    'cleanup target audit logs'
  )
  assertNoDbError(
    await admin.from('chapter_audit_log').delete().in('actor_user_id', uniqueUserIds),
    'cleanup actor audit logs'
  )
  assertNoDbError(
    await admin.from('chapter_permission_grant').delete().in('user_id', uniqueUserIds),
    'cleanup permission grants'
  )
  assertNoDbError(
    await admin.from('chapter_role_assignment').delete().in('user_id', uniqueUserIds),
    'cleanup role assignments'
  )
  assertNoDbError(
    await admin.from('chapter_membership').delete().in('user_id', uniqueUserIds),
    'cleanup chapter memberships'
  )
  assertNoDbError(
    await admin.from('lead_identity').delete().in('user_id', uniqueUserIds),
    'cleanup lead identities'
  )
  assertNoDbError(
    await admin.from('person_profile').delete().in('user_id', uniqueUserIds),
    'cleanup person profiles'
  )
  assertNoDbError(
    await admin.from('user').delete().in('id', uniqueUserIds),
    'cleanup app users'
  )

  for (const userId of uniqueUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error && !error.message.toLowerCase().includes('not found')) {
      throw new Error(`cleanup auth user: ${error.message}`)
    }
  }
}

async function cleanupQaUsers(admin: SupabaseAdmin) {
  const publicIds = new Set<string>()
  const { data: appUsers, error: appUserError } = await admin
    .from('user')
    .select('id')
    .like('email', `${QA_EMAIL_PREFIX}%`)

  assertNoDbError({ error: appUserError }, 'load qa app users')
  for (const user of appUsers ?? []) {
    publicIds.add(user.id)
  }

  const authIds = new Set<string>()
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`load qa auth users: ${error.message}`)

    for (const user of data.users) {
      if (user.email?.startsWith(QA_EMAIL_PREFIX)) {
        authIds.add(user.id)
      }
    }

    if (data.users.length < 1000) break
    page += 1
  }

  await cleanupUserIds(admin, [...publicIds, ...authIds])
}

function testEmail(label: string) {
  return `${QA_EMAIL_PREFIX}${label}-${randomUUID()}@test.local`
}

async function createChapterMember(
  admin: SupabaseAdmin,
  params: {
    label: string
    name: string
    status: MembershipStatus
    chapterId?: string
  }
): Promise<TestMember> {
  const email = testEmail(params.label)
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: params.name,
    },
  })

  if (authError || !authUser.user) {
    throw new Error(`create auth user: ${authError?.message ?? 'No user returned'}`)
  }

  const userId = authUser.user.id
  assertNoDbError(
    await admin.from('user').upsert({
      id: userId,
      email,
      name: params.name,
      role: 'member',
      phone: '+51 999 000 000',
    }),
    'upsert app user'
  )
  assertNoDbError(
    await admin.from('person_profile').insert({
      user_id: userId,
      university: 'Universidad Nacional de Ingenieria',
      major_or_interest: 'Computer Science',
      graduation_year: 2027,
      linkedin_url: `https://linkedin.com/in/${params.label}`,
      skills: ['QA', 'Leadership'],
      gender: 'prefer_not_to_say',
      is_recruiter_visible: true,
    }),
    'insert person profile'
  )

  const isApproved = params.status === 'approved'
  assertNoDbError(
    await admin.from('chapter_membership').insert({
      user_id: userId,
      chapter_id: params.chapterId ?? CHAPTER_ID,
      position: 'member',
      status: params.status,
      approved_by_id: isApproved ? ADMIN_APPROVER_ID : null,
      member_id: isApproved ? `LEAD-UNI-QA-${randomUUID().slice(0, 8).toUpperCase()}` : null,
      joined_at: isApproved ? new Date().toISOString() : null,
    }),
    'insert chapter membership'
  )

  return { id: userId, email, name: params.name }
}

async function getMembership(
  admin: SupabaseAdmin,
  userId: string,
  chapterId = CHAPTER_ID
): Promise<TestMemberState | null> {
  const { data, error } = await admin
    .from('chapter_membership')
    .select('status, member_id, approved_by_id')
    .match({ user_id: userId, chapter_id: chapterId })
    .maybeSingle()

  assertNoDbError({ error }, 'load membership')
  return data
}

async function getActiveRoleAssignment(
  admin: SupabaseAdmin,
  userId: string
): Promise<ActiveRoleAssignment | null> {
  const { data, error } = await admin
    .from('chapter_role_assignment')
    .select('role_level, display_title, status')
    .match({ user_id: userId, chapter_id: CHAPTER_ID, status: 'active' })
    .maybeSingle()

  assertNoDbError({ error }, 'load role assignment')
  return data
}

async function getActivePermissionKeys(admin: SupabaseAdmin, userId: string): Promise<string[]> {
  const { data, error } = await admin
    .from('chapter_permission_grant')
    .select('permission_key')
    .match({ user_id: userId, chapter_id: CHAPTER_ID })
    .is('revoked_at', null)

  assertNoDbError({ error }, 'load permission grants')
  return (data ?? []).map((grant) => grant.permission_key)
}

async function loginAs(page: Page, email: string) {
  await page.goto('/es/auth/login', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await expect(page.locator('#email')).toBeVisible()
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()

  const outcome = await Promise.race([
    page
      .waitForURL((url) => !url.pathname.endsWith('/auth/login'), { timeout: LOGIN_REDIRECT_TIMEOUT_MS })
      .then(() => 'redirect' as const)
      .catch(() => 'timeout' as const),
    page
      .locator('#error-message')
      .waitFor({ state: 'visible', timeout: LOGIN_REDIRECT_TIMEOUT_MS })
      .then(() => 'error' as const)
      .catch(() => 'timeout' as const),
  ])

  if (outcome === 'error') {
    throw new Error(`Login failed for ${email}: ${await page.locator('#error-message').innerText()}`)
  }
  if (outcome !== 'redirect') {
    throw new Error(`Login did not redirect for ${email}; current URL is ${page.url()}`)
  }

  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
}

function memberCard(page: Page, memberName: string) {
  return page.locator('article').filter({ hasText: memberName }).first()
}

async function revealRoleControls(card: ReturnType<typeof memberCard>) {
  const roleDisclosure = card.getByText('Gestionar rol e-board').first()
  if (await roleDisclosure.isVisible().catch(() => false)) {
    await roleDisclosure.click()
  }
}

test.describe('chapter leader member management', () => {
  test.setTimeout(90_000)

  test.beforeEach(async () => {
    await cleanupQaUsers(getAdminClient())
  })

  test.afterEach(async () => {
    await cleanupQaUsers(getAdminClient())
  })

  test('president can approve a pending member while regular e-board cannot manage applicants', async ({
    browser,
  }) => {
    const admin = getAdminClient()
    const applicant = await createChapterMember(admin, {
      label: 'approve',
      name: 'QA Pending Applicant',
      status: 'pending',
    })

    const eboardContext = await browser.newContext()
    const eboardPage = await eboardContext.newPage()
    await loginAs(eboardPage, 'eboard@test.com')
    await eboardPage.goto('/es/chapter/members?status=pending')
    await eboardPage.waitForLoadState('networkidle')
    await expect(eboardPage.getByText(applicant.name)).toHaveCount(0)
    await expect(eboardPage.getByRole('button', { name: /^Aprobar$/i })).toHaveCount(0)
    await expect(eboardPage.getByRole('button', { name: /^Rechazar$/i })).toHaveCount(0)
    await eboardContext.close()

    const presidentContext = await browser.newContext()
    const presidentPage = await presidentContext.newPage()
    await loginAs(presidentPage, 'president@test.com')
    await presidentPage.goto('/es/chapter/members?status=pending')
    await presidentPage.waitForLoadState('networkidle')

    const card = memberCard(presidentPage, applicant.name)
    await expect(card).toBeVisible()
    await card.getByRole('button', { name: /^Aprobar$/i }).click()

    await expect.poll(async () => getMembership(admin, applicant.id)).toMatchObject({
      status: 'approved',
      approved_by_id: '81000000-0000-4000-8000-000000000001',
    })
    await expect.poll(async () => (await getMembership(admin, applicant.id))?.member_id).toMatch(/^LEAD-/)

    await presidentPage.goto('/es/chapter/members?status=active')
    await presidentPage.waitForLoadState('networkidle')
    await expect(memberCard(presidentPage, applicant.name)).toBeVisible()
    await presidentContext.close()
  })

  test('president can reject a pending member', async ({ page }) => {
    const admin = getAdminClient()
    const applicant = await createChapterMember(admin, {
      label: 'reject',
      name: 'QA Rejected Applicant',
      status: 'pending',
    })

    await loginAs(page, 'president@test.com')
    await page.goto('/es/chapter/members?status=pending')
    await page.waitForLoadState('networkidle')

    const card = memberCard(page, applicant.name)
    await expect(card).toBeVisible()
    await card.getByRole('button', { name: /^Rechazar$/i }).click()
    await card.getByPlaceholder(/nota interna opcional/i).fill('Not a fit for this chapter cycle')
    await card.getByRole('button', { name: /confirmar rechazo/i }).click()

    await expect.poll(async () => getMembership(admin, applicant.id)).toMatchObject({
      status: 'rejected',
      member_id: null,
      approved_by_id: null,
    })

    await page.goto('/es/chapter/members?status=rejected')
    await page.waitForLoadState('networkidle')
    await expect(memberCard(page, applicant.name)).toBeVisible()
  })

  test('president can bulk approve selected pending members', async ({ page }) => {
    const admin = getAdminClient()
    const firstApplicant = await createChapterMember(admin, {
      label: 'bulk-approve-one',
      name: 'QA Bulk Applicant One',
      status: 'pending',
    })
    const secondApplicant = await createChapterMember(admin, {
      label: 'bulk-approve-two',
      name: 'QA Bulk Applicant Two',
      status: 'pending',
    })

    await loginAs(page, 'president@test.com')
    await page.goto('/es/chapter/members?status=pending')
    await page.waitForLoadState('networkidle')

    await expect(memberCard(page, firstApplicant.name)).toBeVisible()
    await expect(memberCard(page, secondApplicant.name)).toBeVisible()
    await page.locator('#select-all-pending').click()
    await page.getByRole('button', { name: /aprobar seleccionados/i }).click()

    await expect.poll(async () => getMembership(admin, firstApplicant.id)).toMatchObject({
      status: 'approved',
      approved_by_id: '81000000-0000-4000-8000-000000000001',
    })
    await expect.poll(async () => getMembership(admin, secondApplicant.id)).toMatchObject({
      status: 'approved',
      approved_by_id: '81000000-0000-4000-8000-000000000001',
    })
    await expect.poll(async () => (await getMembership(admin, firstApplicant.id))?.member_id).toMatch(/^LEAD-/)
    await expect.poll(async () => (await getMembership(admin, secondApplicant.id))?.member_id).toMatch(/^LEAD-/)
  })

  test('chapter leaders do not see applicants from another chapter', async ({ page }) => {
    const admin = getAdminClient()
    const otherChapterApplicant = await createChapterMember(admin, {
      label: 'other-chapter',
      name: 'QA ULIMA Applicant',
      status: 'pending',
      chapterId: 'leadulima',
    })

    await loginAs(page, 'president@test.com')
    await page.goto('/es/chapter/members?status=pending')
    await page.waitForLoadState('networkidle')

    await expect(memberCard(page, otherChapterApplicant.name)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Aprobar$/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Rechazar$/i })).toHaveCount(0)
    await expect.poll(async () => getMembership(admin, otherChapterApplicant.id, 'leadulima')).toMatchObject({
      status: 'pending',
      member_id: null,
      approved_by_id: null,
    })
  })

  test('president can revoke another approved member but cannot revoke themselves', async ({ page }) => {
    const admin = getAdminClient()
    const member = await createChapterMember(admin, {
      label: 'revoke',
      name: 'QA Approved Member',
      status: 'approved',
    })

    await loginAs(page, 'president@test.com')
    await page.goto('/es/chapter/members?status=active')
    await page.waitForLoadState('networkidle')

    await expect(memberCard(page, 'Test President').getByRole('button', { name: /revocar membres[ií]a/i })).toHaveCount(0)

    const card = memberCard(page, member.name)
    await expect(card).toBeVisible()
    const revokeButton = card.getByRole('button', { name: /revocar membres[ií]a/i })
    const revokeReason = card.getByPlaceholder(/motivo requerido/i)
    await expect(revokeButton).toBeEnabled()
    await revokeButton.click()
    await revokeReason.waitFor({ state: 'visible', timeout: 5_000 }).catch(async () => {
      await revokeButton.click()
      await revokeReason.waitFor({ state: 'visible', timeout: 5_000 })
    })
    await revokeReason.fill('No longer active in chapter')
    await card.getByRole('button', { name: /confirmar revocaci[oó]n/i }).click()

    await expect.poll(async () => getMembership(admin, member.id)).toMatchObject({
      status: 'inactive',
      member_id: null,
      approved_by_id: null,
    })
  })

  test('vice president can assign a regular e-board role and regular e-board cannot assign roles', async ({
    browser,
  }) => {
    const admin = getAdminClient()
    const member = await createChapterMember(admin, {
      label: 'assign-eboard',
      name: 'QA Future Eboard',
      status: 'approved',
    })

    const eboardContext = await browser.newContext()
    const eboardPage = await eboardContext.newPage()
    await loginAs(eboardPage, 'eboard@test.com')
    await eboardPage.goto('/es/chapter/members?status=active')
    await eboardPage.waitForLoadState('networkidle')
    await expect(memberCard(eboardPage, member.name)).toBeVisible()
    await expect(eboardPage.getByRole('button', { name: /asignar rol|cambiar rol/i })).toHaveCount(0)
    await eboardContext.close()

    const vpContext = await browser.newContext()
    const vpPage = await vpContext.newPage()
    await loginAs(vpPage, 'vp@test.com')
    await vpPage.goto('/es/chapter/members?status=active')
    await vpPage.waitForLoadState('networkidle')

    const card = memberCard(vpPage, member.name)
    await expect(card).toBeVisible()
    await revealRoleControls(card)
    await card.getByRole('button', { name: /asignar rol/i }).click()

    const dialog = vpPage.getByRole('dialog', { name: /asignar rol e-board/i })
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('Ej. Directora de Marketing').fill('Coordinadora de Eventos QA')
    await dialog.getByRole('button', { name: /guardar rol/i }).click()

    await expect.poll(async () => getActiveRoleAssignment(admin, member.id)).toMatchObject({
      role_level: 'director',
      display_title: 'Coordinadora de Eventos QA',
      status: 'active',
    })
    await expect.poll(async () => getActivePermissionKeys(admin, member.id)).toEqual(
      expect.arrayContaining([
        'chapter.dashboard.access',
        'chapter.members.view_approved',
        'chapter.members.view_member_contact',
        'chapter.events.manage',
      ])
    )

    await vpPage.goto('/es/chapter/members?status=active')
    await vpPage.waitForLoadState('networkidle')
    await expect(memberCard(vpPage, member.name)).toContainText('Coordinadora de Eventos QA')
    await vpContext.close()
  })
})
