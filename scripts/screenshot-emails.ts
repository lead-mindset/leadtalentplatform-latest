import { chromium } from 'playwright'
import { join } from 'path'

const HTML_DIR = join(__dirname, '..', 'emails', 'screenshots')
const OUT_DIR = HTML_DIR

interface EmailFile {
  filename: string
  label: string
}

const emails: EmailFile[] = [
  { label: '01-welcome', filename: '01-welcome.html' },
  { label: '02-confirm-signup', filename: '02-confirm-signup.html' },
  { label: '03-magic-link', filename: '03-magic-link.html' },
  { label: '04-reset-password', filename: '04-reset-password.html' },
  { label: '05-company-invite', filename: '05-company-invite.html' },
  { label: '06-chapter-eboard-invite', filename: '06-chapter-eboard-invite.html' },
  { label: '07-member-approval', filename: '07-member-approval.html' },
  { label: '08-application-received', filename: '08-application-received.html' },
  { label: '09-application-approved', filename: '09-application-approved.html' },
  { label: '10-application-rejected', filename: '10-application-rejected.html' },
  { label: '11-chapter-application-submitted', filename: '11-chapter-application-submitted.html' },
  { label: '12-chapter-application-rejected', filename: '12-chapter-application-rejected.html' },
  { label: '13-event-registration-confirmed', filename: '13-event-registration-confirmed.html' },
]

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 600, height: 800 },
    deviceScaleFactor: 2,
  })

  for (const email of emails) {
    const htmlPath = join(HTML_DIR, email.filename)
    const pngPath = join(OUT_DIR, `${email.label}.png`)
    const page = await context.newPage()
    try {
      await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      await page.screenshot({ path: pngPath, fullPage: true })
      console.log(`  Screenshot: ${email.label}.png`)
    } catch (err) {
      console.error(`  FAILED: ${email.label}:`, err)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  console.log(`\nAll ${emails.length} screenshots saved to: ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
