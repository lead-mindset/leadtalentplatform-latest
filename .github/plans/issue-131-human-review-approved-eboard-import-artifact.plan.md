# Plan: Roadmap Phase 2.0 - Human Review And Approved E-board Import Artifact

## Summary

Turn the validated #129 dry-run packet into a human-review workflow and, after review decisions are returned, a frozen approved import artifact for #134. This issue must not write to any database or create users. It should prepare chapter-specific review packets, executive/operations approval files, clear review instructions, and a final approved artifact only when every row has an explicit human decision.

Important implementation rule: automation may prepare and validate review materials, but it must not invent organizational approvals. If human decisions are not available yet, #131 should produce the review package and remain open until the completed approval ledger is returned.

## User Story

As Abigail and the LEAD review group,  
I want chapter leaders and executive/operations reviewers to approve the e-board import decisions,  
so that the later local Docker import reflects organizational truth and deliberate access approvals.

## Metadata

| Field | Value |
| --- | --- |
| Type | PROCESS / DATA GOVERNANCE |
| Complexity | MEDIUM |
| GitHub Issue | #131 |
| GitHub URL | `https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/131` |
| Parent Roadmap | #130 |
| Depends On | #124, #125, #126, #127, #128, #129 |
| Source Dry-run Report | `.github/reports/issue-129-generate-real-eboard-dry-run-outputs-review-report.md` |
| Source Artifact Directory | `tmp/imports/chapter-eboard/` |
| Human Review Directory | `tmp/imports/chapter-eboard-human-review/` |
| Frozen Approved Output | `tmp/imports/chapter-eboard-approved/chapter-eboard-approved-import.csv` |
| Systems Affected | Local generated review artifacts, implementation report, GitHub issue status |

## Current Inputs

Use the #129 generated outputs:

- `tmp/imports/chapter-eboard/chapter-eboard-normalized.csv` - 110 normalized unique rows.
- `tmp/imports/chapter-eboard/chapter-eboard-review-queue.csv` - 81 rows needing human review.
- `tmp/imports/chapter-eboard/chapter-eboard-editor-approval.csv` - 31 proposed editor approvals.
- `tmp/imports/chapter-eboard/chapter-eboard-chapter-reviewers.csv` - 14 chapter coverage rows.
- `tmp/imports/chapter-eboard/chapter-eboard-validation-summary.json` - aggregate validation data.

Known review facts from #129:

- 14/14 canonical chapters validated locally.
- 0 blocked rows.
- 4 duplicate email groups.
- 3 duplicate groups have conflicting row data.
- 31 proposed editor approvals require executive/operations approval.
- UPC initially had no clear detected president signal in the CSV. Abigail later confirmed Alexandra Cuchula Barra as President of LEAD UPC; contact email is still pending, and the detected VP remains backup.
- Company visibility must remain false by default.

## Review Status Model

Every row in the final approved artifact must have exactly one `human_review_status`:

| Status | Meaning | Import behavior in #134 |
| --- | --- | --- |
| `approved` | Row is approved for import as-is or with explicit corrected fields. | Eligible for import. |
| `blocked` | Row should not be imported until a blocking issue is resolved. | Not imported. |
| `needs_correction` | Row needs data correction before import. | Not imported until corrected and re-approved. |
| `excluded` | Row is intentionally excluded from this import. | Not imported. |

Interim review packets may use `pending_review`, but the frozen approved artifact must not contain `pending_review`.

Every row with proposed `editor` app role must also have exactly one `editor_access_decision`:

| Decision | Meaning |
| --- | --- |
| `approved_editor` | Executive/operations approved chapter editor access. |
| `member_only` | Person may be imported, but only with member app role. |
| `not_imported` | Person is blocked/excluded/not ready for import. |

## Required Generated Outputs

### Pass A: Review Package

Generate under `tmp/imports/chapter-eboard-human-review/`:

| Output | Purpose |
| --- | --- |
| `README.md` | Explains review process, owners, statuses, and no-DB-write boundary. |
| `executive-editor-approval.csv` | 31 proposed editor rows with explicit approval columns. |
| `duplicate-conflict-review.csv` | Duplicate groups needing human resolution. |
| `review-ledger.csv` | One row per normalized unique person, initialized for human decisions. |
| `chapter-packets/{chapter-id}-roster-review.csv` | Chapter-specific roster review file for each of 14 chapters. |
| `chapter-reviewer-assignment-summary.csv` | Chapter reviewer coverage and gaps, including UPC president gap. |
| `messages/chapter-review-request-template.md` | Spanish draft message to send chapter packets. |
| `messages/executive-approval-request-template.md` | Spanish draft message for executive/operations approval. |

### Pass B: Frozen Approved Artifact

Generate only after human decisions are provided:

| Output | Purpose |
| --- | --- |
| `tmp/imports/chapter-eboard-approved/chapter-eboard-approved-import.csv` | Final import input for #134. |
| `tmp/imports/chapter-eboard-approved/chapter-eboard-approved-import-summary.json` | Counts by status, chapter, editor decision, and excluded/blocked rows. |
| `.github/reports/issue-131-human-review-approved-eboard-import-artifact-report.md` | Final report with approval evidence and import readiness. |

If human decisions are not available during implementation, create the Pass A review package and an interim report, comment on #131 with next human action required, and do not close #131.

## Tasks

### Task 1: Verify #129 Inputs

Status: Completed

- **Action**: INSPECT
- **Implement**:
  - Confirm #129 is closed.
  - Confirm all six #129 artifacts exist under `tmp/imports/chapter-eboard/`.
  - Confirm `chapter-eboard-validation-summary.json` has local validation `passed`, 0 blocked rows, and 14 validated chapters.
- **Validate**:

```powershell
gh issue view 129 --json state,title,url
Get-ChildItem tmp\imports\chapter-eboard
```

### Task 2: Create Review Package Generator

Status: Completed

- **File**: `scripts/chapter-eboard-human-review-package.ts`
- **Action**: CREATE
- **Implement**:
  - Read #129 artifacts from `tmp/imports/chapter-eboard/` by default.
  - Write Pass A outputs under `tmp/imports/chapter-eboard-human-review/`.
  - Add CLI flags:
    - `--source-dir`, default `tmp/imports/chapter-eboard`
    - `--out`, default `tmp/imports/chapter-eboard-human-review`
    - `--help`
  - Add human-decision columns to `review-ledger.csv`:
    - `human_review_status`
    - `chapter_reviewer_decision`
    - `executive_review_required`
    - `editor_access_decision`
    - `corrected_name`
    - `corrected_email`
    - `corrected_chapter_id`
    - `corrected_role_title`
    - `corrected_major`
    - `review_owner`
    - `review_notes`
  - Initialize `human_review_status` as `pending_review` in review package only.
  - Initialize `executive_review_required=true` for proposed editor rows, duplicate conflicts, ambiguous titles, and UPC reviewer gap rows.
  - Keep `is_recruiter_visible=false` unchanged.
  - Do not write any database, auth, QA, or production data.
- **Validate**:
  - Script generates all Pass A outputs from current #129 artifacts.

### Task 3: Generate Chapter-Specific Packets

Status: Completed

- **Action**: IMPLEMENT IN SCRIPT
- **Implement**:
  - Create one CSV per canonical chapter under `chapter-packets/`.
  - Include only rows for that chapter.
  - Preserve raw and normalized fields needed for review.
  - Include decision columns for chapter reviewer:
    - `chapter_reviewer_decision`
    - `human_review_status`
    - `corrected_*`
    - `review_notes`
  - For UPC, mark `review_owner` as VP / executive-operations confirmation because no president signal exists.
  - For chapters with president signal, set review owner note to president primary, VP backup.
- **Validate**:
  - 14 chapter packet CSVs are generated.
  - The sum of chapter packet row counts equals 110 normalized unique rows.

### Task 4: Generate Executive Approval Files

Status: Completed

- **Action**: IMPLEMENT IN SCRIPT
- **Implement**:
  - `executive-editor-approval.csv` includes all 31 proposed editor rows.
  - Add `editor_access_decision` and `executive_approval_notes`.
  - Default `editor_access_decision=pending_review`.
  - `duplicate-conflict-review.csv` includes duplicate groups from summary JSON and enough row references for human resolution.
  - Do not paste full duplicate row details into GitHub comments; local CSV may contain review data.
- **Validate**:
  - Editor approval file row count is 31.
  - Duplicate conflict review includes 4 groups and flags the 3 conflicting groups.

### Task 5: Generate Review Instructions And Message Templates

Status: Completed

- **Action**: IMPLEMENT IN SCRIPT
- **Implement**:
  - `README.md` explains:
    - what reviewers must decide,
    - allowed statuses,
    - editor access approval rules,
    - UPC gap,
    - no DB writes,
    - company visibility stays false,
    - final import waits for explicit approval.
  - `messages/chapter-review-request-template.md` in Spanish, addressed to chapter presidents/VPs.
  - `messages/executive-approval-request-template.md` in Spanish, addressed to Nicole, Antonny, Xiomara, Christopher, and Abigail.
- **Validate**:
  - Templates do not include sensitive row data.
  - Templates clearly ask for decisions, corrections, and approval deadline placeholders.

### Task 6: Add Package Script And Focused Tests

Status: Completed

- **Files**:
  - `package.json`
  - `lib/services/chapter-eboard-human-review.service.ts`
  - `lib/services/__tests__/chapter-eboard-human-review.service.test.ts`
- **Action**: CREATE / UPDATE
- **Implement**:
  - Keep reusable logic in a pure service.
  - Keep the CLI thin: file IO, argument parsing, service call, writes.
  - Add package script:

```json
"chapter-eboard:review-package": "tsx scripts/chapter-eboard-human-review-package.ts"
```

  - Unit test:
    - reviewer packet grouping,
    - editor approval filtering,
    - duplicate conflict summary,
    - UPC reviewer gap behavior,
    - default `pending_review` only in interim review package,
    - `is_recruiter_visible` remains false.
- **Validate**:

```bash
pnpm test -- lib/services/__tests__/chapter-eboard-human-review.service.test.ts
```

### Task 7: Generate Pass A Review Package

Status: Completed

- **Action**: RUN SCRIPT
- **Command**:

```bash
pnpm chapter-eboard:review-package
```

- **Validate**:
  - `tmp/imports/chapter-eboard-human-review/README.md` exists.
  - `review-ledger.csv` has 110 rows.
  - `executive-editor-approval.csv` has 31 rows.
  - `chapter-packets/` has 14 chapter files.
  - No DB writes occurred.

### Task 8: Add Approved Artifact Compiler

Status: Completed

- **File**: `scripts/chapter-eboard-approved-artifact.ts`
- **Action**: CREATE
- **Implement**:
  - Read a completed review ledger CSV.
  - Fail if any row has `pending_review`.
  - Fail if any proposed editor row lacks an allowed `editor_access_decision`.
  - Fail if any approved row has invalid corrected email/chapter/status.
  - Write only approved rows to `tmp/imports/chapter-eboard-approved/chapter-eboard-approved-import.csv`.
  - Downgrade app role to `member` when `editor_access_decision=member_only`.
  - Keep company visibility false.
  - Write summary JSON with counts by chapter, human status, and editor decision.
- **Validate**:
  - Unit tests cover pending decision failure and approved artifact generation.

### Task 9: Stop Or Finalize Based On Human Decisions

Status: Completed

- **Decision Point**:
  - If completed human decisions are not available, stop after Pass A, comment on #131 with review package path and required human next steps, and leave #131 open.
  - If completed human decisions are available, run approved artifact compiler, create final report, comment on #131, and close #131.

## Validation

Run:

```bash
pnpm test -- lib/services/__tests__/chapter-eboard-human-review.service.test.ts
pnpm exec eslint lib/services/chapter-eboard-human-review.service.ts scripts/chapter-eboard-human-review-package.ts scripts/chapter-eboard-approved-artifact.ts
pnpm chapter-eboard:review-package
```

If the approved artifact compiler is implemented and a completed ledger exists, also run:

```bash
pnpm chapter-eboard:approved-artifact -- --ledger tmp/imports/chapter-eboard-human-review/review-ledger.csv
```

Expected behavior: this command must fail while rows are still `pending_review`.

## Acceptance Criteria

- [x] Every row has a review path in `review-ledger.csv`.
- [x] Every chapter has a chapter-specific packet.
- [x] UPC reviewer gap is explicitly flagged.
- [x] Every proposed editor appears in executive approval output.
- [x] Company visibility remains disabled by default.
- [x] No DB writes happen.
- [x] If human decisions are pending, #131 remains open with clear next human actions.
- [ ] If human decisions are completed, every row is marked `approved`, `blocked`, `needs_correction`, or `excluded`.
- [ ] If human decisions are completed, every proposed editor has explicit editor access approval.
- [ ] If human decisions are completed, frozen approved artifact is generated under `tmp/imports/chapter-eboard-approved/`.

## Out Of Scope

- Importing records into local Docker.
- Creating Supabase auth users.
- Sending invitations.
- Generating final member IDs.
- Updating QA or production.
- Granting admin access from chapter e-board data.
- Exposing company/recruiter visibility.
- Closing #131 before human decisions exist.
