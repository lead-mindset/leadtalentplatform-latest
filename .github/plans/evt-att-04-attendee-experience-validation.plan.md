# Plan: EVT-ATT-04 Attendee Experience Validation

## Summary

Validate the event attendee experience changes through focused tests, lint/build checks, event operations readiness, and rendered desktop/mobile review. Produce an implementation report with command results, files changed, known warnings, and remaining risk.

## User Story

As a platform maintainer  
I want the improved attendee experience validated through automated checks and visual review  
So that the shipped flow is both operationally safe and visually polished.

## Metadata

| Field | Value |
|-------|-------|
| Type | TECHNICAL |
| Complexity | MEDIUM |
| Systems Affected | Events UI, event operations validation, QA reporting |
| GitHub Issue | EVT-ATT-04 |

---

## Patterns to Follow

### Event Ops Readiness Baseline

```md
// SOURCE: tmp/event-ops-132/event-ops-readiness-report.md
Event ops readiness: passed (8/8 flows)
```

### UI/UX Visual Loop

```md
// SOURCE: docs/handbook/UI_UX.md
prompt -> build -> run -> screenshot -> visual review -> click/test -> revise -> recheck
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/reports/evt-att-04-attendee-experience-validation-report.md` | CREATE | Validation evidence and remaining risks |

---

## Tasks

### Task 1: Run Automated Validation

- **Action**: RUN
- **Implement**:
  - Run focused helper tests.
  - Run lint.
  - Run build.
  - Run event ops readiness.
- **Validate**: Record pass/fail and warning notes in report.

### Task 2: Run Rendered UI Review

- **Action**: RUN
- **Implement**:
  - Start local dev server if needed.
  - Inspect event detail and student events routes where accessible.
  - Use desktop and mobile viewport notes.
- **Validate**: Record visible layout issues or access blockers.

### Task 3: Write Validation Report

- **File**: `.github/reports/evt-att-04-attendee-experience-validation-report.md`
- **Action**: CREATE
- **Implement**:
  - Summarize work implemented across EVT-ATT-01 through EVT-ATT-03.
  - Record commands and results.
  - Record visual QA outcome and known limitations.
  - List unrelated dirty files excluded from this work.

---

## Validation

```bash
pnpm test -- lib/events/__tests__/lifecycle.test.ts lib/events/__tests__/calendar.test.ts
pnpm run lint
pnpm run build
pnpm run event-ops:readiness
```

---

## Acceptance Criteria

- [x] Tests pass.
- [x] Lint has no new errors.
- [x] Build passes or blockers are documented.
- [x] Event ops readiness passes.
- [x] Visual QA notes are captured.
- [x] Report is written.
