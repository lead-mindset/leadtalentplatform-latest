import { expect, test, type Page, type TestInfo } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const PASSWORD = 'password123'
const LOGIN_REDIRECT_TIMEOUT_MS = 60_000
const OUTPUT_DIR = path.join('outputs', 'issue-332-admin-events-raw-id-mobile')

async function loginAsAdmin(page: Page) {
  await page.goto('/es/auth/login', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await expect(page.locator('#email')).toBeVisible()
  await page.locator('#email').fill('admin@test.com')
  await page.locator('#password').fill(PASSWORD)
  await expect(page.locator('#email')).toHaveValue('admin@test.com')
  await page.locator('button[type="submit"]').click()

  const outcome = await Promise.race([
    page
      .waitForURL((url) => url.pathname.endsWith('/es/admin'), {
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
    throw new Error(`Admin login failed: ${await page.locator('#error-message').innerText()}`)
  }
  if (outcome !== 'redirect') {
    throw new Error(`Admin login did not reach /es/admin; current URL is ${page.url()}`)
  }
}

async function attachScreenshot(page: Page, testInfo: TestInfo) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const screenshotPath = path.join(OUTPUT_DIR, `admin-events-mobile-id-${testInfo.project.name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach('admin events mobile id hierarchy screenshot', {
    path: screenshotPath,
    contentType: 'image/png',
  })
}

test('admin events mobile cards keep raw IDs secondary', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await loginAsAdmin(page)
  await page.goto('/es/admin/events', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)

  await expect(page.getByText('ID técnico').first()).toBeVisible()
  await expect(page.locator('details').first()).not.toHaveAttribute('open', '')
  await expect(page.getByRole('link', { name: /Gestionar/i }).first()).toBeVisible()
  await expect(page.getByText(/Inicio/).first()).toBeVisible()

  await attachScreenshot(page, testInfo)
})
