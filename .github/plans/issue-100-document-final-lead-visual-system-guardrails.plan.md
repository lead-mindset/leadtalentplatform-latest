# Plan: Issue #100 Document Final LEAD Visual System And Future Guardrails

## Summary

Close the cohesive UI/UX system loop by updating the canonical documentation after the #94-#99 design, implementation, and QA passes. This is a documentation and guardrail issue, not another redesign. The implementation should make `docs/handbook/UI_UX.md` reflect the actual final system decisions, summarize the evidence from the visual audit and browser QA, clarify that shared primitives come before isolated page polish, and record lightweight future options such as component gallery, visual regression, and architecture guardrails.

## User Story

As the LEAD product owner,
I want the final visual-system decisions and evidence documented,
So that future UI work stays cohesive without requiring everyone to read every implementation diff or screenshot artifact.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #100 |
| Type | DOCUMENTATION / GUARDRAIL |
| Complexity | Small |
| Systems Affected | UI/UX handbook, PRD issue specifications, planning docs, visual QA artifact policy |
| Depends On | #99 Run accessibility, mobile overflow, and browser QA pass |
| Source PRD | `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md` |
| Evidence | `tmp/visual-audit/issue-94/audit-report.md`, `tmp/visual-audit/issue-99/qa-report.md`, `.github/plans/issue-95-*`, `.github/plans/issue-96-*`, `.github/plans/issue-97-*`, `.github/plans/issue-98-*`, `.github/plans/issue-99-*` |
| Commit Rule | Commit only after product owner asks; keep `tmp/`, `.agents/`, `.codex/`, `.qa-backups/`, and `test-results/` unstaged unless explicitly requested |

---

## Scope

### In Scope

- Update `docs/handbook/UI_UX.md` with a concise final-system section that reflects what was actually implemented and verified.
- Summarize before/after evidence from the design-system pass without embedding local screenshots or sensitive data.
- Clarify future implementation guardrails:
  - shared primitive contract first
  - shells/navigation second
  - workflow/page polish last
  - no isolated component visual systems
- Document artifact handling for `tmp/visual-audit/*`:
  - local evidence by default
  - attach/share only selected screenshots after review
  - never commit screenshots with secrets, tokens, or real sensitive data
- Add future tooling options:
  - Storybook or local component gallery
  - visual regression snapshots for key routes
  - architecture/lint guardrails for UI primitive usage
  - optional accessibility automation after the current DOM/browser probe matures
- Update `.github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md` or related planning docs so the generated issue spec reflects the completed final documentation step.
- Comment on GitHub #100 with the plan path and, after implementation, evidence and validation.

### Out Of Scope

- Runtime UI changes.
- CSS/token/component refactors.
- New screenshots or Playwright work unless needed to verify a documentation claim.
- Schema, service, action, auth, or database changes.
- Adding Storybook, visual regression tooling, or new dependencies in this issue.
- Committing `tmp/visual-audit` screenshots unless explicitly requested.

---

## Current State

- #99 is closed and validated:
  - Playwright QA gate passed.
  - `pnpm test` passed with 16 files and 261 tests.
  - `pnpm lint` passed with existing warnings.
  - `pnpm build` passed.
- The latest #99 implementation changes are still uncommitted in the working tree.
- `docs/handbook/UI_UX.md` already contains the core system contract:
  - product system
  - surface hierarchy
  - primitive families
  - radius, typography, button, badge contracts
  - app shell and page anatomy
  - responsive rules
  - visual design loop
  - redesign checklist
- The handbook does not yet include a compact final evidence summary or post-pass artifact/tooling guardrails.
- `.github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md` still describes #100 as a future issue and should be updated only if useful for traceability.

---

## Patterns To Follow

| Category | Source | Pattern |
|----------|--------|---------|
| Canonical UI contract | `docs/handbook/UI_UX.md` | Keep guidance practical and enforceable; avoid abstract design philosophy that cannot guide implementation. |
| Visual loop rule | `AGENTS.md` | Codex Desktop visual loop is required for meaningful UI/UX work and must preserve service/action/auth behavior. |
| PRD evidence | `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md` | Design-system-first initiative; screenshots and browser checks support decisions, but temporary artifacts stay out of the repo by default. |
| QA evidence | `tmp/visual-audit/issue-99/qa-report.md` | Summarize outcome: no blocking mobile overflow, route click-through, or screenshot privacy issues; record remaining notes as non-blocking artifacts/warnings. |
| Plan style | `.github/plans/issue-99-accessibility-mobile-overflow-browser-qa-pass.plan.md` | Include scope, source docs, artifact policy, validation commands, and acceptance criteria mapping. |

---

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/issue-100-document-final-lead-visual-system-guardrails.plan.md` | CREATE | This implementation plan |
| `docs/handbook/UI_UX.md` | UPDATE | Add final system evidence summary, guardrails, artifact policy, and future tooling options |
| `.github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md` | UPDATE IF USEFUL | Mark or clarify final documentation issue spec and artifact decision guidance |
| GitHub Issue #100 | UPDATE | Add plan/evidence comment and close only when docs are updated |

Do not change runtime files for this issue unless a documentation reference is demonstrably wrong and cannot be corrected without a tiny doc-adjacent edit.

---

## Tasks

### Task 1: Confirm Documentation Baseline

- **Files**:
  - `docs/handbook/UI_UX.md`
  - `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md`
  - `tmp/visual-audit/issue-99/qa-report.md`
- **Action**: REVIEW
- **Implement**:
  - Confirm the handbook already captures the implemented design-system contract.
  - Extract only the final evidence worth preserving in docs:
    - routes/roles covered
    - mobile overflow result
    - screenshot privacy result
    - validation commands
    - remaining non-blocking warnings
  - Note that local screenshots remain local unless explicitly selected for sharing.
- **Mirror**: `docs/handbook/UI_UX.md` existing concise rule sections.
- **Validate**: No file changes yet beyond this plan.

### Task 2: Add Final System Evidence Summary

- **File**: `docs/handbook/UI_UX.md`
- **Action**: UPDATE
- **Implement**:
  - Add a short section near the Visual Design Loop or Validation area titled something like `Final Cohesion Pass Evidence`.
  - Summarize the #94-#99 loop:
    - #94 baseline visual audit
    - #95 final system decisions
    - #96 global primitives/tokens
    - #97 public/authenticated shells
    - #98 workflow refinements
    - #99 accessibility/mobile/browser QA gate
  - Keep it durable: no huge route tables, no raw screenshots, no temporary token-bearing URLs.
- **Mirror**: `docs/handbook/UI_UX.md` `Validation For This Handbook` style.
- **Validate**: `git diff -- docs/handbook/UI_UX.md`

### Task 3: Add Future Guardrails

- **File**: `docs/handbook/UI_UX.md`
- **Action**: UPDATE
- **Implement**:
  - Add or strengthen explicit rules:
    - improve `components/ui` primitives before page-level polish when repeated inconsistency appears.
    - page-level Tailwind may compose layout, but should not create a new component system.
    - screenshots/browser review are required for significant UI changes, but copy-only docs do not need heavy visual QA.
    - if a route needs a pattern not covered by primitives, create or extend a shared primitive first.
  - Tie the guardrails to future issue planning and review language.
- **Mirror**: `docs/handbook/UI_UX.md` `Implementation Order For Design-System Passes`.
- **Validate**: Handbook reads as implementation guidance, not just a retrospective.

### Task 4: Add Screenshot Artifact Policy

- **File**: `docs/handbook/UI_UX.md`
- **Action**: UPDATE
- **Implement**:
  - Define default handling for visual artifacts:
    - `tmp/visual-audit/{issue}/` is local evidence.
    - keep screenshots out of git unless product owner explicitly asks.
    - attach only selected, reviewed screenshots to GitHub when helpful.
    - avoid screenshots containing secrets, service-role keys, PATs, JWT-looking tokens, passwords, or sensitive real personal data.
    - seed emails/demo names are acceptable for local evidence but should be reviewed before external sharing.
- **Mirror**: `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md` Security & Configuration / Privacy sections.
- **Validate**: The policy directly answers #100's temporary screenshot artifact acceptance criterion.

### Task 5: Add Future Tooling Options

- **File**: `docs/handbook/UI_UX.md`
- **Action**: UPDATE
- **Implement**:
  - Add a lightweight future-tooling section.
  - Include these as options, not current scope:
    - Storybook or local component gallery for core primitives.
    - visual regression snapshots for a small set of key routes.
    - architecture/lint checks for direct one-off component systems or status variant drift.
    - optional automated accessibility checks after false-positive handling is tuned.
  - Keep recommendations sequenced so the team does not over-tool before the product stabilizes.
- **Mirror**: `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md` Future Considerations.
- **Validate**: No new dependencies added.

### Task 6: Update Planning/Issue Traceability

- **File**: `.github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md`
- **Action**: UPDATE IF USEFUL
- **Implement**:
  - Add a brief note under issue 7 / #100 that this final documentation pass should preserve summary evidence and artifact policy, not raw screenshots.
  - If the file is already clear enough, leave it unchanged and record that in the GitHub comment.
- **Mirror**: Existing issue spec format in `.github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md`.
- **Validate**: `git diff -- .github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md`

### Task 7: Validate Documentation Changes

- **Action**: VERIFY
- **Implement**:
  - Run focused doc review:
    - `rg -n "Final Cohesion|Artifact|Storybook|visual regression|shared primitives" docs/handbook/UI_UX.md`
    - `git diff -- docs/handbook/UI_UX.md .github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md`
  - Run `pnpm lint` only if non-doc files are touched during implementation.
  - Runtime `pnpm test`/`pnpm build` are not required for docs-only changes unless implementation unexpectedly touches code.
- **Validate**:
  - Documentation references are accurate.
  - No screenshot artifacts are staged.

### Task 8: GitHub Update

- **Action**: GITHUB
- **Implement**:
  - Add/keep `has-plan` label if available.
  - Comment on #100 with:
    - plan path
    - docs updated
    - evidence summarized
    - artifact decision
    - validation performed
  - Close #100 only after documentation changes are complete and accepted by validation.
- **Validate**:
  - GitHub issue has implementation evidence comment.

---

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Docs become too long to use | Add a compact final evidence section; link/source local artifacts instead of pasting route tables. |
| Screenshots or token-bearing URLs leak into docs | Summarize findings only; do not embed raw signed media/map URLs or local screenshots. |
| #100 turns into another UI pass | Keep this issue docs-only; create follow-up issues for runtime improvements. |
| Guardrails become vague | Use enforceable phrases: shared primitives first, shell second, workflow polish last, no isolated visual systems. |
| Existing uncommitted #99 changes get mixed into docs commit | Keep commit boundaries separate; do not stage unrelated files unless explicitly requested. |

---

## Validation Commands

Docs-only expected validation:

```bash
rg -n "Final Cohesion|Artifact|Storybook|visual regression|shared primitives" docs/handbook/UI_UX.md
git diff -- docs/handbook/UI_UX.md .github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md
```

Run only if non-doc files are touched:

```bash
pnpm lint
pnpm test
pnpm build
```

---

## Acceptance Criteria Mapping

## Implementation Results

- Updated `docs/handbook/UI_UX.md` with:
  - final cohesion pass evidence for #94-#99.
  - explicit future UI guardrails.
  - visual artifact policy for `tmp/visual-audit/{issue}/`.
  - future tooling options for component gallery/Storybook, visual regression, architecture/lint guardrails, and accessibility automation.
- Updated `.github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md` with a traceability note for #100 artifact handling.
- Kept runtime files untouched for this issue.
- Kept screenshot and temporary artifact directories uncommitted.

## Validation Results

```bash
rg -n "Final Cohesion|Artifact|Storybook|visual regression|shared primitives|isolated page polish|Visual Artifact Policy|Future Tooling" docs/handbook/UI_UX.md
# matched the new handbook sections and guardrails

git diff -- docs/handbook/UI_UX.md .github/issues/lead-cohesive-ui-ux-system-visual-audit-issues.md
# reviewed docs-only diff
```

## Acceptance Criteria Mapping

- [x] `docs/handbook/UI_UX.md` reflects the actual final design-system decisions.
- [x] Before/after evidence is summarized so the team understands what changed and why without reading implementation diffs.
- [x] Guidance clearly says shared primitives come before isolated page polish.
- [x] Storybook/component gallery, visual regression, and architecture guardrails are documented as future options.
- [x] Temporary screenshot artifact handling is documented: keep local by default, attach selected reviewed evidence only when useful, discard/archive local artifacts when no longer needed.
