import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '../../lib/database.generated'

const PASSWORD = 'password123'
const LOGIN_REDIRECT_TIMEOUT_MS = 60_000
const MEMBER_ID = '22222222-2222-2222-2222-222222222222'
const EBOARD_ID = '81000000-0000-4000-8000-000000000003'
const CHAPTER_ID = 'leaduni'
const EVENT_ID = '91000000-0000-4000-8000-000000000254'
const CHECK_IN_ID = '91000000-0000-4000-8000-000000000255'
const EVENT_RECOMMENDATION_ID = '91000000-0000-4000-8000-000000000256'
const PROFILE_RECOMMENDATION_ID = '91000000-0000-4000-8000-000000000257'
const PROOF_RECOMMENDATION_ID = '91000000-0000-4000-8000-000000000258'
const EVENT_CHAPTER_ID = '91000000-0000-4000-8000-000000000259'
const PATHWAY_FLAG_ID = '91000000-0000-4000-8000-000000000260'
const APPLICATION_QUESTION_ID = '91000000-0000-4000-8000-000000000261'
const EDIT_EVENT_ID = '91000000-0000-4000-8000-000000000262'
const EDIT_EVENT_CHAPTER_ID = '91000000-0000-4000-8000-000000000263'
const OTHER_CHECK_IN_ID = '91000000-0000-4000-8000-000000000264'
const OTHER_RECOMMENDATION_ID = '91000000-0000-4000-8000-000000000265'
const EVENT_TITLE = 'QA Pathway Event: AI Career Sprint'
const EDIT_EVENT_TITLE = 'QA Pathway Edit Metadata Event'
const OUTPUT_DIR = path.join('outputs', 'pathway-comprehensive-userflow-qa')
const INTERNAL_PATHWAY_LABELS = [
  'Seguridad de recomendacion',
  'Senales de evidencia',
  'Riesgo operativo',
  'Estado de metadata',
  'Notas internas',
]
const OKR_OPTIONS = ['Inspire', 'Unite', 'Empower', 'Elevate']
const FOCUS_OPTIONS = [
  'Exploracion de carrera',
  'Experiencia tecnica',
  'Preparacion para oportunidades',
  'Comunidad y mentorias',
  'Liderazgo',
]
const PILLAR_OPTIONS = [
  'LEAD Academia',
  'Academic Excellence',
  "Women's Excellence",
  'Professional Development',
  'Leadership Development',
  'Community Outreach',
  'Chapter Development',
]
const GROWTH_STAGE_OPTIONS = ['Explorer', 'Builder', 'Leader', 'Candidate', 'Emerging professional']
const STUDENT_OUTCOME_OPTIONS = [
  'Orientacion a la mision',
  'Sentido de pertenencia',
  'Exposicion profesional',
  'Habilidad tecnica',
  'Proyecto o innovacion',
  'Evidencia concreta',
  'Preparacion profesional',
  'Perfil mas visible',
  'Confianza de liderazgo',
  'Trabajo en equipo',
  'Reflexion de aprendizaje',
  'Servicio a la comunidad',
]
const AUDIENCE_OPTIONS = [
  'Nuevos miembros',
  'Miembros activos',
  'Chapter leaders',
  'Todos los estudiantes',
  'Personas listas para postular',
  'Publico abierto',
  'Solo chapter',
]
const EVENT_CTA_OPTIONS = ['Registrarse', 'Postular', 'Asistir']
const NON_EVENT_CTA_OPTIONS = [
  'Reflexionar',
  'Actualizar perfil',
  'Actualizar LinkedIn',
  'Actualizar resume',
  'Capturar evidencia',
]
const PROOF_OPTIONS = [
  'Sin evidencia posterior',
  'Growth Reflection',
  'Certificado',
  'Pitch deck',
  'Actualizacion de LinkedIn',
  'Bullet de resume',
  'Nota de proyecto',
  'Item de portafolio',
]

type SupabaseAdmin = SupabaseClient<Database>

let admin: SupabaseAdmin

test.setTimeout(180_000)

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
    throw new Error('Missing local Supabase credentials for lead intelligence QA setup.')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getAnonClient(): SupabaseAdmin {
  loadLocalEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing local Supabase anon credentials for lead intelligence QA setup.')
  }

  return createClient<Database>(supabaseUrl, anonKey, {
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

function dateTimeLocal(daysFromNow: number, hour: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(hour, 0, 0, 0)
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function artifactName(testName: string, projectName: string) {
  return testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .concat(`-${projectName}.png`)
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const outputPath = path.join(OUTPUT_DIR, artifactName(name, testInfo.project.name))
  await page.screenshot({ path: outputPath, fullPage: true })
  await testInfo.attach(name, {
    path: outputPath,
    contentType: 'image/png',
  })
}

async function expectNoCriticalA11y(page: Page, testInfo: TestInfo, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const critical = results.violations
    .filter((violation) => violation.impact === 'critical')
    .map((violation) => ({
      id: violation.id,
      help: violation.help,
      nodes: violation.nodes.slice(0, 5).map((node) => ({
        target: node.target,
        html: node.html.replace(/\s+/g, ' ').slice(0, 240),
      })),
    }))

  if (critical.length > 0) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    const outputPath = path.join(OUTPUT_DIR, `${artifactName(name, testInfo.project.name)}.json`)
    fs.writeFileSync(outputPath, `${JSON.stringify(critical, null, 2)}\n`)
    await testInfo.attach(`${name} critical accessibility violations`, {
      path: outputPath,
      contentType: 'application/json',
    })
  }

  expect(critical, `${name} critical accessibility violations`).toEqual([])
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

async function openNewEventPathwayStep(page: Page, title: string) {
  await page.goto('/es/chapter/events/new', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

  await expect(page.locator('#title')).toBeVisible()
  await page.locator('#title').fill(title)
  await page.getByRole('button', { name: /Siguiente/i }).click()

  await expect(page.locator('#startAt')).toBeVisible()
  await page.locator('label').filter({ hasText: /^Virtual$/ }).click()
  await page.locator('#startAt').fill(dateTimeLocal(10, 14))
  await page.locator('#endAt').fill(dateTimeLocal(10, 16))
  await page.locator('#meetingUrl').fill('https://example.com/lead-pathway-edge')
  await page.getByRole('button', { name: /Siguiente/i }).click()

  await expect(page.getByText('Modelo de registro')).toBeVisible()
  await page.getByRole('button', { name: /Siguiente/i }).click()

  await expect(page.getByText('Recomendar este evento a estudiantes')).toBeVisible()
}

async function chooseComboboxOption(page: Page, comboboxIndex: number, optionName: string) {
  const combobox = page.getByRole('combobox').nth(comboboxIndex)
  await expect(combobox).toBeEnabled()
  await combobox.click()
  await expect(page.getByRole('option', { name: optionName, exact: true })).toBeVisible()
  await page.getByRole('option', { name: optionName, exact: true }).click()
}

async function expectComboboxOptions(
  page: Page,
  comboboxIndex: number,
  visibleOptions: string[],
  hiddenOptions: string[] = []
) {
  await page.getByRole('combobox').nth(comboboxIndex).click()
  for (const option of visibleOptions) {
    await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible()
  }
  for (const option of hiddenOptions) {
    await expect(page.getByRole('option', { name: option, exact: true })).toHaveCount(0)
  }
  await page.keyboard.press('Escape')
}

async function chooseEveryComboboxOption(
  page: Page,
  comboboxIndex: number,
  options: string[],
  finalOption: string
) {
  for (const option of options) {
    await chooseComboboxOption(page, comboboxIndex, option)
  }
  if (options[options.length - 1] !== finalOption) {
    await chooseComboboxOption(page, comboboxIndex, finalOption)
  }
}

async function checkEveryCheckboxOption(page: Page, options: string[]) {
  for (const option of options) {
    const checkbox = page.getByRole('checkbox', { name: option, exact: true })
    await expect(checkbox).toBeEnabled()
    await checkbox.click()
    await expect(checkbox).toBeChecked()
  }
}

async function cleanupEventsByTitle(adminClient: SupabaseAdmin, title: string) {
  const { data, error } = await adminClient
    .from('event')
    .select('id')
    .eq('title', title)

  if (error) throw new Error(`load events for cleanup: ${error.message}`)

  const eventIds = (data ?? []).map((event) => event.id)
  if (eventIds.length === 0) return

  assertNoDbError(
    await adminClient.from('event_pathway_metadata').delete().in('event_id', eventIds),
    'cleanup created event pathway metadata'
  )
  assertNoDbError(
    await adminClient.from('event_application_question').delete().in('event_id', eventIds),
    'cleanup created event application questions'
  )
  assertNoDbError(
    await adminClient.from('event_chapter').delete().in('event_id', eventIds),
    'cleanup created event chapters'
  )
  assertNoDbError(
    await adminClient.from('event').delete().in('id', eventIds),
    'cleanup created events'
  )
}

async function cleanupEventById(adminClient: SupabaseAdmin, eventId: string) {
  const { data: registrations, error: registrationLoadError } = await adminClient
    .from('event_registration')
    .select('id')
    .eq('event_id', eventId)

  if (registrationLoadError) {
    throw new Error(`load event registrations for cleanup: ${registrationLoadError.message}`)
  }

  const registrationIds = (registrations ?? []).map((registration) => registration.id)
  if (registrationIds.length > 0) {
    assertNoDbError(
      await adminClient.from('event_application_answer').delete().in('registration_id', registrationIds),
      'cleanup event application answers'
    )
  }
  assertNoDbError(
    await adminClient.from('event_application_question').delete().eq('event_id', eventId),
    'cleanup event application questions'
  )
  assertNoDbError(
    await adminClient.from('event_pathway_metadata').delete().eq('event_id', eventId),
    'cleanup event pathway metadata by id'
  )
  assertNoDbError(
    await adminClient.from('event_registration').delete().eq('event_id', eventId),
    'cleanup event registrations by id'
  )
  assertNoDbError(
    await adminClient.from('event_chapter').delete().eq('event_id', eventId),
    'cleanup event chapters by id'
  )
  assertNoDbError(
    await adminClient.from('event').delete().eq('id', eventId),
    'cleanup event by id'
  )
}

async function setPathwayFlags(
  adminClient: SupabaseAdmin,
  flags: {
    enable_check_in?: boolean
    enable_recommendation_card?: boolean
    enable_growth_reflection?: boolean
    enable_chapter_insights?: boolean
  }
) {
  assertNoDbError(
    await adminClient
      .from('pathway_feature_flag')
      .update({
        ...flags,
        updated_by_id: EBOARD_ID,
      })
      .eq('chapter_id', CHAPTER_ID),
    'update pathway feature flags'
  )
}

async function expectRecommendationStatus(
  adminClient: SupabaseAdmin,
  recommendationId: string,
  status: string
) {
  await expect
    .poll(async () => {
      const { data, error } = await adminClient
        .from('pathway_recommendation')
        .select('status')
        .eq('id', recommendationId)
        .single()

      if (error) throw new Error(`load recommendation ${recommendationId}: ${error.message}`)
      return data.status
    }, { timeout: 15_000 })
    .toBe(status)
}

async function seedPathwayRecommendation(adminClient: SupabaseAdmin) {
  const recommendationIds = [
    EVENT_RECOMMENDATION_ID,
    PROFILE_RECOMMENDATION_ID,
    PROOF_RECOMMENDATION_ID,
  ]
  const startAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const endAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000)

  assertNoDbError(
    await adminClient.from('growth_reflection').delete().in('recommendation_id', recommendationIds),
    'cleanup growth reflections'
  )
  const { data: qaRegistrations, error: qaRegistrationLoadError } = await adminClient
    .from('event_registration')
    .select('id')
    .eq('event_id', EVENT_ID)

  if (qaRegistrationLoadError) {
    throw new Error(`load qa event registrations for cleanup: ${qaRegistrationLoadError.message}`)
  }

  const qaRegistrationIds = (qaRegistrations ?? []).map((registration) => registration.id)
  if (qaRegistrationIds.length > 0) {
    assertNoDbError(
      await adminClient.from('event_application_answer').delete().in('registration_id', qaRegistrationIds),
      'cleanup qa event application answers'
    )
  }
  assertNoDbError(
    await adminClient.from('pathway_recommendation').delete().in('id', recommendationIds),
    'cleanup pathway recommendations'
  )
  assertNoDbError(
    await adminClient.from('pathway_check_in').delete().eq('user_id', MEMBER_ID),
    'cleanup pathway check-in'
  )
  assertNoDbError(
    await adminClient.from('event_pathway_metadata').delete().eq('event_id', EVENT_ID),
    'cleanup event pathway metadata'
  )
  assertNoDbError(
    await adminClient.from('event_application_question').delete().eq('event_id', EVENT_ID),
    'cleanup event application questions'
  )
  assertNoDbError(
    await adminClient.from('event_registration').delete().eq('event_id', EVENT_ID),
    'cleanup event registrations'
  )
  assertNoDbError(
    await adminClient.from('event_chapter').delete().eq('event_id', EVENT_ID),
    'cleanup event chapters'
  )
  assertNoDbError(
    await adminClient.from('event').delete().eq('id', EVENT_ID),
    'cleanup event'
  )
  assertNoDbError(
    await adminClient.from('pathway_feature_flag').delete().eq('chapter_id', CHAPTER_ID),
    'cleanup pathway feature flag'
  )

  assertNoDbError(
    await adminClient.from('pathway_feature_flag').insert({
      id: PATHWAY_FLAG_ID,
      chapter_id: CHAPTER_ID,
      enable_check_in: true,
      enable_recommendation_card: true,
      enable_growth_reflection: true,
      enable_chapter_insights: true,
      updated_by_id: EBOARD_ID,
    }),
    'insert pathway feature flag'
  )

  assertNoDbError(
    await adminClient.from('event').insert({
      id: EVENT_ID,
      title: EVENT_TITLE,
      description: 'Focused QA event for Pathway recommendation CTAs.',
      chapter_id: CHAPTER_ID,
      created_by_id: EBOARD_ID,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      event_type: 'online',
      meeting_url: 'https://example.com/lead-qa',
      access_model: 'open',
      is_published: true,
    }),
    'insert qa event'
  )
  assertNoDbError(
    await adminClient.from('event_chapter').insert({
      id: EVENT_CHAPTER_ID,
      event_id: EVENT_ID,
      chapter_id: CHAPTER_ID,
      added_by_id: EBOARD_ID,
    }),
    'insert qa event chapter'
  )
  assertNoDbError(
    await adminClient.from('pathway_check_in').insert({
      id: CHECK_IN_ID,
      user_id: MEMBER_ID,
      chapter_id: CHAPTER_ID,
      status: 'completed',
      looking_for: 'Build career readiness through LEAD events.',
      current_blocker: 'Choosing the next practical action.',
      study_interest: 'AI and career systems',
      confidence_level: 4,
      monthly_time_commitment: 'two_to_four_hours',
      growth_stage: 'builder',
      primary_focus: 'opportunity_readiness',
      submitted_at: new Date().toISOString(),
    }),
    'insert qa pathway check-in'
  )
  assertNoDbError(
    await adminClient.from('pathway_recommendation').insert([
      {
        id: EVENT_RECOMMENDATION_ID,
        check_in_id: CHECK_IN_ID,
        user_id: MEMBER_ID,
        category: 'learn',
        status: 'active',
        title: EVENT_TITLE,
        body: 'Register for the LEAD AI Career Sprint and capture one practical learning afterward.',
        reason: 'Matched because your focus is opportunity readiness and the event is ready to recommend.',
        sort_order: 1,
        source_type: 'event',
        source_event_id: EVENT_ID,
        cta_type: 'register',
        evidence_signal: 'event_registration',
        matched_reasons: ['OKR Elevate', 'Student outcome: professional readiness'],
      },
      {
        id: PROFILE_RECOMMENDATION_ID,
        check_in_id: CHECK_IN_ID,
        user_id: MEMBER_ID,
        category: 'connect',
        status: 'active',
        title: 'Refresh your LEAD profile',
        body: 'Make sure your profile reflects your current interests before new opportunities appear.',
        reason: 'Profile clarity helps Pathway recommend better next steps.',
        sort_order: 2,
        source_type: 'profile_action',
        source_event_id: null,
        cta_type: 'update_profile',
        evidence_signal: 'profile_updated',
        matched_reasons: ['Profile readiness'],
      },
      {
        id: PROOF_RECOMMENDATION_ID,
        check_in_id: CHECK_IN_ID,
        user_id: MEMBER_ID,
        category: 'prove',
        status: 'active',
        title: 'Capture one learning proof',
        body: 'Turn a recent LEAD experience into a private Growth Reflection.',
        reason: 'A small proof artifact makes progress concrete.',
        sort_order: 3,
        source_type: 'proof_action',
        source_event_id: null,
        cta_type: 'capture_proof',
        evidence_signal: 'reflection_completed',
        matched_reasons: ['Proof loop'],
      },
    ]),
    'insert qa pathway recommendations'
  )
}

async function seedEditablePathwayEvent(adminClient: SupabaseAdmin) {
  const startAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)
  const endAt = new Date(startAt.getTime() + 90 * 60 * 1000)

  await cleanupEventById(adminClient, EDIT_EVENT_ID)

  assertNoDbError(
    await adminClient.from('event').insert({
      id: EDIT_EVENT_ID,
      title: EDIT_EVENT_TITLE,
      description: 'Editable QA event for Pathway metadata reload coverage.',
      chapter_id: CHAPTER_ID,
      created_by_id: EBOARD_ID,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      event_type: 'online',
      meeting_url: 'https://example.com/lead-edit-pathway',
      access_model: 'open',
      is_published: false,
    }),
    'insert editable pathway event'
  )
  assertNoDbError(
    await adminClient.from('event_chapter').insert({
      id: EDIT_EVENT_CHAPTER_ID,
      event_id: EDIT_EVENT_ID,
      chapter_id: CHAPTER_ID,
      added_by_id: EBOARD_ID,
    }),
    'insert editable pathway event chapter'
  )
  assertNoDbError(
    await adminClient.from('event_pathway_metadata').insert({
      event_id: EDIT_EVENT_ID,
      is_pathway_eligible: true,
      primary_okr: 'empower',
      okr_alignment: ['empower'],
      pillar_keys: ['professional_development'],
      student_goal: 'opportunity_readiness',
      growth_stage_fit: ['builder', 'candidate'],
      student_outcomes: ['professional_readiness', 'proof_artifact'],
      proof_outcome: 'reflection',
      evidence_signals: ['event_registration', 'reflection_completed'],
      audience: 'active_member',
      cta_type: 'register',
      recommendation_safety: 'recommend_only_if_event_active',
      coordination_risk: 'low',
      metadata_status: 'ready',
      created_by_id: EBOARD_ID,
      updated_by_id: EBOARD_ID,
    }),
    'insert editable pathway metadata'
  )
}

async function switchSeedEventToApplication(adminClient: SupabaseAdmin) {
  assertNoDbError(
    await adminClient.from('event_registration').delete().eq('event_id', EVENT_ID),
    'cleanup application-mode event registrations'
  )
  assertNoDbError(
    await adminClient.from('event_application_question').delete().eq('event_id', EVENT_ID),
    'cleanup application-mode questions'
  )
  assertNoDbError(
    await adminClient
      .from('event')
      .update({
        access_model: 'application',
      })
      .eq('id', EVENT_ID),
    'switch qa event to application access'
  )
  assertNoDbError(
    await adminClient.from('event_application_question').insert({
      id: APPLICATION_QUESTION_ID,
      event_id: EVENT_ID,
      question_text: 'Why is this Pathway event a good next step for you?',
      question_type: 'long_text',
      is_required: true,
      sort_order: 1,
    }),
    'insert application question for qa event'
  )
  assertNoDbError(
    await adminClient
      .from('pathway_recommendation')
      .update({
        cta_type: 'apply',
        title: `Apply for ${EVENT_TITLE}`,
        body: 'This event uses application access and must be framed as a postulation.',
        evidence_signal: 'application_submitted',
        status: 'active',
      })
      .eq('id', EVENT_RECOMMENDATION_ID),
    'switch qa recommendation to application CTA'
  )
}

async function resetMemberPathwayState(adminClient: SupabaseAdmin) {
  assertNoDbError(
    await adminClient.from('growth_reflection').delete().eq('user_id', MEMBER_ID),
    'cleanup member growth reflections'
  )
  assertNoDbError(
    await adminClient.from('pathway_recommendation').delete().eq('user_id', MEMBER_ID),
    'cleanup member pathway recommendations'
  )
  assertNoDbError(
    await adminClient.from('pathway_check_in').delete().eq('user_id', MEMBER_ID),
    'cleanup member pathway check-in'
  )
}

async function cleanupCrossStudentRlsFixture(adminClient: SupabaseAdmin) {
  assertNoDbError(
    await adminClient.from('pathway_recommendation').delete().eq('id', OTHER_RECOMMENDATION_ID),
    'cleanup cross-student recommendation fixture'
  )
  assertNoDbError(
    await adminClient.from('pathway_check_in').delete().eq('id', OTHER_CHECK_IN_ID),
    'cleanup cross-student check-in fixture'
  )
}

test.beforeAll(async () => {
  admin = getAdminClient()
  await seedPathwayRecommendation(admin)
})

test.describe('LEAD intelligence authenticated QA', () => {
  test('seeded eboard and member personas can sign in through the UI', async ({ page }, testInfo) => {
    await loginAs(page, 'eboard@test.com')
    await expect(page).toHaveURL(/\/es\/chapter/)
    await capture(page, testInfo, 'eboard seeded login restored')

    await page.context().clearCookies()

    await loginAs(page, 'member@test.com')
    await expect(page).toHaveURL(/\/es\/student/)
    await capture(page, testInfo, 'member seeded login restored')
  })

  test('Pathway rollout flags hide student guidance and disable direct Check-In', async ({ page }, testInfo) => {
    await seedPathwayRecommendation(admin)

    try {
      await setPathwayFlags(admin, {
        enable_check_in: false,
        enable_recommendation_card: false,
        enable_growth_reflection: false,
      })

      await loginAs(page, 'member@test.com')
      await page.goto('/es/student', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

      await expect(page.getByText('Tus Next Three Moves')).toHaveCount(0)
      await expect(page.getByText('Tus proximos pasos')).toHaveCount(0)
      await capture(page, testInfo, 'pathway rollout disabled dashboard hidden')

      await page.goto('/es/student/pathway-check-in', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
      await expect(page.getByText('Check-In aun no disponible')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Completar Check-In' })).toHaveCount(0)
      await capture(page, testInfo, 'pathway rollout disabled check-in blocked')
    } finally {
      await seedPathwayRecommendation(admin)
    }
  })

  test('student dashboard prompts Check-In before completion and completed state persists', async ({ page }, testInfo) => {
    await resetMemberPathwayState(admin)

    try {
      await loginAs(page, 'member@test.com')
      await page.goto('/es/student', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

      await expect(page.getByText('Tus proximos pasos')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Empezar Check-In' })).toBeVisible()
      await expect(page.getByText('Tus Next Three Moves')).toHaveCount(0)
      await capture(page, testInfo, 'pathway dashboard no check-in prompt')

      await page.goto('/es/student/pathway-check-in', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
      await expect(page.getByRole('heading', { name: 'Pathway Check-In' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Completar Check-In' })).toBeVisible()
      await capture(page, testInfo, 'pathway check-in form before completion')

      await seedPathwayRecommendation(admin)
      await page.goto('/es/student/pathway-check-in', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
      await expect(page.getByText('Tu Check-In esta completo')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Completar Check-In' })).toHaveCount(0)
      await capture(page, testInfo, 'pathway check-in completed revisit state')
    } finally {
      await seedPathwayRecommendation(admin)
    }
  })

  test('Pathway Check-In form completes and generates Next Three Moves', async ({ page }, testInfo) => {
    await resetMemberPathwayState(admin)

    try {
      await loginAs(page, 'member@test.com')
      await page.goto('/es/student/pathway-check-in', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

      await expect(page.getByRole('heading', { name: 'Pathway Check-In' })).toBeVisible()
      await page.locator('label').filter({ hasText: 'Prepararme para oportunidades' }).click()
      await page.locator('label').filter({ hasText: 'Necesito preparacion profesional' }).click()
      await page.locator('input[name="study_interest"]').fill('AI product systems')
      await page.locator('label').filter({ hasText: /^4$/ }).click()
      await page.locator('label').filter({ hasText: '2 a 4 horas al mes' }).click()
      await page.getByRole('button', { name: 'Completar Check-In' }).click()
      await page.waitForURL(/\/es\/student\/pathway-check-in\?completed=1/, { timeout: 60_000 })

      await expect(page.getByText('Tu Check-In esta completo')).toBeVisible()
      const { data: checkIn, error: checkInError } = await admin
        .from('pathway_check_in')
        .select('id,status,growth_stage,primary_focus')
        .eq('user_id', MEMBER_ID)
        .single()

      if (checkInError) throw new Error(`load generated pathway check-in: ${checkInError.message}`)
      expect(checkIn.status).toBe('completed')
      expect(checkIn.growth_stage).toBe('candidate')
      expect(checkIn.primary_focus).toBe('opportunity_readiness')

      const { data: recommendations, error: recommendationError } = await admin
        .from('pathway_recommendation')
        .select('id,category,status')
        .eq('check_in_id', checkIn.id)
        .order('sort_order')

      if (recommendationError) {
        throw new Error(`load generated pathway recommendations: ${recommendationError.message}`)
      }

      expect(recommendations).toHaveLength(3)
      expect(recommendations?.map((recommendation) => recommendation.category)).toEqual([
        'learn',
        'connect',
        'prove',
      ])
      expect(recommendations?.map((recommendation) => recommendation.status)).toEqual([
        'active',
        'active',
        'active',
      ])
      await capture(page, testInfo, 'pathway check-in completed generated recommendations')
    } finally {
      await seedPathwayRecommendation(admin)
    }
  })

  test('RLS blocks cross-student Pathway recommendation reads and writes', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'DB-only RLS check runs once.')

    await cleanupCrossStudentRlsFixture(admin)
    const anon = getAnonClient()

    try {
      assertNoDbError(
        await admin.from('pathway_check_in').insert({
          id: OTHER_CHECK_IN_ID,
          user_id: EBOARD_ID,
          chapter_id: CHAPTER_ID,
          status: 'completed',
          looking_for: 'Private eboard fixture',
          current_blocker: 'Private blocker',
          study_interest: 'Private interest',
          confidence_level: 3,
          monthly_time_commitment: 'one_hour',
          growth_stage: 'builder',
          primary_focus: 'technical_experience',
          submitted_at: new Date().toISOString(),
        }),
        'insert cross-student check-in fixture'
      )
      assertNoDbError(
        await admin.from('pathway_recommendation').insert({
          id: OTHER_RECOMMENDATION_ID,
          check_in_id: OTHER_CHECK_IN_ID,
          user_id: EBOARD_ID,
          category: 'learn',
          status: 'active',
          title: 'Private recommendation',
          body: 'Private recommendation body.',
          reason: 'Private recommendation reason.',
          sort_order: 1,
          source_type: 'fixed_action',
          source_event_id: null,
          cta_type: 'attend',
          evidence_signal: 'event_attendance',
          matched_reasons: ['Private fixture'],
        }),
        'insert cross-student recommendation fixture'
      )

      const signIn = await anon.auth.signInWithPassword({
        email: 'member@test.com',
        password: PASSWORD,
      })
      expect(signIn.error).toBeNull()

      const { data: hiddenRows, error: hiddenRowsError } = await anon
        .from('pathway_recommendation')
        .select('id')
        .eq('id', OTHER_RECOMMENDATION_ID)

      expect(hiddenRowsError).toBeNull()
      expect(hiddenRows).toEqual([])

      const crossUpdate = await anon
        .from('pathway_recommendation')
        .update({ status: 'dismissed' })
        .eq('id', OTHER_RECOMMENDATION_ID)
        .select('id, status')

      expect(crossUpdate.error).toBeNull()
      expect(crossUpdate.data).toEqual([])

      const crossDelete = await anon
        .from('pathway_recommendation')
        .delete()
        .eq('id', OTHER_RECOMMENDATION_ID)
        .select('id')

      expect(crossDelete.error).toBeNull()
      expect(crossDelete.data).toEqual([])

      const { data: untouchedRecommendation, error: untouchedRecommendationError } = await admin
        .from('pathway_recommendation')
        .select('status')
        .eq('id', OTHER_RECOMMENDATION_ID)
        .single()

      if (untouchedRecommendationError) {
        throw new Error(`load untouched recommendation fixture: ${untouchedRecommendationError.message}`)
      }
      expect(untouchedRecommendation.status).toBe('active')

      const crossInsert = await anon.from('pathway_recommendation').insert({
        check_in_id: OTHER_CHECK_IN_ID,
        user_id: MEMBER_ID,
        category: 'connect',
        status: 'active',
        title: 'Blocked cross-student insert',
        body: 'This insert should be rejected by RLS.',
        reason: 'The check-in belongs to a different user.',
        sort_order: 2,
        source_type: 'profile_action',
        source_event_id: null,
        cta_type: 'update_profile',
        evidence_signal: 'profile_updated',
        matched_reasons: ['Blocked fixture'],
      })

      expect(crossInsert.error?.message ?? '').toContain('row-level security')
    } finally {
      await anon.auth.signOut()
      await cleanupCrossStudentRlsFixture(admin)
    }
  })

  test('chapter event Pathway metadata section validates required fields only when eligibility is enabled', async ({ page }, testInfo) => {
    await loginAs(page, 'eboard@test.com')
    await page.goto('/es/chapter/events/new', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

    await expect(page.locator('#title')).toBeVisible()
    await page.locator('#title').fill(`QA Pathway Metadata ${testInfo.project.name}`)
    await page.getByRole('button', { name: /Siguiente/i }).click()

    await expect(page.locator('#startAt')).toBeVisible()
    await page.locator('#startAt').fill(dateTimeLocal(10, 14))
    await page.locator('#endAt').fill(dateTimeLocal(10, 16))
    await page.getByRole('button', { name: /Siguiente/i }).click()

    await expect(page.getByText('Modelo de registro')).toBeVisible()
    await page.getByRole('button', { name: /Siguiente/i }).click()

    await expect(page.getByText('Recomendar este evento a estudiantes')).toBeVisible()
    await expect(page.getByText('Este evento no aparecera en recomendaciones de Pathway')).toBeVisible()
    await page.getByText('Permitir recomendacion en Pathway').click()
    await expect(page.getByText('Por que vale la pena recomendarlo')).toBeVisible()
    await expect(page.getByText('Como se recomendara este evento')).toBeVisible()
    await capture(page, testInfo, 'chapter pathway metadata section enabled')

    await page.getByRole('button', { name: /Siguiente/i }).click()
    await expect(page.getByText('Selecciona el OKR principal').first()).toBeVisible()
    await expect(page.getByText('Selecciona al menos un pilar LEAD').first()).toBeVisible()
    await expect(page.getByText('Selecciona el boton que vera el estudiante').first()).toBeVisible()
    await capture(page, testInfo, 'chapter pathway required validation')
  })

  test('chapter Pathway step hides internal controls and lets non-Pathway events continue', async ({ page }, testInfo) => {
    await loginAs(page, 'eboard@test.com')
    await openNewEventPathwayStep(page, `QA Pathway Toggle Off ${testInfo.project.name}`)

    await expect(page.getByRole('checkbox', { name: 'Permitir recomendacion en Pathway' })).not.toBeChecked()
    for (const label of INTERNAL_PATHWAY_LABELS) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0)
    }

    await expect(page.getByRole('combobox').first()).toBeDisabled()
    await expect(page.getByRole('checkbox', { name: 'Inspire', exact: true })).toBeDisabled()

    await page.getByRole('button', { name: /Siguiente/i }).click()
    await expect(page.getByText('Resumen del evento')).toBeVisible()
    await expect(page.getByText('No elegible')).toBeVisible()

    await page.getByRole('button', { name: /Atras|Atrás/i }).click()
    await expect(page.getByText('Recomendar este evento a estudiantes')).toBeVisible()
    await capture(page, testInfo, 'chapter pathway toggle off review edge')
  })

  test('chapter can exercise all visible Pathway options and save derived metadata', async ({ page }, testInfo) => {
    const title = `QA Pathway Options ${testInfo.project.name} ${Date.now()}`
    await cleanupEventsByTitle(admin, title)

    try {
      await loginAs(page, 'eboard@test.com')
      await openNewEventPathwayStep(page, title)

      await page.getByRole('checkbox', { name: 'Permitir recomendacion en Pathway' }).click()
      await expect(page.getByRole('combobox').first()).toBeEnabled()

      await chooseEveryComboboxOption(page, 0, OKR_OPTIONS, 'Empower')
      await chooseEveryComboboxOption(page, 1, FOCUS_OPTIONS, 'Preparacion para oportunidades')
      await checkEveryCheckboxOption(page, PILLAR_OPTIONS)
      await checkEveryCheckboxOption(page, GROWTH_STAGE_OPTIONS)
      await checkEveryCheckboxOption(page, STUDENT_OUTCOME_OPTIONS)
      await expectComboboxOptions(page, 3, EVENT_CTA_OPTIONS, NON_EVENT_CTA_OPTIONS)
      await chooseEveryComboboxOption(page, 2, AUDIENCE_OPTIONS, 'Miembros activos')
      await chooseEveryComboboxOption(page, 3, EVENT_CTA_OPTIONS, 'Registrarse')
      await chooseEveryComboboxOption(page, 4, PROOF_OPTIONS, 'Item de portafolio')

      await capture(page, testInfo, 'chapter pathway all options selected')
      await page.getByRole('button', { name: /Siguiente/i }).click()
      await expect(page.getByText('Resumen del evento')).toBeVisible()
      await expect(page.getByText('Empower')).toBeVisible()
      await expect(page.getByText('Preparacion para oportunidades')).toBeVisible()
      await page.getByRole('button', { name: 'Guardar como borrador' }).click()
      await page.waitForURL(/\/es\/chapter\/events\/[0-9a-f-]+$/, { timeout: 60_000 })

      const { data: event, error: eventError } = await admin
        .from('event')
        .select('id,is_published')
        .eq('title', title)
        .single()

      if (eventError) throw new Error(`load created event: ${eventError.message}`)
      expect(event.is_published).toBe(false)

      const { data: metadata, error: metadataError } = await admin
        .from('event_pathway_metadata')
        .select('*')
        .eq('event_id', event.id)
        .single()

      if (metadataError) throw new Error(`load created event Pathway metadata: ${metadataError.message}`)

      expect(metadata.is_pathway_eligible).toBe(true)
      expect(metadata.primary_okr).toBe('empower')
      expect(metadata.pillar_keys).toEqual(expect.arrayContaining([
        'lead_academia',
        'academic_excellence',
        'womens_excellence',
        'professional_development',
        'leadership_development',
        'community_outreach',
        'chapter_development',
      ]))
      expect(metadata.growth_stage_fit).toEqual(expect.arrayContaining([
        'explorer',
        'builder',
        'leader',
        'candidate',
        'emerging_professional',
      ]))
      expect(metadata.student_outcomes).toEqual(expect.arrayContaining([
        'mission_orientation',
        'belonging',
        'career_exposure',
        'technical_skill',
        'innovation_project',
        'proof_artifact',
        'professional_readiness',
        'profile_visibility',
        'leadership_confidence',
        'teamwork',
        'reflection',
        'community_service',
      ]))
      expect(metadata.evidence_signals).toEqual(expect.arrayContaining([
        'event_registration',
        'proof_submitted',
      ]))
      expect(metadata.recommendation_safety).toBe('recommend_only_if_event_active')
      expect(metadata.metadata_status).toBe('ready')
      expect(metadata.coordination_risk).toBe('low')
      await capture(page, testInfo, 'chapter pathway draft saved with derived metadata')
    } finally {
      await cleanupEventsByTitle(admin, title)
    }
  })

  test('application access forces the Pathway CTA back to Postular only', async ({ page }, testInfo) => {
    await loginAs(page, 'eboard@test.com')
    await openNewEventPathwayStep(page, `QA Pathway Application CTA ${testInfo.project.name}`)

    await page.getByRole('checkbox', { name: 'Permitir recomendacion en Pathway' }).click()
    await chooseComboboxOption(page, 3, 'Registrarse')
    await expect(page.getByRole('combobox').nth(3)).toContainText('Registrarse')

    await page.getByRole('button', { name: /Atras|Atrás/i }).click()
    await expect(page.getByText('Modelo de registro')).toBeVisible()
    await page.getByText(/Postulaci.n requerida/).click()
    await page.getByRole('button', { name: /Siguiente/i }).click()

    await expect(page.getByText('Recomendar este evento a estudiantes')).toBeVisible()
    await expect(page.getByRole('combobox').nth(3)).toContainText('Postular')
    await expectComboboxOptions(page, 3, ['Postular'], ['Registrarse', 'Asistir'])
    await capture(page, testInfo, 'chapter pathway application cta forced to apply')
  })

  test('chapter edit form reloads and can disable existing Pathway metadata', async ({ page }, testInfo) => {
    await seedEditablePathwayEvent(admin)

    try {
      await loginAs(page, 'eboard@test.com')
      await page.goto(`/es/chapter/events/${EDIT_EVENT_ID}`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

      await expect(page.getByRole('heading', { name: 'Editar evento' })).toBeVisible()
      await expect(page.getByText('Recomendar este evento a estudiantes')).toBeVisible()
      await expect(page.getByRole('checkbox', { name: 'Permitir recomendacion en Pathway' })).toBeChecked()
      await expect(page.getByText('Empower').first()).toBeVisible()
      await expect(page.getByText('Preparacion para oportunidades').first()).toBeVisible()
      await expect(page.getByText('Miembros activos').first()).toBeVisible()
      await expect(page.getByText('Registrarse').first()).toBeVisible()
      await expect(page.getByText('Growth Reflection').first()).toBeVisible()
      await capture(page, testInfo, 'chapter edit pathway metadata reloaded')

      await page.getByRole('checkbox', { name: 'Permitir recomendacion en Pathway' }).click()
      await expect(page.getByText('Este evento no aparecera en recomendaciones de Pathway')).toBeVisible()
      await page.getByRole('button', { name: 'Guardar borrador' }).click()

      await expect
        .poll(async () => {
          const { data, error } = await admin
            .from('event_pathway_metadata')
            .select('is_pathway_eligible')
            .eq('event_id', EDIT_EVENT_ID)
            .single()

          if (error) throw new Error(`load edit event metadata: ${error.message}`)
          return data.is_pathway_eligible
        }, { timeout: 30_000 })
        .toBe(false)
      await capture(page, testInfo, 'chapter edit pathway metadata disabled')
    } finally {
      await cleanupEventById(admin, EDIT_EVENT_ID)
    }
  })

  test('student profile and proof recommendation CTAs mark started and route safely', async ({ page }, testInfo) => {
    await seedPathwayRecommendation(admin)

    try {
      await loginAs(page, 'member@test.com')
      await page.goto('/es/student', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

      const profileCard = page
        .getByRole('heading', { name: 'Refresh your LEAD profile' })
        .locator('xpath=ancestor::*[contains(@class, "rounded-lg")][1]')
      await profileCard.getByRole('button', { name: 'Actualizar perfil' }).click()
      await page.waitForURL(/\/(?:es\/)?student\/profile/, { timeout: 60_000 })
      await expectRecommendationStatus(admin, PROFILE_RECOMMENDATION_ID, 'started')
      await capture(page, testInfo, 'student profile recommendation started')

      await page.goto('/es/student', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
      const proofCard = page
        .getByRole('heading', { name: 'Capture one learning proof' })
        .locator('xpath=ancestor::*[contains(@class, "rounded-lg")][1]')
      await proofCard.getByRole('button', { name: 'Capturar aprendizaje' }).click()
      await page.waitForURL(new RegExp(`/(?:es/)?student/growth-reflection.*recommendationId=${PROOF_RECOMMENDATION_ID}`), {
        timeout: 60_000,
      })
      await expect(page.locator('input[name="recommendation_id"]')).toHaveValue(PROOF_RECOMMENDATION_ID)
      await expectRecommendationStatus(admin, PROOF_RECOMMENDATION_ID, 'started')
      await capture(page, testInfo, 'student proof recommendation started')
    } finally {
      await seedPathwayRecommendation(admin)
    }
  })

  test('student can dismiss a recommendation and remove it from dashboard guidance', async ({ page }, testInfo) => {
    await seedPathwayRecommendation(admin)

    try {
      await loginAs(page, 'member@test.com')
      await page.goto('/es/student', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

      const profileCard = page
        .getByRole('heading', { name: 'Refresh your LEAD profile' })
        .locator('xpath=ancestor::*[contains(@class, "rounded-lg")][1]')
      await profileCard.getByRole('button', { name: 'No aplica' }).click()
      await expectRecommendationStatus(admin, PROFILE_RECOMMENDATION_ID, 'dismissed')

      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
      await expect(page.getByText('Refresh your LEAD profile')).toHaveCount(0)
      await expect(page.getByText(EVENT_TITLE)).toBeVisible()
      await capture(page, testInfo, 'student recommendation dismissed')
    } finally {
      await seedPathwayRecommendation(admin)
    }
  })

  test('student dashboard renders event-backed recommendation CTAs', async ({ page }, testInfo) => {
    await seedPathwayRecommendation(admin)

    await loginAs(page, 'member@test.com')
    await page.goto('/es/student', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

    await expect(page.getByText('Tus Next Three Moves')).toBeVisible()
    await expect(page.getByText(EVENT_TITLE)).toBeVisible()
    await expect(page.getByText('Evento LEAD')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Registrarme al evento' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Capturar aprendizaje' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Actualizar perfil' })).toBeVisible()
    await capture(page, testInfo, 'student recommendation ctas')

    await page.getByRole('button', { name: 'Registrarme al evento' }).click()
    await page.waitForURL(new RegExp(`/(?:es/)?events/${EVENT_ID}`), { timeout: 60_000 })

    const { data, error } = await admin
      .from('pathway_recommendation')
      .select('status')
      .eq('id', EVENT_RECOMMENDATION_ID)
      .single()

    if (error) throw new Error(`load recommendation after event CTA: ${error.message}`)
    expect(data.status).toBe('started')
    await capture(page, testInfo, 'student event recommendation cta starts recommendation')

    await expect(page.getByRole('heading', { name: EVENT_TITLE })).toBeVisible()
    await page.getByRole('button', { name: /^Registrarme$/ }).click()
    await page.waitForURL(new RegExp(`/(?:es/)?student/events\\?event=${EVENT_ID}`), { timeout: 60_000 })

    const { data: registration, error: registrationError } = await admin
      .from('event_registration')
      .select('status')
      .eq('event_id', EVENT_ID)
      .eq('user_id', MEMBER_ID)
      .single()

    if (registrationError) throw new Error(`load event registration after Pathway CTA: ${registrationError.message}`)
    expect(registration.status).toBe('registered')
    await expect(page.getByText('Basicos del check-in')).toHaveCount(0)
    await expect(page.getByText('Recomendaciones')).toHaveCount(1)
    await expect(page.getByText('Para entrar rapido')).toHaveCount(1)
    await expect(page.getByText('Ten el brillo alto cuando llegues al check-in.')).toHaveCount(1)
    await capture(page, testInfo, 'student event recommendation completes registration')
  })

  test('application event recommendation uses postulation flow and pending-review state', async ({ page }, testInfo) => {
    await seedPathwayRecommendation(admin)
    await switchSeedEventToApplication(admin)

    try {
      await loginAs(page, 'member@test.com')
      await page.goto('/es/student', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

      await expect(page.getByRole('button', { name: 'Postular al evento' })).toBeVisible()
      await page.getByRole('button', { name: 'Postular al evento' }).click()
      await page.waitForURL(new RegExp(`/(?:es/)?events/${EVENT_ID}`), { timeout: 60_000 })
      await expect(page.getByText('Envia tu postulacion y el equipo anfitrion revisara tus respuestas.')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Postular ahora' })).toBeVisible()
      await capture(page, testInfo, 'student application recommendation lands on postulation event')

      await page.getByRole('button', { name: 'Postular ahora' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Enviar postulacion' }).click()
      await expect(page.getByText('Esta pregunta es obligatoria.')).toBeVisible()
      await page.locator('textarea').fill('This event maps directly to my current Pathway next step.')
      await page.getByRole('button', { name: 'Enviar postulacion' }).click()
      await expect(page.getByText('Tu postulacion esta en revision.')).toBeVisible({ timeout: 60_000 })

      const { data: registration, error: registrationError } = await admin
        .from('event_registration')
        .select('status')
        .eq('event_id', EVENT_ID)
        .eq('user_id', MEMBER_ID)
        .single()

      if (registrationError) throw new Error(`load application registration: ${registrationError.message}`)
      expect(registration.status).toBe('pending_review')
      await expectRecommendationStatus(admin, EVENT_RECOMMENDATION_ID, 'started')
      await capture(page, testInfo, 'student application recommendation submitted pending review')
    } finally {
      await seedPathwayRecommendation(admin)
    }
  })

  test('Growth Reflection carries event and recommendation context into proof capture', async ({ page }, testInfo) => {
    await loginAs(page, 'member@test.com')
    const params = new URLSearchParams({
      eventId: EVENT_ID,
      eventTitle: EVENT_TITLE,
      recommendationId: EVENT_RECOMMENDATION_ID,
      recommendationTitle: EVENT_TITLE,
    })
    await page.goto(`/es/student/growth-reflection?${params.toString()}`, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)

    await expect(page.getByRole('heading', { name: 'Growth Reflection' })).toBeVisible()
    await expect(page.locator('input[name="event_id"]')).toHaveValue(EVENT_ID)
    await expect(page.locator('input[name="recommendation_id"]')).toHaveValue(EVENT_RECOMMENDATION_ID)
    await expect(page.locator('input[name="participated_in"]')).toHaveValue(EVENT_TITLE)
    await capture(page, testInfo, 'growth reflection context handoff')

    await page.locator('textarea[name="learned"]').fill('I learned how LEAD events can become specific next actions.')
    await page.locator('textarea[name="skill_or_mindset"]').fill('Reflection and opportunity readiness.')
    await page.locator('textarea[name="goal_connection"]').fill('This connects to building stronger career proof.')
    await page.locator('textarea[name="next_move"]').fill('Register for one relevant event and capture the learning.')
    await page.getByRole('button', { name: 'Guardar reflexion' }).click()
    await page.waitForURL(/\/(?:es\/)?student\?reflection=saved/, { timeout: 60_000 })

    const { data, error } = await admin
      .from('pathway_recommendation')
      .select('status')
      .eq('id', EVENT_RECOMMENDATION_ID)
      .single()

    if (error) throw new Error(`load recommendation after reflection: ${error.message}`)
    expect(data.status).toBe('completed')
    await capture(page, testInfo, 'growth reflection saved recommendation completed')
  })

  test('Pathway critical accessibility smoke passes on student and chapter surfaces', async ({ page }, testInfo) => {
    await seedPathwayRecommendation(admin)

    await loginAs(page, 'member@test.com')
    await page.goto('/es/student', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
    await expectNoCriticalA11y(page, testInfo, 'pathway student dashboard')

    await page.goto('/es/student/pathway-check-in', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
    await expectNoCriticalA11y(page, testInfo, 'pathway check-in completed')

    const params = new URLSearchParams({
      eventId: EVENT_ID,
      eventTitle: EVENT_TITLE,
      recommendationId: EVENT_RECOMMENDATION_ID,
      recommendationTitle: EVENT_TITLE,
    })
    await page.goto(`/es/student/growth-reflection?${params.toString()}`, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
    await expectNoCriticalA11y(page, testInfo, 'pathway growth reflection')

    await page.context().clearCookies()
    await loginAs(page, 'eboard@test.com')
    await openNewEventPathwayStep(page, `QA Pathway A11y ${testInfo.project.name}`)
    await expectNoCriticalA11y(page, testInfo, 'chapter pathway metadata step')
    await capture(page, testInfo, 'pathway critical accessibility smoke')
  })
})
