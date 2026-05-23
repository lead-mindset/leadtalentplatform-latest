import { test, expect, type Page, type Locator } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const PASSWORD = 'password123'
const LOGIN_REDIRECT_TIMEOUT_MS = 60_000
const OPEN_EVENT_ID = '92000000-0000-4000-8000-000000000016'
const APPLICATION_EVENT_ID = '92000000-0000-4000-8000-000000000030'
const MEMBER_USER_ID = '22222222-2222-2222-2222-222222222222'
const REPORT_ROOT = path.join('outputs', 'launch-qa')
const QA_SCOPE = process.env.LAUNCH_QA_SCOPE ?? 'all'

type Severity = 'blocker' | 'major' | 'minor' | 'info'

type Finding = {
  severity: Severity
  title: string
  step: string
  url: string
  expected: string
  actual: string
  screenshot?: string
  suggestedFix: string
}

type StepResult = {
  label: string
  path: string
  finalUrl: string
  screenshot?: string
}

type ExpectedBehavior = {
  label: string
  path: string
  finalUrl: string
  reason: string
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}

async function firstVisible(locator: Locator): Promise<Locator | null> {
  const count = await locator.count()
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index)
    if (await item.isVisible().catch(() => false)) return item
  }
  return null
}

async function hasRegisteredEventState(page: Page) {
  const registeredBadge = page.getByText(/^registrado$/i)
  const qrLink = page.getByRole('link', { name: /codigo qr|c[oó]digo qr|ver mi/i })
  const studentEventRoute = /\/student\/events/.test(new URL(page.url()).pathname)

  return (
    studentEventRoute ||
    (await registeredBadge.first().isVisible().catch(() => false)) ||
    (await qrLink.first().isVisible().catch(() => false))
  )
}

class LaunchQaCollector {
  readonly findings: Finding[] = []
  readonly steps: StepResult[] = []
  readonly expectedBehaviors: ExpectedBehavior[] = []
  private currentStep = 'setup'
  private expectedNetworkPattern: RegExp | null = null

  constructor(
    private readonly page: Page,
    private readonly projectName: string
  ) {
    this.page.on('console', (message) => {
      if (message.type() !== 'error') return
      const text = message.text()
      if (/favicon|devtools/i.test(text)) return
      if (this.expectedNetworkPattern && /failed to load resource/i.test(text)) return
      this.addFinding('major', 'Browser console error', {
        expected: 'No critical console errors during launch flows.',
        actual: text,
        suggestedFix: 'Open the route in dev tools, trace the client-side exception, and add a regression test for the affected flow.',
      })
    })

    this.page.on('pageerror', (error) => {
      this.addFinding('major', 'Uncaught browser exception', {
        expected: 'No uncaught JavaScript exceptions during launch flows.',
        actual: error.message,
        suggestedFix: 'Fix the throwing component/action path and verify the route with Playwright.',
      })
    })

    this.page.on('response', (response) => {
      const status = response.status()
      if (status < 400) return
      const url = response.url()
      if (this.expectedNetworkPattern?.test(url)) return
      if (/\/_next\/static\//.test(url)) return
      this.addFinding(status >= 500 ? 'major' : 'minor', `Unexpected HTTP ${status}`, {
        expected: 'No unexpected 4xx/5xx responses outside intentional auth failures.',
        actual: `${status} ${url}`,
        suggestedFix: 'Inspect the server action/API route or asset request and align the UI state with the expected authorization path.',
      })
    })
  }

  addFinding(
    severity: Severity,
    title: string,
    details: {
      expected: string
      actual: string
      suggestedFix: string
      screenshot?: string
    }
  ) {
    this.findings.push({
      severity,
      title,
      step: this.currentStep,
      url: this.page.url(),
      expected: details.expected,
      actual: details.actual,
      screenshot: details.screenshot,
      suggestedFix: details.suggestedFix,
    })
  }

  async screenshot(label: string) {
    const screenshotPath = path.join(REPORT_ROOT, this.projectName, `${slug(label)}.png`)
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true })
    await this.page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined)
    return screenshotPath
  }

  async checkVisualOverflow(label: string) {
    const overflow = await this.page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth
      const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0)
      const offenders: string[] = []

      for (const element of Array.from(document.querySelectorAll('body *'))) {
        const htmlElement = element as HTMLElement
        const rect = htmlElement.getBoundingClientRect()
        const style = window.getComputedStyle(htmlElement)
        if (!rect.width || !rect.height) continue
        if (style.position === 'fixed') continue
        if (rect.left < -8 || rect.right > viewportWidth + 8) {
          offenders.push(
            `${element.tagName.toLowerCase()}${htmlElement.id ? `#${htmlElement.id}` : ''}${htmlElement.className ? `.${String(htmlElement.className).split(/\s+/).slice(0, 3).join('.')}` : ''}`
          )
        }
        if (offenders.length >= 5) break
      }

      return {
        hasHorizontalScroll: scrollWidth > viewportWidth + 8,
        viewportWidth,
        scrollWidth,
        offenders,
      }
    }).catch(() => null)

    if (!overflow?.hasHorizontalScroll) return
    const shot = await this.screenshot(`${label} overflow`)
    this.addFinding('minor', 'Horizontal overflow detected', {
      expected: 'The page should fit the viewport without body-level horizontal scrolling.',
      actual: `Viewport ${overflow.viewportWidth}px, scroll width ${overflow.scrollWidth}px. Offenders: ${overflow.offenders.join(', ') || 'not identified'}.`,
      screenshot: shot,
      suggestedFix: 'Constrain wide content with responsive grid/table wrappers or overflow containers that do not expand the body width.',
    })
  }

  async visit(
    label: string,
    route: string,
    options: {
      expectedUrl?: RegExp
      expectedText?: RegExp
      screenshot?: boolean
      expectedBehavior?: string
    } = {}
  ) {
    this.currentStep = label
    let navigationError: unknown
    await this.page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch((error) => {
      navigationError = error
    })
    await this.page.waitForLoadState('networkidle', { timeout: 1_500 }).catch(() => undefined)

    const shot = options.screenshot === false ? undefined : await this.screenshot(label)

    const finalPath = new URL(this.page.url()).pathname
    const expectedUrlMatched = options.expectedUrl?.test(finalPath) ?? false
    if (navigationError && !expectedUrlMatched) {
      this.addFinding('blocker', 'Navigation failed', {
        expected: `Route ${route} should load.`,
        actual: navigationError instanceof Error ? navigationError.message : String(navigationError),
        screenshot: shot,
        suggestedFix: 'Check route guard/server component errors and rerun the same URL in Playwright.',
      })
    }

    if (options.expectedUrl && !expectedUrlMatched) {
      this.addFinding('major', 'Unexpected redirect or landing route', {
        expected: `URL path should match ${options.expectedUrl}.`,
        actual: finalPath,
        screenshot: shot,
        suggestedFix: 'Review auth redirect logic and route guard expectations for this persona.',
      })
    } else if (options.expectedUrl) {
      const requestedPath = new URL(route, 'http://launch-qa.local').pathname
      if (requestedPath !== finalPath) {
        this.expectedBehaviors.push({
          label,
          path: route,
          finalUrl: this.page.url(),
          reason: options.expectedBehavior ?? 'Route guard redirected to the expected boundary.',
        })
      }
    }

    if (options.expectedText) {
      const hasText = Boolean(await firstVisible(this.page.getByText(options.expectedText)))
      if (!hasText) {
        this.addFinding('major', 'Expected page content missing', {
          expected: `Visible text matching ${options.expectedText}.`,
          actual: 'Text was not visible in the rendered page.',
          screenshot: shot,
          suggestedFix: 'Verify that the server data loads for the seeded persona and the page copy still matches the intended state.',
        })
      }
    }

    await this.checkVisualOverflow(label)
    this.steps.push({ label, path: route, finalUrl: this.page.url(), screenshot: shot })
  }

  async resetSession() {
    this.currentStep = 'reset session'
    await this.page.context().clearCookies()
    await this.page.goto('/es/auth/login', { waitUntil: 'domcontentloaded' })
    await this.page.evaluate(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    }).catch(() => undefined)
  }

  async loginAs(email: string, expectedPath: RegExp) {
    await this.resetSession()
    this.currentStep = `login ${email}`
    await this.page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
    await expect(this.page.locator('#email')).toBeVisible()
    await this.page.locator('#email').fill(email)
    await this.page.locator('#password').fill(PASSWORD)
    await this.page.locator('button[type="submit"]').click()
    const outcome = await Promise.race([
      this.page
        .waitForURL((url) => !url.pathname.endsWith('/auth/login'), { timeout: LOGIN_REDIRECT_TIMEOUT_MS })
        .then(() => 'redirect' as const)
        .catch(() => 'timeout' as const),
      this.page
        .locator('#error-message')
        .waitFor({ state: 'visible', timeout: LOGIN_REDIRECT_TIMEOUT_MS })
        .then(() => 'error' as const)
        .catch(() => 'timeout' as const),
    ])

    if (outcome === 'error') {
      const shot = await this.screenshot(`login ${email} failed`)
      this.addFinding('major', 'Login failed', {
        expected: `${email} should authenticate with the seeded password.`,
        actual: await this.page.locator('#error-message').innerText().catch(() => 'Login error text unavailable.'),
        screenshot: shot,
        suggestedFix: 'Check seed auth state, password-login redirect resolution, and Supabase cookie propagation.',
      })
      return
    }

    await this.page.waitForLoadState('networkidle', { timeout: 1_500 }).catch(() => undefined)
    const shot = await this.screenshot(`dashboard ${email}`)
    if (!expectedPath.test(new URL(this.page.url()).pathname)) {
      this.addFinding('major', 'Wrong post-login dashboard', {
        expected: `${email} should land on ${expectedPath}.`,
        actual: new URL(this.page.url()).pathname,
        screenshot: shot,
        suggestedFix: 'Review resolvePostAuthRedirectPath and persona permissions/profile state.',
      })
    }
  }

  async invalidLogin() {
    await this.resetSession()
    this.currentStep = 'invalid login'
    this.expectedNetworkPattern = /\/auth\/v1\/token/
    await this.page.locator('#email').fill('missing-user@test.com')
    await this.page.locator('#password').fill('wrong-password')
    await this.page.locator('button[type="submit"]').click()
    await this.page.waitForTimeout(1500)
    this.expectedNetworkPattern = null
    const shot = await this.screenshot('invalid login')
    const stayedOnLogin = new URL(this.page.url()).pathname.endsWith('/auth/login')
    const visibleError = await this.page
      .getByText(/invalid|error|incorrect|credenciales|no pudimos|failed/i)
      .first()
      .isVisible()
      .catch(() => false)
    if (!stayedOnLogin || !visibleError) {
      this.addFinding('minor', 'Invalid login feedback is unclear', {
        expected: 'Invalid credentials should keep the user on login and show a visible error.',
        actual: `stayedOnLogin=${stayedOnLogin}, visibleError=${visibleError}`,
        screenshot: shot,
        suggestedFix: 'Add or expose an accessible error message for failed password login.',
      })
    }
  }

  async clickFirst(label: string, locator: Locator, missingSeverity: Severity = 'major') {
    this.currentStep = label
    const target = await firstVisible(locator)
    if (!target) {
      const shot = await this.screenshot(`${label} missing target`)
      this.addFinding(missingSeverity, 'Expected interactive control missing', {
        expected: `A visible control should exist for ${label}.`,
        actual: 'No matching visible control was found.',
        screenshot: shot,
        suggestedFix: 'Check whether the control is hidden by permissions, copy drift, or a rendering error.',
      })
      return false
    }
    await target.click()
    await this.page.waitForLoadState('networkidle', { timeout: 1_500 }).catch(() => undefined)
    return true
  }
}

async function runAnonymousFlows(qa: LaunchQaCollector) {
  await qa.visit('anonymous home', '/es', { expectedText: /LEAD/i })
  await qa.visit('anonymous events list', '/es/events', { expectedText: /eventos|events|encuentra/i })
  await qa.visit('anonymous open event detail', `/es/events/${OPEN_EVENT_ID}`, { expectedText: /registro|registr/i })
  await qa.clickFirst('anonymous open event login CTA', qa['page'].getByRole('link', { name: /iniciar sesion/i }).first())
  await qa['page'].waitForURL(/\/auth\/login/, { timeout: 5_000 }).catch(() => undefined)
  if (!/\/auth\/login/.test(new URL(qa['page'].url()).pathname)) {
    qa.addFinding('major', 'Anonymous event CTA did not route to login', {
      expected: 'Anonymous registration CTA should go to login.',
      actual: qa['page'].url(),
      suggestedFix: 'Check event registration loginUrl construction.',
    })
  }
  await qa.visit('anonymous application event detail', `/es/events/${APPLICATION_EVENT_ID}`, { expectedText: /postular|postulacion|requiere/i })
  await qa.visit('anonymous public chapter page', '/es/chapter/leaduni', { expectedText: /LEAD UNI/i })
  await qa.visit('anonymous login page', '/es/auth/login', { expectedText: /bienvenido|correo|email|login/i })
  await qa.visit('anonymous signup page', '/es/auth/sign-up', { expectedText: /crear|sign|email/i })
  await qa.visit('anonymous protected student redirect', '/es/student', { expectedUrl: /\/auth\/login/ })
  await qa.visit('anonymous protected chapter redirect', '/es/chapter', { expectedUrl: /\/auth\/login/ })
  await qa.visit('anonymous protected admin redirect', '/es/admin', { expectedUrl: /\/auth\/login/ })
  await qa.visit('anonymous protected company redirect', '/es/company/dashboard', { expectedUrl: /\/auth\/login/ })
  await qa.invalidLogin()
}

async function runStudentLikeFlows(qa: LaunchQaCollector) {
  await qa.loginAs('participant@test.com', /\/student/)
  await qa.visit('participant student dashboard', '/es/student', { expectedText: /mi perfil|explorar eventos|mis eventos|perfil/i })
  await qa.visit('participant profile', '/es/student/profile', { expectedText: /perfil|profile/i })
  await qa.visit('participant resume', '/es/student/resume', { expectedText: /resume|cv|curriculum|hoja/i })
  await qa.visit('participant events', '/es/student/events', { expectedText: /eventos|events/i })
  await qa.visit('participant blocked from chapter', '/es/chapter', { expectedUrl: /\/student/ })
  await qa.visit('participant blocked from company', '/es/company/dashboard', { expectedUrl: /\/auth\/login|\/company\/onboard/ })

  await qa.loginAs('member@test.com', /\/student/)
  await qa.visit('member student dashboard', '/es/student', { expectedText: /miembro oficial/i })
  await qa.visit('member blocked from chapter', '/es/chapter', { expectedUrl: /\/student/ })
  await qa.visit('member open event before registration', `/es/events/${OPEN_EVENT_ID}`, { expectedText: /registrarme|registrado|registro/i })
  const registeredBefore = await hasRegisteredEventState(qa['page'])
  if (!registeredBefore) {
    await qa.clickFirst('member open event registration submit', qa['page'].getByRole('button', { name: /^registrarme$/i }))
      await qa['page'].waitForURL(/\/student\/events|\/events\//, { timeout: 30_000 }).catch(() => null)
      await qa['page'].waitForTimeout(1000)
      await expect
        .poll(async () => hasRegisteredEventState(qa['page']), { timeout: 30_000 })
        .toBe(true)
        .catch(() => undefined)
      const registered = await hasRegisteredEventState(qa['page'])
    if (!registered) {
      const shot = await qa.screenshot('member registration failed')
      qa.addFinding('major', 'Open event registration did not reach registered state', {
        expected: 'After submitting, the member should see a registered state or QR link.',
        actual: 'No registered state was visible after submitting the open event form.',
        screenshot: shot,
        suggestedFix: 'Inspect registerForEvent action, event capacity, and client refresh handling.',
      })
    }
  }
  await qa.visit('member open event duplicate state', `/es/events/${OPEN_EVENT_ID}`, { expectedText: /registro|registrado/i })
  const registeredAfterRevisit = await hasRegisteredEventState(qa['page'])
  const duplicateButtonVisible = await firstVisible(qa['page'].getByRole('button', { name: /^registrarme$/i }))
  if (registeredAfterRevisit && duplicateButtonVisible) {
    const shot = await qa.screenshot('member duplicate registration button visible')
    qa.addFinding('major', 'Duplicate registration button remains visible', {
      expected: 'Already registered users should see registered/QR state, not a fresh registration button.',
      actual: 'A visible Registrarme button remained after registration.',
      screenshot: shot,
      suggestedFix: 'Ensure myRegistration is refreshed and duplicate registrations render the registered state.',
    })
  } else if (!registeredAfterRevisit) {
    const shot = await qa.screenshot('member registration state missing after revisit')
    qa.addFinding('major', 'Open event registration did not persist after revisit', {
      expected: 'After registration, revisiting the event should show registered/QR state.',
      actual: 'The event detail still rendered as an unregistered visitor/member state.',
      screenshot: shot,
      suggestedFix: 'Inspect registerForEvent action, redirect handling, and myRegistration lookup on event detail.',
    })
  }
  await qa.visit('member application event before submit', `/es/events/${APPLICATION_EVENT_ID}`, { expectedText: /postular|postulacion/i })
  if (await qa.clickFirst('member application open modal', qa['page'].getByRole('button', { name: /postular/i }))) {
    await qa.clickFirst('member application empty submit', qa['page'].getByRole('button', { name: /enviar postulacion/i }))
    const requiredError = await qa['page'].getByText(/obligatoria|configuradas/i).first().isVisible().catch(() => false)
    if (!requiredError) {
      const shot = await qa.screenshot('member application missing validation')
      qa.addFinding('major', 'Application form missing required-answer validation', {
        expected: 'Submitting empty required application answers should show validation.',
        actual: 'No required-answer validation message was visible.',
        screenshot: shot,
        suggestedFix: 'Check ApplyModal required question validation and labels.',
      })
    }
  }

  await qa.loginAs('alumni@test.com', /\/student/)
  await qa.visit('alumni student dashboard', '/es/student', { expectedText: /alumni/i })
  await qa.visit('alumni blocked from chapter', '/es/chapter', { expectedUrl: /\/student/ })
}

async function runChapterFlows(qa: LaunchQaCollector) {
  const leaders = [
    { email: 'president@test.com', label: 'president', canSensitive: true, canAssign: true, canRevoke: true },
    { email: 'vp@test.com', label: 'vp', canSensitive: true, canAssign: true, canRevoke: true },
    { email: 'editor@test.com', label: 'legacy editor', canSensitive: true, canAssign: false, canRevoke: false },
    { email: 'eboard@test.com', label: 'regular eboard', canSensitive: false, canAssign: false, canRevoke: false },
  ]

  for (const persona of leaders) {
    await qa.loginAs(persona.email, /\/chapter/)
    await qa.visit(`${persona.label} chapter dashboard`, '/es/chapter', { expectedText: /LEAD UNI|resumen del capitulo|crear evento/i })
    await qa.visit(`${persona.label} active roster`, '/es/chapter/members?status=active', { expectedText: /Test Member/i })
    const assignVisible = Boolean(await firstVisible(qa['page'].getByRole('button', { name: /asignar rol|cambiar rol/i })))
    const revokeVisible = Boolean(await firstVisible(qa['page'].getByRole('button', { name: /revocar membresia/i })))
    if (persona.canAssign !== assignVisible) {
      const shot = await qa.screenshot(`${persona.label} assign permission mismatch`)
      qa.addFinding('major', 'E-board assignment control permission mismatch', {
        expected: `${persona.label} assign visible = ${persona.canAssign}.`,
        actual: `assign visible = ${assignVisible}.`,
        screenshot: shot,
        suggestedFix: 'Align chapter.roles.assign_eboard permission checks between roster UI and server action.',
      })
    }
    if (persona.canRevoke !== revokeVisible) {
      const shot = await qa.screenshot(`${persona.label} revoke permission mismatch`)
      qa.addFinding('major', 'Membership revoke control permission mismatch', {
        expected: `${persona.label} revoke visible = ${persona.canRevoke}.`,
        actual: `revoke visible = ${revokeVisible}.`,
        screenshot: shot,
        suggestedFix: 'Align chapter.members.revoke permission checks between roster UI and server action.',
      })
    }

    await qa.visit(`${persona.label} pending roster`, '/es/chapter/members?status=pending')
    const sensitiveActionVisible = Boolean(
      await firstVisible(qa['page'].getByRole('button', { name: /aprobar|rechazar/i }))
    )
    if (!persona.canSensitive && sensitiveActionVisible) {
      const shot = await qa.screenshot(`${persona.label} pending permission mismatch`)
      qa.addFinding('major', 'Sensitive member tab visibility mismatch', {
        expected: `${persona.label} should not see applicant approve/reject controls.`,
        actual: 'Sensitive applicant controls were visible.',
        screenshot: shot,
        suggestedFix: 'Use chapter.members.view_applicants to drive visible statuses and default status redirects.',
      })
    }

    await qa.visit(`${persona.label} chapter events`, '/es/chapter/events', { expectedText: /crear evento|eventos/i })
    const deleteVisible = Boolean(await firstVisible(qa['page'].getByRole('button', { name: /eliminar/i })))
    const shouldSeeDelete = persona.label !== 'regular eboard'
    if (shouldSeeDelete !== deleteVisible) {
      const shot = await qa.screenshot(`${persona.label} event delete permission mismatch`)
      qa.addFinding('major', 'Event archive/delete control permission mismatch', {
        expected: `${persona.label} delete/archive visible = ${shouldSeeDelete}.`,
        actual: `delete/archive visible = ${deleteVisible}.`,
        screenshot: shot,
        suggestedFix: 'Align chapter.events.archive permission checks between event table UI and server action.',
      })
    }
    await qa.visit(`${persona.label} new chapter event form`, '/es/chapter/events/new', { expectedText: /title|titulo|event/i })
    await qa.visit(`${persona.label} chapter event detail`, `/es/chapter/events/${OPEN_EVENT_ID}`, { expectedText: /save|publish|evento|title|titulo/i })
    await qa.visit(`${persona.label} event applications`, `/es/chapter/events/${APPLICATION_EVENT_ID}/applications`, { expectedText: /postul|aplic|revision|solicitud/i })
    await qa.visit(`${persona.label} event checkin`, `/es/chapter/events/${OPEN_EVENT_ID}/checkin`, { expectedText: /check|qr|asistencia|registr/i })
  }
}

async function runAdminFlows(qa: LaunchQaCollector) {
  for (const persona of ['admin@test.com', 'staff@test.com']) {
    const label = persona.startsWith('staff') ? 'staff admin' : 'admin'
    await qa.loginAs(persona, /\/admin/)
    await qa.visit(`${label} admin dashboard`, '/es/admin', { expectedText: /admin|resumen|usuarios/i })
    await qa.visit(`${label} admin users`, '/es/admin/users', { expectedText: /usuarios|users|Test Member/i })
    await qa.visit(`${label} admin user detail`, `/es/admin/users/${MEMBER_USER_ID}`, { expectedText: /Test Member|Chapter Role Correction/i })
    await qa.visit(`${label} admin companies`, '/es/admin/companies', { expectedText: /company|empresa|Test Company/i })
    await qa.visit(`${label} admin invites`, '/es/admin/invites', { expectedText: /invite|invit/i })
    await qa.visit(`${label} admin chapters`, '/es/admin/chapters', { expectedText: /chapter|capitulo|LEAD UNI/i })
    await qa.visit(`${label} admin events`, '/es/admin/events', { expectedText: /event/i })
    await qa.visit(`${label} admin settings`, '/es/admin/settings', { expectedText: /settings|config/i })

    await qa.visit(`${label} direct student route should not be primary`, '/es/student', { expectedUrl: /\/admin/ })
    if (/\/student/.test(new URL(qa['page'].url()).pathname)) {
      const shot = await qa.screenshot(`${label} reached student route`)
      qa.addFinding('major', 'Admin can directly access student workspace', {
        expected: 'Admins should remain in admin workspace for launch QA, or be explicitly redirected from student routes.',
        actual: `${label} rendered ${new URL(qa['page'].url()).pathname}.`,
        screenshot: shot,
        suggestedFix: 'Add an admin redirect in student layout or document/support intentional admin access to student routes.',
      })
    }
  }
}

async function runRecruiterFlows(qa: LaunchQaCollector) {
  await qa.loginAs('recruiter@test.com', /\/company/)
  await qa.visit('recruiter company dashboard', '/es/company/dashboard', { expectedText: /Test Company|empresa|talento/i })
  await qa.visit('recruiter browse talent', '/es/company/browse', { expectedText: /explorar talento|Test Member/i })
  const bodyText = await qa['page'].locator('body').innerText().catch(() => '')
  if (/Test Editor/i.test(bodyText)) {
    const shot = await qa.screenshot('recruiter editor leak')
    qa.addFinding('major', 'Recruiter can see non-visible editor profile', {
      expected: 'Company browse should show only approved users who opted into recruiter visibility.',
      actual: 'Test Editor appeared in recruiter browse results even though seed visibility is false.',
      screenshot: shot,
      suggestedFix: 'Check recruiter search filters for person_profile.is_recruiter_visible and approved membership joins.',
    })
  }
  const saveButton = qa['page'].getByRole('button', { name: /guardar|guardado|quitar/i })
  if (await qa.clickFirst('recruiter toggle first visible saved student', saveButton, 'minor')) {
    await expect(qa['page'].getByText(/guardo|guardado|quito/i).first()).toBeVisible({ timeout: 5_000 }).catch(async () => {
      const shot = await qa.screenshot('recruiter save unclear')
      qa.addFinding('minor', 'Save/unsave feedback unclear', {
        expected: 'Saving a student should show a toast or button state change.',
        actual: 'No visible save feedback was detected after toggling the saved-state control.',
        screenshot: shot,
        suggestedFix: 'Expose an accessible success state for company save/unsave actions.',
      })
    })
  }
  await qa.visit('recruiter saved talent', '/es/company/saved', { expectedText: /guardado|talento|saved/i })
  await qa.visit('recruiter student detail', `/es/company/students/${MEMBER_USER_ID}`, { expectedText: /Test Member|Industrial Engineering/i })
  await qa.visit('recruiter profile', '/es/company/profile', { expectedText: /perfil|profile|Test Company/i })
  await qa.visit('recruiter settings', '/es/company/settings', { expectedText: /settings|configuracion|empresa/i })

  await qa.visit('recruiter blocked from admin', '/es/admin', { expectedUrl: /\/auth\/login/ })
  await qa.loginAs('recruiter@test.com', /\/company/)
  await qa.visit('recruiter direct student route blocked', '/es/student', { expectedUrl: /\/company/ })
  if (/\/student/.test(new URL(qa['page'].url()).pathname)) {
    const shot = await qa.screenshot('recruiter reached student route')
    qa.addFinding('major', 'Recruiter can directly access student workspace', {
      expected: 'Recruiters should be blocked from student/member routes in the launch matrix.',
      actual: `Recruiter rendered ${new URL(qa['page'].url()).pathname}.`,
      screenshot: shot,
      suggestedFix: 'Add recruiter redirect handling in student layout or clarify that recruiter access to student routes is intentional.',
    })
  }
  await qa.visit('recruiter direct chapter route blocked', '/es/chapter', { expectedUrl: /\/auth\/login|\/company/ })
  if (!/\/auth\/login|\/company/.test(new URL(qa['page'].url()).pathname)) {
    const shot = await qa.screenshot('recruiter chapter route unexpected')
    qa.addFinding('major', 'Recruiter chapter route does not resolve to a company/auth boundary', {
      expected: 'Recruiters should not reach chapter operations.',
      actual: qa['page'].url(),
      screenshot: shot,
      suggestedFix: 'Ensure requireChapterMember sends recruiters to a company/auth boundary rather than student workspace.',
    })
  }
}

test.describe('launch matrix report-only QA', () => {
  test.setTimeout(10 * 60 * 1000)

  test('collects launch matrix findings', async ({ page }, testInfo) => {
    const qa = new LaunchQaCollector(page, testInfo.project.name)
    fs.mkdirSync(path.join(REPORT_ROOT, testInfo.project.name), { recursive: true })

    try {
      if (QA_SCOPE === 'all' || QA_SCOPE === 'public-student') {
        await runAnonymousFlows(qa)
        await runStudentLikeFlows(qa)
      }

      if (QA_SCOPE === 'all' || QA_SCOPE === 'chapter') {
        await runChapterFlows(qa)
      }

      if (QA_SCOPE === 'all' || QA_SCOPE === 'admin-recruiter') {
        await runAdminFlows(qa)
        await runRecruiterFlows(qa)
      }
    } finally {
      const resultPath = path.join(REPORT_ROOT, `launch-qa-results-${QA_SCOPE}-${testInfo.project.name}.json`)
      fs.writeFileSync(
        resultPath,
        JSON.stringify(
          {
            project: testInfo.project.name,
            scope: QA_SCOPE,
            generatedAt: new Date().toISOString(),
            steps: qa.steps,
            findings: qa.findings,
            expectedBehaviors: qa.expectedBehaviors,
            summary: {
              totalSteps: qa.steps.length,
              totalFindings: qa.findings.length,
              totalExpectedBehaviors: qa.expectedBehaviors.length,
              bySeverity: qa.findings.reduce<Record<string, number>>((acc, finding) => {
                acc[finding.severity] = (acc[finding.severity] ?? 0) + 1
                return acc
              }, {}),
            },
          },
          null,
          2
        )
      )
      await testInfo.attach('launch qa results', { path: resultPath, contentType: 'application/json' })
    }

    expect(qa.findings, JSON.stringify(qa.findings, null, 2)).toEqual([])
  })
})
