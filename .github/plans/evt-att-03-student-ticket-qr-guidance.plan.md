# Plan: EVT-ATT-03 Student Ticket QR Guidance and Lifecycle States

## Summary

Improve the student "My events" ticket experience so registered students see a clearly labeled event check-in code, compact arrival guidance, and add-to-calendar actions. Reuse the lifecycle and calendar foundation from EVT-ATT-01 while leaving the check-in scanner behavior untouched.

## User Story

As a registered student  
I want my QR ticket page to explain what code to show, what status I am in, and what to do if QR scanning fails  
So that event-day check-in is faster and less stressful.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Student events page, ticket cards, event calendar actions |
| GitHub Issue | EVT-ATT-03 |

---

## Patterns to Follow

### Existing Student Ticket Page

```tsx
// SOURCE: app/[locale]/student/events/page.tsx
function CurrentTicket({ registration, qrDataUrl }: { registration: RegistrationWithEvent; qrDataUrl: string | null }) {
  return (
    <Card className="rounded-lg">
      ...
    </Card>
  )
}
```

### Calendar Action Component

```tsx
// SOURCE: components/events/event-calendar-actions.tsx
<EventCalendarActions event={calendarEvent} layout="stack" />
```

### UI/UX Guidance

```md
// SOURCE: docs/handbook/UI_UX.md
Student surfaces: encouraging and clear; use friendly guidance, but keep profile, event, and chapter status easy to scan.
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `components/events/event-day-guidance.tsx` | CREATE | Reusable compact check-in guidance |
| `components/events/index.ts` | UPDATE | Export event-day guidance |
| `app/[locale]/student/events/page.tsx` | UPDATE | Add QR label, guidance, calendar actions, and lifecycle copy |

---

## Tasks

### Task 1: Create Event-Day Guidance Component

- **File**: `components/events/event-day-guidance.tsx`
- **Action**: CREATE
- **Implement**:
  - Compact guidance list with event QR validity, brightness, and manual search fallback.
  - Optional `compact` prop for sidebars/ticket cards.
- **Mirror**: existing small event components in `components/events`.
- **Validate**: `pnpm run lint`

### Task 2: Improve QR Panel and Ticket Cards

- **File**: `app/[locale]/student/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Label QR as "Codigo de check-in del evento".
  - Add guidance below QR for current ticket and active tickets.
  - Use lifecycle helper for message derivation.
  - Add `EventCalendarActions` for registered future tickets.
  - Ensure pending/rejected/cancelled/attended cards do not imply QR validity.
- **Mirror**: existing `CurrentTicket` and `EventRegistrationCard` layout.
- **Validate**: `pnpm run lint`

### Task 3: Validate Helper Tests

- **Action**: RUN
- **Implement**:
  - Re-run helper tests to ensure lifecycle/calendar behavior remains stable.
- **Validate**: `pnpm test -- lib/events/__tests__/lifecycle.test.ts lib/events/__tests__/calendar.test.ts`

---

## Validation

```bash
pnpm run lint
pnpm test -- lib/events/__tests__/lifecycle.test.ts lib/events/__tests__/calendar.test.ts
```

---

## Acceptance Criteria

- [x] Registered future tickets label the QR as an event check-in code.
- [x] QR guidance explains brightness, event-specific validity, and manual fallback.
- [x] Calendar actions appear for registered future tickets.
- [x] Pending/rejected/cancelled/attended states do not imply valid QR access.
