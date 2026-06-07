# Full Platform QA, UX, UI, Logic, And Service Audit - 2026-06-07

## Scope

This audit covers the LEAD Talent Platform on branch `codex/full-role-playwright-production-qa`, using the local app at `http://localhost:3104`.

The request for this pass was intentionally diagnostic: identify UX/UI hierarchy issues, logical friction, role-flow bugs, service-layer risks, security/privacy concerns, and places where the product does not make sense for users. No fixes were made in this pass.

## Methodology

This review combined five lenses:

1. Product standards review:
   - `docs/handbook/TESTING.md`
   - `docs/handbook/UI_UX.md`
   - `docs/handbook/LAUNCH_UI_STANDARD.md`
   - `docs/handbook/PILOT_ROLE_PERMISSION_MATRIX.md`
   - `docs/runbooks/qa-observation-resolution-audit-2026-06-04.md`
2. Role and route sweep across deterministic personas:
   - Public visitor
   - Participant: `participant@test.com`
   - Member: `member@test.com`
   - Chapter editor: `editor@test.com`
   - President: `president@test.com`
   - Vice president: `vp@test.com`
   - E-board: `eboard@test.com`
   - Admin: `admin@test.com`
   - Staff: `staff@test.com`
   - Company representative: `recruiter@test.com`
   - Alumni: `alumni@test.com`
3. Visual sweep:
   - Desktop `1365 x 900`
   - Mobile `390 x 844`
   - 142 screenshots captured locally under `outputs/massive-qa-2026-06-07/screenshots/`
4. Existing Playwright launch artifact review:
   - `outputs/launch-qa/launch-qa-results-all-desktop-chromium.json`
5. Targeted source review:
   - Auth and route guards
   - Student activation/dashboard services
   - Chapter permission services
   - Company/recruiter services
   - Admin, chapter, company, and student operational pages
   - Security-sensitive logs and auth confirmation routes

## Executive Verdict

The platform is stronger than the last visual pass on the specific student/member activation issue, but it is not ready for a broad all-role production launch. The controlled Spanish-first pilot path is closer, but there are still major issues in route-guard runtime stability, mobile operational UX, Spanish copy consistency, and service observability.

The most important distinction:

- Access control mostly behaves safely in the visible wrong-role checks.
- The user experience still communicates unevenly, especially on mobile admin/chapter/company surfaces.
- Several services fail closed or return empty states on backend errors, which protects data but can mislead users and operators.
- Company/recruiter and alumni surfaces still read like deferred or partially localized product areas, not launch-polished surfaces.

## Positive Findings

These are real strengths and should be preserved while fixing the problems below.

1. Wrong-role route redirects are broadly safe in the custom route sweep.
   - Member to `/es/admin`, `/es/chapter`, `/es/company` redirected to unauthorized routes.
   - Recruiter to `/es/admin` and `/es/chapter` redirected to unauthorized routes.
   - Public to protected student/admin routes redirected to login.
2. No body-level horizontal overflow was detected in the 142-check custom route sweep.
3. Sampled axe checks found zero serious or critical accessibility violations.
4. Company talent visibility is not purely role-based. `CompanyService` requires explicit recruiter visibility plus approved chapter membership before exposing talent.
5. Resume download flow re-checks visible talent before creating signed URLs.
6. Chapter permissions are explicit and scoped, and recruiters are denied chapter permissions by default.
7. Architecture tests exist to keep live app code away from deprecated `student_profile` dependencies.

## Severity Definitions

- Critical: likely data exposure, privilege escalation, auth bypass, destructive user impact, or complete inability to complete a launch-critical flow.
- Major: blocks or seriously damages a primary workflow, launch quality, trust, or operator effectiveness.
- Medium: important friction, scaling risk, maintainability risk, or copy/design issue that can become major under load.
- Minor: polish, wording, consistency, or documentation drift that should be cleaned up but is not a primary blocker alone.

## Major Findings

### QA-001 - Protected-route guard checks are producing uncaught browser exceptions

Severity: Major

Evidence:
- `outputs/launch-qa/launch-qa-results-all-desktop-chromium.json`
- 7 major findings, all titled `Uncaught browser exception`.
- Affected steps include:
  - anonymous protected chapter redirect
  - participant blocked from chapter
  - participant blocked from company
  - alumni blocked from chapter
  - admin direct student route should not be primary
  - recruiter direct student route blocked

Observed exception family:

```text
Failed to execute 'measure' on 'Performance': '<LayoutOrPageName>' cannot have a negative time stamp.
```

Why this matters:
- The user-facing redirect may still work, but the browser runtime is not clean.
- This can hide instability in protected layouts during auth transitions.
- It makes automated QA noisy and harder to trust.

Likely area:
- The source search did not find direct `performance.measure` calls in app code, so this may be framework/dev instrumentation or a library interaction around protected layouts. It still needs isolated reproduction and a fix or documented suppression.

Recommended next step:
- Reproduce one route at a time with console/pageerror capture.
- Identify whether the exception comes from Next.js dev instrumentation, React performance marks, or a local wrapper.
- Add a regression test that asserts protected-route redirects have no page errors.

### QA-002 - Participant onboarding timed out in the full route sweep

Severity: Major

Evidence:
- `outputs/massive-qa-2026-06-07/route-sweep.json`
- Persona: `participant`
- Route: `/es/onboarding`
- Viewport: `1365 x 900`
- Error:

```text
page.goto: Timeout 45000ms exceeded while waiting for domcontentloaded
```

Why this matters:
- Onboarding is one of the most critical participant flows.
- Even if intermittent, a 45-second load failure is unacceptable for a launch path.
- This may be a server component/data fetch hang, dev-server instability, or route-level query issue.

Recommended next step:
- Re-run `/es/onboarding` alone for participant.
- Capture network waterfall and server logs.
- Confirm whether the form waits on chapter/event/newsletter data without a timeout or fallback.

### QA-003 - Admin events mobile view is not operationally usable

Severity: Major

Evidence:
- Screenshot: `outputs/massive-qa-2026-06-07/screenshots/admin-es-admin-events-390.png`
- Route sweep: `/es/admin/events`, mobile, admin and staff
- `clippedButtonCount: 53`
- Source: `app/[locale]/admin/events/events-management-client.tsx`
  - Table implementation starts at line 183.
  - Actions column is declared at line 197.
  - Event title cell uses `min-w-[16rem]` at line 205.
  - Chapter cell uses `min-w-[14rem]` at line 210.

UX issue:
- The page squeezes a dense desktop table into a 390px mobile viewport.
- Row actions are not discoverable in the first mobile view.
- Event IDs and dense metadata compete with event names.
- The table is technically scrollable, but operationally hostile for admins/staff who need to scan and act.

Why this matters:
- Admin/staff event management is a repeated operational workflow.
- Mobile does not need feature parity with desktop tables, but it needs a usable card/record pattern if the page is accessible on mobile.

Recommended next step:
- Replace the mobile rendering with record cards or a compact list.
- Keep only the primary metadata visible:
  - event title
  - status
  - start date
  - chapter
  - primary action menu
- Hide raw IDs unless explicitly expanded.

### QA-004 - Admin users mobile view hides or buries critical actions

Severity: Major

Evidence:
- Screenshot: `outputs/massive-qa-2026-06-07/screenshots/admin-es-admin-users-390.png`
- Route sweep: `/es/admin/users`, mobile, admin and staff
- `clippedButtonCount: 20`
- Source: `app/[locale]/admin/users/users-management-client.tsx`
  - Desktop table begins at line 356.
  - Actions column is declared at line 374.
  - Row action cell starts at line 408.

UX issue:
- The mobile view shows a table-like list with tiny checkboxes and only early columns visible.
- The user cannot quickly tell how to view, edit, approve, or manage a row from the mobile first screen.
- Bulk selection affordances are too small and too abstract for touch.

Why this matters:
- User management is a high-risk admin surface.
- A cramped table increases the chance of selecting the wrong user or missing the intended action.

Recommended next step:
- Use mobile record cards with explicit row actions.
- Keep bulk actions desktop-first unless there is a deliberate mobile pattern.
- Add clear selected-state feedback and larger touch targets.

### QA-005 - Student events mobile ticket and tabs clip at 390px

Severity: Major

Evidence:
- Screenshots:
  - `outputs/massive-qa-2026-06-07/screenshots/member-es-student-events-390.png`
  - `outputs/massive-qa-2026-06-07/screenshots/participant-es-student-events-390.png`
- Route sweep: `/es/student/events`, mobile, participant and member
- `clippedButtonCount: 5`
- Source: `app/[locale]/student/events/page.tsx`
  - Current ticket layout starts around line 315.
  - Main layout uses `xl:grid-cols-[minmax(0,1fr)_20rem]` at line 468.
  - Tabs list uses horizontal overflow at line 492.

UX issue:
- The active ticket/QR area visually pushes against the right edge.
- The tab row clips `Historial` and creates the feeling that the page is wider than the phone.
- QR content is central and valuable, but the surrounding layout makes the page feel unstable.

Why this matters:
- The event ticket is a core student flow.
- At live check-in, clipped tabs or awkward QR presentation directly increases user stress.

Recommended next step:
- Constrain QR/ticket panels with explicit max widths and `min-w-0`.
- Consider stacked segmented tabs or two-row tabs on small screens.
- Prioritize the next action: show QR, calendar action, cancel action, then history.

### QA-006 - Spanish routes still contain broad English copy leaks

Severity: Major

Evidence from source:
- `app/[locale]/faq/page.tsx`
  - English metadata at line 7.
  - English H1 at line 14.
  - FAQ content remains English throughout the page.
- `app/[locale]/student/growth-reflection/page.tsx`
  - `Growth Reflection` at line 53.
- `app/[locale]/admin/layout.tsx`
  - `mobileSubtitle="Platform management"` at line 18.
- `app/[locale]/company/(protected)/settings/page.tsx`
  - `Company Information` at line 21.
  - `Company Name` at line 29.
- `app/[locale]/company/(protected)/students/[id]/page.tsx`
  - `Back to Browse Talent` at line 62.
  - `Company access verified` at line 113.
  - `Chapter Context` at line 133.

Evidence from route sweep:
- `spanishEnglishLeaks: 38`
- Confirmed affected areas:
  - public FAQ
  - company settings
  - company student detail
  - admin shell
  - student growth reflection

Why this matters:
- The current launch standard is Spanish-first controlled rollout.
- Mixed language makes the product feel unfinished and less trustworthy.
- Operational users may interpret English labels as a different or unsupported product state.

Recommended next step:
- Move these pages through a Spanish copy pass using `next-intl` keys where appropriate.
- Do not fix this with local one-off string edits only; otherwise the same drift will return.
- Decide whether `/en` is in active scope or explicitly deferred.

### QA-007 - Company/recruiter portal still feels deferred while remaining reachable

Severity: Major

Evidence:
- `docs/handbook/LAUNCH_UI_STANDARD.md` describes company/recruiter and alumni as deferred from first launch, but the route sweep includes reachable protected company pages for the recruiter persona.
- Company settings is mostly English on `/es/company/settings`.
- Company student detail mixes English operational labels with Spanish route context.
- Source:
  - `app/[locale]/company/(protected)/settings/page.tsx:21`
  - `app/[locale]/company/(protected)/settings/page.tsx:29`
  - `app/[locale]/company/(protected)/students/[id]/page.tsx:62`
  - `app/[locale]/company/(protected)/students/[id]/page.tsx:113`
  - `app/[locale]/company/(protected)/students/[id]/page.tsx:133`

Why this matters:
- If company representatives are not launch scope, the UX should communicate an intentional access/help state or be deliberately hidden from pilot navigation.
- If they are launch scope, the portal needs the same localization, hierarchy, empty/error state, and mobile QA bar as student/admin/chapter surfaces.

Recommended next step:
- Product decision needed:
  - Keep company portal deferred and route it to clear controlled-access states, or
  - Promote it to launch scope and run a full company-specific UX pass.

### QA-008 - Chapter members mobile view is dense and partly inconsistent

Severity: Major

Evidence:
- Screenshots:
  - `outputs/massive-qa-2026-06-07/screenshots/president-es-chapter-members-390.png`
  - `outputs/massive-qa-2026-06-07/screenshots/vp-es-chapter-members-390.png`
  - `outputs/massive-qa-2026-06-07/screenshots/editor-es-chapter-members-390.png`
- Route sweep:
  - `/es/chapter/members`, mobile, president/vp/editor
  - `/es/chapter/members?status=active`, mobile, president
  - `clippedButtonCount: 3`
- Source:
  - `app/[locale]/chapter/members/page.tsx:139`
  - `app/[locale]/chapter/members/page.tsx:140`
  - tabs rendered through `app/[locale]/chapter/members/components/member-tabs`

UX issue:
- The page is much better than a raw table, but still feels heavy on mobile.
- Status tabs are cramped.
- Repeated role/action controls consume a lot of vertical space.
- Copy includes unaccented Spanish such as `capitulo`, and the e-board invite text uses `chapter` in Spanish context.

Why this matters:
- Chapter leaders will use this surface repeatedly.
- Dense repeated controls can make it hard to distinguish reviewing, assigning, revoking, and inspecting.

Recommended next step:
- Use a mobile action menu per member for less common operations.
- Separate "review applicants" from "manage active members" more clearly.
- Tighten tabs into a small-screen segmented control or dropdown.

### QA-009 - Auth and admin invite flows log sensitive data too casually

Severity: Major

Evidence:
- `app/[locale]/auth/confirm/route.ts:32`
  - Logs `token_hash?.slice(0, 20)`, type, and locale.
- `app/[locale]/auth/confirm/route.ts:41`
  - Logs verifyOtp error details.
- `lib/actions/admin/invite-recruiter.ts:12`
  - Console audit logger.
- `lib/actions/admin/invite-recruiter.ts:77`
  - Logs invite creation details including admin and recruiter/company metadata.
- `lib/actions/admin/invite-recruiter.ts:118`
  - Logs resend metadata.
- `lib/actions/admin/invite-recruiter.ts:142`
  - Logs revoke metadata.

Why this matters:
- Partial token hashes and invite metadata are not harmless in production logs.
- Email addresses and invite identifiers can become privacy and compliance issues.
- Console logs are not an audit system.

Recommended next step:
- Replace raw console audit logs with structured logging through `lib/logger`.
- Redact tokens, emails, and invite identifiers by default.
- Keep audit trails in durable tables when needed, not only process logs.

### QA-010 - Several services fail closed but turn backend errors into normal empty states

Severity: Major

Evidence:
- `lib/services/student-dashboard.service.ts`
  - Profile query ignores `profile` error at lines 118-122.
  - Membership errors become `memberships: []` at lines 124-134.
- `lib/services/chapter-permission.service.ts`
  - User role load error returns `null` at lines 124-132.
  - Membership verification error returns `false` at lines 142-157.
  - Permission grant error returns `false` at lines 179-201.
- `lib/services/company.service.ts`
  - Visible talent load errors return `[]` at lines 133-156 and 182-184.
  - Saved student load errors return `[]` at lines 252-260.
  - `isStudentSaved` errors return `false` at lines 398-407.

Why this matters:
- Failing closed is correct for authorization.
- But from the user's perspective, an outage can look like:
  - "you have no membership"
  - "there are no students"
  - "you have no saved talent"
  - "you do not have permission"
- That creates bad support/debugging loops.

Recommended next step:
- Preserve fail-closed behavior for authorization decisions.
- Add explicit service result types for UI data loads:
  - success with data
  - empty
  - unavailable/error
- Show user-friendly error states while logging operational details.

### QA-011 - Recruiter talent search and filter options may not scale

Severity: Major

Evidence:
- `lib/services/company.service.ts`
  - `loadVisibleStudents` loads visible profiles, memberships, users, chapters, then joins in application code from lines 111-220.
  - `getCompanyStats` calls `getVisibleStudents` and `getSavedStudents` at lines 310-317.
- `lib/services/recruiter.service.ts`
  - `getTalentPool` filters skills in memory and paginates with `slice` at lines 77-93.
  - `getSavedStudents` filters saved records in memory and paginates with `slice` at lines 111-131.
  - `getTalentPoolFilterOptions` loads all visible students at line 143.

Why this matters:
- This is acceptable for seed data, but not for real recruiter traffic.
- Pagination after in-memory filtering can become slow and expensive.
- Filter option generation over all visible students can become a page-load bottleneck.

Recommended next step:
- Move more filtering and pagination into database queries or RPCs.
- Add indexes around recruiter-visible profiles, approved memberships, graduation year, chapter, and skills/search strategy.
- Define expected talent volume for the pilot and next scale tier.

### QA-012 - Chapter activation interest service lacks payload length controls and can surface raw DB errors

Severity: Major

Evidence:
- `lib/services/chapter-activation-interest.service.ts`
  - Input is trimmed at lines 34-44.
  - Required fields are checked at lines 47-49.
  - There are no explicit max-length validations before insert.
  - `friendlyInterestError` returns `error?.message` for non-unique errors at line 59.
  - Insert occurs at lines 110-114.

Why this matters:
- Long free-text payloads can create storage errors, poor review UX, or spammy records.
- Raw database errors should not be shown to end users.

Recommended next step:
- Add schema-level and service-level max lengths.
- Return generic user-facing errors and log the raw error separately.
- Add tests for empty, duplicate, too-long, and DB-failure cases.

### QA-013 - Permission key names drift between docs and code

Severity: Major

Evidence:
- Code permission keys:
  - `lib/services/chapter-permission.service.ts:5-27`
  - Examples: `chapter.dashboard.access`, `chapter.events.view_registrations`, `chapter.events.check_in`
- Pilot matrix permission keys:
  - `docs/handbook/PILOT_ROLE_PERMISSION_MATRIX.md`
  - Examples: `chapter.dashboard.view`, `chapter.registrations.view`, `chapter.checkin.manage`

Why this matters:
- The code can be correct and the docs can still lead future implementers into wrong permission grants.
- Permission drift is dangerous because it creates silent access gaps or false assumptions in QA.

Recommended next step:
- Align the pilot matrix with canonical code constants, or generate docs from the constants.
- Add a test or docs lint that catches permission keys in docs that do not exist in `CHAPTER_PERMISSION_KEYS`.

### QA-014 - The combined Playwright QA command timed out

Severity: Major

Evidence:
- Command:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3104'; pnpm exec playwright test tests/e2e/chapter-permissions.spec.ts tests/e2e/launch-qa-report.spec.ts --reporter=line
```

- Result:
  - Timed out after 424 seconds.
  - Partial launch artifact was still generated.

Why this matters:
- A massive QA suite that cannot reliably finish becomes hard to use as a release gate.
- This is a process and automation problem, not necessarily a product runtime bug.

Recommended next step:
- Split role tests into smaller CI jobs:
  - auth/guards
  - student
  - chapter
  - admin
  - company/recruiter
  - visual/mobile
- Persist artifacts per shard.
- Set explicit per-test and global timeouts.

## Medium Findings

### QA-015 - Admin shell still communicates partly in English on Spanish routes

Severity: Medium

Evidence:
- `app/[locale]/admin/layout.tsx:18`
- Mobile subtitle: `Platform management`

Impact:
- This is a small string, but it appears in a highly visible shell position.
- It makes Spanish admin routes feel like an internal prototype.

### QA-016 - Admin and chapter copy still has unaccented Spanish

Severity: Medium

Evidence:
- `app/[locale]/admin/events/events-management-client.tsx`
  - `Capitulos` at line 38.
  - `capitulo` at line 126.
  - `Capitulos` at line 139.
- `app/[locale]/chapter/members/page.tsx`
  - `Sin capitulo asignado` at line 79.
  - `Herramientas del capitulo` at line 139.
  - `Miembros del capitulo` at line 140.
- `app/[locale]/student/events/page.tsx`
  - `Postulacion`, `codigos`, `Agendalo`, `pagina` variants around lines 116, 123, 376, 457, 592.

Impact:
- This is not just polish. In Spanish-first launch, it affects product credibility.

### QA-017 - Mobile tabs often depend on horizontal scrolling instead of clear hierarchy

Severity: Medium

Evidence:
- Student events tabs use `overflow-x-auto` at `app/[locale]/student/events/page.tsx:492`.
- Chapter members tabs visually clip in mobile screenshots.

Impact:
- Horizontal tab overflow is easy to miss on touch devices.
- It can hide important states such as history, cancelled, rejected, or inactive.

Recommended next step:
- Use dropdown/status filter on mobile when there are more than three states.

### QA-018 - Growth reflection appears experimental and English in Spanish student flow

Severity: Medium

Evidence:
- Screenshot: `outputs/massive-qa-2026-06-07/screenshots/member-es-student-growth-reflection-390.png`
- Source: `app/[locale]/student/growth-reflection/page.tsx:53`

Impact:
- Students will not know whether this is an official LEAD pathway, a prototype, or a personal journal.

Recommended next step:
- Either localize and position it as an official student growth tool, or hide it from launch navigation until its purpose is clear.

### QA-019 - Public FAQ is fully English on `/es/faq`

Severity: Medium

Evidence:
- Screenshot: `outputs/massive-qa-2026-06-07/screenshots/public-es-faq-390.png`
- Source:
  - `app/[locale]/faq/page.tsx:7`
  - `app/[locale]/faq/page.tsx:14`

Impact:
- This is public-facing and undermines Spanish-first launch trust.

### QA-020 - Company resume download UX has English success/action copy

Severity: Medium

Evidence:
- `app/[locale]/company/(protected)/_components/resume-access-button.tsx`
- Existing search found:
  - `Resume opened in a new tab`
  - `Open Resume`

Impact:
- A company representative on `/es/company/*` sees mixed-locale operational feedback.

### QA-021 - Resume download requires logging success before returning the URL

Severity: Medium

Evidence:
- `lib/services/company.service.ts:474-485`

Current behavior:
- If `resume_download_log` insert fails, the service returns `Failed to log resume download.` and withholds the signed URL.

Why this may be right:
- If audit logging is a hard compliance requirement, this is correct.

Why this may be friction:
- If logging has a transient issue, an authorized recruiter cannot access a visible resume.

Recommended next step:
- Product/security decision needed: is audit-log failure a hard block or should it allow access with an alert?

### QA-022 - Route sweep detected a dev-server console/network error during long run

Severity: Medium

Evidence:
- `outputs/massive-qa-2026-06-07/route-sweep.json`
- One console/network error was captured during the long sweep, likely related to dev-server connection reset/refused.

Impact:
- This may be environment noise, but it reinforces the need for segmented QA runs and artifact review.

## Minor Findings

### QA-023 - Source comments contain mojibake/noisy separator characters in `company.service.ts`

Severity: Minor

Evidence:
- `lib/services/company.service.ts:103-109`
- `lib/services/company.service.ts:412-414`

Impact:
- No product impact, but it makes source review harder and suggests encoding drift.

### QA-024 - Raw event IDs appear too prominently in admin event mobile scanning

Severity: Minor

Evidence:
- `outputs/massive-qa-2026-06-07/screenshots/admin-es-admin-events-390.png`

Impact:
- IDs are useful for support, but not as primary mobile scan content.

### QA-025 - Some heuristic unlabeled-input checks need manual follow-up

Severity: Minor

Evidence:
- Custom sweep saw unlabeled inputs on some pages, but sampled axe checks found zero serious/critical violations.

Impact:
- This is not confirmed as a launch blocker, but custom controls/selects should be manually checked for accessible names.

## Role Flow Notes

### Public Visitor

What works:
- Public pages generally load.
- Protected routes redirect to login.

Friction:
- `/es/faq` is English.
- Any public Spanish-first route with English content weakens the first impression.

### Participant

What works:
- Participant is blocked from chapter/company/admin routes.
- Student events route loads on mobile and desktop.

Friction:
- `/es/onboarding` timed out once in a 45-second navigation.
- Student events mobile ticket/tabs clip.
- Event copy still has unaccented Spanish.

### Member

What works:
- Member route guards are safe.
- Member does not get chapter operations without grants.
- Student events ticket is visible.

Friction:
- Student events mobile layout clipping affects live event use.
- Member profile and growth surfaces still need copy/a11y review.

### President / Vice President / Editor / E-board

What works:
- Chapter access is scoped by approved membership plus permissions.
- Recruiters are not treated as chapter members.

Friction:
- Chapter members mobile is dense.
- Tabs and repeated controls need more hierarchy.
- Permission documentation is not aligned with code constants.

### Admin / Staff

What works:
- Admin/staff routes are protected.
- Admin dashboards are improved compared with earlier passes.

Friction:
- Admin users and events mobile pages are not operationally comfortable.
- Admin shell still has English mobile subtitle.
- Admin invite logging and messages need privacy/localization review.

### Company Representative / Recruiter

What works:
- Recruiter access is separated from chapter membership.
- Talent visibility requires explicit opt-in plus approved membership.
- Resume URL generation checks current visibility.

Friction:
- Company portal Spanish routes still contain English page titles, buttons, and descriptions.
- Talent search/filtering is likely not scalable beyond small datasets.
- Product scope is ambiguous: deferred in launch docs, but reachable and functional in the app.

### Alumni

What works:
- Alumni is blocked from chapter operations in guard checks.

Friction:
- Alumni-specific value proposition and route behavior still feel under-specified in the current launch surface.
- If alumni are part of the active pilot, they need a dedicated pass.

## Security And Privacy Notes

No confirmed auth bypass or data exposure was found in this pass.

However, the following need attention before production confidence:

1. Auth confirmation logs partial token hash and OTP errors.
2. Admin recruiter-invite audit logs use console output with PII-like metadata.
3. Company/recruiter resume access is correctly visibility-gated, but logging failure policy needs a product/security decision.
4. Service-layer fail-closed patterns need user-facing error states so outages are not silently interpreted as empty or unauthorized states.

## Automation Summary

Custom route sweep:

```text
Artifact: outputs/massive-qa-2026-06-07/route-sweep.json
Generated: 2026-06-07T12:12:28.000Z
Total checks: 142
Navigation errors: 1
Console errors: 1
Failed responses: 0
Body horizontal overflow: 0
Pages with clipped controls: 10
Axe serious/critical findings: 0
Spanish/English leak checks: 38
Screenshots: 142
```

Existing launch QA artifact:

```text
Artifact: outputs/launch-qa/launch-qa-results-all-desktop-chromium.json
Generated: 2026-06-07T12:00:03.399Z
Scope: all
Findings: 7
Expected behavior checks: 13
Steps: 83
Finding class: major uncaught browser exception
```

Timed-out command:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3104'; pnpm exec playwright test tests/e2e/chapter-permissions.spec.ts tests/e2e/launch-qa-report.spec.ts --reporter=line
```

Result:

```text
Timed out after 424 seconds.
```

## Recommended Fix Order

1. Stabilize protected-route redirects and remove uncaught browser exceptions.
2. Reproduce and fix `/es/onboarding` participant timeout.
3. Fix mobile operational UX:
   - admin events
   - admin users
   - student events ticket/tabs
   - chapter members tabs/actions
4. Run a Spanish-first copy sweep on active `/es` surfaces:
   - admin shell
   - FAQ
   - student events
   - growth reflection
   - company settings/student detail if company remains reachable
5. Redact or replace sensitive console logs in auth and invite flows.
6. Harden service-layer result semantics so UI can distinguish:
   - true empty
   - unauthorized
   - temporarily unavailable
   - backend failure
7. Align permission docs with code constants.
8. Split Playwright QA into reliable role shards and add visual/mobile artifacts to the release gate.

## Product Questions To Answer Before Fixing

1. Is the company/recruiter portal launch scope for this release, or should it remain intentionally deferred?
2. Is alumni a real first-launch role with its own expected dashboard, or only a guarded identity state for now?
3. Should admin/staff mobile be launch-critical, or is admin explicitly desktop-first for the pilot?
4. Should growth reflection be treated as an official student workflow, or hidden until its copy and purpose are mature?
5. Is resume-download audit logging a hard blocker for access, or should authorized access continue while logging failure alerts operators?
6. Should permission docs use the current code constants exactly, or should the code rename constants to match the product-language matrix?

## Bottom Line

The most dangerous current pattern is not a single broken page. It is uneven product truth:

- Some routes are safely guarded but still throw browser exceptions.
- Some mobile pages technically render but are not comfortable enough for real operators.
- Some Spanish routes are still English.
- Some services protect data but hide backend failure behind ordinary empty states.
- Company and alumni are partly present but not clearly launch-polished.

The next pass should be focused and sequential, not broad cosmetic cleanup. Start with route stability, onboarding, and mobile operational surfaces; then do the Spanish copy source-of-truth pass and service error-state hardening.
