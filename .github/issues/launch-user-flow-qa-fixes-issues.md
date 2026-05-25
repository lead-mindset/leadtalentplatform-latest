# Launch User-Flow QA Fixes Issues

Source PRD: `.github/PRDs/launch-user-flow-qa-fixes.prd.md`

Source QA report: `.github/reports/launch-user-flow-playwright-qa-report.md`

GitHub integration status: created with `gh` CLI on branch `codex/chapter-scoped-roles-permissions`.

## Created GitHub Issues

| Local Issue | GitHub Issue | Title | URL |
| --- | --- | --- | --- |
| 1 | #207 | Stabilize password-login redirect resolution | https://github.com/lead-mindset/leadtalentplatform-latest/issues/207 |
| 2 | #208 | Enforce student workspace role boundaries | https://github.com/lead-mindset/leadtalentplatform-latest/issues/208 |
| 3 | #209 | Split public chapter pages from protected chapter operations | https://github.com/lead-mindset/leadtalentplatform-latest/issues/209 |
| 4 | #210 | Fix open event registration and anonymous registration CTA | https://github.com/lead-mindset/leadtalentplatform-latest/issues/210 |
| 5 | #211 | Make admin date rendering hydration-safe | https://github.com/lead-mindset/leadtalentplatform-latest/issues/211 |
| 6 | #212 | Clean public homepage asset and hydration warnings | https://github.com/lead-mindset/leadtalentplatform-latest/issues/212 |
| 7 | #213 | Harden and re-run the launch QA matrix | https://github.com/lead-mindset/leadtalentplatform-latest/issues/213 |

## Proposed GitHub Issues

| Issue | Title | Type | Priority | Complexity | Dependencies |
| --- | --- | --- | --- | --- | --- |
| 1 | Stabilize password-login redirect resolution | Bug / Auth | High | Medium | None |
| 2 | Enforce student workspace role boundaries | Bug / Authorization | High | Medium | Issue 1 |
| 3 | Split public chapter pages from protected chapter operations | Bug / Routing | High | Medium | None |
| 4 | Fix open event registration and anonymous registration CTA | Bug / Events | High | Medium | None |
| 5 | Make admin date rendering hydration-safe | Bug / Frontend | Medium | Small | None |
| 6 | Clean public homepage asset and hydration warnings | Bug / Frontend | Medium | Small | None |
| 7 | Harden and re-run the launch QA matrix | Technical / Testing | High | Medium | Issues 1-6 |

## Issue 1: Stabilize password-login redirect resolution

Type: Bug / Auth
Priority: High
Complexity: Medium
Labels: `LEAD`, `auth`, `routing`, `permissions`, `testing`, `phase:launch-stabilization`, `piv-status:plan-ready`
Dependencies: None

### Description

Password login currently sends several seeded personas to the wrong workspace. Chapter operators can land in `/student` or `/onboarding`, admins can land outside `/admin`, and recruiters need a reliable company destination. Implement a server-trusted redirect resolver so post-login routing follows global role, profile state, recruiter access, and chapter dashboard permission instead of an incomplete client-side role lookup.

### Acceptance Criteria

- [ ] Given `president@test.com`, `vp@test.com`, `editor@test.com`, or `eboard@test.com` logs in with `password123`, when login succeeds, then they land on `/es/chapter`.
- [ ] Given `admin@test.com` or `staff@test.com` logs in with `password123`, when login succeeds, then they land on `/es/admin`.
- [ ] Given `recruiter@test.com` logs in with `password123`, when login succeeds, then they land on `/es/company` or the canonical company dashboard route.
- [ ] Given `participant@test.com`, `member@test.com`, or `alumni@test.com` logs in with `password123`, when login succeeds, then they land on `/es/student` unless profile/onboarding data legitimately requires onboarding.
- [ ] Given redirect data cannot be resolved, when login completes, then the UI shows a clear error or safe fallback instead of silently sending the user to the wrong workspace.

### Implementation Notes

- Likely files: `components/auth/login.tsx`, `lib/auth-redirects.ts`, `lib/auth-redirects.test.ts`, and a new server action or route handler under `lib/actions/auth/`.
- Preferred path: after password login, call a server-trusted resolver that reads the authenticated Supabase session from cookies and delegates to `resolvePostAuthRedirectPath()`.
- Acceptable fallback: a narrow client query that includes chapter dashboard permission and explicit error handling, only if server-side session propagation is unreliable after client password login.
- Preserve Google/OAuth callback behavior.
- Do not introduce database schema changes for this issue.

## Issue 2: Enforce student workspace role boundaries

Type: Bug / Authorization
Priority: High
Complexity: Medium
Labels: `LEAD`, `auth`, `authorization`, `student`, `company`, `admin`, `testing`, `phase:launch-stabilization`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

The student workspace currently renders for recruiters and admins/staff when they visit the route directly. Add explicit route-level boundaries so `/student/*` is reserved for student/member/alumni-style users, while recruiters and admins are redirected to their proper workspaces.

### Acceptance Criteria

- [ ] Given `recruiter@test.com` visits `/es/student`, `/es/student/profile`, `/es/student/events`, or `/es/student/resume`, when the route guard runs, then the user is redirected to the company workspace.
- [ ] Given `admin@test.com` or `staff@test.com` visits those same student routes, when the route guard runs, then the user is redirected to the admin workspace.
- [ ] Given `participant@test.com`, `member@test.com`, or `alumni@test.com` visits student routes, when the route guard runs, then the page renders normally.
- [ ] Given an anonymous visitor visits student routes, when the route guard runs, then they are redirected to localized login with an appropriate return path.
- [ ] Given Playwright route-boundary checks run, when role redirects occur, then expected auth guards are documented separately from bugs.

### Implementation Notes

- Likely files: `app/[locale]/student/layout.tsx`, `lib/auth.ts`, `lib/auth-redirects.ts`, and a focused Playwright auth/workspace spec.
- Keep admin impersonation out of scope. If it becomes necessary later, create a separate issue.
- Do not weaken existing chapter, admin, or company route guards while adding the student boundary.
- Do not expose student data to recruiter/admin workspaces through shared client components.

## Issue 3: Split public chapter pages from protected chapter operations

Type: Bug / Routing
Priority: High
Complexity: Medium
Labels: `LEAD`, `routing`, `chapter`, `public-pages`, `permissions`, `frontend`, `testing`, `phase:launch-stabilization`, `piv-status:plan-ready`
Dependencies: None

### Description

The public chapter detail URL is currently protected by the chapter dashboard layout, so anonymous visitors are redirected to login instead of seeing chapter information. Separate public chapter profiles from protected chapter operations while preserving the intended public URL behavior.

### Acceptance Criteria

- [ ] Given an anonymous visitor opens `/es/chapter/leaduni`, when the page loads, then the public LEAD UNI chapter content renders without requiring login.
- [ ] Given an anonymous visitor opens `/es/chapter`, when the page loads, then protected chapter operations still redirect to login.
- [ ] Given a regular member without chapter dashboard permission opens protected chapter routes, when the guard runs, then they are blocked or redirected according to current permission rules.
- [ ] Given the public chapter page renders, when inspected on desktop and mobile Chromium, then it does not expose member contact data, applicant data, internal tools, or operator actions.
- [ ] Given route changes are complete, when existing chapter dashboard links are tested, then `/es/chapter`, `/es/chapter/members`, `/es/chapter/events`, and `/es/chapter/checkin` still work for authorized chapter operators.

### Implementation Notes

- Likely files: `app/[locale]/chapter/layout.tsx`, `app/[locale]/chapter/[id]/page.tsx`, route-group files under `app/[locale]/(public)` or an equivalent structure, and public chapter components.
- Recommended model: public chapter detail route does not inherit the protected chapter operations layout.
- If the URL must change because of Next.js route constraints, preserve old public URL behavior with a documented redirect.
- Add desktop and mobile screenshots for the public chapter page.

## Issue 4: Fix open event registration and anonymous registration CTA

Type: Bug / Events
Priority: High
Complexity: Medium
Labels: `LEAD`, `events`, `registration`, `server-actions`, `student`, `testing`, `phase:launch-stabilization`, `piv-status:plan-ready`
Dependencies: None

### Description

Open event registration can remain stuck on `Registrando...` instead of creating a stable registered/QR state, and the anonymous registration CTA did not navigate during QA. Stabilize the event registration action, duplicate registration state, and localized login return path.

### Acceptance Criteria

- [ ] Given `member@test.com` is logged in, when they click `Registrarme` for the seeded open event, then an `event_registration` row is created or updated successfully.
- [ ] Given registration succeeds, when the UI resolves, then the user is redirected to the localized student event route or sees a stable `Registrado`/QR state.
- [ ] Given the same member revisits the event, when the page renders, then it does not show a fresh duplicate registration CTA for the same active registration.
- [ ] Given an anonymous visitor clicks the event registration login CTA, when the link is activated, then it navigates to `/es/auth/login?next=...` or the canonical localized login return path.
- [ ] Given registration fails because of auth, profile, capacity, validation, or RLS, when the action returns, then the user sees a clear error instead of an indefinite pending state.

### Implementation Notes

- Likely files: `components/events/event-registration-checkout.tsx`, `app/[locale]/events/[id]/_components/EventContent.tsx`, `lib/actions/events/register.ts`, `lib/services/event.service.ts`, and a focused Playwright event registration spec.
- Investigate whether `redirect()` inside `useActionState()` is followed reliably in this setup.
- Verify both UI state and database row creation after `pnpm run supabase:reset`.
- Do not redesign event-scoped permissions in this issue.

## Issue 5: Make admin date rendering hydration-safe

Type: Bug / Frontend
Priority: Medium
Complexity: Small
Labels: `LEAD`, `admin`, `hydration`, `frontend`, `testing`, `phase:launch-stabilization`, `piv-status:plan-ready`
Dependencies: None

### Description

Admin company and event tables throw hydration errors caused by environment-dependent date formatting. Replace implicit locale/time-zone formatting with a deterministic display helper or server-preformatted strings while preserving sorting/filtering behavior.

### Acceptance Criteria

- [ ] Given `/es/admin/companies` renders, when Playwright captures page errors and console messages, then there are no date-format hydration exceptions.
- [ ] Given `/es/admin/events` renders, when Playwright captures page errors and console messages, then there are no date-format hydration exceptions.
- [ ] Given admin date columns render, when reviewed by a user, then dates remain readable and consistent in Spanish/local launch context.
- [ ] Given sorting or filtering uses date fields, when the user interacts with the tables, then raw ISO/date ordering behavior remains correct.
- [ ] Given a shared date helper is added, when Vitest runs, then deterministic formatting is covered.

### Implementation Notes

- Likely files: `app/[locale]/admin/companies/companies-management-client.tsx`, `app/[locale]/admin/events/events-management-client.tsx`, `app/[locale]/admin/users/users-management-client.tsx`, and a shared date helper if needed.
- Avoid bare `new Date(value).toLocaleDateString()` or `toLocaleString()` in client/server-rendered markup.
- Use an explicit locale and time zone, such as `es-PE` and `America/Lima`, or a project-approved equivalent.
- Keep raw values intact for data operations.

## Issue 6: Clean public homepage asset and hydration warnings

Type: Bug / Frontend
Priority: Medium
Complexity: Small
Labels: `LEAD`, `public-pages`, `assets`, `hydration`, `frontend`, `testing`, `phase:launch-stabilization`, `piv-status:plan-ready`
Dependencies: None

### Description

The public pages produce launch-visible warnings: localized `/es/video3.mp4` 404, logo aspect-ratio warning, and caret-color hydration mismatch. Clean these up so public QA output is trustworthy and reviewers are not distracted by avoidable console noise.

### Acceptance Criteria

- [ ] Given `/es` loads, when network requests are captured, then there is no unexpected 404 for `/es/video3.mp4`.
- [ ] Given the public navbar/logo renders, when console warnings are captured, then the `leadl2.svg` aspect-ratio warning no longer appears.
- [ ] Given homepage, login page, and company band render, when hydration warnings are captured, then caret-color mismatch warnings no longer appear.
- [ ] Given public pages render on desktop and mobile, when screenshots are reviewed, then the media/logo fixes do not create layout shift, clipping, or overlap.
- [ ] Given Playwright console capture runs, when expected third-party warnings remain, then they are documented separately from product bugs.

### Implementation Notes

- Likely files: `app/[locale]/(public)/_components/hero.tsx`, `app/[locale]/(public)/_components/final-cta.tsx`, `app/[locale]/(public)/_components/navbar-client.tsx`, shared image/media components, or CSS affecting public inputs.
- Prefer root-relative asset URLs for public files that live under `public/`.
- Keep this issue narrow; do not combine it with a public homepage redesign.

## Issue 7: Harden and re-run the launch QA matrix

Type: Technical / Testing
Priority: High
Complexity: Medium
Labels: `LEAD`, `playwright`, `qa`, `testing`, `documentation`, `phase:launch-stabilization`, `piv-status:plan-ready`
Dependencies: Issues 1-6

### Description

After the confirmed fixes land, promote the useful parts of the report-only launch QA harness into stable validation. The goal is to prove that the original launch-blocking issues are gone across desktop and mobile Chromium, while keeping expected auth redirects separate from real bugs.

### Acceptance Criteria

- [ ] Given Docker Supabase is available, when `pnpm run supabase:reset` runs, then the seeded launch matrix is restored successfully.
- [ ] Given the baseline chapter permission suite runs, when `pnpm exec playwright test tests/e2e/chapter-permissions.spec.ts --reporter=line` completes, then it passes.
- [ ] Given the launch QA matrix runs for public/student, chapter, admin/recruiter, and event participant flows, when desktop and mobile Chromium complete, then no confirmed findings remain from the original QA report.
- [ ] Given expected redirects occur because of route guards, when the report is generated, then they appear under expected behavior rather than bugs.
- [ ] Given the launch QA harness becomes a permanent workflow, when documentation is reviewed, then `docs/handbook/TESTING.md` includes the exact commands and seed persona assumptions.

### Implementation Notes

- Likely files: `tests/e2e/launch-qa-report.spec.ts`, `.github/reports/`, and `docs/handbook/TESTING.md`.
- Keep screenshot artifacts for role dashboards and previously failing flows.
- Reduce false positives from broad text matching, dev compilation states, and expected auth guards.
- Final QA should include seeded personas: anonymous visitor, participant, member, alumni, editor, president, VP, e-board, admin, staff, and recruiter.

## Creation Report

| Issue | Title | Complexity | Dependency |
| --- | --- | --- | --- |
| [#207](https://github.com/lead-mindset/leadtalentplatform-latest/issues/207) | Stabilize password-login redirect resolution | Medium | None |
| [#208](https://github.com/lead-mindset/leadtalentplatform-latest/issues/208) | Enforce student workspace role boundaries | Medium | #207 |
| [#209](https://github.com/lead-mindset/leadtalentplatform-latest/issues/209) | Split public chapter pages from protected chapter operations | Medium | None |
| [#210](https://github.com/lead-mindset/leadtalentplatform-latest/issues/210) | Fix open event registration and anonymous registration CTA | Medium | None |
| [#211](https://github.com/lead-mindset/leadtalentplatform-latest/issues/211) | Make admin date rendering hydration-safe | Small | None |
| [#212](https://github.com/lead-mindset/leadtalentplatform-latest/issues/212) | Clean public homepage asset and hydration warnings | Small | None |
| [#213](https://github.com/lead-mindset/leadtalentplatform-latest/issues/213) | Harden and re-run the launch QA matrix | Medium | #207-#212 |
