# Playwright QA Report: Full Launch User-Flow Review

## Overall Verdict

`pass with issues`

The seeded launch matrix was exercised on desktop and mobile Chromium after a Supabase reset. The baseline chapter permission regression passed. The broader report-only QA pass found several launch-relevant issues around post-login routing, role boundaries, the public chapter page, admin hydration, and open event registration.

No product fixes were made in this pass.

## Validation Commands

| Command | Result |
| :-- | :-- |
| `pnpm run supabase:reset` | Passed |
| `pnpm exec playwright test tests/e2e/chapter-permissions.spec.ts --reporter=line` | Passed, 14/14 |
| `LAUNCH_QA_SCOPE=public-student pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line` | Passed, desktop + mobile |
| `LAUNCH_QA_SCOPE=chapter pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line` | Passed, desktop + mobile |
| `LAUNCH_QA_SCOPE=admin-recruiter pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line` | Desktop passed; mobile initially hit Turbopack OOM |
| `NODE_OPTIONS=--max-old-space-size=4096 LAUNCH_QA_SCOPE=admin-recruiter pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --project=mobile-chromium --reporter=line --timeout=900000` | Passed |

Artifacts:
- Screenshots: `outputs/launch-qa/`
- JSON findings: `outputs/launch-qa/launch-qa-results-*.json`
- QA collector used for this report: `tests/e2e/launch-qa-report.spec.ts`

## Persona Results

| Persona | Result | Notes |
| :-- | :-- | :-- |
| Anonymous visitor | Issues found | Public events load, but public chapter page redirects to login. Event login CTA did not navigate during QA. |
| `participant@test.com` | Pass with notes | Student dashboard/profile/resume/events reachable. Chapter and company guards redirected as expected. |
| `member@test.com` | Issue found | Student dashboard reachable. Open event registration stayed pending and did not reach QR/registered state within the QA window. |
| `alumni@test.com` | Pass | Student dashboard reachable. Chapter access blocked as expected. |
| `editor@test.com` | Issue found | Can reach chapter routes directly, but post-login landing goes to student instead of chapter. |
| `president@test.com` | Issue found | Can reach chapter routes directly, but post-login landing goes to onboarding/student instead of chapter. |
| `vp@test.com` | Issue found | Can reach chapter routes directly, but post-login landing goes to student instead of chapter. |
| `eboard@test.com` | Issue found | Can reach chapter routes directly, but post-login landing goes to student instead of chapter. |
| `admin@test.com` | Issue found | Admin routes load when visited directly, but post-login route is unreliable and can land on onboarding/login. |
| `staff@test.com` | Issue found | Admin routes load, but staff/admin can also directly render the student workspace. |
| `recruiter@test.com` | Issue found | Company portal loads, browse/saved/profile/settings/student detail load, but recruiter can directly render student workspace. |

## Confirmed Bugs

### 1. Chapter leaders do not land on the chapter dashboard after password login

Severity: `major`

Repro:
1. Reset Supabase.
2. Log in with `president@test.com`, `vp@test.com`, `editor@test.com`, or `eboard@test.com`.
3. Observe the first post-login route.

Expected: Chapter operators with `chapter.dashboard.access` should land on `/es/chapter`.

Actual: VP/editor/eboard land on `/es/student`; president landed on `/es/onboarding` in desktop QA and `/es/student` in mobile QA.

Evidence:
- `outputs/launch-qa/desktop-chromium/dashboard-vp-test-com.png`
- `outputs/launch-qa/mobile-chromium/dashboard-president-test-com.png`

Likely cause:
- `components/auth/login.tsx` uses `getPostAuthRedirectPath()` on the client and only passes `role` plus `hasProfile`.
- It does not call the permission-aware `resolvePostAuthRedirectPath()` path used by the auth callback.

Suggested fix:
- Move password login redirect resolution to a server action/API route that can call `resolvePostAuthRedirectPath()`, or add a safe server-backed chapter dashboard permission lookup before redirecting.
- Add a Playwright assertion for first post-login route for president, VP, editor, and regular e-board.

### 2. Admin password login can land outside the admin workspace

Severity: `major`

Repro:
1. Reset Supabase.
2. Log in with `admin@test.com`.
3. Observe the first post-login route.

Expected: Admin should land on `/es/admin`.

Actual: Admin landed on `/es/onboarding` in mobile QA and stayed on `/es/auth/login` in one desktop run, while direct `/es/admin` access still worked afterward.

Evidence:
- `outputs/launch-qa/mobile-chromium/dashboard-admin-test-com.png`
- `outputs/launch-qa/desktop-chromium/dashboard-admin-test-com.png`

Likely cause:
- Same client-side redirect path in `components/auth/login.tsx`.
- The login flow ignores Supabase query errors for `public.user` / `person_profile`; if role lookup fails, `getPostAuthRedirectPath()` falls through to onboarding.

Suggested fix:
- Treat role/profile lookup errors as explicit login errors or resolve redirects server-side.
- Add tests for `admin@test.com` and `staff@test.com` first post-login destination.

### 3. Recruiter and admin can directly render the student workspace

Severity: `major`

Repro:
1. Log in as `recruiter@test.com`, `admin@test.com`, or `staff@test.com`.
2. Navigate directly to `/es/student`.

Expected: Recruiter should redirect to company/auth boundary; admin/staff should stay in admin workspace unless an explicit impersonation mode exists.

Actual:
- Recruiter renders the student participant dashboard.
- Admin/staff render the student participant dashboard.

Evidence:
- `outputs/launch-qa/desktop-chromium/recruiter-reached-student-route.png`
- `outputs/launch-qa/mobile-chromium/admin-reached-student-route.png`
- `outputs/launch-qa/desktop-chromium/staff-admin-reached-student-route.png`

Likely cause:
- `app/[locale]/student/layout.tsx` calls `requireUser()` only and does not enforce student/member role boundaries.

Suggested fix:
- In the student layout, redirect `user.role === 'recruiter'` to `/company` and `user.role === 'admin'` to `/admin`, unless a deliberate admin impersonation flow is added.
- Add route-guard tests for recruiter/admin direct access to `/student`, `/student/profile`, `/student/events`, and `/student/resume`.

### 4. Public chapter page is behind the protected chapter layout

Severity: `major`

Repro:
1. As anonymous visitor, navigate to `/es/chapter/leaduni`.

Expected: Public chapter page should render LEAD UNI information.

Actual: The route redirects to `/es/auth/login`.

Evidence:
- `outputs/launch-qa/desktop-chromium/anonymous-public-chapter-page.png`
- `outputs/launch-qa/mobile-chromium/anonymous-public-chapter-page.png`

Likely cause:
- `app/[locale]/chapter/[id]/page.tsx` sits under `app/[locale]/chapter/layout.tsx`, and that layout calls `requireChapterMember()`.

Suggested fix:
- Move public chapter pages into a public route group, for example `app/[locale]/(public)/chapters/[id]`, or split protected operations under a different route group so `[id]` does not inherit the chapter-operator guard.

### 5. Admin company and event tables throw hydration errors from locale-dependent dates

Severity: `major`

Repro:
1. Log in as admin or staff.
2. Visit `/es/admin/companies` or `/es/admin/events`.
3. Watch browser console/page errors.

Expected: No hydration exceptions.

Actual: React hydration errors occur because server and client render different date formats, for example `22/5/2026` vs `5/22/2026` and `21/11/2026, 9:00:00 a. m.` vs `11/21/2026, 9:00:00 AM`.

Evidence:
- Console traces captured in `outputs/launch-qa/launch-qa-results-admin-recruiter-*.json`.
- Source hotspots: `app/[locale]/admin/companies/companies-management-client.tsx`, `app/[locale]/admin/events/events-management-client.tsx`, and other admin tables using `toLocaleDateString()` / `toLocaleString()` without explicit locale.

Suggested fix:
- Format dates deterministically with an explicit locale/time zone, or pass preformatted strings from the server.
- Add a hydration-focused smoke test for admin companies/events/users.

### 6. Open event registration stays pending and never reaches QR/registered state in QA

Severity: `major`

Repro:
1. Reset Supabase.
2. Log in as `member@test.com`.
3. Visit `/es/events/92000000-0000-4000-8000-000000000016`.
4. Click `Registrarme`.

Expected: Member should be redirected to `/es/student/events?event=...` or see a registered/QR state.

Actual: The button remains in `Registrando...` state and the event still shows `0 registrados / 80` after the QA wait window.

Evidence:
- `outputs/launch-qa/desktop-chromium/member-registration-failed.png`

Suggested fix:
- Inspect `registerForEvent`, server action redirect handling, and whether local dev/server action requests are hanging.
- Add an e2e assertion that registration completes, creates the event registration row, and renders the QR state.

### 7. Anonymous event registration CTA did not navigate during QA

Severity: `major`

Repro:
1. As anonymous visitor, visit `/es/events/92000000-0000-4000-8000-000000000016`.
2. Click the visible `Iniciar sesion` CTA in the registration card.

Expected: Route should become `/es/auth/login?...`.

Actual: The URL stayed on the event detail route in both desktop and mobile QA.

Evidence:
- Event detail before CTA: `outputs/launch-qa/desktop-chromium/anonymous-open-event-detail.png`
- Finding recorded in `outputs/launch-qa/launch-qa-results-public-student-*.json`.

Suggested fix:
- Verify the localized `Link href` passed through `EventRegistrationCheckout`.
- Add a focused click test for the event registration card CTA, not only the global navbar sign-in link.

### 8. Public homepage emits asset/hydration console noise

Severity: `minor`

Repro:
1. Visit `/es`.
2. Observe console/network output.

Actual:
- Browser recorded 404s for `/es/video3.mp4`.
- React reports hydration mismatch on public form inputs due `style={{caret-color:"transparent"}}` appearing only on the server/client side.
- Next warns that `/leadl2.svg` has one dimension changed without preserving aspect ratio.

Evidence:
- `outputs/launch-qa/launch-qa-results-public-student-*.json`
- Source references include `app/[locale]/(public)/_components/hero.tsx`, `app/[locale]/(public)/_components/final-cta.tsx`, and public navbar/footer logo usage.

Suggested fix:
- Verify video asset resolution under localized routes.
- Remove the source of injected caret-color mismatch or render it consistently.
- Set matching `width: auto` or `height: auto` when resizing `leadl2.svg`.

## Not Bugs / Expected Behavior

- Anonymous protected route redirects to login are expected for `/student`, `/chapter`, `/admin`, and `/company/dashboard`.
- Participant/member/alumni being redirected away from `/chapter` is expected unless they have chapter dashboard grants.
- Recruiter being blocked from `/admin` is expected; after the heap-increased retry this path completed without the earlier Turbopack OOM.
- The regular e-board "pending roster" finding in the raw JSON is not counted as a confirmed permission bug. The detector matched page copy containing "pendientes"; the screenshot shows only `Aprobados` and `Alumni` tabs and no approve/reject controls.
- Several "expected page content missing" JSON findings are harness copy-matching noise. Screenshots show the target pages rendered, but the expected regex was too English/narrow or the screenshot was taken while dev compilation was still settling.
- Invalid login producing an auth 400 is expected. The UX remained on login; the raw console finding should not be treated as a product bug by itself.
- Google Maps Places Autocomplete warnings in chapter event forms are deprecation warnings, not immediate launch blockers. They should be tracked for maintenance.

## Flows Not Fully Testable With Current Seed/Local Setup

- Real invitation email delivery and member self-claim from email.
- Google OAuth end-to-end.
- Real resume upload/download storage verification.
- Camera-based QR scanning hardware flow.
- Full application-event happy path with realistic answers and subsequent chapter approval email.
- Production build behavior; this was run against local Next dev/Turbopack.
- Exhaustive route crawler. This followed the requested launch matrix depth.

## Recommended Fix Order

1. Fix password login redirect resolution for chapter operators and admins.
2. Add role boundaries to the student workspace for recruiter/admin/staff.
3. Split public chapter pages from protected chapter operations.
4. Fix open event registration completion and anonymous event CTA navigation.
5. Make admin date formatting hydration-safe.
6. Clean up public homepage asset/hydration warnings.
