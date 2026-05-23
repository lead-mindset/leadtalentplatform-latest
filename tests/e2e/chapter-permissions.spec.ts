import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const PASSWORD = 'password123'
const LOGIN_REDIRECT_TIMEOUT_MS = 60_000

type Persona = {
  email: string
  expectedDashboard: RegExp
}

const chapterOperators: Persona[] = [
  { email: 'president@test.com', expectedDashboard: /\/es\/chapter(?:\/)?$/ },
  { email: 'vp@test.com', expectedDashboard: /\/es\/chapter(?:\/)?$/ },
  { email: 'eboard@test.com', expectedDashboard: /\/es\/chapter(?:\/)?$/ },
]

function artifactName(testName: string, projectName: string) {
  return testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .concat(`-${projectName}.png`)
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

async function screenshot(page: Page, name: string) {
  const outputPath = path.join('outputs', name)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  await page.screenshot({ path: outputPath, fullPage: true })
  return outputPath
}

test.describe('chapter-scoped permission matrix', () => {
  for (const persona of chapterOperators) {
    test(`${persona.email} reaches the chapter dashboard`, async ({ page }) => {
      await loginAs(page, persona.email)
      await page.goto('/es/chapter')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveURL(persona.expectedDashboard)
      await expect(page.getByText('LEAD UNI').first()).toBeVisible()
    })
  }

  test('president sees e-board assignment controls on the roster', async ({ page }, testInfo) => {
    await loginAs(page, 'president@test.com')
    await page.goto('/es/chapter/members?status=active')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Test Member').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /asignar rol|cambiar rol/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /revocar membresia/i }).first()).toBeVisible()

    const capturePath = await screenshot(
      page,
      artifactName('issue-205-president-roster-assignment-controls', testInfo.project.name)
    )
    await testInfo.attach('president roster assignment controls', {
      path: capturePath,
      contentType: 'image/png',
    })
  })

  test('regular e-board sees approved members but not sensitive roster actions', async ({ page }) => {
    await loginAs(page, 'eboard@test.com')
    await page.goto('/es/chapter/members?status=active')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Test Member').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /asignar rol|cambiar rol/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /revocar membresia/i })).toHaveCount(0)
  })

  test('approved member is redirected away from chapter operations', async ({ page }) => {
    await loginAs(page, 'member@test.com')
    await page.goto('/es/chapter')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/\/es\/student/)
  })

  test('admin reaches admin correction UI and recruiter reaches company dashboard', async ({ browser }, testInfo) => {
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    await loginAs(adminPage, 'admin@test.com')
    await adminPage.goto('/es/admin/users/22222222-2222-2222-2222-222222222222')
    await adminPage.waitForLoadState('networkidle')
    await expect(adminPage.getByText('Chapter Role Correction')).toBeVisible()
    const adminCapturePath = await screenshot(
      adminPage,
      artifactName('issue-205-admin-role-correction', testInfo.project.name)
    )
    await testInfo.attach('admin role correction', {
      path: adminCapturePath,
      contentType: 'image/png',
    })
    await adminContext.close()

    const recruiterContext = await browser.newContext()
    const recruiterPage = await recruiterContext.newPage()
    await loginAs(recruiterPage, 'recruiter@test.com')
    await recruiterPage.goto('/es/company/dashboard')
    await recruiterPage.waitForLoadState('networkidle')
    await expect(recruiterPage).toHaveURL(/\/es\/company\/dashboard/)
    await expect(recruiterPage.getByText(/Test Company|Company|Empresa/i).first()).toBeVisible()
    await recruiterContext.close()
  })
})
