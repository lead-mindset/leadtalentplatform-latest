# Plan: Issue #94 Audit Primary LEAD Screens With Codex Visual Loop

## Summary

Run a baseline visual audit for LEAD before any design-system implementation. This issue captures desktop and mobile screenshots for the primary public, student, chapter editor, admin, and company representative routes, then produces a Vera-style audit matrix that separates critical, major, minor, and positive findings. It must not change global CSS, Shadcn primitives, shells, or page styling.

## Implementation Status

- [x] Freeze current state and include the current local `/events` patch in the baseline notes.
- [x] Verify local app and Supabase readiness.
- [x] Capture desktop and mobile screenshots under `tmp/visual-audit/issue-94/baseline/`.
- [x] Run lightweight browser and click-path checks.
- [x] Produce `tmp/visual-audit/issue-94/audit-report.md`.
- [x] Comment #94 with evidence and next-step recommendation.

## User Story

As the LEAD product owner,
I want a complete visual baseline and UX audit before design-system changes,
So that we improve the product from evidence instead of isolated taste-based page edits.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #94 |
| Type | SPIKE / AUDIT |
| Complexity | Medium |
| Systems Affected | Public, student, chapter, admin, company routes; screenshot tooling; audit docs |
| Source PRD | `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md` |
| Output | Local screenshot matrix and audit report |
| Commit Rule | Do not commit unless product owner explicitly approves |

---

## Scope

### In Scope

- Freeze current git state.
- Decide whether the current uncommitted `/events` patch is included in the baseline.
- Run or use the local app.
- Capture desktop `1440x1100` and mobile `390x1200` screenshots.
- Use seeded personas for authenticated routes.
- Create a structured audit report.
- Comment on #94 with summary and evidence paths, not private screenshots with sensitive data.

### Out Of Scope

- Editing `app/[locale]/globals.css`.
- Editing `components/ui/*`.
- Editing route layouts or page styling.
- Fixing the discovered issues.
- Committing screenshot artifacts.
- Committing any code changes without approval.

---

## Current Working State

Before implementation, verify:

- `app/[locale]/events/page.tsx` has an uncommitted visual-loop patch from the prior events page pass.
- `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md` is untracked.
- `.github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md` is untracked.
- `.github/plans/lead-cohesive-ui-ux-system-visual-audit.plan.md` is untracked.
- `.agents/`, `.codex/`, `.qa-backups/`, and `tmp/` are local artifacts and should remain unstaged.

Decision needed at Task 1:

- **Recommended baseline**: keep the current `/events` patch in place while capturing screenshots, but clearly note that `/events` is not a pure pre-change baseline. This preserves the user-approved visual-loop exploration and avoids destructive revert.

---

## Personas

Use seed personas from `docs/handbook/TESTING.md`.

| Persona | Email | Password | Routes |
|---------|-------|----------|--------|
| Public | none | none | `/en`, `/en/events`, event detail, about/faq/partner/auth |
| Participant | `participant@test.com` | `password123` | `/en/student`, `/en/student/events`, `/en/student/profile`, `/en/student/resume` |
| Editor | `editor@test.com` | `password123` | `/en/chapter`, `/en/chapter/events`, members, check-in, applications |
| Admin | `admin@test.com` | `password123` | `/en/admin`, users, chapters, events, companies, invites, activity |
| Company Representative | `recruiter@test.com` | `password123` | `/en/company/dashboard`, browse, saved, profile, student detail |

If a seeded route is not accessible because local Supabase/dev data is not ready, record it as a blocker in the audit report instead of changing implementation.

---

## Routes To Capture

### Public

- `/en`
- `/en/events`
- first available `/en/events/[id]`
- `/en/about`
- `/en/faq`
- `/en/partner-info`
- `/en/auth/login`
- `/en/auth/sign-up`

### Participant / Student

- `/en/student`
- `/en/student/events`
- `/en/student/profile`
- `/en/student/resume`
- `/en/onboarding` if reachable with a fresh test account or known incomplete account; otherwise document as auth-state dependent.

### Chapter Editor

- `/en/chapter`
- `/en/chapter/events`
- `/en/chapter/events/new`
- first available `/en/chapter/events/[id]`
- first available `/en/chapter/events/[id]/applications`
- first available `/en/chapter/events/[id]/checkin`
- `/en/chapter/members`
- `/en/chapter/checkin`

### Admin

- `/en/admin`
- `/en/admin/users`
- first available `/en/admin/users/[id]`
- `/en/admin/chapters`
- first available `/en/admin/chapters/[id]`
- `/en/admin/events`
- `/en/admin/companies`
- `/en/admin/invites`
- `/en/admin/activity`

### Company Representative

- `/en/company/dashboard`
- `/en/company/browse`
- `/en/company/saved`
- first available `/en/company/students/[id]`
- `/en/company/profile`
- `/en/company/access-help` if route exists; otherwise document as missing/renamed.

---

## Audit Rubric

Score each route with:

| Lens | Question |
|------|----------|
| Primary action | Can the next action be identified in 2 seconds? |
| Cognitive load | Are there too many equally weighted choices? |
| Spacing and grouping | Are related elements grouped and separated with a consistent rhythm? |
| Component consistency | Do buttons, cards, badges, tables, and forms behave like one system? |
| Accessibility | Are contrast, target size, focus states, and labels acceptable? |
| Mobile fit | Does text wrap/truncate intentionally without overlap or horizontal chaos? |
| Status clarity | Are pending, approved, rejected, registered, application required, invited, revoked, and active states visually consistent? |
| Role clarity | Does the screen match the role without becoming a separate product? |

Severity:

- Critical: blocks task completion or access.
- Major: causes confusion, friction, or serious inconsistency.
- Minor: polish or visual refinement.
- Positive: keep and reuse.

---

## Files To Create

| File / Folder | Action | Purpose |
|---------------|--------|---------|
| `tmp/visual-audit/issue-94/baseline/...` | CREATE LOCAL | Desktop/mobile screenshots; do not commit |
| `tmp/visual-audit/issue-94/audit-report.md` | CREATE LOCAL | Detailed Vera audit report; do not commit unless requested |
| `.github/plans/issue-94-audit-primary-lead-screens-visual-loop.plan.md` | CREATE | This plan |

---

## Tasks

### Task 1: Freeze Current State

- **Action**: REVIEW
- **Implement**:
  - Run `git status --short --branch`.
  - Run `git diff -- app/[locale]/events/page.tsx`.
  - Record whether `/events` baseline includes the current uncommitted patch.
- **Validate**: No code changes.

### Task 2: Verify Local App And Data Readiness

- **Action**: VERIFY
- **Implement**:
  - Confirm local app responds at `http://localhost:3000/en`.
  - If needed, start `pnpm dev`.
  - Confirm Supabase local seed personas can log in, or record blocker.
  - Determine first event/admin/chapter/company record IDs needed for detail pages.
- **Validate**: Public homepage and `/en/events` return HTTP 200.

### Task 3: Build Screenshot Runner

- **Action**: CREATE LOCAL SCRIPT OR INLINE RUNNER
- **Implement**:
  - Use Playwright from existing dev dependency.
  - Capture desktop and mobile screenshots per route.
  - Use separate browser contexts for public, participant, editor, admin, and company.
  - Log failed routes and continue.
- **Validate**: Screenshot output folders are created under `tmp/visual-audit/issue-94/baseline`.

### Task 4: Capture Public Screens

- **Action**: CAPTURE
- **Implement**:
  - Capture public route list at desktop and mobile.
  - Include auth pages.
  - Include first event detail page.
- **Validate**: At least one screenshot per public route per viewport, or blocker logged.

### Task 5: Capture Authenticated Role Screens

- **Action**: CAPTURE
- **Implement**:
  - Log in as participant, editor, admin, and company representative.
  - Capture listed routes for each role.
  - Use current seeded data; do not mutate workflows unless navigation requires opening existing records.
- **Validate**: Screenshots exist or blockers logged for each role route.

### Task 6: Run Lightweight Browser Checks

- **Action**: VERIFY
- **Implement**:
  - Run mobile horizontal overflow checks for representative pages.
  - Click one primary navigation path for each role.
  - Record obvious auth or routing failures.
- **Validate**: Findings logged in audit report.

### Task 7: Produce Vera Audit Report

- **Action**: CREATE LOCAL REPORT
- **Implement**:
  - Create `tmp/visual-audit/issue-94/audit-report.md`.
  - Include executive summary, risk level, findings counts, and route matrix.
  - Separate critical, major, minor, and positive findings.
  - Identify system-level themes to feed #95 and #96.
- **Validate**: Report clearly names next issue handoff: #95 design decisions.

### Task 8: Update GitHub Issue #94

- **Action**: GITHUB COMMENT
- **Implement**:
  - Comment on #94 with:
    - screenshot folder path
    - audit report path
    - findings summary
    - blockers
    - recommended next issue
  - Do not upload sensitive screenshots unless reviewed.
- **Validate**: #94 has evidence comment.

---

## Validation

Issue #94 is complete when:

```bash
git status --short --branch
```

confirms no accidental tracked implementation edits beyond pre-existing/unapproved work, and the following exist locally:

```text
tmp/visual-audit/issue-94/baseline/
tmp/visual-audit/issue-94/audit-report.md
```

No `pnpm test` is required unless the audit process changes code. No commit is required.

---

## Acceptance Criteria Mapping

- [ ] Desktop and mobile screenshots captured for primary public, student, chapter, admin, and company routes.
- [ ] Seeded personas used for auth-only routes where local data allows.
- [ ] Every captured route scored with the Vera audit rubric.
- [ ] Critical, major, minor, and positive findings separated.
- [ ] Temporary screenshots remain local unless explicitly approved.
- [ ] #94 commented with evidence and recommended next step.
