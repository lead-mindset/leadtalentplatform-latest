import { expect, test, type Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import fs from 'node:fs'
import path from 'node:path'

const PASSWORD = 'password123'
const REPORT_ROOT = path.join('outputs', 'production-readiness')
const OPEN_EVENT_ID = '92000000-0000-4000-8000-000000000016'
const SCOPE = process.env.AXE_QA_SCOPE ?? 'all'

test.setTimeout(360_000)

type ViolationSummary = {
  id: string
  impact: string | null | undefined
  description: string
  help: string
  nodes: number
  samples: {
    target: string[]
    html: string
    failureSummary: string
  }[]
}

type RouteResult = {
  label: string
  route: string
  finalUrl: string
  criticalOrSerious: ViolationSummary[]
  totalViolations: number
}

function shouldRun(scope: string) {
  return SCOPE === 'all' || SCOPE.split(',').map((item) => item.trim()).includes(scope)
}

async function loginAs(page: Page, email: string) {
  await page.context().clearCookies()
  await page.goto('/en/auth/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  await page.goto('/en/auth/login', { waitUntil: 'domcontentloaded' })
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|iniciar/i }).click()
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
}

async function analyzeRoute(page: Page, label: string, route: string): Promise<RouteResult> {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await page.waitForTimeout(500)

  let results
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      break
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/Execution context was destroyed|navigation/i.test(message) || attempt === 1) {
        throw error
      }
      await page.waitForLoadState('domcontentloaded', { timeout: 5_000 }).catch(() => undefined)
      await page.waitForTimeout(750)
    }
  }

  if (!results) throw new Error(`Axe did not return results for ${label}`)

  const criticalOrSerious = results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      nodes: violation.nodes.length,
      samples: violation.nodes.slice(0, 5).map((node) => ({
        target: node.target,
        html: node.html.replace(/\s+/g, ' ').slice(0, 240),
        failureSummary: (node.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 360),
      })),
    }))

  return {
    label,
    route,
    finalUrl: page.url(),
    criticalOrSerious,
    totalViolations: results.violations.length,
  }
}

async function keyboardSmoke(page: Page) {
  await page.goto('/en/auth/login', { waitUntil: 'domcontentloaded' })
  await page.locator('#email').focus()
  await expect(page.locator('#email')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('#password')).toBeFocused()
}

test('production readiness accessibility matrix', async ({ page }, testInfo) => {
  const routes: RouteResult[] = []
  const keyboard: { name: string; status: 'pass' | 'fail'; details?: string }[] = []

  if (shouldRun('public')) {
    routes.push(await analyzeRoute(page, 'public home', '/en'))
    routes.push(await analyzeRoute(page, 'public events', '/en/events'))
    routes.push(await analyzeRoute(page, 'public event detail', `/en/events/${OPEN_EVENT_ID}`))
  }

  if (shouldRun('auth')) {
    routes.push(await analyzeRoute(page, 'login', '/en/auth/login'))
    routes.push(await analyzeRoute(page, 'signup', '/en/auth/sign-up'))
    routes.push(await analyzeRoute(page, 'forgot password', '/en/auth/forgot-password'))
    await keyboardSmoke(page)
    keyboard.push({ name: 'login form focus order', status: 'pass' })
  }

  if (shouldRun('student')) {
    await loginAs(page, 'member@test.com')
    routes.push(await analyzeRoute(page, 'student dashboard', '/en/student'))
    routes.push(await analyzeRoute(page, 'student profile', '/en/student/profile'))
    routes.push(await analyzeRoute(page, 'student resume', '/en/student/resume'))
    routes.push(await analyzeRoute(page, 'student events', '/en/student/events'))
    await page.keyboard.press('Tab')
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? '')
    keyboard.push({
      name: 'student dashboard keyboard focus leaves body',
      status: activeTag && activeTag !== 'BODY' ? 'pass' : 'fail',
      details: activeTag,
    })
  }

  if (shouldRun('chapter')) {
    await loginAs(page, 'president@test.com')
    routes.push(await analyzeRoute(page, 'chapter dashboard', '/en/chapter'))
    routes.push(await analyzeRoute(page, 'chapter members', '/en/chapter/members'))
    routes.push(await analyzeRoute(page, 'chapter events', '/en/chapter/events'))
    routes.push(await analyzeRoute(page, 'chapter new event', '/en/chapter/events/new'))
  }

  if (shouldRun('company')) {
    await loginAs(page, 'recruiter@test.com')
    routes.push(await analyzeRoute(page, 'company dashboard', '/en/company'))
    routes.push(await analyzeRoute(page, 'company browse', '/en/company/browse'))
    routes.push(await analyzeRoute(page, 'company saved', '/en/company/saved'))
    routes.push(await analyzeRoute(page, 'company settings', '/en/company/settings'))
  }

  if (shouldRun('admin')) {
    await loginAs(page, 'admin@test.com')
    routes.push(await analyzeRoute(page, 'admin dashboard', '/en/admin'))
    routes.push(await analyzeRoute(page, 'admin users', '/en/admin/users'))
    routes.push(await analyzeRoute(page, 'admin companies', '/en/admin/companies'))
    routes.push(await analyzeRoute(page, 'admin chapters', '/en/admin/chapters'))
    routes.push(await analyzeRoute(page, 'admin events', '/en/admin/events'))
    routes.push(await analyzeRoute(page, 'admin invites', '/en/admin/invites'))
    routes.push(await analyzeRoute(page, 'admin settings', '/en/admin/settings'))
  }

  const blockers = routes.flatMap((route) =>
    route.criticalOrSerious.map((violation) => ({
      route: route.label,
      ...violation,
    }))
  )
  const keyboardFailures = keyboard.filter((result) => result.status === 'fail')

  const output = {
    generatedAt: new Date().toISOString(),
    project: testInfo.project.name,
    scope: SCOPE,
    status: blockers.length === 0 && keyboardFailures.length === 0 ? 'pass' : 'fail',
    routes,
    keyboard,
  }

  fs.mkdirSync(REPORT_ROOT, { recursive: true })
  fs.writeFileSync(
    path.join(REPORT_ROOT, `accessibility-results-${testInfo.project.name}.json`),
    `${JSON.stringify(output, null, 2)}\n`
  )

  expect(blockers, 'critical or serious axe violations').toEqual([])
  expect(keyboardFailures, 'keyboard smoke failures').toEqual([])
})
