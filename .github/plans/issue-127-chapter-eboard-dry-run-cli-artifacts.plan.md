# Plan: Roadmap Phase 1.3 - E-board Dry-run CLI And Artifact Writer

## Summary

Create a reusable dry-run CLI that reads the master chapter e-board CSV, loads the versioned mapping configs, runs the pure normalizer from #126, and writes local review artifacts under a configurable output directory. The CLI must be safe to run repeatedly and must not write to any database, create auth users, generate member IDs, send invitations, or touch QA/production.

This issue is the bridge between pure normalization logic and human-review artifacts. It still does not validate canonical chapters against local Docker; that is #128.

## User Story

As Abigail and the LEAD activation team,  
I want a repeatable dry-run command that creates review files from the e-board CSV,  
so that chapter and executive reviewers can inspect proposed import decisions before any database write.

## Metadata

| Field | Value |
| --- | --- |
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| GitHub Issue | #127 |
| GitHub URL | `https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/127` |
| Parent Issue | #124 |
| Roadmap Phase | Phase 1.3 |
| Blocked By | #126, completed |
| Source PRD | `.github/PRDs/chapter-eboard-import-dry-run-normalization.prd.md` |
| Normalizer | `lib/services/chapter-eboard-import.service.ts` |
| Config Inputs | `docs/data-import/*.json` |
| Default Source | `docs/Registro de Junta Ejecutiva(Sheet1).csv` |
| Default Output | `tmp/imports/chapter-eboard` |
| Systems Affected | Service layer, scripts, package scripts, tests |

## Current Codebase Context

- #125 created the mapping configs under `docs/data-import/`.
- #126 created the pure `ChapterEboardImportService`.
- Existing service-layer pattern keeps business logic in `lib/services/`.
- Existing `scripts/migrate-events.ts` is a TS script, but it is DB-writing and should not be used as a behavior model for this dry-run except for basic script placement.
- `package.json` currently has no dedicated data-import script command.
- `pnpm-lock.yaml` contains `tsx` transitively, but `package.json` does not list it directly. Implementation should prefer a reliable package script. If `pnpm exec tsx` works locally, use it; if not, add `tsx` as a dev dependency only if needed.

## Design Decision

Keep artifact generation testable in a service and keep the CLI thin.

| File | Action | Purpose |
| --- | --- | --- |
| `lib/services/chapter-eboard-artifact.service.ts` | CREATE | Convert `NormalizeCsvResult` into CSV, JSON summary, and markdown report strings. |
| `lib/services/__tests__/chapter-eboard-artifact.service.test.ts` | CREATE | Unit test artifact formatting without filesystem writes. |
| `scripts/chapter-eboard-dry-run.ts` | CREATE | Thin CLI: parse args, read files, run normalizer, write artifacts, print concise summary. |
| `package.json` | UPDATE | Add a reusable script command for the dry-run. |
| `.github/plans/issue-127-chapter-eboard-dry-run-cli-artifacts.plan.md` | UPDATE | Track completion. |

## CLI Contract

Command should support:

```bash
pnpm chapter-eboard:dry-run
pnpm chapter-eboard:dry-run -- --source "docs/Registro de Junta Ejecutiva(Sheet1).csv" --out tmp/imports/chapter-eboard
pnpm chapter-eboard:dry-run -- --validate-local
```

Flags:

| Flag | Required | Default | Behavior |
| --- | --- | --- | --- |
| `--source` | No | `docs/Registro de Junta Ejecutiva(Sheet1).csv` | CSV input path. |
| `--out` | No | `tmp/imports/chapter-eboard` | Output directory. |
| `--validate-local` | No | `false` | Accepted for roadmap compatibility, but should print a note that local DB validation is handled in #128. |
| `--help` | No | N/A | Print usage. |

The CLI should fail fast if:

- source file does not exist,
- mapping config files do not exist or fail JSON parsing,
- normalizer throws due to missing required CSV headers,
- output directory cannot be created.

## Artifacts

Write these files:

| File | Contents |
| --- | --- |
| `chapter-eboard-normalized.csv` | All normalized rows with raw values, normalized values, status, and review reasons. |
| `chapter-eboard-review-queue.csv` | Rows with `needs_review` or `blocked` status for human review. |
| `chapter-eboard-editor-approval.csv` | Rows with proposed app role `editor` and editor review requirement. |
| `chapter-eboard-chapter-reviewers.csv` | Chapter-level review summary derived from normalized rows, grouped by canonical chapter. |
| `chapter-eboard-validation-report.md` | Human-readable summary, warnings, duplicate count, status counts, and next steps. |
| `chapter-eboard-validation-summary.json` | Machine-readable summary, duplicate groups, output metadata, and counts. |

## Artifact Details

### Normalized CSV

Recommended columns:

- `source_row_numbers`
- `status`
- `review_reasons`
- `raw_name`
- `normalized_name`
- `raw_email`
- `normalized_email`
- `raw_confirm_email`
- `raw_chapter`
- `canonical_chapter_id`
- `canonical_chapter_name`
- `raw_role_title`
- `role_level`
- `functional_area`
- `proposed_app_role`
- `proposed_membership_position`
- `proposed_identity_type`
- `proposed_editor_requires_review`
- `raw_major`
- `standardized_major`
- `major_family`
- `raw_phone`
- `normalized_phone`
- `is_recruiter_visible`
- `member_id_strategy`

### Review Queue CSV

Subset of normalized CSV where status is `needs_review` or `blocked`.

### Editor Approval CSV

Subset where proposed app role is `editor`.

Should make it obvious that editor is not final:

- include `proposed_editor_requires_review`,
- include `review_reasons`,
- include `approval_status` column defaulting to blank or `pending_review`.

### Chapter Reviewers CSV

This issue does not need to infer the final reviewer person perfectly. It should create useful grouped context:

- `canonical_chapter_id`
- `canonical_chapter_name`
- `total_rows`
- `ready_count`
- `review_count`
- `blocked_count`
- `proposed_editor_count`
- `detected_president_emails`
- `detected_vp_emails`
- `detected_chief_of_staff_emails`
- `reviewer_note`

Actual human assignment and approval happens in #131.

### Validation Report Markdown

Include:

- source path,
- output path,
- generated timestamp,
- total raw rows,
- normalized unique rows,
- ready/review/blocked counts,
- duplicate group count,
- editor approval count,
- blocked reason summary,
- reminder that no DB writes happened,
- next issue: #128 local canonical chapter validation.

### Validation Summary JSON

Include:

- `generatedAt`
- `sourcePath`
- `outputDirectory`
- `summary`
- `artifactPaths`
- `duplicates`
- `statusCounts`
- `reviewReasonCounts`
- `editorApprovalCount`
- `blockedCount`
- `validateLocalRequested`
- `validateLocalNote`

## Privacy / Output Safety

The CLI terminal output should be concise and not dump full row data.

Allowed terminal output:

- source path,
- output directory,
- total/ready/review/blocked counts,
- duplicate count,
- editor approval count,
- artifact filenames.

Avoid terminal output:

- full names,
- full emails,
- phone numbers,
- full CSV rows.

The artifacts themselves are local review files and may contain PII because their purpose is human review. They should be written under `tmp/imports/chapter-eboard` by default and not committed.

## Tasks

### Task 1: Create Artifact Writer Service

Status: Completed

- **File**: `lib/services/chapter-eboard-artifact.service.ts`
- **Action**: CREATE
- **Implement**:
  - Export `ChapterEboardArtifactService`.
  - Add CSV escaping helper.
  - Add functions:
    - `buildNormalizedCsv(result)`
    - `buildReviewQueueCsv(result)`
    - `buildEditorApprovalCsv(result)`
    - `buildChapterReviewersCsv(result)`
    - `buildValidationReportMarkdown(params)`
    - `buildValidationSummaryJson(params)`
    - optional `buildAllArtifacts(params)`
  - Keep it pure: return strings/objects, no filesystem writes.
- **Validate**:
  - Unit tests parse expected strings and key columns.

### Task 2: Add Artifact Writer Tests

Status: Completed

- **File**: `lib/services/__tests__/chapter-eboard-artifact.service.test.ts`
- **Action**: CREATE
- **Implement**:
  - Build a small `NormalizeCsvResult` fixture.
  - Test CSV escaping for commas, quotes, and newlines.
  - Test normalized/review/editor CSV subsets.
  - Test chapter reviewer grouping.
  - Test markdown report contains counts and no-DB-write note.
  - Test summary JSON object includes artifact paths and counts.
- **Validate**:
  - `pnpm test -- lib/services/__tests__/chapter-eboard-artifact.service.test.ts`

### Task 3: Create Thin CLI Script

Status: Completed

- **File**: `scripts/chapter-eboard-dry-run.ts`
- **Action**: CREATE
- **Implement**:
  - Parse `--source`, `--out`, `--validate-local`, and `--help`.
  - Resolve paths from `process.cwd()`.
  - Load source CSV.
  - Load three mapping config JSON files.
  - Run `ChapterEboardImportService.normalizeCsv`.
  - Build artifacts using `ChapterEboardArtifactService`.
  - Create output directory with `fs.mkdir({ recursive: true })`.
  - Write all required files.
  - Print concise summary only.
  - If `--validate-local` is passed, print note that DB validation is deferred to #128.
- **Validate**:
  - Run CLI against the real Sheet1 CSV to a temporary test output directory.

### Task 4: Add Package Script

Status: Completed

- **File**: `package.json`
- **Action**: UPDATE
- **Implement**:
  - Add `chapter-eboard:dry-run`.
  - Preferred command: `tsx scripts/chapter-eboard-dry-run.ts`.
  - If `tsx` is not available through `pnpm exec`, add it as a dev dependency before using it directly.
- **Validate**:
  - `pnpm chapter-eboard:dry-run -- --out tmp/imports/chapter-eboard-plan-smoke` runs.

### Task 5: Run Smoke Command And Verify Artifacts

Status: Completed

- **Files**:
  - `tmp/imports/chapter-eboard-plan-smoke/*`
- **Action**: GENERATE LOCALLY ONLY
- **Implement**:
  - Run dry-run command against default source with a smoke output path.
  - Verify all six required artifacts exist.
  - Do not commit generated artifacts.
- **Validate**:
  - `Get-ChildItem tmp/imports/chapter-eboard-plan-smoke`
  - Confirm expected filenames.

### Task 6: Run Validation

Status: Completed

- **Action**: VALIDATE
- **Commands**:

```bash
pnpm test -- lib/services/__tests__/chapter-eboard-import.service.test.ts lib/services/__tests__/chapter-eboard-artifact.service.test.ts
pnpm exec eslint lib/services/chapter-eboard-import.service.ts lib/services/chapter-eboard-artifact.service.ts lib/services/__tests__/chapter-eboard-import.service.test.ts lib/services/__tests__/chapter-eboard-artifact.service.test.ts scripts/chapter-eboard-dry-run.ts
```

Safety scans:

```bash
rg -F "createAdminClient" scripts/chapter-eboard-dry-run.ts lib/services/chapter-eboard-artifact.service.ts
rg -F "SupabaseClient" scripts/chapter-eboard-dry-run.ts lib/services/chapter-eboard-artifact.service.ts
rg -F "generateUniqueMemberId" scripts/chapter-eboard-dry-run.ts lib/services/chapter-eboard-artifact.service.ts
```

Expected result: no DB/auth/member-ID references.

### Task 7: Update Plan And GitHub Issue

Status: Completed

- **Files**:
  - `.github/plans/issue-127-chapter-eboard-dry-run-cli-artifacts.plan.md`
  - GitHub issue #127
- **Action**: UPDATE
- **Implement**:
  - Mark tasks complete during implementation.
  - Comment on #127 with created files, artifact names, and validation result.
  - Close #127 only when acceptance criteria pass.

## Acceptance Criteria

- [x] CLI accepts `--source`, `--out`, and optional `--validate-local` flags.
- [x] Default source is `docs/Registro de Junta Ejecutiva(Sheet1).csv`.
- [x] Default output directory is `tmp/imports/chapter-eboard`.
- [x] CLI loads versioned mapping configs.
- [x] CLI writes `chapter-eboard-normalized.csv`.
- [x] CLI writes `chapter-eboard-review-queue.csv`.
- [x] CLI writes `chapter-eboard-editor-approval.csv`.
- [x] CLI writes `chapter-eboard-chapter-reviewers.csv`.
- [x] CLI writes `chapter-eboard-validation-report.md`.
- [x] CLI writes `chapter-eboard-validation-summary.json`.
- [x] CLI terminal output is concise and does not dump full PII-heavy data.
- [x] CLI performs no DB writes.

## Implementation Results

Created:

- `lib/services/chapter-eboard-artifact.service.ts`
- `lib/services/__tests__/chapter-eboard-artifact.service.test.ts`
- `scripts/chapter-eboard-dry-run.ts`

Updated:

- `package.json`
- `pnpm-lock.yaml`
- `lib/services/chapter-eboard-import.service.ts`

Validation completed:

- `pnpm test -- lib/services/__tests__/chapter-eboard-import.service.test.ts lib/services/__tests__/chapter-eboard-artifact.service.test.ts`
  - 2 test files passed, 16 tests passed.
- `pnpm exec eslint lib/services/chapter-eboard-import.service.ts lib/services/chapter-eboard-artifact.service.ts lib/services/__tests__/chapter-eboard-import.service.test.ts lib/services/__tests__/chapter-eboard-artifact.service.test.ts scripts/chapter-eboard-dry-run.ts`
  - Passed.
- `pnpm chapter-eboard:dry-run -- --out tmp/imports/chapter-eboard-plan-smoke`
  - Wrote all six expected artifacts.
  - Produced concise aggregate output only.
- Safety scans confirmed no `createAdminClient`, `SupabaseClient`, or `generateUniqueMemberId` references in the CLI/artifact writer.

Smoke output summary:

- Total raw rows: 114
- Ready rows: 29
- Review rows: 81
- Blocked rows: 0
- Duplicate email groups: 4
- Proposed editor approvals: 31

## Out Of Scope

- Local Docker canonical chapter validation. This is #128.
- Real dry-run output review/report finalization against all current CSVs. This is #129.
- Database writes.
- Auth user creation.
- Member ID generation.
- Invitation emails.
- QA updates.
- Production updates.
- Human approval workflow.

## Follow-up

After #127 is complete, implement #128:

> Roadmap Phase 1.4: Validate canonical chapters against local Docker.
