# PRD: Launch User-Flow QA Fixes

## 1. Executive Summary

The launch Playwright QA pass found that LEAD Talent Platform is close to being usable across the main personas, but several launch-critical user flows still behave incorrectly or unreliably. The highest-risk failures are not cosmetic: chapter leaders can log in and land in the wrong workspace, recruiters and admins can directly render the student workspace, the public chapter page is protected by the chapter dashboard layout, and open event registration can stay stuck instead of producing a registered/QR state.

This PRD defines a focused stabilization package for the issues confirmed in `.github/reports/launch-user-flow-playwright-qa-report.md`.

MVP goal: make the seeded launch matrix pass cleanly for anonymous visitors, participants, members, alumni, chapter operators, admins/staff, and recruiters across desktop and mobile Chromium, without changing the database schema unless implementation proves it is strictly necessary.

## 2. Mission

Stabilize the platform's launch-critical access, registration, and rendering flows so founders, chapter leaders, members, and company representatives can use the product with confidence.

Core principles:

- Keep global roles, chapter membership, chapter permissions, and recruiter access separate.
- Use server-trusted authorization for redirects and protected route boundaries.
- Do not let workspace routes bleed across roles.
- Preserve the intended public surface for chapters, events, signup, and login.
- Fix behavior before visual polish.
- Keep fixes narrow and testable.
- Add regression coverage for every confirmed launch bug.
- Treat report-only QA artifacts as evidence, not as permanent product code unless promoted intentionally.

## 3. Target Users

### Anonymous Visitor

Needs:

- Browse public homepage, events, event detail, and public chapter pages.
- Understand whether they need to log in or create a profile.
- Click event registration CTAs and reach login/signup cleanly.

Pain points from QA:

- `/es/chapter/leaduni` redirects to login.
- Event registration login CTA did not navigate during QA.

### Participant / Regular Member / Alumni

Needs:

- Reach the student workspace after login.
- Register for open events and see QR/registered state.
- Apply to chapter or events without gaining operator access.
- Be blocked from chapter operations unless granted.

Pain points from QA:

- Open event registration stayed on `Registrando...`.

### Chapter President / VP / E-board / Editor

Needs:

- Land in `/es/chapter` after password login when they have `chapter.dashboard.access`.
- Keep direct chapter dashboard access working.
- Operate members, events, applications, and check-in according to permission grants.

Pain points from QA:

- Password login sends chapter operators to `/es/student` or `/es/onboarding`.

### Admin / Staff

Needs:

- Land in `/es/admin` after login.
- Manage users, chapters, companies, events, invites, and settings.
- Avoid accidental student-workspace behavior unless an explicit impersonation mode exists.

Pain points from QA:

- Admin password login can land outside admin.
- Admin/staff can directly render `/es/student`.
- Admin company/event tables throw hydration errors.

### Recruiter / Company Representative

Needs:

- Land in `/es/company`.
- Browse and save visible talent.
- Access only company-scoped routes.
- Be blocked from student, chapter, and admin workspaces.

Pain points from QA:

- Recruiter can directly render `/es/student`.

## 4. MVP Scope

### In Scope

- [ ] Fix password-login redirect resolution so it uses permission-aware, server-trusted role/profile/chapter access data.
- [ ] Ensure chapter operators with `chapter.dashboard.access` land on `/chapter`.
- [ ] Ensure admins/staff land on `/admin`.
- [ ] Ensure recruiters land on `/company`.
- [ ] Add route-level role boundaries to the student workspace.
- [ ] Redirect recruiters away from `/student/*` to `/company`.
- [ ] Redirect admins/staff away from `/student/*` to `/admin`, unless an explicit impersonation flow is introduced.
- [ ] Split public chapter pages from protected chapter operations.
- [ ] Preserve a public chapter detail URL for `/chapter/[id]` or provide a documented redirect from the old public URL to the new public URL.
- [ ] Fix open event registration so it creates/updates registration, redirects or refreshes correctly, and renders QR/registered state.
- [ ] Fix anonymous event registration CTA navigation to localized login with a return path.
- [ ] Fix hydration errors caused by locale-dependent admin date formatting.
- [ ] Clean up public homepage asset and hydration console warnings that are launch-visible.
- [ ] Harden the Playwright launch matrix so false positives are reduced and confirmed bugs are asserted after fixes.
- [ ] Re-run Supabase reset, baseline chapter permission spec, and launch QA on desktop/mobile.
- [ ] Update testing docs if launch QA commands become permanent.

### Out of Scope

- [ ] New database tables or permission schema redesign.
- [ ] Full event-scoped permissions.
- [ ] LEAD Pulse, LEAD Funding, or Impact Metrics feature work.
- [ ] New chapter preapproval behavior beyond preserving existing access assumptions.
- [ ] Full production observability implementation.
- [ ] Full route crawler.
- [ ] Google OAuth end-to-end beyond preserving existing callback behavior.
- [ ] Real email delivery validation.
- [ ] Resume upload/download storage hardening unless directly broken by route guards.
- [ ] QR camera hardware validation.
- [ ] Broad UI redesign.

## 5. User Stories

1. As a chapter president, I want to log in and land directly in my chapter dashboard, so that training and chapter operations start without confusion.

2. As a chapter e-board member, I want my dashboard destination to follow my chapter permissions, so that I do not need to manually find the chapter workspace.

3. As an admin, I want password login to reliably send me to the admin dashboard, so that global operations are not mixed with the student experience.

4. As a recruiter, I want my account to stay inside the company portal, so that I only see the workflows I am allowed to use.

5. As a student or member, I want student pages to be reserved for the appropriate user types, so that account roles remain clear and protected.

6. As an anonymous visitor, I want public chapter pages to be visible without login, so that I can learn about LEAD chapters before creating an account.

7. As a member, I want event registration to complete and show my QR/registered status, so that I know I am actually registered.

8. As a founder or reviewer, I want the launch QA matrix to pass without hydration exceptions or misleading false positives, so that the product can be judged from reliable evidence.

## 6. Core Architecture

### Existing Architecture To Preserve

```text
app/[locale]/
  (public)/
  auth/
  events/
  onboarding/
  student/
  chapter/
  admin/
  company/

components/
  auth/
  events/
  ui/

lib/
  actions/
  services/
  auth.ts
  auth-redirects.ts
  supabase/
```

Business logic should remain in `lib/services/`. Server actions and route handlers should stay thin: authenticate, validate, call service/helper, return/redirect.

### Redirect Architecture

Current password-login risk:

```text
components/auth/login.tsx
  supabase.auth.signInWithPassword()
  query public.user + person_profile from browser
  getPostAuthRedirectPath({ role, hasProfile })
```

Required launch behavior:

```text
Password login succeeds
  -> server-trusted redirect resolver
  -> resolvePostAuthRedirectPath()
  -> workspace route:
       admin      -> /admin
       recruiter  -> /company
       chapter op -> /chapter
       member     -> /student
       no profile -> /onboarding where appropriate
```

The implementation may use one of two approaches:

- Preferred: a server action or route handler that reads the authenticated Supabase session from cookies and calls `resolvePostAuthRedirectPath()`.
- Acceptable fallback: a narrow client query that also checks chapter dashboard permission, with explicit error handling and tests. This should only be used if server-side session propagation after client password login is not reliable.

### Route Boundary Architecture

Student workspace should explicitly guard workspace roles:

```text
/student/*
  anonymous -> /auth/login
  recruiter -> /company
  admin/staff -> /admin
  member/editor -> allowed
```

Chapter operations remain permission-scoped:

```text
/chapter
/chapter/members
/chapter/events
/chapter/checkin
  requires approved membership + chapter.dashboard.access
```

Public chapter profile pages must not inherit protected chapter layout:

```text
Public:
  /chapter/[id] or /chapters/[id]

Protected:
  /chapter
  /chapter/members
  /chapter/events
  /chapter/checkin
```

Recommended route structure:

```text
app/[locale]/
  (public)/
    chapter/[id]/page.tsx
  (chapter-ops)/
    chapter/layout.tsx
    chapter/page.tsx
    chapter/members/page.tsx
    chapter/events/page.tsx
    chapter/checkin/page.tsx
```

If Next.js route group constraints require a different arrangement, preserve the URL behavior and document the chosen layout boundary.

### Event Registration Architecture

Open event registration should complete through the existing server action:

```text
EventRegistrationCheckout
  -> registerForEvent()
  -> EventService.registerForEvent()
  -> revalidate event/student paths
  -> redirect to /{locale}/student/events?event={eventId}
```

Required investigation points:

- Whether `registerForEvent()` receives the submitted form.
- Whether `EventService.registerForEvent()` creates the row.
- Whether `redirect()` inside `useActionState()` is being followed.
- Whether client pending state is stuck because the server action never resolves.
- Whether RLS, auth session, or local dev compilation is blocking completion.

### Date Formatting Architecture

Admin client tables must not use environment-dependent date formatting:

```tsx
new Date(value).toLocaleDateString()
new Date(value).toLocaleString()
```

Required replacement:

- Explicit locale and time zone, or
- Server-preformatted display strings, or
- A shared helper that formats consistently on server and client.

Example target:

```ts
formatDisplayDate(value, { locale: 'es-PE', timeZone: 'America/Lima' })
```

## 7. Tools / Features

### Auth Redirect Stabilization

Functional requirements:

- Password login must resolve role, profile, and chapter dashboard access consistently.
- Login must not silently fall back to onboarding when role/profile lookup fails.
- Login errors must be visible and accessible.
- Auth callback behavior must remain compatible with Google/OAuth.

Acceptance criteria:

- `president@test.com`, `vp@test.com`, `editor@test.com`, and `eboard@test.com` land on `/es/chapter`.
- `admin@test.com` and `staff@test.com` land on `/es/admin`.
- `recruiter@test.com` lands on `/es/company` or `/es/company/dashboard`.
- `participant@test.com`, `member@test.com`, and `alumni@test.com` land on `/es/student`.

### Workspace Boundary Guards

Functional requirements:

- Recruiter accounts cannot render student workspace pages.
- Admin/staff accounts cannot render student workspace pages unless a future impersonation mode is explicitly built.
- Existing member/student access is preserved.
- Existing chapter permission guard remains intact.

Acceptance criteria:

- Recruiter direct visits to `/es/student`, `/es/student/profile`, `/es/student/events`, and `/es/student/resume` redirect to company boundary.
- Admin/staff direct visits to the same routes redirect to admin boundary.
- Participant/member/alumni continue to render student pages.

### Public Chapter Page Split

Functional requirements:

- Anonymous visitor can view public chapter profile content.
- Protected chapter dashboard remains inaccessible to anonymous/regular members.
- Public chapter route does not expose member contact info or operator tools.
- Existing chapter profile components can be reused when safe.

Acceptance criteria:

- Anonymous `/es/chapter/leaduni` renders LEAD UNI public content.
- Anonymous `/es/chapter` redirects to login.
- Member without dashboard permission is blocked from `/es/chapter`.
- Public chapter page passes desktop/mobile screenshot checks.

### Event Registration Completion

Functional requirements:

- Logged-in member can register for an open event.
- Duplicate registration renders a stable registered/QR state, not another fresh registration form.
- Anonymous event CTA navigates to localized login and preserves return path.
- Event registration errors are visible and not stuck in pending.

Acceptance criteria:

- `member@test.com` clicking `Registrarme` creates an `event_registration` row.
- The UI redirects to `/es/student/events?event=92000000-0000-4000-8000-000000000016` or renders `Registrado` with QR link.
- Revisiting the same event does not show a duplicate active registration button.
- Anonymous `Iniciar sesion` CTA on the registration card reaches `/es/auth/login?next=...`.

### Admin Hydration Safety

Functional requirements:

- Admin companies/events/users pages must not throw hydration exceptions.
- Date formatting must be deterministic across server/client and desktop/mobile.
- Existing sorting and filtering behavior remains intact.

Acceptance criteria:

- `/es/admin/companies` has no hydration page errors.
- `/es/admin/events` has no hydration page errors.
- Date columns still display readable dates.
- Vitest coverage exists for shared date formatting helper if added.

### Public Asset / Console Cleanup

Functional requirements:

- Public homepage should not request localized `/es/video3.mp4` if the asset lives at `/video3.mp4`.
- Logo image resizing should avoid Next image aspect-ratio warnings.
- Public form inputs should not produce caret-style hydration mismatch.

Acceptance criteria:

- `/es` has no unexpected 404 for `video3.mp4`.
- `/leadl2.svg` warning no longer appears in tested public routes.
- Homepage, login page, and company band no longer produce caret-color hydration mismatches in Playwright console capture.

### Launch QA Harness

Functional requirements:

- Keep the launch matrix report-only until fixes are complete.
- Convert key findings into assertions after each fix lands.
- Reduce false positives from broad text matching and dev compilation states.
- Keep screenshots for role dashboards and failure states.

Acceptance criteria:

- Baseline `tests/e2e/chapter-permissions.spec.ts` remains green.
- Launch QA spec passes after all fixes without confirmed bug findings.
- Report distinguishes expected auth redirects from actual bugs.
- Documentation lists exact commands to reproduce the launch matrix.

## 8. Technology Stack

No stack changes are expected.

| Layer | Technology |
| :-- | :-- |
| Framework | Next.js 15 App Router, React 19 |
| Auth/database | Supabase, `@supabase/ssr` |
| Styling/UI | Tailwind CSS 4, Radix UI, Shadcn-like local components |
| i18n | `next-intl`, locale routing under `app/[locale]` |
| Validation | Zod where new actions need inputs |
| Tests | Vitest for helpers/services, Playwright for launch flows |
| Package manager | pnpm |

## 9. Security & Configuration

Security requirements:

- Do not trust client-only role data for privileged redirects.
- Do not expose chapter member contact information on public chapter pages.
- Recruiter access remains controlled by `user.role = 'recruiter'` plus active `recruiter_access`.
- Admin access remains controlled by `user.role = 'admin'`.
- Chapter access remains controlled by approved membership plus permission grants.
- Event registration must respect existing auth, profile, capacity, and RLS rules.
- No secrets or new env vars should be added unless a chosen implementation requires one.

Configuration expectations:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` remain the auth/database client configuration.
- Local QA continues to use seeded password `password123`.
- Local launch QA may use `NODE_OPTIONS=--max-old-space-size=4096` for the mobile admin/recruiter slice if Turbopack memory pressure recurs.

## 10. API Specification

No public API changes are required.

Potential internal additions:

### Server Action: Resolve Post-Login Redirect

Purpose: after password login, return the authoritative workspace route for the current authenticated user.

Location:

```text
lib/actions/auth/resolve-post-login-redirect.ts
```

Request:

```ts
type ResolvePostLoginRedirectInput = {
  fallback?: string
}
```

Response:

```ts
type ResolvePostLoginRedirectResult =
  | { success: true; path: string }
  | { success: false; error: string; path?: string }
```

Rules:

- Must call server Supabase client.
- Must read current user from the authenticated session.
- Must query `public.user`, `person_profile`, and chapter dashboard permission when needed.
- Must delegate route decision to `resolvePostAuthRedirectPath()`.
- Must not grant access based only on client-supplied role.

### Existing Server Action: `registerForEvent`

Required behavior:

```ts
registerForEvent(prevState, formData)
  -> authenticate
  -> validate event and profile preflight
  -> call EventService.registerForEvent
  -> revalidate event/student paths
  -> redirect to localized student event QR route
```

No request/response contract change should be necessary unless investigation proves `useActionState()` cannot handle redirect reliably in this setup.

## 11. Success Criteria

The stabilization package is complete when:

- `pnpm run supabase:reset` passes.
- `pnpm exec playwright test tests/e2e/chapter-permissions.spec.ts --reporter=line` passes.
- Launch QA passes desktop and mobile for public/student, chapter, and admin/recruiter scopes.
- No confirmed launch-matrix findings remain for:
  - wrong post-login dashboard,
  - recruiter/admin access to student workspace,
  - public chapter page auth redirect,
  - open event registration stuck pending,
  - anonymous event CTA not routing,
  - admin date hydration errors.
- New Vitest coverage exists for any redirect/date helper added.
- New Playwright coverage exists for every previously confirmed bug.
- No schema changes are introduced unless explicitly justified in the implementation notes.
- No broad UI redesign or unrelated refactor is included.

## 12. Implementation Phases

### Phase 1: Auth Redirects and Workspace Boundaries

Deliverables:

- Server-trusted password-login redirect resolution.
- Role boundaries in `app/[locale]/student/layout.tsx`.
- Tests for persona landing routes and direct student-route access.

Primary files likely affected:

- `components/auth/login.tsx`
- `lib/auth-redirects.ts`
- `lib/auth-redirects.test.ts`
- `app/[locale]/student/layout.tsx`
- `tests/e2e/chapter-permissions.spec.ts` or a new focused auth spec

### Phase 2: Public Chapter Route Split

Deliverables:

- Public chapter detail route no longer inherits protected chapter layout.
- Protected chapter operator routes remain permission-guarded.
- Desktop/mobile screenshots for public chapter page and chapter dashboard.

Primary files likely affected:

- `app/[locale]/chapter/layout.tsx`
- `app/[locale]/chapter/[id]/page.tsx`
- route-group files under `app/[locale]/(public)` or an equivalent structure
- public chapter components under `app/[locale]/chapter/[id]/_components`

### Phase 3: Event Registration Stabilization

Deliverables:

- Open registration completes for seeded member.
- Duplicate registration state renders registered/QR UI.
- Anonymous login CTA routes correctly with localized return path.
- Server action or component changes covered by e2e.

Primary files likely affected:

- `components/events/event-registration-checkout.tsx`
- `app/[locale]/events/[id]/_components/EventContent.tsx`
- `lib/actions/events/register.ts`
- `lib/services/event.service.ts`
- focused Playwright event registration spec

### Phase 4: Hydration and Public Console Cleanup

Deliverables:

- Deterministic admin date formatting.
- Public video/logo/caret hydration warnings removed.
- Hydration checks covered in Playwright console capture.

Primary files likely affected:

- `app/[locale]/admin/companies/companies-management-client.tsx`
- `app/[locale]/admin/events/events-management-client.tsx`
- `app/[locale]/admin/users/users-management-client.tsx`
- `app/[locale]/(public)/_components/hero.tsx`
- `app/[locale]/(public)/_components/final-cta.tsx`
- `app/[locale]/(public)/_components/navbar-client.tsx`
- shared date formatting helper if added

### Phase 5: Launch QA Re-run and Documentation

Deliverables:

- Hardened launch QA spec or updated report-only harness.
- Fresh QA report showing resolved findings.
- Update `docs/handbook/TESTING.md` with launch QA commands if the harness becomes official.

Primary files likely affected:

- `tests/e2e/launch-qa-report.spec.ts`
- `.github/reports/`
- `docs/handbook/TESTING.md`

## 13. Future Considerations

- Convert the launch matrix into a CI-friendly smoke suite after launch stabilization.
- Add production-build Playwright coverage separate from local dev/Turbopack behavior.
- Add explicit admin impersonation if founders/admins need to view student workflows intentionally.
- Add observability for server action failures in event registration.
- Track Google Maps Places Autocomplete deprecation separately.
- Add public chapter SEO metadata once public route behavior is stable.
- Add route-level access documentation for every workspace.

## 14. Risks & Mitigations

### Risk: Password login server redirect cannot see the client-created session immediately

Mitigation:

- Prototype server action/session read first.
- If unavailable, use a narrow client fallback that queries only non-sensitive redirect facts and explicitly checks chapter dashboard permission.
- Keep OAuth callback path unchanged.

### Risk: Moving chapter routes breaks links or layouts

Mitigation:

- Preserve public URL behavior.
- Add redirects only if a public URL changes.
- Cover `/chapter`, `/chapter/[id]`, `/chapter/events`, and `/chapter/members` in Playwright.

### Risk: Student route guard blocks legitimate admin support workflows

Mitigation:

- Treat admin access to student pages as out of scope unless there is an explicit impersonation requirement.
- Document the decision in the PR or follow-up issue.

### Risk: Event registration issue is local-dev/Turbopack-specific

Mitigation:

- Verify both UI state and database row creation.
- If local dev is the only failing mode, add a production-build validation note before lowering severity.

### Risk: Hydration fixes create date/time confusion

Mitigation:

- Use one explicit display locale/time zone across admin tables.
- Add small helper tests.
- Keep raw ISO values untouched for sorting where possible.

### Risk: QA harness false positives distract from real fixes

Mitigation:

- Convert broad text probes into route-specific assertions.
- Keep report-only findings separated from failing assertions until each fix is stable.
- Attach screenshots to every role dashboard and every confirmed failure.

## 15. Definition of Done

- All launch user-flow fixes are implemented in vertical slices.
- Service/helper logic has Vitest coverage where applicable.
- Critical user flows have Playwright coverage.
- `pnpm run lint` passes.
- `pnpm test` passes.
- Supabase reset plus baseline chapter permission Playwright spec passes.
- Launch QA report is refreshed and shows no remaining major confirmed bugs from the original report.
- The final PR description links this PRD and the QA report.
