# Production Readiness Validation Issues

Source PRD: `.github/PRDs/production-readiness-validation.prd.md`

GitHub integration status: created with `gh` CLI on branch `codex/chapter-scoped-roles-permissions`.

## Created GitHub Issues

| Local Issue | GitHub Issue | Title | URL |
| --- | --- | --- | --- |
| 1 | #214 | Create production-readiness validation harness and report template | https://github.com/lead-mindset/leadtalentplatform-latest/issues/214 |
| 2 | #215 | Validate real email delivery across launch-critical flows | https://github.com/lead-mindset/leadtalentplatform-latest/issues/215 |
| 3 | #216 | Validate Supabase Storage uploads and private file access | https://github.com/lead-mindset/leadtalentplatform-latest/issues/216 |
| 4 | #217 | Add axe accessibility and keyboard launch checks | https://github.com/lead-mindset/leadtalentplatform-latest/issues/217 |
| 5 | #218 | Add performance budget validation for launch routes | https://github.com/lead-mindset/leadtalentplatform-latest/issues/218 |
| 6 | #219 | Run chapter leader training dry run | https://github.com/lead-mindset/leadtalentplatform-latest/issues/219 |
| 7 | #220 | Publish final production-readiness report and launch recommendation | https://github.com/lead-mindset/leadtalentplatform-latest/issues/220 |

## Proposed GitHub Issues

| Issue | Title | Type | Priority | Complexity | Dependencies |
| --- | --- | --- | --- | --- | --- |
| 1 | Create production-readiness validation harness and report template | Technical / QA | High | Small | None |
| 2 | Validate real email delivery across launch-critical flows | Technical / Email QA | High | Medium | Issue 1 |
| 3 | Validate Supabase Storage uploads and private file access | Technical / Storage QA | High | Medium | Issue 1 |
| 4 | Add axe accessibility and keyboard launch checks | Technical / Accessibility | High | Medium | Issue 1 |
| 5 | Add performance budget validation for launch routes | Technical / Performance | Medium | Medium | Issue 1 |
| 6 | Run chapter leader training dry run | Operations / Training | High | Medium | Issues 1-5 |
| 7 | Publish final production-readiness report and launch recommendation | Documentation / Release | High | Small | Issues 2-6 |

## Issue 1: Create production-readiness validation harness and report template

Type: Technical / QA
Priority: High
Complexity: Small
Labels: `LEAD`, `qa`, `production-readiness`, `documentation`, `testing`, `phase:production-readiness`, `piv-status:plan-ready`
Dependencies: None

### Description

Create the shared validation structure for the production-readiness gates defined in the PRD. This issue should establish where evidence goes, how sensitive artifacts are handled, and which commands/environments are required before email, storage, accessibility, performance, and training validation begin.

### Acceptance Criteria

- [ ] Given the production-readiness PRD is reviewed, when the validation scope is mapped, then every PRD gate has a clear evidence destination.
- [ ] Given report artifacts may include screenshots, traces, or provider logs, when storage locations are documented, then sensitive artifacts are either ignored or explicitly sanitized before commit.
- [ ] Given validation runs locally or in staging-like environments, when setup docs are followed, then required accounts, inboxes, buckets, and test users are listed without exposing real member data.
- [ ] Given the report template is created, when a gate is executed, then it can record verdict, environment, repro steps, evidence path, owner, severity, and recommendation.
- [ ] Given no validation has run yet, when the report is opened, then it clearly marks each gate as pending instead of implying production readiness.

### Implementation Notes

- Likely files: `.github/reports/production-readiness-validation-report.md`, `docs/runbooks/production-readiness-validation.md`, and `.gitignore` if artifact paths need protection.
- Keep this issue report-only and harness-only. Do not change product behavior.
- Explicitly document that real chapter rosters, real leader emails, real member emails, real resumes, and production screenshots with personal data must not be committed.
- Reference the existing chapter activation runbook instead of duplicating it wholesale.

## Issue 2: Validate real email delivery across launch-critical flows

Type: Technical / Email QA
Priority: High
Complexity: Medium
Labels: `LEAD`, `qa`, `email`, `auth`, `supabase`, `production-readiness`, `phase:production-readiness`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

Validate that real email delivery works for the launch-critical account and invitation flows. The platform cannot scale chapter activation if sign-up, reset, approval, or recruiter invitation emails silently fail or link users to confusing routes.

### Acceptance Criteria

- [ ] Given controlled test inboxes are configured, when sign-up or invite-style authentication email is triggered, then the email is delivered and opens the expected localized route.
- [ ] Given a test user requests password reset, when the reset email is delivered, then the link allows the user to reach the password update flow and invalid/reused links fail safely.
- [ ] Given a member approval email is triggered, when delivery completes, then subject, sender, body, and links match Spanish-first product expectations.
- [ ] Given a recruiter invitation is sent, when the invite is opened, then the recipient reaches the expected company/recruiter onboarding or login path.
- [ ] Given delivery fails or the provider rejects an email, when logs are inspected, then the failure is visible enough to diagnose without exposing secrets or personal data.

### Implementation Notes

- Likely files and flows: `lib/emails/*`, `app/api/auth/hooks/send-email/*`, auth sign-up/reset flows, admin recruiter invite action, and member approval action.
- Use Mailpit or equivalent for local assertions and the configured staging/production-like provider for real delivery checks.
- Use only test inbox aliases. Do not send to real chapter leaders or members as part of this issue.
- Record delivery time, message content summary, link destination, and sanitized provider evidence.
- No public API, schema, or app type changes should be introduced for validation.

## Issue 3: Validate Supabase Storage uploads and private file access

Type: Technical / Storage QA
Priority: High
Complexity: Medium
Labels: `LEAD`, `qa`, `storage`, `supabase`, `security`, `events`, `resumes`, `phase:production-readiness`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

Validate real upload, rendering, and access-control behavior for storage-backed product flows. Public event promotion depends on event cover images, while recruiter workflows depend on resume/profile files staying private unless visibility rules allow access.

### Acceptance Criteria

- [ ] Given a chapter operator creates or edits an event with an image file, when the upload succeeds, then the image is stored and renders on the public event detail page.
- [ ] Given invalid file type, oversized file, network failure, or canceled upload occurs, when the UI responds, then the user sees a clear recoverable state.
- [ ] Given a member uploads or updates a resume file, when the owner views their profile, then the file state is accurate and no duplicate or broken record is created.
- [ ] Given an unauthorized user, anonymous visitor, or wrong account attempts to access a private resume, when the storage URL or route is requested, then access is denied.
- [ ] Given a recruiter views a visible candidate, when resume access is allowed by product rules, then the recruiter can access only the intended file and no cross-user file data leaks.

### Implementation Notes

- Likely buckets: `event-covers` and `resumes`.
- Likely areas: event form, public event pages, student resume/profile flow, company browse/detail flow, and Supabase storage policies.
- Validate both local reset state and staging-like storage behavior.
- Capture screenshots and network evidence, but redact signed URLs, tokens, and personal file names.
- Treat any unauthorized resume access as a launch blocker.

## Issue 4: Add axe accessibility and keyboard launch checks

Type: Technical / Accessibility
Priority: High
Complexity: Medium
Labels: `LEAD`, `qa`, `accessibility`, `axe`, `playwright`, `frontend`, `phase:production-readiness`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

Add accessibility validation for the main launch routes using axe plus keyboard-only checks. The goal is not decorative compliance; it is to make sure the product can be used across the public, student, chapter, company, and admin workflows without critical barriers.

### Acceptance Criteria

- [ ] Given axe checks run on scoped public, auth, student, chapter, company, and admin routes, when results are reported, then there are zero critical violations.
- [ ] Given serious axe violations are found, when triaged, then they are either fixed before launch or explicitly waived with a documented reason and owner.
- [ ] Given keyboard-only navigation is used, when a user completes login, event registration, member approval or rejection, event creation, recruiter save or unsave, and logout, then focus order and visible focus states remain usable.
- [ ] Given form errors occur, when using keyboard and screen-reader-oriented inspection, then errors are associated with the relevant inputs and announced clearly enough to act on.
- [ ] Given desktop and mobile layouts are reviewed, when screenshots are captured, then buttons, tables, tabs, and forms do not overflow, clip, or become unreadable.

### Implementation Notes

- Use `@axe-core/playwright` or the closest project-approved axe integration.
- Candidate files: new specs under `tests/accessibility/` or `tests/e2e/production-readiness/`.
- Scope should follow launch matrix depth, not a full crawler.
- Separate expected auth redirects from accessibility failures.
- Keep UI fixes out of this issue unless a violation blocks validation. Create follow-up issues for larger remediation.

## Issue 5: Add performance budget validation for launch routes

Type: Technical / Performance
Priority: Medium
Complexity: Medium
Labels: `LEAD`, `qa`, `performance`, `lighthouse`, `playwright`, `production-readiness`, `phase:production-readiness`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

Add repeatable performance validation for the routes that matter most at launch. Public event promotion should feel reliable, and authenticated dashboards should not become slow enough to block chapter training or founder review.

### Acceptance Criteria

- [ ] Given public routes are measured, when performance validation runs, then `/en`, `/en/events`, and a published event detail page meet LCP at or below 2.5 seconds and CLS at or below 0.1 under the documented environment.
- [ ] Given authenticated operational routes are measured, when validation runs, then student, chapter, company, and admin dashboards meet LCP at or below 3.5 seconds and CLS at or below 0.1 under the documented environment.
- [ ] Given browser console and network capture are enabled, when performance checks run, then there are no uncaught JavaScript errors or unexpected 5xx responses.
- [ ] Given a route exceeds budget, when the report is generated, then the failing route includes evidence, likely cause, and a suggested fix or follow-up issue.
- [ ] Given performance results are noisy, when repeated runs are compared, then the report uses a documented median or stable measurement approach.

### Implementation Notes

- Use Lighthouse CI, Playwright tracing, or a project-approved equivalent.
- Candidate routes: `/en`, `/en/events`, `/en/events/[slug]`, `/en/student`, `/en/chapter`, `/en/chapter/members`, `/en/chapter/events`, `/en/chapter/events/new`, `/en/company`, `/en/company/browse`, `/en/admin`, and `/en/admin/users`.
- Document whether measurements are local, preview, staging, or production-like.
- Avoid turning local machine noise into false launch blockers.

## Issue 6: Run chapter leader training dry run

Type: Operations / Training
Priority: High
Complexity: Medium
Labels: `LEAD`, `training`, `chapter`, `operations`, `production-readiness`, `qa`, `phase:production-readiness`, `piv-status:plan-ready`
Dependencies: Issues 1-5

### Description

Run a controlled chapter leader training dry run before broad activation. This validates whether presidents, vice presidents, and chapter operators can understand the platform well enough to use it without constant engineering support.

### Acceptance Criteria

- [ ] Given a pilot chapter leader account is preapproved, when the leader signs in, then they land on the chapter dashboard and understand their next action.
- [ ] Given the leader reviews members and applicants, when they approve or reject test users, then the workflow is understandable and permission boundaries are clear.
- [ ] Given the leader creates and publishes an event, when they share it publicly, then a participant can register from a separate account.
- [ ] Given e-board assignment is demonstrated, when a regular approved member is promoted to an official e-board role, then the leader understands who can perform that action and why.
- [ ] Given the dry run ends, when notes are compiled, then questions, blockers, confusing labels, time-to-task, and support needs are documented.

### Implementation Notes

- Use the existing chapter activation runbook as the base agenda.
- Include Abigail, Christopher or a chapter operations owner, and at least one president or vice president from a pilot chapter.
- Use test data or a staging-safe environment. Do not commit real leader emails, real member rosters, or private screenshots.
- Treat failed comprehension as product evidence, not as user error.
- Convert launch blockers into GitHub issues after the dry-run report is reviewed.

## Issue 7: Publish final production-readiness report and launch recommendation

Type: Documentation / Release
Priority: High
Complexity: Small
Labels: `LEAD`, `release`, `documentation`, `qa`, `production-readiness`, `founder-update`, `phase:production-readiness`, `piv-status:plan-ready`
Dependencies: Issues 2-6

### Description

Compile the production-readiness evidence into a founder-ready report. The report should make the launch decision obvious: pass, pass with issues, or blocked, with crisp evidence and next actions.

### Acceptance Criteria

- [ ] Given all validation gates have run, when the final report is opened, then each gate has a verdict of pass, pass with issues, blocked, or not testable with reason.
- [ ] Given confirmed bugs exist, when the report lists them, then each includes severity, repro steps, expected behavior, actual behavior, evidence path, owner, and suggested fix.
- [ ] Given expected redirects or role guards are observed, when the report is reviewed, then they are listed separately as expected behavior rather than bugs.
- [ ] Given flows cannot be tested with current seed data or environment, when the report is reviewed, then those gaps are explicit and assigned.
- [ ] Given founders review the report, when they reach the recommendation, then they can see whether to proceed with controlled pilot, pause launch, or expand activation.

### Implementation Notes

- Likely file: `.github/reports/production-readiness-validation-report.md`.
- Keep the report concise enough for founder review, with detailed evidence linked below each finding.
- Sanitize screenshots, inbox evidence, storage URLs, tokens, emails, and resumes.
- Reference follow-up GitHub issues if fixes are created from findings.

## Validation Checklist

- [ ] Every PRD gate maps to at least one issue.
- [ ] No issue requires broad product redesign to complete.
- [ ] Acceptance criteria are testable.
- [ ] Dependencies form a valid order.
- [ ] Real email, real storage, axe, performance, and training dry-run validation are all covered.
- [ ] Sensitive production or chapter data is explicitly protected.
