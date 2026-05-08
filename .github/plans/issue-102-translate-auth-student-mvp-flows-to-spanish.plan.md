# Issue #102: Translate Auth and Student MVP Flows to Spanish

GitHub: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/102

## Summary

Translate the highest-volume participant journey to Spanish without broadening into every operational surface. The slice covers auth, onboarding, student dashboard/profile/events, public event browsing/detail/registration states, and shared event components used by participants. The implementation should keep code and route identifiers in English, localize UI labels at the boundary, and preserve the Spanish-default routing foundation from #101.

## Problem

Spanish is now the default product language, but the primary participant path still contains visible English copy. Auth pages mostly use `messages.auth`, while student dashboard, student events, event browsing, event details, registration checkout, sidebar labels, and some auth edge states still rely on route-local English literals. That makes `/es` feel mixed even when routing is correct.

## User Story

As a Spanish-speaking participant,
I want login, onboarding, dashboard, profile, and event participation flows to be in Spanish,
so that I can use the product without translation friction.

## Type and Complexity

| Field | Value |
| --- | --- |
| Type | Frontend / Localization |
| Complexity | Medium |
| Phase | Active PIV Loop |
| GitHub Issue | #102 |
| Source PRD | `.github/PRDs/spanish-first-product-language-strategy.prd.md` |
| Dependency | #101 Spanish default locale and language policy |

## Current Codebase Findings

| Area | File | Finding |
| --- | --- | --- |
| Auth forms | `components/auth/login.tsx`, `components/auth/sign-up.tsx`, `components/auth/forgot-password.tsx`, `components/auth/update-password.tsx` | Main labels already use `useTranslations('auth')`; remaining hardcoded strings are aria labels, raw Supabase error messages, reset redirect locale, and auth error page copy. |
| Auth messages | `messages/es.json`, `messages/en.json` | Spanish auth/onboarding/profile namespaces exist; add missing keys rather than inventing a new translation layer. |
| Onboarding | `components/onboarding.tsx` | Mostly Spanish through `messages.onboarding`, but one hardcoded `and` remains in terms/privacy copy and some Spanish strings need cleanup for accents/clarity. |
| Student dashboard | `app/[locale]/student/page.tsx` | Primary dashboard, cards, badges, status messages, actions, and fallbacks are English literals. |
| Student profile | `app/[locale]/student/profile/page.tsx`, `app/[locale]/student/profile/components/profile-update-form.tsx` | Page heading/description, member ID notices, placeholders, and status hints include English literals. Form sections mostly use `messages.profile`. |
| Student events | `app/[locale]/student/events/page.tsx` | Page header, tabs, empty states, QR guidance, status descriptions, and buttons are English literals. |
| Public events | `app/[locale]/events/page.tsx`, `app/[locale]/events/[id]/_components/EventContent.tsx` | Public event list/detail/registration path is heavily English: date locale, badges, empty states, CTAs, registration sidebar, event metadata, and application states. |
| Registration components | `components/events/event-registration-checkout.tsx`, `components/events/registration-status-badge.tsx`, `components/events/cancel-registration-dialog.tsx` | Shared participant-facing labels/statuses are English and should be translated or mapped centrally. |
| Student navigation | `lib/nav-config.ts`, `components/ui/sidebars/student-sidebar.tsx` | Student nav labels and group labels are English. Since nav config is shared with chapter/admin/company, only translate student-facing labels in this issue and avoid operational portals. |

## Design Decisions

### Scope The Spanish Pass By Participant Path

Translate:

- `/es/auth/login`
- `/es/auth/sign-up`
- `/es/auth/forgot-password`
- `/es/auth/update-password`
- `/es/auth/error`
- `/es/auth/sign-up-success`
- `/es/onboarding`
- `/es/student`
- `/es/student/profile`
- `/es/student/events`
- `/es/events`
- `/es/events/[id]`
- shared participant registration/cancel/status components used by those routes

Defer:

- Chapter editor tools
- Admin tools
- Company representative portal
- Sponsor-facing English public polish

Those are covered by #103, #104, and #105.

### Prefer Messages For Shared Copy, Direct Spanish For Route-Local Copy

Use `messages/es.json` and `messages/en.json` for auth, nav, reusable event registration labels, and repeated statuses. Direct Spanish literals are acceptable for route-local page copy that is still moving quickly, especially in `app/[locale]/student/*` and event page sections.

### Preserve Auth And Business Behavior

Do not change Supabase auth logic, event registration logic, onboarding schema, RLS, service methods, or database enum values. Translate display labels only.

### Keep Event Content Authored

Do not translate event titles/descriptions that come from the database. Translate the UI around them.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `messages/es.json` | UPDATE | Add/clean participant-flow keys for auth edge copy, nav, student, events, registration, statuses. |
| `messages/en.json` | UPDATE | Keep parity for any new message keys added to Spanish. |
| `components/auth/google-button.tsx` | UPDATE | Translate Google auth CTA if hardcoded. |
| `components/auth/sign-up.tsx` | UPDATE | Translate password visibility aria labels and map Supabase errors through existing auth error keys. |
| `components/auth/login.tsx` | UPDATE | Translate password visibility aria labels. |
| `components/auth/forgot-password.tsx` | UPDATE | Preserve locale in reset redirect and map user-facing errors. |
| `app/[locale]/auth/error/page.tsx` | UPDATE | Spanish-first auth error copy. |
| `components/onboarding.tsx` | UPDATE | Replace hardcoded `and`, polish remaining primary onboarding copy. |
| `lib/nav-config.ts` and/or sidebar components | UPDATE | Spanish student nav and group labels without changing route paths. |
| `app/[locale]/student/page.tsx` | UPDATE | Translate dashboard badges, headings, cards, actions, and empty/status states. |
| `app/[locale]/student/profile/page.tsx` | UPDATE | Translate heading/description and fallback status language. |
| `app/[locale]/student/profile/components/profile-update-form.tsx` | UPDATE | Translate member ID notices, placeholders, save/loading context. |
| `app/[locale]/student/events/page.tsx` | UPDATE | Translate student event dashboard, tabs, QR guidance, empty states, and buttons. |
| `app/[locale]/events/page.tsx` | UPDATE | Translate public event list shell, badges, counts, date locale, empty states, and CTAs. |
| `app/[locale]/events/[id]/_components/EventContent.tsx` | UPDATE | Translate event detail shell, timing/status labels, registration sidebar, fallbacks, and actions. |
| `components/events/event-registration-checkout.tsx` | UPDATE | Translate registration checkout states, sticky CTA, newsletter checkbox, and errors where displayed. |
| `components/events/registration-status-badge.tsx` | UPDATE | Translate registration status labels. |
| `components/events/cancel-registration-dialog.tsx` | UPDATE | Translate cancellation dialog. |
| `.github/plans/issue-102-translate-auth-student-mvp-flows-to-spanish.plan.md` | UPDATE | Track implementation and validation evidence. |

## Implementation Tasks

- [x] Tighten auth Spanish coverage.
  - **Files**: `components/auth/*`, `app/[locale]/auth/error/page.tsx`, `messages/es.json`, `messages/en.json`
  - **Implement**:
    - Translate hardcoded password visibility aria labels.
    - Translate Google button text if hardcoded.
    - Ensure forgot-password reset link preserves locale.
    - Map visible Supabase errors through `getAuthErrorKey` where practical.
    - Translate auth error page title/body.
  - **Mirror**: `components/auth/login.tsx` already uses `useTranslations('auth')`.
  - **Validate**: `/es/auth/login`, `/es/auth/sign-up`, `/es/auth/forgot-password`, `/es/auth/update-password`, `/es/auth/error`.

- [x] Polish onboarding copy and remove mixed-language leftovers.
  - **Files**: `components/onboarding.tsx`, `messages/es.json`, `messages/en.json`
  - **Implement**:
    - Replace hardcoded `and` between terms/privacy links.
    - Clean Spanish onboarding labels for accents and clarity where currently visibly rough.
    - Keep validation schema and field names unchanged.
  - **Mirror**: Existing `useTranslations('onboarding')` pattern in `components/onboarding.tsx`.
  - **Validate**: `/es/onboarding` renders without mixed primary copy.

- [x] Translate student navigation and dashboard.
  - **Files**: `lib/nav-config.ts`, `components/ui/sidebars/student-sidebar.tsx`, `app/[locale]/student/page.tsx`
  - **Implement**:
    - Translate student nav labels: browse events, my events, profile, resume.
    - Translate student sidebar group label.
    - Translate dashboard status content, actions, membership details, profile readiness, and chapter application prompts.
    - Preserve role/status enum keys and service calls.
  - **Mirror**: Existing dashboard composition with `PageHeader`, `Badge`, `Card`, and `Button`.
  - **Validate**: `/es/student` for participant, pending, member, and alumni seed personas where possible.

- [x] Translate student profile flow.
  - **Files**: `app/[locale]/student/profile/page.tsx`, `app/[locale]/student/profile/components/profile-update-form.tsx`, `messages/es.json`, `messages/en.json`
  - **Implement**:
    - Translate heading/description, member ID helper text, pending membership notice, placeholders, and save/loading labels.
    - Keep profile field names/data mapping unchanged.
  - **Mirror**: Existing `messages.profile` namespace.
  - **Validate**: `/es/student/profile`.

- [x] Translate public event browse/detail participant path.
  - **Files**: `app/[locale]/events/page.tsx`, `app/[locale]/events/[id]/_components/EventContent.tsx`
  - **Implement**:
    - Change event date locale to Spanish display (`es-PE`) while keeping `America/Lima`.
    - Translate list headings, badges, counts, empty states, CTAs, fallback labels, event timing/status messages, and registration sidebar labels.
    - Do not translate DB-authored event titles/descriptions.
  - **Mirror**: Current event list/detail layout and badge variants.
  - **Validate**: `/es/events`, `/es/events/[id]` for open, application, full, live/past, logged-out, logged-in-without-profile, and logged-in-with-profile states where available.

- [x] Translate shared registration components.
  - **Files**: `components/events/event-registration-checkout.tsx`, `components/events/registration-status-badge.tsx`, `components/events/cancel-registration-dialog.tsx`
  - **Implement**:
    - Translate register/apply/cancel/status labels, mobile sticky CTA copy, newsletter checkbox, QR copy, and unavailable/full/closed states.
    - Keep `RegistrationStatus` enum values unchanged.
  - **Mirror**: Existing status mapping in `registration-status-badge.tsx`.
  - **Validate**: event registration and cancellation smoke.

- [x] Smoke test the Spanish participant path with seeded personas.
  - **Routes**:
    - `/es/auth/login`
    - `/es/auth/sign-up`
    - `/es/auth/forgot-password`
    - `/es/onboarding`
    - `/es/student`
    - `/es/student/profile`
    - `/es/student/events`
    - `/es/events`
    - `/es/events/[id]`
  - **Expected**:
    - Primary headings, buttons, badges, empty states, and status labels are Spanish.
    - Event titles/descriptions remain authored content.
    - No route redirects Spanish users to `/en`.
    - Participant can understand login, onboarding, dashboard, profile, event browse, event registration, and QR/status flow.

- [x] Validate and update GitHub.
  - **Commands**:
    - `pnpm lint`
    - `pnpm build`
    - `pnpm test` if implementation touches schemas/actions/services or if existing test coverage is affected.
  - **GitHub**:
    - Comment on #102 with changed files, validation, screenshots/manual smoke notes, and any deliberate deferrals.

## Validation Results

- [x] `pnpm lint` passed with existing warnings only.
- [x] `pnpm build` passed.
- [x] Playwright smoke passed:
  - `/es/auth/login`: `Bienvenido de nuevo`, no matched English primary auth/event phrases.
  - `/es/auth/sign-up`: `Crear una cuenta`, no matched English primary auth/event phrases.
  - `/es/auth/forgot-password`: `Restablece tu contraseña`, no matched English primary auth/event phrases.
  - `/es/events`: `Encuentra tu proximo evento LEAD`, no matched English primary event/nav phrases.
  - Logged in with `participant@test.com` / `password123`.
  - `/es/student`: `Bienvenido, Test Participant`, no matched English dashboard phrases.
  - `/es/student/events`: `Mis eventos`, no matched English student-events phrases.
- [x] `/es/onboarding` copy path updated by code review: terms/privacy connector now uses translated `onboarding.and`; stepper buttons use translated common labels.
- [x] `/es/student/profile` primary copy translated by code review.
- [x] `/es/events/[id]` event detail/registration shell translated by code review.
- [x] Explicit `/en` is preserved in the public navbar by path-based labels.

## Follow-Up Notes

- `pnpm test` was not run because this implementation changed UI copy and display labels only; no services, actions, schemas, or business rules were changed.
- Event titles/descriptions remain in their authored language by design.
- Chapter/admin/company operational translation remains deferred to #103.
- Sponsor-facing English public polish remains deferred to #104.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| This turns into full-app translation | Keep scope to auth/student/events participant path. Defer chapter/admin/company to #103. |
| Missing English message key breaks `/en` | Add matching keys to `messages/en.json` whenever new translation keys are introduced. |
| Translating enum values breaks logic | Only translate display labels; keep status keys and route segments unchanged. |
| Route-local direct literals become messy | Use messages for shared/repeated strings; direct literals only for page-local copy. |
| Spanish copy causes button overflow | Use visual/browser smoke on desktop and mobile after implementation. |

## Out Of Scope

- Chapter editor operational translation.
- Admin translation.
- Company portal translation.
- Sponsor-facing English public copy polish.
- New database/schema/service work.
- Full bilingual authenticated app guarantee.
