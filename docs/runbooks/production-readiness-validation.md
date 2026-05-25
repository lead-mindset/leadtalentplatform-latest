# Production Readiness Validation Runbook

This runbook supports issues #214-#220 and the PRD in `.github/PRDs/production-readiness-validation.prd.md`.

The goal is to prove whether LEAD Talent Platform is ready for a controlled pilot or broader launch. This is an evidence workflow, not a product redesign workflow. If validation finds a product defect, record it in the report and create a focused follow-up issue instead of hiding the fix inside the validation gate.

## Verdicts

Use one verdict for the overall report and one verdict for each gate.

| Verdict | Meaning |
| --- | --- |
| `pending` | Gate has not been executed. |
| `pass` | Gate passed with evidence. |
| `pass with issues` | Gate passed for controlled pilot, but non-blocking issues remain with owners. |
| `blocked` | Gate cannot support launch until a blocker is resolved. |
| `not testable` | Required environment, credentials, data, or participants are unavailable. |

Do not mark a gate as `pass` without evidence from the environment named in the report.

## Safe Evidence Rules

- Do not commit real chapter rosters, leader emails, member emails, resumes, or provider screenshots that expose personal data.
- Do not commit auth links, reset links, signed storage URLs, provider tokens, API keys, or Supabase service-role keys.
- Use controlled test inboxes and test files.
- Keep raw screenshots, traces, and provider exports in ignored paths such as `outputs/`, `test-results/`, or `playwright-report/`.
- Commit only sanitized summaries and sanitized screenshots after review.
- If a screenshot contains an email address, token, resume, or private member details, redact it before committing.

## Required Baseline

Run these checks before gate-specific validation when Docker Supabase is available:

```bash
pnpm run supabase:reset
pnpm exec playwright test tests/e2e/chapter-permissions.spec.ts --reporter=line
pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line
```

Seeded personas use the password `password123`. See `docs/handbook/TESTING.md` for the full persona matrix.

## Environments

Record the environment for every gate.

| Environment | Use |
| --- | --- |
| Local Supabase | Deterministic seeded validation, Mailpit, local storage behavior, browser QA. |
| Staging or preview | Provider-backed email and storage behavior close to launch settings. |
| Production | Smoke validation only after founders approve real-user risk. |

Local Supabase exposes Mailpit in `pnpm run supabase:status`. Use Mailpit for local email assertions, but do not treat Mailpit as proof that external email delivery works.

## Gate 1: Email Delivery

Required flows:

- Sign-up or invite-style authentication email.
- Password reset and password update.
- Member approval notification.
- Recruiter invitation.
- Auth hook email route, if enabled.

Local auth email smoke:

```bash
pnpm run qa:email -- --mode local-auth
```

This uses local Supabase Auth and Mailpit. It creates temporary smoke users, triggers an invite-style auth email and a password reset email, polls Mailpit, writes sanitized JSON to `outputs/production-readiness/email-delivery-results.json`, and deletes the temporary auth users when possible.

Provider-backed SMTP smoke:

```bash
$env:QA_EMAIL_TO='controlled-test-inbox@example.com'
pnpm run qa:email -- --mode smtp --env production
```

Run provider-backed smoke only after confirming the controlled test inbox and environment. This command verifies SMTP connectivity and sends one controlled smoke email. It does not prove inbox placement unless the recipient or provider dashboard confirms receipt.

Evidence to capture:

- Environment and provider.
- Test inbox used, redacted if needed.
- Delivery time.
- Subject and sender summary.
- Link destination after clicking.
- Expired, reused, or invalid link behavior.
- Provider error or bounce logs when failures are induced.

Blockers:

- No provider-backed delivery can be verified.
- Links route users to the wrong locale or wrong workspace.
- Email failures are silent.
- Real user data is exposed in committed artifacts.

## Gate 2: Storage And Uploads

Required flows:

- Event cover upload for a chapter event.
- Published event cover rendering on public event detail.
- Invalid event image state.
- Resume upload by owner.
- Recruiter access to an allowed visible resume.
- Unauthorized access attempt for a private resume.

Local storage smoke:

```bash
pnpm run qa:storage
```

This uses local Supabase Storage and seeded personas. It writes sanitized JSON to `outputs/production-readiness/storage-upload-results.json`, tries event cover upload as chapter president and legacy editor, inspects the required buckets, and runs resume upload/access checks when the `resumes` bucket exists.

Evidence to capture:

- Bucket name and environment.
- File type and size.
- Upload result and rendered page screenshot.
- Network status for successful and failed uploads.
- Authorization result for wrong user, anonymous user, and recruiter.
- Redacted storage path or signed URL metadata.

Blockers:

- Private resume file can be read by an unauthorized user.
- Event images do not render on public pages after successful upload.
- Upload failure leaves users with no recoverable state.

## Gate 3: Accessibility

Required route groups:

- Public: home, events list, event detail.
- Auth: login, sign-up, onboarding.
- Student: dashboard, profile, resume, events.
- Chapter: dashboard, members, events, new event, event detail, applications or check-in.
- Company: dashboard, browse, saved, student detail.
- Admin: dashboard, users, companies, chapters, events, invites, settings.

Automated axe smoke:

```bash
pnpm run qa:accessibility
```

For a narrower pass:

```bash
$env:AXE_QA_SCOPE='public,auth'
pnpm run qa:accessibility
```

The Playwright spec writes per-project JSON to `outputs/production-readiness/accessibility-results-*.json` and fails on critical or serious axe violations unless the report explicitly waives them later.

Evidence to capture:

- Axe result summary by route and viewport.
- Critical and serious violations.
- Waivers with reason and owner.
- Keyboard path notes for login, event registration, member approval/rejection, event creation, recruiter save/unsave, and logout.
- Mobile overflow screenshots when found.

Blockers:

- Any unwaived critical axe violation.
- Serious violation that blocks a launch-critical action.
- Keyboard users cannot complete login, registration, member approval, event creation, or recruiter browse.

## Gate 4: Performance Budgets

Recommended budgets:

| Route type | LCP | CLS |
| --- | --- | --- |
| Public pages | <= 2.5 seconds | <= 0.1 |
| Authenticated operational pages | <= 3.5 seconds | <= 0.1 |

Required routes:

- `/en`
- `/en/events`
- A published event detail route.
- `/en/student`
- `/en/chapter`
- `/en/chapter/members`
- `/en/chapter/events`
- `/en/chapter/events/new`
- `/en/company`
- `/en/company/browse`
- `/en/admin`
- `/en/admin/users`

Local performance smoke:

```bash
pnpm run qa:performance
```

For a narrower pass:

```bash
$env:PERF_QA_SCOPE='public,chapter'
pnpm run qa:performance
```

The Playwright spec warms each route before measuring, writes per-project JSON to `outputs/production-readiness/performance-results-*.json`, and fails when local smoke exceeds the documented budgets. Local dev results are useful for regressions, but preview or staging must be rerun before using this as final production proof.

Evidence to capture:

- Tool used and command.
- Environment.
- Repeated run strategy when local machine noise is likely.
- Median or chosen representative result.
- Console and network error summary.
- Suggested fix for failed budgets.

Blockers:

- Public event pages are too slow to support public promotion.
- Authenticated dashboards are too slow for chapter leader training.
- Route load throws uncaught JavaScript errors or unexpected 5xx responses.

## Gate 5: Chapter Leader Training Dry Run

Use `docs/runbooks/chapter-activation-runbook.md` as the operating source of truth.

Required participants:

- Abigail as trainer/platform owner.
- Christopher or the chapter operations owner.
- At least one president or vice president from a pilot chapter.

Required tasks:

- Sign in with a preapproved chapter leader account.
- Confirm chapter dashboard landing.
- Review members and applicants.
- Approve and reject test applicants.
- Assign or update regular e-board role where permitted.
- Create, publish, and share an event.
- Register as a participant from a separate account.
- Review registrations or applications.
- Check in an attendee if the event supports it.
- Confirm support path for wrong email, chapter, role, or access.

Evidence to capture:

- Attendance.
- Environment.
- Time-to-task.
- Questions asked.
- Confusing labels or permission boundaries.
- Screenshots with private data redacted.
- Launch blockers and non-blocking training improvements.

Blockers:

- Chapter leaders cannot complete the basic dashboard, member, or event workflow.
- Role boundaries are too confusing for safe activation.
- Required training participants are unavailable.

## Report Template

Use `.github/reports/production-readiness-validation-report.md`.

Every finding should include:

- Severity: `blocker`, `major`, `minor`, or `info`.
- Gate.
- Environment.
- Repro steps.
- Expected behavior.
- Actual behavior.
- Evidence path.
- Suggested fix.
- Owner or next decision.

## Founder Recommendation

At the end of the validation pass, choose one recommendation:

- Proceed with controlled pilot.
- Proceed with controlled pilot after named fixes.
- Pause launch until blockers are resolved.
- Expand activation.

The recommendation must be tied to evidence, not intuition.
