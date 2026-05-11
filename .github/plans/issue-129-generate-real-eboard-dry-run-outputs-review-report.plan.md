# Plan: Roadmap Phase 1.5 - Generate Real E-board Dry-run Outputs And Review Report

## Summary

Run the completed chapter e-board dry-run workflow against the real master `Sheet1` CSV, with local Docker chapter validation enabled, and produce the final local review packet for executive/operations and chapter review. This issue does not add import code or write to any database; it produces evidence, readiness analysis, and a GitHub completion report that decides whether the artifacts are ready for human review or need mapping fixes first.

## User Story

As Abigail and the LEAD operations reviewers,  
I want the real e-board CSV transformed into validated review artifacts,  
so that we can inspect roster, duplicate, editor-access, and chapter-review decisions before approving any local Docker import.

## Metadata

| Field | Value |
| --- | --- |
| Type | VALIDATION / OPERATIONS |
| Complexity | LOW |
| GitHub Issue | #129 |
| GitHub URL | `https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/129` |
| Parent Issue | #124 |
| Roadmap Phase | Phase 1.5 |
| Blocked By | #128, completed |
| Source PRD | `.github/PRDs/chapter-eboard-import-dry-run-normalization.prd.md` |
| Default Source | `docs/Registro de Junta Ejecutiva(Sheet1).csv` |
| Required Output | `tmp/imports/chapter-eboard/` |
| Implementation Report | `.github/reports/issue-129-generate-real-eboard-dry-run-outputs-review-report.md` |
| Systems Affected | Dry-run artifacts, implementation reports, GitHub issue updates |

## Current Codebase Context

- #125 created versioned mapping configs under `docs/data-import/`.
- #126 created the pure normalization engine.
- #127 created the dry-run CLI and artifact writer.
- #128 implemented `--validate-local`, requiring `.env.local`, refusing non-local Supabase URLs, querying only `chapter.id` and `chapter.name`, and validating the 14 canonical chapter IDs.
- The current dry-run command writes six local artifacts and performs no DB writes.

## Patterns To Follow

### Dry-run Command

```bash
pnpm chapter-eboard:dry-run -- --validate-local --out tmp/imports/chapter-eboard
```

Use the default source unless the issue explicitly changes it. The default source is `docs/Registro de Junta Ejecutiva(Sheet1).csv`.

### Required Artifacts

The output directory must contain:

- `chapter-eboard-normalized.csv`
- `chapter-eboard-review-queue.csv`
- `chapter-eboard-editor-approval.csv`
- `chapter-eboard-chapter-reviewers.csv`
- `chapter-eboard-validation-report.md`
- `chapter-eboard-validation-summary.json`

### Report Style

Mirror existing implementation reports in `.github/reports/`:

- concise summary,
- source table,
- validation evidence,
- key findings,
- readiness recommendation,
- follow-up decision.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `tmp/imports/chapter-eboard/*` | GENERATE LOCALLY | Final review artifacts from the real master e-board CSV. |
| `.github/reports/issue-129-generate-real-eboard-dry-run-outputs-review-report.md` | CREATE | Human-readable implementation report summarizing evidence and readiness. |
| `.github/plans/issue-129-generate-real-eboard-dry-run-outputs-review-report.plan.md` | UPDATE | Track task completion during implementation. |
| GitHub issue #129 | UPDATE | Add concise completion comment with report path and readiness recommendation. |

Generated `tmp/imports/chapter-eboard/*` files are local review outputs and should not be committed unless the user explicitly asks.

## Tasks

### Task 1: Confirm Prerequisites

Status: Completed

- **Action**: INSPECT
- **Implement**:
  - Confirm issue #128 is closed or local validation exists in the CLI.
  - Confirm `.env.local` exists and points to local Supabase for `--validate-local`.
  - Confirm local Supabase Docker is running or start it only if the user has already approved that environment behavior in the current workflow.
- **Validate**:
  - `gh issue view 128 --json state,title,url`
  - `pnpm chapter-eboard:dry-run -- --help`

### Task 2: Generate Real Dry-run Outputs

Status: Completed

- **Action**: GENERATE LOCALLY
- **Command**:

```bash
pnpm chapter-eboard:dry-run -- --validate-local --out tmp/imports/chapter-eboard
```

- **Implement**:
  - Use the default source, `docs/Registro de Junta Ejecutiva(Sheet1).csv`.
  - Require local validation to pass before artifacts are accepted.
  - Capture terminal summary counts for the implementation report.
- **Validate**:
  - Command exits successfully.
  - Local chapter validation reports `passed (14/14)`.
  - No database writes are performed by the workflow.

### Task 3: Verify Required Artifacts

Status: Completed

- **Action**: INSPECT
- **Implement**:
  - Confirm all six expected files exist under `tmp/imports/chapter-eboard/`.
  - Open `chapter-eboard-validation-summary.json`.
  - Open `chapter-eboard-validation-report.md`.
  - Do not print or paste full PII-heavy CSV contents into GitHub or final response.
- **Validate**:

```powershell
Get-ChildItem tmp\imports\chapter-eboard
```

Expected files are exactly the six artifacts listed above.

### Task 4: Extract Readiness Findings

Status: Completed

- **Action**: ANALYZE
- **Implement**:
  - From `chapter-eboard-validation-summary.json`, capture:
    - source row count,
    - normalized unique row count if available from report,
    - ready rows,
    - review rows,
    - blocked rows,
    - duplicate email groups,
    - proposed editor approvals,
    - local validation status and canonical chapter count.
  - From `chapter-eboard-chapter-reviewers.csv`, identify:
    - chapter coverage,
    - chapters with no detected president email,
    - chapters with president, VP, or chief-of-staff reviewer signals.
  - From `chapter-eboard-editor-approval.csv`, capture total rows requiring executive/operations approval.
  - From review reasons, determine whether mapping fixes are required before human review.
- **Validate**:
  - Findings are aggregate-only and do not expose full member PII in GitHub comments.

### Task 5: Create Implementation Report

Status: Completed

- **File**: `.github/reports/issue-129-generate-real-eboard-dry-run-outputs-review-report.md`
- **Action**: CREATE
- **Implement**:
  - Include source, output directory, generated artifact list, local validation result, and dry-run counts.
  - Include a table of readiness findings.
  - Include reviewer gaps, especially chapters with no clear president.
  - Include executive/operations approval needs, especially proposed editor approvals.
  - Include safety confirmation:
    - no DB writes,
    - no auth users created,
    - no member IDs generated,
    - company visibility remains opt-in / false in normalized rows.
  - Include recommendation:
    - `Ready for human review` if local validation passed, blocked rows are zero, artifacts exist, and remaining issues are review/approval work.
    - `Needs mapping fixes first` if blocked rows are nonzero, canonical chapters fail, or unmapped chapter/role issues prevent useful review.
  - Include whether a follow-up issue for actual local Docker import should be proposed now.
- **Validate**:
  - Report links to local artifact paths only.
  - Report does not paste full raw CSV rows.

### Task 6: Run Focused Validation

Status: Completed

- **Action**: VALIDATE
- **Commands**:

```bash
pnpm test -- lib/services/__tests__/chapter-eboard-import.service.test.ts lib/services/__tests__/chapter-eboard-artifact.service.test.ts lib/services/__tests__/chapter-eboard-local-validation.service.test.ts
pnpm exec eslint lib/services/chapter-eboard-import.service.ts lib/services/chapter-eboard-artifact.service.ts lib/services/chapter-eboard-local-validation.service.ts scripts/chapter-eboard-dry-run.ts
```

- **Implement**:
  - Use focused validation because #129 is mostly output/report generation.
  - If the focused validation fails, stop and fix only regressions directly caused by this workflow.
- **Validate**:
  - Tests pass.
  - Focused lint passes.

### Task 7: Update Plan And GitHub Issue

Status: Completed

- **Files**:
  - `.github/plans/issue-129-generate-real-eboard-dry-run-outputs-review-report.plan.md`
  - GitHub issue #129
- **Action**: UPDATE
- **Implement**:
  - Mark tasks completed as they finish.
  - Add a GitHub comment with:
    - report path,
    - artifact directory,
    - dry-run counts,
    - local validation result,
    - readiness recommendation,
    - whether a follow-up actual import issue is recommended.
  - Close #129 only if acceptance criteria pass.

## Acceptance Criteria

- [x] Dry-run is executed against `docs/Registro de Junta Ejecutiva(Sheet1).csv`.
- [x] Output artifacts are generated under `tmp/imports/chapter-eboard/`.
- [x] Validation report summarizes source row count, unique emails, duplicates, blocked rows, review queue, proposed editors, reviewer assignments, and chapter coverage.
- [x] Report confirms no DB writes occurred.
- [x] Report identifies chapter reviewer gaps, including any chapter with no clear president.
- [x] Report identifies rows requiring executive/operations approval.
- [x] Report recommends whether the artifact is ready for human review or needs mapping fixes first.
- [x] GitHub issue is updated with a concise completion comment linking the report path.
- [x] Follow-up issue for actual local Docker import is proposed only after review readiness is confirmed.

## Out Of Scope

- Writing to local Docker.
- Creating `public.user`, `person_profile`, `chapter_membership`, or `lead_identity` records.
- Creating Supabase auth users.
- Sending invitations.
- Generating final member IDs.
- Updating QA or production.
- Building reviewer UI.
- Changing mapping rules unless the generated report proves mapping fixes are required before human review.
