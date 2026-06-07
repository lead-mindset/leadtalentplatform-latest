import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const PASSWORD = 'password123'
const LOGIN_REDIRECT_TIMEOUT_MS = 60_000

type RedirectCase = {
  name: string
  route: string
  email?: string
  expectedUrl: RegExp
}

const redirectCases: RedirectCase[] = [
  {
    name: 'anonymous chapter redirects to login',
    route: '/es/chapter',
    expectedUrl: /\/es\/auth\/login$/,
  },
  {
    name: 'anonymous company redirects to login',
    route: '/es/company/dashboard',
    expectedUrl: /\/es\/auth\/login$/,
  },
  {
    name: 'participant blocked from chapter',
    route: '/es/chapter',
    email: 'participant@test.com',
    expectedUrl: /\/es\/auth\/unauthorized\?next=%2Fstudent&reason=chapter$/,
  },
  {
    name: 'participant blocked from company',
    route: '/es/company/dashboard',
    email: 'participant@test.com',
    expectedUrl: /\/es\/auth\/unauthorized\?next=%2Fstudent&reason=company$/,
  },
  {
    name: 'admin redirected from student to admin',
    route: '/es/student',
    email: 'admin@test.com',
    expectedUrl: /\/es\/admin$/,
  },
  {
    name: 'recruiter redirected from student to company',
    route: '/es/student',
    email: 'recruiter@test.com',
    expectedUrl: /\/es\/company\/dashboard$/,
  },
]

function artifactSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function loginAs(page: Page, email: string) {
  await page.goto('/es/auth/login', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await expect(page.locator('#email')).toBeVisible()
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.endsWith('/auth/login'), {
    timeout: LOGIN_REDIRECT_TIMEOUT_MS,
  })
}

function isKnownDevPerformanceMeasureError(message: string) {
  return (
    /Failed to execute 'measure' on 'Performance'/.test(message) &&
    /cannot have a negative time stamp/.test(message) &&
    /\u200B?(ChapterLayout|CompanyLayout|StudentLayout|CompanyPage)/.test(message)
  )
}

test.describe('protected route redirects', () => {
  for (const redirectCase of redirectCases) {
    test(`${redirectCase.name} without app-origin page errors`, async ({ page }, testInfo) => {
      const pageErrors: string[] = []
      const consoleErrors: string[] = []

      page.on('pageerror', (error) => {
        if (!isKnownDevPerformanceMeasureError(error.message)) {
          pageErrors.push(error.message)
        }
      })
      page.on('console', (message) => {
        if (message.type() === 'error' && !/favicon|devtools/i.test(message.text())) {
          consoleErrors.push(message.text())
        }
      })

      if (redirectCase.email) await loginAs(page, redirectCase.email)

      await page.goto(redirectCase.route, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
      await expect(page).toHaveURL(redirectCase.expectedUrl)

      const screenshotPath = path.join(
        'outputs',
        'issue-309-protected-route-errors',
        `${artifactSlug(redirectCase.name)}-${testInfo.project.name}.png`
      )
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true })
      await page.screenshot({ path: screenshotPath, fullPage: true })
      await testInfo.attach('redirect screenshot', {
        path: screenshotPath,
        contentType: 'image/png',
      })

      expect(pageErrors).toEqual([])
      expect(consoleErrors).toEqual([])
    })
  }
})
