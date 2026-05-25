import { expect, test, type Page, type TestInfo } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const PASSWORD = 'password123'
const LOGIN_REDIRECT_TIMEOUT_MS = 60_000
const APPROVED_REQUEST_ID = 'f1000000-0000-4000-8000-000000000002'

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
  await expect(page.locator('#email')).toHaveValue(email)
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

async function screenshot(page: Page, testInfo: TestInfo, label: string) {
  const outputPath = path.join(
    'outputs',
    artifactName(`lead funding ${label}`, testInfo.project.name)
  )
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  await page.screenshot({ path: outputPath, fullPage: true })
  await testInfo.attach(label, {
    path: outputPath,
    contentType: 'image/png',
  })
  return outputPath
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2)
}

test.describe.serial('Lead Funding v1', () => {
  test('chapter president can submit a request and upload accountability evidence', async ({ page }, testInfo) => {
    const title = `QA financiamiento ${testInfo.project.name} ${Date.now()}`
    const fileName = `receipt-${testInfo.project.name}.pdf`

    await loginAs(page, 'president@test.com')

    await page.goto('/es/chapter/funding', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Financiamiento', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /Nueva solicitud/i })).toBeVisible()
    await screenshot(page, testInfo, 'chapter-list')
    await assertNoHorizontalOverflow(page)

    await page.goto('/es/chapter/funding/new', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /Nueva solicitud/i })).toBeVisible()
    await page.locator('#title').fill(title)
    await page.locator('#purpose').fill('Validar el flujo completo de financiamiento para el piloto controlado.')
    await page.locator('#eventDate').fill('2030-08-15')
    await page.locator('#attendees').fill('45')
    await page.locator('#audience').fill('Estudiantes miembros y potenciales miembros del capítulo.')
    await page.getByText('Empower', { exact: true }).click()
    await page.getByText('Excelencia académica', { exact: true }).click()
    await page.locator('#amount').fill('150')
    await page.locator('#budget-label-0').fill('Materiales para dinámica de liderazgo')
    await page.locator('#budget-amount-0').fill('150')
    await screenshot(page, testInfo, 'chapter-new')
    await assertNoHorizontalOverflow(page)
    await page.getByRole('button', { name: /Enviar solicitud/i }).click()

    await page.getByText(title).waitFor({ state: 'visible', timeout: 30_000 })
    await expect(page.getByText('En revisión').first()).toBeVisible()

    await page.goto(`/es/chapter/funding/${APPROVED_REQUEST_ID}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /Refrigerios para Career Readiness Clinic/i })).toBeVisible()
    await page.locator('#actual-spend').fill('345')
    await page.locator('#result-summary').fill('QA: se valida que el capítulo pueda registrar resultado e impacto.')
    await page.locator('#accountability-note').fill('QA: evidencia de comprobante para piloto controlado.')
    await page.getByRole('button', { name: /Guardar seguimiento/i }).click()
    await page.waitForTimeout(1_000)
    await page.locator('#funding-file').setInputFiles({
      name: fileName,
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'),
    })
    await page.locator('#file-notes').fill('Comprobante de QA para flujo de evidencia.')
    await page.getByRole('button', { name: /Subir archivo/i }).click()
    await expect(page.getByText('Comprobante de QA para flujo de evidencia.')).toBeVisible({ timeout: 30_000 })
    await screenshot(page, testInfo, 'chapter-accountability')
    await assertNoHorizontalOverflow(page)
  })

  test('admin can review funding queue and see closure controls', async ({ page }, testInfo) => {
    await loginAs(page, 'admin@test.com')

    await page.goto('/es/admin/funding', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Financiamiento', exact: true })).toBeVisible()
    await expect(page.getByText('Materiales para taller de liderazgo')).toBeVisible()
    await expect(page.getByRole('button', { name: /Aprobar completo/i }).first()).toBeVisible()
    await screenshot(page, testInfo, 'admin-review')
    await assertNoHorizontalOverflow(page)

    await page.goto('/es/admin/funding?status=approved', { waitUntil: 'networkidle' })
    await expect(page.getByText('Refrigerios para Career Readiness Clinic')).toBeVisible()
    await expect(page.getByText('Cierre y regularización')).toBeVisible()
    await expect(page.getByRole('button', { name: /Cerrar solicitud/i })).toBeVisible()
    await screenshot(page, testInfo, 'admin-close')
    await assertNoHorizontalOverflow(page)
  })

  test('regular members cannot reach request-level funding controls', async ({ page }) => {
    await loginAs(page, 'member@test.com')
    await page.goto('/es/chapter/funding', { waitUntil: 'networkidle' })
    await expect(page).not.toHaveURL(/\/es\/chapter\/funding/)
    await expect(page.getByRole('link', { name: /Nueva solicitud/i })).toHaveCount(0)
  })

  test('recruiters cannot reach admin funding review controls', async ({ page }) => {
    await loginAs(page, 'recruiter@test.com')
    await page.goto('/es/admin/funding', { waitUntil: 'networkidle' })
    await expect(page).not.toHaveURL(/\/es\/admin\/funding/)
    await expect(page.getByRole('button', { name: /Aprobar completo/i })).toHaveCount(0)
  })
})
