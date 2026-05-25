import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const PASSWORD = 'password123'
const OPEN_EVENT_ID = '92000000-0000-4000-8000-000000000016'
const REPORT_ROOT = path.join('outputs', 'production-readiness')
const SCOPE = process.env.PERF_QA_SCOPE ?? 'all'

type RouteKind = 'public' | 'authenticated'

type RouteBudget = {
  label: string
  route: string
  kind: RouteKind
}

type Measurement = {
  label: string
  route: string
  finalUrl: string
  kind: RouteKind
  lcpMs: number | null
  cls: number
  loadEventEndMs: number | null
  domContentLoadedMs: number | null
  consoleErrors: string[]
  failedResponses: string[]
  status: 'pass' | 'fail'
  failures: string[]
}

test.setTimeout(360_000)

function shouldRun(scope: string) {
  return SCOPE === 'all' || SCOPE.split(',').map((item) => item.trim()).includes(scope)
}

async function installPerformanceObserver(page: Page) {
  await page.addInitScript(() => {
    window.__leadPerformanceMetrics = {
      lcp: 0,
      cls: 0,
    }

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) window.__leadPerformanceMetrics.lcp = last.startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      // LCP is not available in every execution context.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as LayoutShift
          if (!layoutShift.hadRecentInput) {
            window.__leadPerformanceMetrics.cls += layoutShift.value
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })
    } catch {
      // CLS is not available in every execution context.
    }
  })
}

declare global {
  interface Window {
    __leadPerformanceMetrics?: {
      lcp: number
      cls: number
    }
  }

  interface LayoutShift extends PerformanceEntry {
    value: number
    hadRecentInput: boolean
  }
}

async function loginAs(page: Page, email: string) {
  await page.context().clearCookies()
  await page.goto('/en/auth/login', { waitUntil: 'domcontentloaded' })
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|iniciar/i }).click()
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
}

async function warmRoute(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => undefined)
}

async function measureRoute(page: Page, routeBudget: RouteBudget): Promise<Measurement> {
  const consoleErrors: string[] = []
  const failedResponses: string[] = []

  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (/favicon|devtools/i.test(text)) return
    consoleErrors.push(text)
  }
  const onResponse = (response: { status: () => number; url: () => string }) => {
    const status = response.status()
    if (status >= 500) failedResponses.push(`${status} ${response.url()}`)
  }

  page.on('console', onConsole)
  page.on('response', onResponse)

  await warmRoute(page, routeBudget.route)
  await page.evaluate(() => {
    window.__leadPerformanceMetrics = { lcp: 0, cls: 0 }
    performance.clearResourceTimings()
  }).catch(() => undefined)

  await page.goto(routeBudget.route, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await page.waitForTimeout(1_000)

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    return {
      lcpMs: window.__leadPerformanceMetrics?.lcp || null,
      cls: window.__leadPerformanceMetrics?.cls ?? 0,
      loadEventEndMs: navigation?.loadEventEnd ? navigation.loadEventEnd - navigation.startTime : null,
      domContentLoadedMs: navigation?.domContentLoadedEventEnd
        ? navigation.domContentLoadedEventEnd - navigation.startTime
        : null,
    }
  })

  page.off('console', onConsole)
  page.off('response', onResponse)

  const lcpBudget = routeBudget.kind === 'public' ? 2_500 : 3_500
  const failures: string[] = []

  if (metrics.lcpMs !== null && metrics.lcpMs > lcpBudget) {
    failures.push(`LCP ${Math.round(metrics.lcpMs)}ms exceeded ${lcpBudget}ms budget`)
  }
  if (metrics.cls > 0.1) failures.push(`CLS ${metrics.cls.toFixed(3)} exceeded 0.1 budget`)
  if (consoleErrors.length > 0) failures.push(`${consoleErrors.length} console error(s)`)
  if (failedResponses.length > 0) failures.push(`${failedResponses.length} 5xx response(s)`)

  return {
    label: routeBudget.label,
    route: routeBudget.route,
    finalUrl: page.url(),
    kind: routeBudget.kind,
    lcpMs: metrics.lcpMs,
    cls: metrics.cls,
    loadEventEndMs: metrics.loadEventEndMs,
    domContentLoadedMs: metrics.domContentLoadedMs,
    consoleErrors,
    failedResponses,
    status: failures.length === 0 ? 'pass' : 'fail',
    failures,
  }
}

test('production readiness performance budgets', async ({ page }, testInfo) => {
  await installPerformanceObserver(page)

  const results: Measurement[] = []

  if (shouldRun('public')) {
    const publicRoutes: RouteBudget[] = [
      { label: 'public home', route: '/en', kind: 'public' },
      { label: 'public events', route: '/en/events', kind: 'public' },
      { label: 'public event detail', route: `/en/events/${OPEN_EVENT_ID}`, kind: 'public' },
    ]

    for (const route of publicRoutes) results.push(await measureRoute(page, route))
  }

  if (shouldRun('student')) {
    await loginAs(page, 'member@test.com')
    const studentRoutes: RouteBudget[] = [
      { label: 'student dashboard', route: '/en/student', kind: 'authenticated' },
      { label: 'student profile', route: '/en/student/profile', kind: 'authenticated' },
      { label: 'student resume', route: '/en/student/resume', kind: 'authenticated' },
      { label: 'student events', route: '/en/student/events', kind: 'authenticated' },
    ]

    for (const route of studentRoutes) results.push(await measureRoute(page, route))
  }

  if (shouldRun('chapter')) {
    await loginAs(page, 'president@test.com')
    const chapterRoutes: RouteBudget[] = [
      { label: 'chapter dashboard', route: '/en/chapter', kind: 'authenticated' },
      { label: 'chapter members', route: '/en/chapter/members', kind: 'authenticated' },
      { label: 'chapter events', route: '/en/chapter/events', kind: 'authenticated' },
      { label: 'chapter new event', route: '/en/chapter/events/new', kind: 'authenticated' },
    ]

    for (const route of chapterRoutes) results.push(await measureRoute(page, route))
  }

  if (shouldRun('company')) {
    await loginAs(page, 'recruiter@test.com')
    const companyRoutes: RouteBudget[] = [
      { label: 'company dashboard', route: '/en/company', kind: 'authenticated' },
      { label: 'company browse', route: '/en/company/browse', kind: 'authenticated' },
      { label: 'company saved', route: '/en/company/saved', kind: 'authenticated' },
    ]

    for (const route of companyRoutes) results.push(await measureRoute(page, route))
  }

  if (shouldRun('admin')) {
    await loginAs(page, 'admin@test.com')
    const adminRoutes: RouteBudget[] = [
      { label: 'admin dashboard', route: '/en/admin', kind: 'authenticated' },
      { label: 'admin users', route: '/en/admin/users', kind: 'authenticated' },
      { label: 'admin companies', route: '/en/admin/companies', kind: 'authenticated' },
      { label: 'admin chapters', route: '/en/admin/chapters', kind: 'authenticated' },
      { label: 'admin events', route: '/en/admin/events', kind: 'authenticated' },
    ]

    for (const route of adminRoutes) results.push(await measureRoute(page, route))
  }

  const failingRoutes = results.filter((result) => result.status === 'fail')
  const output = {
    generatedAt: new Date().toISOString(),
    project: testInfo.project.name,
    scope: SCOPE,
    status: failingRoutes.length === 0 ? 'pass' : 'fail',
    caveat: 'Local dev server smoke; preview or staging rerun is required for final production performance proof.',
    results,
  }

  fs.mkdirSync(REPORT_ROOT, { recursive: true })
  fs.writeFileSync(
    path.join(REPORT_ROOT, `performance-results-${testInfo.project.name}.json`),
    `${JSON.stringify(output, null, 2)}\n`
  )

  expect(failingRoutes, 'routes exceeding performance budgets').toEqual([])
})
