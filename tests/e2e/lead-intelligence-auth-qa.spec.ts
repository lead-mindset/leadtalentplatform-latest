import { expect, test, type Page, type TestInfo } from '@playwright/test'
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
const EVENT_TITLE = 'QA Pathway Event: AI Career Sprint'
const OUTPUT_DIR = path.join('outputs', 'issue-256-pathway-metadata-ui')
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

  test('student dashboard renders event-backed recommendation CTAs', async ({ page }, testInfo) => {
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
})
