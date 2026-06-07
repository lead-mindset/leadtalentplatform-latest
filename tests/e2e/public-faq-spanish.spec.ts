import { expect, test, type TestInfo, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const OUTPUT_DIR = path.join('outputs', 'issue-327-public-faq-spanish')

async function attachScreenshot(page: Page, testInfo: TestInfo) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const screenshotPath = path.join(OUTPUT_DIR, `es-faq-mobile-${testInfo.project.name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach('Spanish FAQ mobile screenshot', {
    path: screenshotPath,
    contentType: 'image/png',
  })
}

test('Spanish FAQ renders localized public copy without mojibake', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/es/faq', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)

  await expect(page).toHaveTitle(/Preguntas frecuentes - LEAD/)
  await expect(page.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeVisible()
  await expect(page.getByText('¿Qué es LEAD?')).toBeVisible()
  await expect(page.getByText('Respuestas claras sobre LEAD, sus capítulos')).toBeVisible()
  await expect(page.getByText('Frequently Asked Questions')).toHaveCount(0)

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/Ã|Â|�/)

  await attachScreenshot(page, testInfo)
})
