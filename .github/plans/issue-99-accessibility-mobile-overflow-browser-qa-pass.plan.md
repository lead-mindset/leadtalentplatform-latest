# Plan: Issue #99 Accessibility, Mobile Overflow, And Browser QA Pass

## Summary

Run the quality gate for the cohesive UI/UX system after #96, #97, and #98. This issue verifies the redesigned system rather than redesigning it again. The implementation should use local Playwright/Codex Desktop browser QA to check accessibility basics, keyboard behavior, mobile overflow, role-based click-throughs, console/network health, screenshots, and final validation commands. Production code should only change if the QA pass finds a concrete blocker.

## User Story

As the LEAD product owner,
I want the redesigned system verified across accessibility, mobile, and role workflows,
So that the team can test the app with confidence and without obvious UI regressions.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #99 |
| Type | VALIDATION / QA GATE |
| Complexity | Medium |
| Systems Affected | Public routes, student routes, chapter editor routes, admin routes, company representative routes, Playwright QA artifacts |
| Depends On | #98 Apply cohesive workflow refinements across core routes |
| Source Docs | `docs/handbook/UI_UX.md`, `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md`, `tmp/visual-audit/issue-98/workflow-clickthrough-notes.md` |
| Commit Rule | Commit code/docs only when product owner explicitly asks; keep `tmp/` screenshots local unless requested |

---

## Scope

### In Scope

- Verify mobile screenshots for no broken primary actions, overlap, or unintended horizontal pressure.
- Verify focus states, labels, target sizes, and keyboard behavior for:
  - buttons
  - links
  - forms
  - dialogs
  - menus
  - tabs
  - dense tables/mobile record alternatives
- Click through primary role workflows for:
  - public visitor
  - participant/student
  - chapter editor
  - admin
  - company representative
- Run final validation:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- Capture local evidence under `tmp/visual-audit/issue-99/`.
- Create a concise QA report with pass/fail evidence and any follow-up issues needed.
- Redact or avoid screenshots that expose secrets, service-role keys, personal tokens, or sensitive real personal data.

### Out Of Scope

- Broad visual redesign.
- Schema, auth, service, action, or database changes.
- New production dependencies.
- Committing `tmp/`, `.agents/`, `.codex/`, `.qa-backups/`, or `test-results/`.
- Reworking old legacy route groups unless they block the validated paths.

---

## Current State

- #98 already produced `tmp/visual-audit/issue-98/workflow-clickthrough.spec.cjs`.
- #98 visual notes show desktop/mobile route coverage and `overflow=false` for public, student, chapter, admin, and company paths.
- `@playwright/test` is already installed.
- No axe dependency is currently present in `package.json`.
- `docs/handbook/UI_UX.md` defines the visual product builder loop and route/system expectations.
- Branch `dev` is ahead of `origin/dev` by the three cohesive UI commits:
  - `docs: define cohesive ui ux redesign system`
  - `feat(ui): normalize design primitives and shells`
  - `feat(ui): refine cohesive workflow routes`

---

## Patterns To Follow

| Category | Source | Pattern |
|----------|--------|---------|
| Visual QA script | `tmp/visual-audit/issue-98/workflow-clickthrough.spec.cjs` | Use Playwright, seed persona auth cookies, screenshots, overflow checks, and notes written under `tmp/visual-audit/{issue}`. |
| QA evidence | `tmp/visual-audit/issue-98/workflow-clickthrough-notes.md` | Produce terse route-by-route notes with URL and overflow state. |
| UI contract | `docs/handbook/UI_UX.md` | Validate hierarchy, spacing, contrast, mobile fit, focus, loading/empty/error/success states, and role workflow clarity. |
| Accessibility skill | WCAG 2.2 AA checklist | Prefer native elements, visible focus, 24x24px minimum targets, labels for icon-only controls, modal focus containment, text-based status/error meaning. |
| Browser QA skill | Smoke/interactions/visual/accessibility phases | Combine console/network checks, screenshots, role clicks, keyboard checks, and validation command evidence. |

---

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/issue-99-accessibility-mobile-overflow-browser-qa-pass.plan.md` | CREATE | This implementation plan |
| `tmp/visual-audit/issue-99/qa-gate.spec.cjs` | CREATE LOCAL | Local Playwright QA gate script; do not commit unless explicitly requested |
| `tmp/visual-audit/issue-99/qa-report.md` | CREATE LOCAL | Human-readable evidence report; do not commit unless explicitly requested |
| `tmp/visual-audit/issue-99/*.png` | CREATE LOCAL | Desktop/mobile screenshots; do not commit unless explicitly requested |
| Production files | UPDATE ONLY IF NEEDED | Patch only concrete blockers discovered by the QA gate |
| GitHub Issue #99 | UPDATE | Comment with plan path, QA evidence, validation results, and follow-up issues if needed |

Optional dev-only tooling:

| Tool | Decision |
|------|----------|
| `@axe-core/playwright` | Add only if the implementation owner wants automated axe checks committed into the workflow. Otherwise use Playwright DOM checks plus manual WCAG checklist evidence to avoid dependency churn. |

---

## Tasks

### Task 1: Confirm Baseline And QA Environment

- **Action**: REVIEW
- **Implement**:
  - Run `git status --short --branch`.
  - Confirm #98 commits are present.
  - Confirm local app responds at `http://localhost:3000/en/events`.
  - Confirm local Supabase seed persona auth works for:
    - `participant@test.com`
    - `editor@test.com`
    - `admin@test.com`
    - `recruiter@test.com`
  - Keep existing untracked tool/state folders unstaged.
- **Validate**:
  - Baseline notes added to `tmp/visual-audit/issue-99/qa-report.md`.

### Task 2: Build The QA Gate Script

- **File**: `tmp/visual-audit/issue-99/qa-gate.spec.cjs`
- **Action**: CREATE LOCAL
- **Implement**:
  - Reuse the login/session helper pattern from `tmp/visual-audit/issue-98/workflow-clickthrough.spec.cjs`.
  - Capture screenshots at desktop and mobile viewports.
  - Record:
    - final URL
    - horizontal overflow state
    - console errors/warnings
    - failed network requests
    - visible primary action checks
    - basic focus/keyboard checks
    - basic accessible-name/target-size checks
  - Write `tmp/visual-audit/issue-99/qa-report.md`.
- **Validate**:
  - `pnpm exec playwright test tmp/visual-audit/issue-99/qa-gate.spec.cjs --reporter=line`

### Task 3: Public Visitor QA

- **Routes**:
  - `/en`
  - `/en/events`
  - first public event detail
  - `/en/auth/login`
  - `/en/company/login`
- **Action**: VERIFY
- **Implement**:
  - Check public nav and mobile menu.
  - Confirm event cards/details expose date, event type, chapter, availability, and primary action.
  - Keyboard-tab through navbar/menu and primary event actions.
  - Verify no secrets or personal tokens appear in screenshots.
- **Validate**:
  - Public route screenshots and notes exist under `tmp/visual-audit/issue-99/`.

### Task 4: Participant And Student QA

- **Routes**:
  - `/en/student`
  - `/en/student/events`
  - `/en/student/profile`
  - `/en/student/resume`
  - `/en/onboarding` redirect/complete-profile state
- **Action**: VERIFY
- **Implement**:
  - Login as `participant@test.com`.
  - Click through student sidebar links.
  - Verify dashboard primary actions, chapter application form controls, tabs, QR/status panels, and forms have keyboard-visible focus.
  - Confirm mobile screenshots have no overlap or hidden primary actions.
- **Validate**:
  - Student route screenshots and notes exist under `tmp/visual-audit/issue-99/`.

### Task 5: Chapter Editor QA

- **Routes**:
  - `/en/chapter`
  - `/en/chapter/events`
  - first manageable event detail when available
  - first event applications route when available
  - `/en/chapter/members`
  - `/en/chapter/checkin`
- **Action**: VERIFY
- **Implement**:
  - Login as `editor@test.com`.
  - Verify editor navigation is scoped and operational pages are scannable.
  - Check tabs, bulk action controls, dialogs, event row actions, member row actions, and check-in input/scanner controls.
  - Verify mobile record/list alternatives do not overflow.
- **Validate**:
  - Chapter route screenshots and notes exist under `tmp/visual-audit/issue-99/`.

### Task 6: Admin QA

- **Routes**:
  - `/en/admin`
  - `/en/admin/users`
  - `/en/admin/companies`
  - `/en/admin/events`
  - `/en/admin/chapters`
  - `/en/admin/invites`
  - `/en/admin/activity`
- **Action**: VERIFY
- **Implement**:
  - Login as `admin@test.com`.
  - Verify tables, filters, statuses, destructive actions, and modal confirmations are calm and reachable.
  - Keyboard-check search/filter controls and at least one dialog trigger/cancel flow.
  - Confirm mobile admin invite/cards avoid overflow.
- **Validate**:
  - Admin route screenshots and notes exist under `tmp/visual-audit/issue-99/`.

### Task 7: Company Representative QA

- **Routes**:
  - `/en/company/dashboard`
  - `/en/company/browse`
  - `/en/company/saved`
  - first visible talent profile when available
  - `/en/company/profile`
- **Action**: VERIFY
- **Implement**:
  - Login as `recruiter@test.com`.
  - Confirm user-facing language says company/representative/talent, not recruiter except where intentionally internal.
  - Verify browse filters, save buttons, profile links, saved list, resume/access controls, and help/access states.
  - Confirm mobile company talent records avoid table pressure.
- **Validate**:
  - Company route screenshots and notes exist under `tmp/visual-audit/issue-99/`.

### Task 8: Accessibility Checklist Pass

- **Action**: VERIFY / PATCH ONLY IF BLOCKED
- **Implement**:
  - Verify no obvious critical issues in:
    - semantic button/link usage
    - icon-only labels
    - visible focus states
    - 24x24px minimum interactive target size
    - dialog focus containment and Escape/cancel path
    - tab keyboard behavior
    - form labels and error text
    - color-only statuses
  - If a blocker is found, patch the smallest relevant component/route and rerun targeted QA.
- **Validate**:
  - Accessibility checklist section completed in `qa-report.md`.

### Task 9: Mobile Overflow And Screenshot Privacy Review

- **Action**: VERIFY
- **Implement**:
  - Review generated screenshots.
  - Confirm no visible secrets, service-role keys, auth tokens, private credentials, or sensitive real personal data.
  - Confirm no horizontal overflow on all captured 390px mobile routes.
  - Document any screenshot intentionally excluded from sharing.
- **Validate**:
  - Privacy/overflow section completed in `qa-report.md`.

### Task 10: Full Validation Commands

- **Action**: VERIFY
- **Implement**:
  - Run:
    - `pnpm lint`
    - `pnpm test`
    - `pnpm build`
  - Avoid running `pnpm test` concurrently with `pnpm build`; prior work showed that can cause an architecture test timeout due to resource contention.
- **Validate**:
  - Results recorded in `qa-report.md`.

### Task 11: GitHub Update

- **Action**: GITHUB
- **Implement**:
  - Add `has-plan`.
  - Comment on #99 with this plan path.
  - After implementation, comment with:
    - QA report path
    - screenshot directory
    - role flows covered
    - accessibility findings
    - validation command results
    - follow-up issues created, if any
  - Close #99 only if there are no blocking QA findings.
- **Validate**:
  - GitHub issue has plan and QA evidence comments.

---

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| QA becomes another redesign pass | Only patch concrete blockers found by evidence. |
| Screenshots expose secrets or sensitive real data | Use local seed users only; review screenshots before sharing; keep screenshots in `tmp/` unless approved. |
| Flaky test from animation/network timing | Use `domcontentloaded`, short network idle timeout, and deterministic seed personas. |
| `pnpm test` times out under resource contention | Run test/build sequentially, not in parallel. |
| Axe dependency churn distracts from QA gate | Prefer Playwright DOM checks and manual WCAG checklist unless automated axe is explicitly desired. |
| Company route redirects due to seed/access drift | Document as a QA blocker only if seed persona cannot access expected company routes; do not rewrite auth inside this issue. |
| Keyboard checks miss hidden overlays | Include dialog/menu/tab open-close flows and focus visibility samples, not just static screenshots. |

---

## Validation Commands

```bash
pnpm exec playwright test tmp/visual-audit/issue-99/qa-gate.spec.cjs --reporter=line
pnpm lint
pnpm test
pnpm build
```

Evidence paths:

```text
tmp/visual-audit/issue-99/
tmp/visual-audit/issue-99/qa-report.md
```

---

## Implementation Results

- Browser QA script created locally at `tmp/visual-audit/issue-99/qa-gate.spec.cjs`.
- QA report and screenshots created locally under `tmp/visual-audit/issue-99/`.
- Browser QA covered public visitor, participant/student, chapter editor, admin, and company representative paths.
- Fixed admin PostgREST relationship errors by composing admin membership/access data with explicit user/company/chapter lookups.
- Added accessible labels to search/check-in/resume controls and made admin sort header buttons easier to hit.
- Remaining QA notes are non-blocking artifacts/warnings:
  - hidden native controls used by custom select/checkbox/file inputs are reported as small targets by the DOM probe.
  - local public media/map requests can abort during fast route transitions.
  - the home logo image still emits a Next image ratio warning.

## Validation Results

```bash
pnpm exec playwright test tmp/visual-audit/issue-99/qa-gate.spec.cjs --reporter=line
# 1 passed

pnpm test
# 16 files passed, 261 tests passed

pnpm lint
# passed with existing warnings

pnpm build
# passed
```

## Acceptance Criteria Mapping

- [x] Mobile screenshots show no broken primary actions, overlap, or unintended horizontal pressure.
- [x] Interactive controls have acceptable focus states, labels, target sizes, and keyboard behavior for the primary workflows; remaining DOM probe notes are hidden custom-control internals.
- [x] Public visitor, participant/student, chapter editor, admin, and company representative primary paths can be clicked through.
- [x] `pnpm test`, `pnpm lint`, and `pnpm build` pass.
- [x] Screenshot evidence does not expose secrets or sensitive real personal data.
