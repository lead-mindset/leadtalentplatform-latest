import { expect, test, type Page, type TestInfo } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const PASSWORD = 'password123'
const LOGIN_REDIRECT_TIMEOUT_MS = 60_000
const OUTPUT_DIR = path.join('outputs', 'issue-310-participant-onboarding-timeout')

type OnboardingViewportCase = {
  name: string
  viewport: { width: number; height: number }
}

const viewportCases: OnboardingViewportCase[] = [
  { name: 'desktop-1365', viewport: { width: 1365, height: 900 } },
  { name: 'mobile-390', viewport: { width: 390, height: 844 } },
]

async function loginAsParticipant(page: Page) {
  await page.goto('/es/auth/login', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await expect(page.locator('#email')).toBeVisible()
  await page.locator('#email').fill('participant@test.com')
  await page.locator('#password').fill(PASSWORD)
  await expect(page.locator('#email')).toHaveValue('participant@test.com')
  await expect(page.locator('#password')).toHaveValue(PASSWORD)
  await page.locator('button[type="submit"]').click()

  const outcome = await Promise.race([
    page
      .waitForURL((url) => !url.pathname.endsWith('/auth/login'), {
        timeout: LOGIN_REDIRECT_TIMEOUT_MS,
      })
      .then(() => 'redirect' as const)
      .catch(() => 'timeout' as const),
    page
      .locator('#error-message')
      .waitFor({ state: 'visible', timeout: LOGIN_REDIRECT_TIMEOUT_MS })
      .then(() => 'error' as const)
      .catch(() => 'timeout' as const),
  ])

  if (outcome === 'error') {
    throw new Error(`Participant login failed: ${await page.locator('#error-message').innerText()}`)
  }
  if (outcome !== 'redirect') {
    throw new Error(`Participant login did not redirect; current URL is ${page.url()}`)
  }

  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const screenshotPath = path.join(OUTPUT_DIR, `${name}-${testInfo.project.name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach(`${name} screenshot`, {
    path: screenshotPath,
    contentType: 'image/png',
  })
}

test.describe('participant onboarding redirect', () => {
  for (const viewportCase of viewportCases) {
    test(`profile-complete participant redirects from onboarding on ${viewportCase.name}`, async ({
      page,
    }, testInfo) => {
      const pageErrors: string[] = []
      const consoleErrors: string[] = []
      const failedResponses: string[] = []

      page.on('pageerror', (error) => pageErrors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error' && !/favicon|devtools/i.test(message.text())) {
          consoleErrors.push(message.text())
        }
      })
      page.on('response', (response) => {
        if (response.status() >= 500) failedResponses.push(`${response.status()} ${response.url()}`)
      })

      await page.setViewportSize(viewportCase.viewport)
      await loginAsParticipant(page)

      const startedAt = Date.now()
      await page.goto('/es/onboarding', { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
      const elapsedMs = Date.now() - startedAt

      await expect(page).toHaveURL(/\/es\/events$/)
      await expect(page.getByRole('heading', { name: /encuentra tu pr[oó]ximo evento lead/i })).toBeVisible()
      expect(elapsedMs).toBeLessThan(45_000)
      expect(pageErrors).toEqual([])
      expect(consoleErrors).toEqual([])
      expect(failedResponses).toEqual([])

      await attachScreenshot(page, testInfo, viewportCase.name)
    })
  }
})
