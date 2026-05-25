# Plan: EVT-ATT-01 Event Lifecycle and Calendar Foundation

## Summary

Create small, tested event helper modules for lifecycle state derivation and calendar payload generation. These helpers will let event detail, registration confirmation, and student ticket surfaces share state labels and calendar behavior without changing existing event service or action contracts.

## User Story

As a platform maintainer  
I want event lifecycle and calendar behavior to be derived from shared helpers  
So that public event detail, registration confirmation, and student ticket surfaces use consistent states and calendar data.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Events UI helpers, tests |
| GitHub Issue | EVT-ATT-01 |

---

## Patterns to Follow

### Existing Event Helper Naming

```ts
// SOURCE: lib/events/share.ts
export function getCanonicalEventSharePath(eventId: string) {
  return `/${CANONICAL_EVENT_SHARE_LOCALE}/events/${eventId}`
}
```

### Existing Event Helper Tests

```ts
// SOURCE: lib/events/__tests__/share.test.ts
describe('event share helpers', () => {
  it('builds the canonical Spanish event share path', () => {
    expect(getCanonicalEventSharePath('event-123')).toBe('/es/events/event-123')
  })
})
```

### UI/UX State Semantics

```md
// SOURCE: docs/handbook/UI_UX.md
Badges are for status, role, counts, and compact metadata. They are not decoration.
Domain status mapping should drive badge color and label.
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/events/lifecycle.ts` | CREATE | Shared lifecycle derivation for event and registration UI states |
| `lib/events/calendar.ts` | CREATE | Shared calendar URL and `.ics` helpers |
| `lib/events/__tests__/lifecycle.test.ts` | CREATE | Validate lifecycle states |
| `lib/events/__tests__/calendar.test.ts` | CREATE | Validate calendar output |

---

## Tasks

### Task 1: Create Lifecycle Helper

- **File**: `lib/events/lifecycle.ts`
- **Action**: CREATE
- **Implement**:
  - Define `EventLifecycleState` union.
  - Define a minimal event input shape with `startAt`, `endAt`, `accessModel`, `capacity`, `registeredCount`, and optional `registrationStatus`.
  - Export `getEventLifecycle(input, now?)`.
  - Return label, description, badge variant, registration availability, and QR validity.
- **Mirror**: `lib/events/share.ts` for small named exports.
- **Validate**: `pnpm test -- lib/events/__tests__/lifecycle.test.ts`

### Task 2: Create Calendar Helper

- **File**: `lib/events/calendar.ts`
- **Action**: CREATE
- **Implement**:
  - Define `CalendarEventInput`.
  - Export `getGoogleCalendarUrl(input)`.
  - Export `getIcsFileName(title)`.
  - Export `getIcsContent(input)`.
  - Escape `.ics` text safely for commas, semicolons, backslashes, and newlines.
- **Mirror**: `lib/events/share.ts` for deterministic helper style.
- **Validate**: `pnpm test -- lib/events/__tests__/calendar.test.ts`

### Task 3: Add Focused Tests

- **File**: `lib/events/__tests__/lifecycle.test.ts`
- **Action**: CREATE
- **Implement**:
  - Cover registration open, application required, full, live, past, registered, pending, rejected, cancelled, attended.
- **File**: `lib/events/__tests__/calendar.test.ts`
- **Action**: CREATE
- **Implement**:
  - Cover Google Calendar URL fields, `.ics` date formatting, text escaping, and filename normalization.
- **Validate**: `pnpm test -- lib/events/__tests__/lifecycle.test.ts lib/events/__tests__/calendar.test.ts`

---

## Validation

```bash
pnpm test -- lib/events/__tests__/lifecycle.test.ts lib/events/__tests__/calendar.test.ts
pnpm run lint
```

---

## Acceptance Criteria

- [x] Lifecycle helper returns stable student-facing states for event and registration combinations.
- [x] Calendar helper returns valid Google Calendar URL and `.ics` content.
- [x] Focused tests pass.
- [x] No service/action contracts changed.
