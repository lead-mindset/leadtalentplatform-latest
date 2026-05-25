# Plan: Issue 116 Chapter E-board Import Dry-run Normalization

## Summary

Build a reusable dry-run normalization workflow for the chapter e-board import. The workflow will read the master `Registro de Junta Ejecutiva(Sheet1).csv`, normalize and validate chapter, role, permission, major, phone, and duplicate data, validate canonical chapter IDs against local Docker when requested, and generate review artifacts without writing to any database. This turns #116 from a generic pilot import mapping task into a safe, review-first data governance slice for Wave 1 member activation.

This plan intentionally stops before DB import. Actual auth user creation, member ID generation, `public.user`, `person_profile`, `chapter_membership`, and `lead_identity` writes belong in a later issue after the normalized artifact is reviewed and approved.

## User Story

As Abigail and the LEAD activation team,
I want a dry-run workflow that cleans and validates chapter e-board data,
so that executive/operations reviewers and chapter leaders can approve accurate roster and permission decisions before any real import happens.

## Metadata

| Field | Value |
| --- | --- |
| Type | Data Import Dry-run / Validation Tooling |
| Complexity | High |
| GitHub Issue | #116 |
| GitHub URL | `https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/116` |
| Source PRD | `.github/PRDs/chapter-eboard-import-dry-run-normalization.prd.md` |
| Related PRD | `.github/PRDs/lead-spark-production-readiness-validation.prd.md` |
| Depends On | Local Docker schema being current; `docs/Registro de Junta Ejecutiva(Sheet1).csv` available |
| Systems Affected | Data import tooling, import configs, validation reports, chapter/member activation workflow |

## Current State

- #110 through #115 are complete and closed.
- #116 remains open as the next active LEAD SPARK issue.
- The current source CSV inventory showed:
  - `docs/Registro de Junta Ejecutiva(Sheet1).csv` has 114 valid email rows.
  - It has 110 unique emails.
  - Individual chapter CSVs are subsets/splits and should be validation references only.
  - Individual chapter CSVs have 0 emails not present in `Sheet1`.
  - `Sheet1` includes 15 additional unique emails not present in individual chapter files, mostly UNSA.
- Local Docker is the current schema source of truth.
- Local Docker canonical chapters are available through `chapter` table and include `leadpucp`, `leadtecsup`, `leaducsur`, `leaduni`, `leadunmsm`, `leadunsa`, `leadpacifico`, `leadupc`, `leadupn`, `leadupntrujillo`, `leadusil`, `leadutec`, `leadutp`, and `leadvillareal`.
- Current member ID utility validates/generates global `LEAD-######` IDs, but dry run must not generate final IDs.
- `chapter_membership.position` is permission-relevant today and should not be overloaded with detailed role taxonomy.

## Safety Rules

- Do not write to local Docker, QA, or production.
- Do not create Supabase auth users.
- Do not generate final member IDs.
- Do not send emails or invitations.
- Do not grant or persist app roles.
- Do not use `other` as a silent fallback chapter.
- Do not print full sensitive outputs in GitHub comments.
- Generated artifacts under `tmp/` may include operational review data and should be handled as local working files unless explicitly approved for sharing.

## Patterns To Follow

### Test Structure

Source: `lib/services/__tests__/chapter-membership.service.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest'
```

Use Vitest tests that validate external behavior. Prefer small fixture CSV rows and pure mapping functions over brittle tests tied only to the full real CSV.

### Local Supabase Chapter Validation Shape

Source: `lib/database.generated.ts`

```ts
chapter: {
  Row: {
    city: string | null
    id: string
    name: string
    region: string | null
    university: string
  }
}
```

When `--validate-local` is enabled, query only chapter IDs/names/university from local Supabase and fail if mapped IDs are absent.

### Existing Member ID Rule

Source: `lib/utils/member-id.ts`

```ts
const RANDOM_MIN = 100001
const RANDOM_MAX = 999999
```

Dry-run artifacts should record `member_id_strategy=generate_on_import` and should not call the generator.

### Package/Validation Commands

Source: `package.json`

```json
"test": "vitest run",
"lint": "eslint .",
"build": "next build"
```

Use targeted Vitest during implementation, then run lint/build when feasible.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/data-import/chapter-eboard-chapter-mapping.json` | Create | Versioned chapter alias to canonical local chapter ID mapping. |
| `docs/data-import/chapter-eboard-role-mapping.json` | Create | Versioned raw role pattern to role level, functional area, app role recommendation, and confidence mapping. |
| `docs/data-import/chapter-eboard-major-mapping.json` | Create | Versioned raw major pattern to standardized major/family/confidence mapping. |
| `lib/data-import/chapter-eboard-normalizer.ts` | Create | Pure normalization engine with parsing, mapping, dedupe, status assignment, reviewer assignment, and report model generation. |
| `lib/data-import/__tests__/chapter-eboard-normalizer.test.ts` | Create | Unit tests for mapping, dedupe, status, editor recommendation, no admin role, no final member IDs, and output grouping. |
| `scripts/data-import/normalize-chapter-eboard.ts` | Create | CLI wrapper for reading CSV, optional local chapter validation, and writing dry-run artifacts. |
| `.gitignore` | Update if needed | Ensure generated `tmp/imports/` artifacts remain local if not already ignored. |
| `.github/reports/issue-116-chapter-eboard-import-dry-run-normalization-report.md` | Create during implementation | Summarize implementation, generated artifacts, validation results, and follow-up import issue recommendation. |
| `.github/plans/issue-116-chapter-eboard-import-dry-run-normalization.plan.md` | Update during implementation | Track task completion. |

## Output Artifacts

Generated outputs should default to `tmp/imports/chapter-eboard/`.

| Artifact | Purpose |
| --- | --- |
| `chapter-eboard-normalized.csv` | Master normalized one-row-per-canonical-person decision artifact. |
| `chapter-eboard-review-queue.csv` | Rows that need chapter/executive/data review. |
| `chapter-eboard-editor-approval.csv` | Rows where editor access is recommended and must be approved. |
| `chapter-eboard-chapter-reviewers.csv` | Chapter reviewer assignments: president primary, VP backup, Chief of Staff operational backup when present. |
| `chapter-eboard-validation-report.md` | Human-readable summary of counts, blockers, review needs, mappings, and no-DB-write confirmation. |
| `chapter-eboard-validation-summary.json` | Machine-readable summary for future import tooling. |

## Data Model For Normalized Rows

The normalized artifact should include at least:

- `source_file`
- `source_row_numbers`
- `raw_name`
- `clean_name`
- `raw_email`
- `normalized_email`
- `raw_confirm_email`
- `email_valid`
- `email_confirm_matches`
- `raw_phone`
- `normalized_phone`
- `phone_valid`
- `raw_chapter`
- `canonical_chapter_id`
- `canonical_chapter_name`
- `raw_title`
- `display_title`
- `role_level`
- `functional_area`
- `role_mapping_confidence`
- `raw_major`
- `standardized_major`
- `major_family`
- `major_mapping_confidence`
- `proposed_app_role`
- `proposed_membership_position`
- `proposed_identity_type`
- `member_id_strategy`
- `is_recruiter_visible`
- `review_required`
- `review_reasons`
- `import_status`
- `primary_chapter_reviewer_name`
- `primary_chapter_reviewer_email`
- `backup_chapter_reviewer_name`
- `backup_chapter_reviewer_email`
- `executive_review_required`
- `notes`

## Import Status Rules

Use explicit statuses:

- `ready_member_import`
- `ready_editor_review`
- `needs_chapter_review`
- `needs_data_review`
- `blocked_unmapped_chapter`
- `blocked_invalid_email`
- `blocked_duplicate_identity`

Any row with proposed `editor` access should require review and appear in the editor approval artifact.

## Tasks

### Task 1: Create Versioned Chapter Mapping Config

- **Files**:
  - `docs/data-import/chapter-eboard-chapter-mapping.json`
- **Implement**:
  - Map CSV aliases to canonical chapter IDs:
    - `UP` -> `leadpacifico`
    - `PUCP` -> `leadpucp`
    - `TECSUP` -> `leadtecsup`
    - `UCSUR` -> `leaducsur`
    - `UNI` -> `leaduni`
    - `UNMSM` -> `leadunmsm`
    - `UNSA` -> `leadunsa`
    - `UPC` -> `leadupc`
    - `UPN` -> `leadupn`
    - `UPN-Trujillo` / variants -> `leadupntrujillo`
    - `USIL` -> `leadusil`
    - `UTEC` -> `leadutec`
    - `UTP` -> `leadutp`
    - `UNFV` -> `leadvillareal`
  - Include canonical display names and notes.
  - Do not include a broad `other` fallback.
- **Validate**:
  - Mapping config is valid JSON.

### Task 2: Create Versioned Role Mapping Config

- **Files**:
  - `docs/data-import/chapter-eboard-role-mapping.json`
- **Implement**:
  - Encode role patterns into:
    - `role_level`
    - `functional_area`
    - `proposed_app_role`
    - `proposed_membership_position`
    - `proposed_identity_type`
    - `confidence`
    - `requires_review`
  - Cover known raw role families from `Sheet1`: president/presidenta, vice president variants, VP, Chief of Staff, secretary, treasurer/finance, director, subdirector, coordinator, volunteer.
  - Cover functional areas: marketing/communications, finance/legal, people/talent, chapter development, academic excellence, professional development, community impact, women in STEM, innovation/technology, partnerships/external relations, entrepreneurship, strategy/operations, general leadership, other.
  - Ensure no mapping proposes `admin`.
- **Validate**:
  - Mapping config is valid JSON.

### Task 3: Create Versioned Major Mapping Config

- **Files**:
  - `docs/data-import/chapter-eboard-major-mapping.json`
- **Implement**:
  - Map common variants into exact standardized display majors and broad families.
  - Include confidence values and fallback `Otra / Por confirmar`.
  - Cover common observed variants: Sistemas, Software, Industrial, Telecomunicaciones, Informatica, Computer Science, Administracion, Marketing, Negocios Internacionales, Economia, Derecho, Finanzas, Comunicaciones, Relaciones Internacionales, Diseno y Desarrollo de Software, Mecatronica.
- **Validate**:
  - Mapping config is valid JSON.

### Task 4: Implement Pure Normalization Engine

- **Files**:
  - `lib/data-import/chapter-eboard-normalizer.ts`
- **Implement**:
  - Parse CSV content without DB writes.
  - Detect header variants from the Microsoft/Form CSV export:
    - name
    - email
    - confirm email
    - chapter
    - title/role
    - major
    - phone
  - Normalize email, name whitespace, chapter aliases, title, role, major, and phone.
  - Deduplicate by normalized email.
  - Preserve source row numbers and raw duplicate details.
  - Assign import status and review reasons.
  - Assign reviewer candidates by chapter using normalized president/VP/Chief of Staff rows.
  - Produce grouped outputs for normalized rows, review queue, editor approval queue, chapter reviewers, and summary.
  - Keep no Supabase client dependency in the pure engine.
- **Validate**:
  - Unit tests cover pure engine behavior.

### Task 5: Implement Optional Local Chapter Validation Adapter

- **Files**:
  - `lib/data-import/chapter-eboard-normalizer.ts` or a small helper under `lib/data-import/`
  - `scripts/data-import/normalize-chapter-eboard.ts`
- **Implement**:
  - When `--validate-local` is passed, read `.env.local` values and query local Supabase `chapter`.
  - Validate that all mapped canonical chapter IDs exist.
  - Fail hard with a clear error when local Docker is unreachable or mapped IDs are missing.
  - Keep this adapter out of the pure mapper tests where possible.
- **Validate**:
  - Dry-run with local Docker available.

### Task 6: Implement CLI Wrapper

- **Files**:
  - `scripts/data-import/normalize-chapter-eboard.ts`
- **Implement**:
  - Accept:
    - `--source`
    - `--out`
    - `--validate-local`
  - Default source:
    - `docs/Registro de Junta Ejecutiva(Sheet1).csv`
  - Default output:
    - `tmp/imports/chapter-eboard`
  - Load mapping configs.
  - Run normalizer.
  - Write CSV, JSON, and Markdown artifacts.
  - Print concise summary only; do not dump full PII-heavy data to terminal.
- **Validate**:
  - Command runs locally and writes artifacts.

### Task 7: Add Tests

- **Files**:
  - `lib/data-import/__tests__/chapter-eboard-normalizer.test.ts`
- **Implement**:
  - Fixture-driven tests for:
    - header detection
    - chapter alias mapping
    - unmapped chapter blocking
    - duplicate identical email dedupe
    - duplicate conflicting email review/block behavior
    - role mapping for key examples
    - functional area mapping for key examples
    - major mapping for key examples
    - proposed editor access always review-required
    - app role never `admin`
    - company visibility false
    - member ID strategy `generate_on_import`
    - output grouping counts
  - Include one test around the real CSV only if it remains stable enough; otherwise keep real CSV validation as implementation evidence rather than brittle unit test.
- **Validate**:
  - `pnpm test -- lib/data-import/__tests__/chapter-eboard-normalizer.test.ts`

### Task 8: Generate Dry-run Artifacts From Real CSV

- **Files**:
  - `tmp/imports/chapter-eboard/*`
  - `.github/reports/issue-116-chapter-eboard-import-dry-run-normalization-report.md`
- **Implement**:
  - Run the CLI against `Sheet1`.
  - Run once with `--validate-local` if local Docker is available.
  - Confirm outputs include:
    - normalized master
    - review queue
    - editor approval queue
    - chapter reviewers
    - validation report
    - JSON summary
  - Record counts and blockers in report.
- **Validate**:
  - No DB writes occurred.

### Task 9: Update GitHub Issue #116

- **Files**:
  - GitHub issue #116
- **Implement**:
  - Add a comment linking:
    - source PRD
    - plan file
    - generated report
  - Move status label from `piv-status:plan-ready` to `piv-status:review` after implementation, if following prior issue flow.
  - Create follow-up issue for actual local Docker import only after dry-run artifacts are reviewed, not during this implementation unless the user asks.
- **Validate**:
  - Issue reflects current state.

## Validation Commands

Targeted validation:

```bash
pnpm test -- lib/data-import/__tests__/chapter-eboard-normalizer.test.ts
```

Dry-run validation:

```bash
pnpm tsx scripts/data-import/normalize-chapter-eboard.ts --source "docs/Registro de Junta Ejecutiva(Sheet1).csv" --out tmp/imports/chapter-eboard --validate-local
```

Repo validation when feasible:

```bash
pnpm run lint
pnpm run build
```

## Acceptance Criteria

- [ ] A versioned chapter mapping config exists and covers all expected e-board CSV chapters.
- [ ] A versioned role mapping config exists and never proposes app role `admin`.
- [ ] A versioned major mapping config exists and preserves confidence/fallback behavior.
- [ ] A reusable dry-run CLI exists.
- [ ] The dry-run CLI writes all required output artifacts.
- [ ] The dry-run CLI performs no database writes.
- [ ] `--validate-local` validates mapped chapter IDs against local Docker.
- [ ] Unmapped chapters fail hard or produce blocking status.
- [ ] Duplicate emails are surfaced with review/blocking status instead of silently discarded.
- [ ] Proposed editor access is review-required.
- [ ] Company visibility defaults false.
- [ ] Final member IDs are not generated.
- [ ] The output assigns chapter reviewers where possible.
- [ ] The output separates normalized rows, review queue, editor approval queue, chapter reviewers, validation report, and JSON summary.
- [ ] Tests cover normalization and mapping behavior.
- [ ] Implementation report is created for #116.

## Follow-up Work

After this plan is implemented and reviewed, create a separate issue for actual local Docker import execution. That future issue should handle:

- creating/inviting auth users,
- inserting/updating `public.user`,
- inserting/updating `person_profile`,
- inserting/updating `chapter_membership`,
- generating global `LEAD-######` member IDs,
- creating `lead_identity`,
- validating counts,
- producing rollback notes,
- and preparing QA import only after local import is approved.

