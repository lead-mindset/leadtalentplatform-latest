# Plan: Issue #210 - Fix Open Event Registration And Anonymous Registration CTA

GitHub Issue: #210
Source PRD: `.github/PRDs/launch-user-flow-qa-fixes.prd.md`
Type: Bug / Events
Complexity: Medium

## Summary

Open event registration currently calls `redirect()` from a server action used with `useActionState`, which can leave the submit button in a pending state instead of landing the user on a stable QR or registered state. Keep registration logic in the existing service, but change the action contract to return an explicit localized success path and let the client perform the navigation. Preserve duplicate and cancelled-registration behavior already handled by `EventService.registerForEvent`.

## Implementation Status

- [x] Task 1: Replace action redirect throws with a success state.
- [x] Task 2: Navigate from the checkout client after success.
- [x] Task 3: Add focused action regression tests.
- [x] Task 4: Validate focused and repo-wide checks.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Service logic | `lib/services/event.service.ts` | Handles active duplicate rows, cancelled-row revival, capacity races, and newsletter opt-in. |
| Thin action | `lib/actions/events/register.ts` | Authenticates, validates preflight/event, delegates to service, revalidates paths. |
| Checkout UI | `components/events/event-registration-checkout.tsx` | Uses `useActionState` for form state and visible inline errors. |
| Tests | `lib/actions/events/__tests__/delete-event.test.ts` | Mocks action dependencies and asserts service calls. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/actions/events/register.ts` | Update | Return `{ success: true, redirectPath }` instead of throwing a redirect in the `useActionState` path. |
| `components/events/event-registration-checkout.tsx` | Update | Push the returned route and display an intermediate success state instead of indefinite pending. |
| `lib/actions/events/__tests__/register.test.ts` | Create | Cover success redirect, auth/profile/validation/service failures, and subscription opt-in argument. |

## Tasks

### Task 1: Return Success State From Registration Action

- Remove `redirect()` and `isRedirectError` usage from `registerForEvent`.
- Keep request-locale detection via `headers()`.
- On service success, revalidate public event and student event paths.
- Return `{ success: true, redirectPath: "/{locale}/student/events?event={eventId}" }`.

### Task 2: Client-Side Navigation

- In `EventRegistrationCheckout`, watch for `state.success && state.redirectPath`.
- Use the Next router to push the returned path.
- Disable submit controls and show a QR/registered transition label while navigation is in progress.
- Keep anonymous and onboarding CTA links intact.

### Task 3: Regression Tests

- Mock `requireUser`, `headers`, `revalidatePath`, registration preflight, and `EventService`.
- Assert successful registration returns the localized redirect path.
- Assert preflight, validation, and service failures return visible error state and do not redirect.

### Task 4: Validate

```bash
pnpm exec vitest run lib/actions/events/__tests__/register.test.ts lib/services/__tests__/event.service.test.ts
pnpm run lint
pnpm exec tsc --noEmit
pnpm test
```

## Acceptance Criteria Mapping

- Logged-in member registration returns a stable success path after creating, reviving, or accepting an active registration.
- Duplicate active registrations do not produce a fresh failed CTA because the service returns success and the client navigates to the QR route.
- Anonymous CTA continues to point to the localized login route through `next-intl` routing.
- Auth, onboarding, capacity, validation, or RLS failures return visible errors instead of indefinite pending.
