# Plan: LEAD-075 Public Event Discovery And Event Detail Redesign

## Summary

Redesign public event discovery and event detail around the canonical UI/UX handbook from LEAD-074. The implementation should remove the disconnected `LEAD Frontier` one-off visual direction, preserve event services/actions/auth routing, and make event type, host chapter, date/time, availability, application/registration state, and next action scannable on mobile and desktop.

## User Story

As a public participant or student,
I want to quickly understand LEAD events and what action I can take,
So that I can browse, register, apply, or complete onboarding without confusion.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #75 |
| Type | Enhancement / UI |
| Complexity | Medium |
| Phase | Active PIV Loop |
| Systems Affected | Public events, event detail, registration/apply UI, loading/error states |
| Behavior Scope | Preserve existing service/action/auth behavior |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Public pages use top navigation.
- Public pages may be spacious and visual, but must still use the unified LEAD product system.
- Use `components/ui` primitives instead of one-off page styling when possible.
- Event discovery and event detail are mobile-first workflows.
- Primary action must reflect current event and user state.
- Status badge semantics must be consistent.
- Loading, empty, error, unauthorized, success, and mobile overflow states must be accounted for.

## Codebase Patterns To Follow

### Public Route Shell

Sources:

- `app/[locale]/events/page.tsx`
- `app/[locale]/events/[id]/page.tsx`
- `app/[locale]/(public)/_components/navbar.tsx`
- `components/global/main-container.tsx`

Pattern:

- Public event routes already use the public `Navbar`.
- Keep this top-nav shell and avoid introducing authenticated sidebar behavior.

### Event Data Fetching

Sources:

- `lib/actions/events/get-data.ts`
- `lib/services/event.service.ts`

Pattern:

- `getPublishedEvents()` and `getEventById()` are thin server actions over `EventService`.
- Do not move data fetching into client components.
- Do not alter event service behavior for this UI issue.

### Event Detail Auth And Profile Gates

Sources:

- `app/[locale]/events/[id]/page.tsx`
- `lib/actions/events/register.helpers.ts`
- `components/events/event-registration-checkout.tsx`
- `lib/actions/events/register.ts`

Pattern:

- Event detail already computes `isLoggedIn`, `hasBasicProfile`, `myRegistration`, and `onboardingUrl`.
- `EventRegistrationCheckout` preserves unauthenticated login routing and onboarding routing.
- Keep registration/application mutations delegated to existing actions.

### Application Flow

Sources:

- `components/events/apply-modal.tsx`
- `lib/actions/events/register.ts`
- `lib/services/event-application.service.ts`

Pattern:

- Native event application questions are submitted through `ApplyModal` and `applyForEvent`.
- Preserve application answer validation and newsletter checkbox behavior.

### Existing UI To Refactor

Sources:

- `app/[locale]/events/page.tsx`
- `app/[locale]/events/[id]/_components/EventContent.tsx`
- `app/[locale]/events/loading.tsx`
- `app/[locale]/events/[id]/loading.tsx`
- `app/[locale]/events/[id]/error.tsx`
- `components/events/event-registration-checkout.tsx`

Observed issues:

- Discovery currently uses a disconnected `LEAD Frontier` hero/calendar/map visual system.
- Event list cards use heavy custom styling and static widgets that do not directly support registration decisions.
- Event detail uses oversized title/image treatment and a custom registration card that can bury status/next action.
- Loading states should be aligned with the new page anatomy.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/events/page.tsx` | UPDATE | Redesign discovery page around unified event browsing, scannable cards, filters/search placement, empty state, and public shell. |
| `app/[locale]/events/[id]/_components/EventContent.tsx` | UPDATE | Redesign event detail around status, host, date/location, primary action, application/registration state, and mobile CTA clarity. |
| `components/events/event-registration-checkout.tsx` | UPDATE | Lightly align checkout presentation with the new detail layout while preserving action behavior. |
| `app/[locale]/events/loading.tsx` | UPDATE | Align discovery loading skeleton with redesigned page anatomy. |
| `app/[locale]/events/[id]/loading.tsx` | UPDATE | Align detail loading skeleton with redesigned page anatomy. |
| `app/[locale]/events/[id]/error.tsx` | UPDATE | Align error state with handbook state patterns. |
| `.github/plans/lead-075-public-event-discovery-detail-redesign.plan.md` | UPDATE | Track task completion and validation evidence. |

## Tasks

### Task 1: Redesign Public Event Discovery

- **File**: `app/[locale]/events/page.tsx`
- **Action**: UPDATE
- **Status**: Completed
- **Implement**:
  - Remove the disconnected `LEAD Frontier` hero, fake calendar widget, fake map widget, and one-off decorative styling.
  - Use a clear public page header: title, concise context, and event count/availability summary.
  - Show event cards/lists that make event type, host chapter, date/time, location/modality, capacity/availability, access model, and next action scannable.
  - Keep events clickable to `/events/[id]`.
  - Use `Badge`, `Button`, `Card`, `Input`, and shared icon patterns where appropriate.
  - Keep mobile-first layout with no CTA/status overlap.
- **Mirror**: `docs/handbook/UI_UX.md` public shell, page anatomy, cards/lists, status semantics, and mobile rules.
- **Validate**: `pnpm build`

### Task 2: Redesign Event Detail Layout

- **File**: `app/[locale]/events/[id]/_components/EventContent.tsx`
- **Action**: UPDATE
- **Status**: Completed
- **Implement**:
  - Preserve existing props and behavior: `event`, `myRegistration`, `applicationQuestions`, `isLoggedIn`, `hasBasicProfile`, and `onboardingUrl`.
  - Reframe the page around event status and next action near the top.
  - Make registration-open, application-required, live, past, full, registered, pending review, rejected, and cancelled states visually clear.
  - Show host chapter and collaborators clearly without decorative-only host blocks.
  - Keep event cover media supportive, not dominant over status/action clarity.
  - Keep application modal behavior unchanged.
  - Keep mobile primary CTA/status reachable without overlap.
- **Mirror**: existing `EventRegistrationCheckout` behavior and `docs/handbook/UI_UX.md` event/status rules.
- **Validate**: `pnpm build`

### Task 3: Align Registration Checkout Presentation

- **File**: `components/events/event-registration-checkout.tsx`
- **Action**: UPDATE
- **Status**: Completed
- **Implement**:
  - Preserve `registerForEvent` action usage, hidden `eventId`, newsletter checkbox, mobile sticky submit, QR link, cancellation dialog, login link, and onboarding link.
  - Improve copy/status presentation only where needed to match the redesigned detail page.
  - Do not change registration or newsletter business logic.
- **Mirror**: current component behavior and `docs/handbook/UI_UX.md` standard states.
- **Validate**: `pnpm build`

### Task 4: Align Loading And Error States

- **Files**:
  - `app/[locale]/events/loading.tsx`
  - `app/[locale]/events/[id]/loading.tsx`
  - `app/[locale]/events/[id]/error.tsx`
- **Action**: UPDATE
- **Status**: Completed
- **Implement**:
  - Match skeletons to the redesigned page header/card/detail anatomy.
  - Keep error state concise with a retry action.
  - Avoid layout jumps and decorative loading placeholders.
- **Mirror**: `docs/handbook/UI_UX.md` loading and error state guidance.
- **Validate**: `pnpm build`

### Task 5: Validate And Update GitHub

- **File**: GitHub issue #75
- **Action**: UPDATE
- **Status**: Completed
- **Implement**:
  - Run `pnpm build`.
  - Run `pnpm lint` if build passes or if CSS/class changes create lint risk.
  - Optionally run focused event tests if behavior code is touched. If only presentation is touched, cite build/lint.
  - Add a GitHub comment with changed files and validation.
  - Add `has-plan`.
  - Close #75 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 75 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation after implementation:

```bash
pnpm build
pnpm lint
```

Optional if behavior code changes:

```bash
pnpm vitest run lib/services/__tests__/event.service.test.ts lib/services/__tests__/event-application.service.test.ts lib/actions/events/__tests__/register.helpers.test.ts
```

Visual QA expectation:

- Desktop: `/events`, `/events/[id]`
- Mobile: `/events`, `/events/[id]`
- Confirm long title/chapter/location text wraps or truncates intentionally.
- Confirm primary CTA/status remains reachable on mobile.

## Acceptance Criteria Mapping

- [x] Discovery cards/lists show event type, host chapter, date/time, availability, and next action.
- [x] Event detail makes registration-open, application-required, live, and past states visually clear.
- [x] Unauthenticated register/apply still routes to login.
- [x] Authenticated users without basic profile still route to onboarding.
- [x] Mobile discovery/detail keep primary CTA and status visible without overlap.

## Validation Results

- `pnpm build` passed.
- `pnpm lint` passed with existing warnings; no errors.
- Local page load checks passed:
  - `http://127.0.0.1:3000/en/events` -> 200
  - `http://127.0.0.1:3000/en/events/not-a-real-event` -> 200

## Out Of Scope

- Event service changes.
- Registration or application business logic changes.
- Database/schema/RLS changes.
- Auth route changes.
- Chapter editor event management redesign.
- Student QR/status page redesign; that belongs to #77.

## Recommended Next Step

Implement this plan, preserving behavior first and improving event presentation second. After #75 closes, proceed to #76 basic onboarding/profile completion.
