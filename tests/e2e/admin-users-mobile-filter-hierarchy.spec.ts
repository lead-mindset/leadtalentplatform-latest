import { expect, test, type Page, type TestInfo } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const PASSWORD = 'password123'
const LOGIN_REDIRECT_TIMEOUT_MS = 60_000
const OUTPUT_DIR = path.join('outputs', 'issue-325-mobile-tab-overflow-filters')

async function loginAsAdmin(page: Page) {
  await page.goto('/es/auth/login', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await expect(page.locator('#email')).toBeVisible()
  await page.locator('#email').fill('admin@test.com')
  await page.locator('#password').fill(PASSWORD)
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
  const screenshotPath = path.join(OUTPUT_DIR, `admin-users-mobile-filter-${testInfo.project.name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach('admin users mobile filter screenshot', {
    path: screenshotPath,
    contentType: 'image/png',
  })
}

test('admin users mobile filters use explicit full-width controls', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await loginAsAdmin(page)
  await page.goto('/es/admin/users', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)

  await expect(page.getByText('Filtros', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Roles \(todos\)/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Capítulos \(todos\)/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Perfil \(todos\)/i })).toBeVisible()

  const overflow = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 2)

  await page.getByRole('button', { name: /Roles \(todos\)/i }).click()
  await page.getByRole('menuitemcheckbox', { name: 'admin' }).click()
  await expect(page).toHaveURL(/role=admin/)
  await expect(page.getByRole('button', { name: /Roles \(1\)/i })).toBeVisible()

  await attachScreenshot(page, testInfo)
})
