# Plan: Chapter Discovery Visual QA and Accessibility Gate

## Summary

Implement #159 by running a browser-based QA pass for the new public chapter discovery surfaces: `/chapters` and at least one `/chapter/[id]` profile. The work will produce local evidence, screenshots, and a concise report covering responsive layout, CTAs, links, public-safe data display, and accessibility basics.

## User Story

As the LEAD platform owner,
I want visual and accessibility evidence for the chapter discovery pages,
So that we know the new public student-facing experience is safe to review and continue iterating.

## Metadata

| Field | Value |
| --- | --- |
| GitHub Issue | #159 |
| Type | VALIDATION |
| Complexity | MEDIUM |
| Systems Affected | Public chapter directory, public chapter profile, QA evidence |
| Status | Completed |

## Patterns to Follow

| Category | Source | Pattern |
| --- | --- | --- |
| Visual QA | `docs/handbook/UI_UX.md` | Run app, screenshot, visually review, click/test, revise if needed, recheck. |
| Browser QA | `browser-qa` skill | Capture desktop/mobile screenshots, check console/network, links, overflow, and accessibility basics. |
| Prior reports | `.github/reports/events-page-luma-phase-1-visual-qa-report.md` | Save evidence as a local markdown report with verdict and paths. |

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `.github/reports/chapter-discovery-visual-qa-report.md` | CREATE | Store QA findings, screenshot paths, and validation notes. |
| `.github/plans/chapter-discovery-visual-qa-accessibility-gate.plan.md` | UPDATE | Track task completion and validation. |
| Chapter UI files | UPDATE IF NEEDED | Apply small fixes only if QA reveals blockers. |

## Tasks

### Task 1: Start Local App

- [x] **Action**: Run the app locally on an available port.
- [x] **Validate**: `/es/chapters` responds.

### Task 2: Capture Directory Evidence

- [x] **Action**: Use Playwright to capture desktop and mobile screenshots for `/es/chapters`.
- [x] **Validate**: No horizontal overflow, cards are scannable, CTAs are visible.

### Task 3: Capture Profile Evidence

- [x] **Action**: Open at least one chapter profile from the directory if data exists, otherwise use a known route and document sparse-data limits.
- [x] **Validate**: Hero, events, team/community preview, stats, and footer render without overlap.

### Task 4: Interaction and Public-Safety Checks

- [x] **Action**: Click chapter cards and event links when present; inspect visible text for private emails.
- [x] **Validate**: Links route to expected public pages and no member emails appear.

### Task 5: Accessibility Review

- [x] **Action**: Check heading order, actionable labels, alt text, focusable elements, and coarse contrast/readability.
- [x] **Validate**: Document findings and any residual risks.

### Task 6: Report and GitHub Update

- [x] **Action**: Write report, update this plan, comment on #159, and close #159 if no blockers remain.

## Acceptance Criteria

- [x] Visual QA covers at least one chapter profile with events and one sparse/no-event state when data is available.
- [x] Visual QA covers the chapter directory on desktop and mobile.
- [x] No horizontal overflow appears on mobile widths.
- [x] CTAs are visible, clear, and do not imply unavailable flows.
- [x] Event links route correctly to public event detail pages when events are present.
- [x] Public pages do not expose private member emails or unapproved members.
- [x] Accessibility review covers heading order, focus states, contrast, alt text, and actionable labels.
- [x] Evidence is recorded in a local report or GitHub issue comment.

## Validation Results

- Playwright QA passed for `/es/chapters` desktop/mobile.
- Playwright QA passed for active profile `/es/chapter/leadpucp` desktop/mobile.
- Playwright QA passed for sparse profile `/es/chapter/leadtecsup` mobile.
- `pnpm test -- chapter-profile.service` passed.
- `pnpm lint` passed with pre-existing warnings and no errors.
- Report written to `.github/reports/chapter-discovery-visual-qa-report.md`.
