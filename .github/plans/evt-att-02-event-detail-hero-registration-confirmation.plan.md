# Plan: EVT-ATT-02 Event Detail Hero and Registration Confirmation

## Summary

Redesign the public event detail experience so students see the event identity, host, logistics, availability, and next action in a stronger first viewport. Add a reusable calendar action component and wire registration success copy so students get a clearer "you are registered" moment with QR and calendar next steps.

## User Story

As a student  
I want the event detail page to show the event identity, host, date, location, availability, and main action immediately  
So that I can trust the event and know what to do next.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | HIGH |
| Systems Affected | Public event detail, registration checkout, calendar UI |
| GitHub Issue | EVT-ATT-02 |

---

## Patterns to Follow

### Public Surface Hierarchy

```md
// SOURCE: docs/handbook/UI_UX.md
Public surfaces: visual, warmer, and more spacious; use imagery and expressive calls to action where they support mission and event discovery.
```

### Existing Registration Checkout State

```tsx
// SOURCE: components/events/event-registration-checkout.tsx
if (state?.success && state.redirectPath) {
  router.push(state.redirectPath)
}
```

### Existing Share Button Client Pattern

```tsx
// SOURCE: components/events/event-share-button.tsx
export function EventShareButton({ eventId, eventTitle, ...buttonProps }: EventShareButtonProps) {
  async function handleShare() {
    const url = getCanonicalEventShareUrl(eventId, window.location.origin)
  }
}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `components/events/event-calendar-actions.tsx` | CREATE | Reusable Google Calendar and `.ics` controls |
| `components/events/index.ts` | UPDATE | Export calendar actions |
| `components/events/event-registration-checkout.tsx` | UPDATE | Show clearer registration success and calendar actions |
| `app/[locale]/events/[id]/_components/EventContent.tsx` | UPDATE | Redesign first viewport hero and use lifecycle helper |

---

## Tasks

### Task 1: Create Calendar Actions Component

- **File**: `components/events/event-calendar-actions.tsx`
- **Action**: CREATE
- **Implement**:
  - Client component that uses `getGoogleCalendarUrl`, `getIcsContent`, and `getIcsFileName`.
  - Supports `layout="stack" | "inline"` and optional `className`.
  - Opens Google Calendar in a new tab.
  - Downloads `.ics` through a Blob.
- **Mirror**: `components/events/event-share-button.tsx` client action style.
- **Validate**: `pnpm run lint`

### Task 2: Add Registration Success Confirmation

- **File**: `components/events/event-registration-checkout.tsx`
- **Action**: UPDATE
- **Implement**:
  - Accept event start/end/location/meeting/detail data needed for calendar actions.
  - When `state.success && state.redirectPath`, show a success panel with "Registro confirmado", "Ver mi codigo QR", and calendar actions while redirect is pending.
  - Keep existing redirect behavior.
  - Keep logged-out, onboarding, full, closed, cancelled, and registered states intact.
- **Mirror**: existing state and mobile sticky CTA structure.
- **Validate**: `pnpm run lint`

### Task 3: Redesign Event Detail Hero

- **File**: `app/[locale]/events/[id]/_components/EventContent.tsx`
- **Action**: UPDATE
- **Implement**:
  - Use `getEventLifecycle` for top-level lifecycle label/message.
  - Replace the split title-then-card opening with a stronger hero: image/fallback plus event identity and metadata together.
  - Keep the registration card in the sticky aside.
  - Pass calendar props to `EventRegistrationCheckout`.
  - Avoid large decorative one-off UI that conflicts with the LEAD design handbook.
- **Mirror**: existing metadata blocks and `MainContainer` layout.
- **Validate**: `pnpm run lint`

---

## Validation

```bash
pnpm run lint
pnpm test -- lib/events/__tests__/lifecycle.test.ts lib/events/__tests__/calendar.test.ts
```

---

## Acceptance Criteria

- [x] Desktop first viewport shows event identity, host, date/time, location, status, availability, and CTA.
- [x] Mobile layout does not overflow and preserves a clear CTA.
- [x] Successful registration exposes QR and calendar next steps.
- [x] Existing registration/application gating remains intact.
