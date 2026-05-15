# Plan: Roadmap Phase 1.2 - Pure E-board Normalization Engine

## Summary

Build a pure TypeScript normalization engine for chapter e-board import dry-runs. The engine should parse the e-board CSV shape, normalize and validate row data, apply the versioned mapping configs from #125, dedupe by normalized email, assign row statuses and review reasons, preserve raw values, and return grouped in-memory output models. It must not read/write databases, create auth users, generate member IDs, send invitations, write files, or touch QA/production.

This issue is the logic layer only. The CLI and artifact writer come later in #127.

## User Story

As Abigail and the LEAD activation team,  
I want a pure normalization engine for e-board CSV data,  
so that messy chapter leadership data can become deterministic, reviewable import models before any database write.

## Metadata

| Field | Value |
| --- | --- |
| Type | NEW_CAPABILITY |
| Complexity | HIGH |
| GitHub Issue | #126 |
| GitHub URL | `https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/126` |
| Parent Issue | #124 |
| Roadmap Phase | Phase 1.2 |
| Blocked By | #125, completed |
| Source PRD | `.github/PRDs/chapter-eboard-import-dry-run-normalization.prd.md` |
| Config Inputs | `docs/data-import/*.json` |
| Systems Affected | Service layer, tests, future CLI |

## Current Codebase Context

The repo requires business logic to live in `lib/services/` per `AGENTS.md` and `docs/adr/001-service-layer-pattern.md`. Existing services expose plain objects with pure helpers and async methods where needed. `lib/services/event-application.service.ts` is a good local pattern for pure validation/normalization helpers that are easy to unit test.

Relevant repo facts:

- `tsconfig.json` has `resolveJsonModule: true`, so tests can import JSON configs if needed.
- `vitest.config.ts` includes all `**/*.test.{ts,tsx}` files.
- `package.json` uses `pnpm test` / `vitest run`.
- #125 created:
  - `docs/data-import/chapter-eboard-chapter-mapping.json`
  - `docs/data-import/chapter-eboard-role-mapping.json`
  - `docs/data-import/chapter-eboard-major-mapping.json`

## Current Data Context

`docs/Registro de Junta Ejecutiva(Sheet1).csv` is the source of truth for the first e-board import. The CSV includes encoding artifacts and a role header split by a quoted comma:

| Field Needed | Observed Header Shape |
| --- | --- |
| name | `Nombres y Apellidos...` |
| email | `Email...` or `Email` |
| confirm email | `Confirmar Email...` |
| chapter | `Chapter...` |
| role/title | `Cargo que desempena...` split across quoted CSV header text |
| major | `Carrera` |
| phone | `Telefono de Contacto...` |

The engine should detect fields by normalized header meaning, not exact raw header text only.

## Design Decision

Create a pure service:

| File | Action | Purpose |
| --- | --- | --- |
| `lib/services/chapter-eboard-import.service.ts` | CREATE | Pure CSV parsing, normalization, mapping, dedupe, status assignment, and grouped output models. |
| `lib/services/__tests__/chapter-eboard-import.service.test.ts` | CREATE | Unit tests for mapping, dedupe, statuses, editor review rules, major mapping, and safety defaults. |
| `.github/plans/issue-126-chapter-eboard-normalization-engine.plan.md` | UPDATE | Mark implementation progress. |

The service should accept mapping config objects as parameters instead of reading files directly. This keeps the service pure and lets #127 own file loading and artifact writing.

## Proposed API

```ts
export const ChapterEboardImportService = {
  parseCsv(text: string): string[][],
  normalizeCsv(input: NormalizeCsvInput): NormalizeCsvResult,
  normalizeRows(input: NormalizeRowsInput): NormalizeCsvResult,
}
```

Recommended input shape:

```ts
export type NormalizeRowsInput = {
  rows: Record<string, string>[]
  chapterMapping: ChapterMappingConfig
  roleMapping: RoleMappingConfig
  majorMapping: MajorMappingConfig
}
```

Recommended output shape:

```ts
export type NormalizedEboardRow = {
  sourceRowNumber: number
  status: 'ready' | 'needs_review' | 'blocked'
  reviewReasons: string[]
  raw: {
    name: string
    email: string
    confirmEmail: string
    chapter: string
    roleTitle: string
    major: string
    phone: string
  }
  normalized: {
    name: string
    email: string
    phone: string | null
    canonicalChapterId: string | null
    canonicalChapterName: string | null
    roleLevel: string
    functionalArea: string
    proposedAppRole: 'member' | 'editor'
    proposedMembershipPosition: string
    proposedIdentityType: string
    standardizedMajor: string
    majorFamily: string
    isRecruiterVisible: false
    memberIdStrategy: 'generate_on_import'
  }
  mapping: {
    chapterConfidence: 'high' | 'medium' | 'low' | 'none'
    roleConfidence: 'high' | 'medium' | 'low'
    majorConfidence: 'high' | 'medium' | 'low'
    proposedEditorRequiresReview: boolean
  }
}
```

Recommended result shape:

```ts
export type NormalizeCsvResult = {
  rows: NormalizedEboardRow[]
  readyRows: NormalizedEboardRow[]
  reviewRows: NormalizedEboardRow[]
  blockedRows: NormalizedEboardRow[]
  duplicates: DuplicateGroup[]
  summary: {
    totalRows: number
    readyCount: number
    reviewCount: number
    blockedCount: number
    duplicateEmailCount: number
  }
}
```

## Normalization Rules

### CSV/Header Rules

- Parse quoted CSV values safely enough for the e-board file shape.
- Detect expected fields by normalizing headers:
  - lowercase,
  - trim,
  - remove accents,
  - strip mojibake replacement artifacts where practical,
  - collapse whitespace,
  - match by key terms like `nombres`, `email`, `confirmar`, `chapter`, `cargo`, `carrera`, `telefono`.
- If required headers are missing, return a blocked result or throw a clear service error. Prefer a typed error/result over silent failure.

### Email Rules

- Trim and lowercase emails.
- Validate basic email shape.
- If email is missing or invalid, row is `blocked`.
- If confirm email exists and does not match normalized email, row is `needs_review` or `blocked` depending on severity. For this issue, mark `needs_review` unless the primary email is invalid.
- Dedupe by normalized lowercase email.
- Identical duplicate rows can collapse into one canonical row with a duplicate note.
- Conflicting duplicates should be represented in `duplicates` and mark affected row(s) `needs_review`.

### Chapter Rules

- Map chapter aliases through `chapterMapping`.
- Preserve raw chapter.
- If chapter cannot be mapped, row is `blocked`.
- Do not fall back to `other`.

### Role Rules

- Preserve raw role title.
- Apply role mappings by normalized substring or token matching.
- Prefer more specific matches before generic matches:
  - president before director,
  - vice president before president,
  - chief of staff before staff/generic operations,
  - functional-area mappings before generic director/coordinator where needed.
- Proposed app role must be only `member` or `editor`.
- Never return `admin`.
- Every `editor` recommendation must set `proposedEditorRequiresReview=true` and make row `needs_review`.

### Major Rules

- Preserve raw major.
- Apply major mapping by normalized substring or exact normalized alias.
- Use default low-confidence mapping for missing/unknown values.
- Low-confidence major should add review reason but should not block the row by itself.

### Safety Defaults

- `normalized.isRecruiterVisible` must always be `false`.
- `normalized.memberIdStrategy` must always be `generate_on_import`.
- Do not call `generateUniqueMemberId`.
- Do not import Supabase clients.

## Tasks

### Task 1: Define Types And Pure Service Shell

Status: Completed

- **File**: `lib/services/chapter-eboard-import.service.ts`
- **Action**: CREATE
- **Implement**:
  - Export mapping config types matching the #125 JSON shapes.
  - Export normalized row/result types.
  - Export `ChapterEboardImportService` object.
  - Keep all logic pure and dependency-free.
- **Validate**:
  - `pnpm test -- --runInBand` is not required; use targeted Vitest after tests exist.

### Task 2: Implement Text Normalization And CSV Parsing

Status: Completed

- **File**: `lib/services/chapter-eboard-import.service.ts`
- **Action**: UPDATE
- **Implement**:
  - Add `normalizeTextForMatch`.
  - Add small CSV parser that handles commas, quotes, escaped quotes, CRLF, and blank trailing lines.
  - Add header detection helpers.
  - Convert parsed CSV to raw row records with row numbers.
- **Validate**:
  - Unit test quoted role header and simple data rows.

### Task 3: Implement Chapter, Role, And Major Mapping

Status: Completed

- **File**: `lib/services/chapter-eboard-import.service.ts`
- **Action**: UPDATE
- **Implement**:
  - Match chapter aliases from config.
  - Match role mappings from config with specific-before-generic behavior.
  - Match major mappings from config.
  - Preserve raw values.
- **Validate**:
  - Unit tests for UP, UNFV/Villarreal, UPN-Trujillo, Presidenta, VP, Chief of Staff, Marketing, Impacto Comunitario, Lead Academia, Ing. Sistemas, Administracion y Marketing, Computer Science.

### Task 4: Implement Row Status And Safety Rules

Status: Completed

- **File**: `lib/services/chapter-eboard-import.service.ts`
- **Action**: UPDATE
- **Implement**:
  - Status values: `ready`, `needs_review`, `blocked`.
  - Review reasons for confirm-email mismatch, low-confidence role/major, editor approval, duplicate conflicts.
  - Block reasons for invalid email and unmapped chapter.
  - Force company visibility false and member ID strategy generate-on-import.
  - Guard against `admin` from bad config by downgrading or blocking. Prefer blocking with explicit reason if mapping proposes a disallowed role.
- **Validate**:
  - Unit tests for no-admin, no-visibility, no-final-member-ID behavior.

### Task 5: Implement Dedupe And Grouped Results

Status: Completed

- **File**: `lib/services/chapter-eboard-import.service.ts`
- **Action**: UPDATE
- **Implement**:
  - Group by normalized email.
  - Produce duplicate groups.
  - Identical duplicates should not double count ready rows.
  - Conflicting duplicates should be marked `needs_review`.
  - Produce `readyRows`, `reviewRows`, `blockedRows`, and summary counts.
- **Validate**:
  - Unit tests for identical duplicate and conflicting duplicate behavior.

### Task 6: Add Unit Tests

Status: Completed

- **File**: `lib/services/__tests__/chapter-eboard-import.service.test.ts`
- **Action**: CREATE
- **Implement**:
  - Use small fixture strings/row objects instead of depending on the full real CSV for every test.
  - Import the #125 JSON configs where useful.
  - Cover acceptance criteria from #126.
- **Validate**:
  - `pnpm test -- lib/services/__tests__/chapter-eboard-import.service.test.ts`

### Task 7: Optional Real CSV Smoke Test

Status: Completed

- **File**: `lib/services/__tests__/chapter-eboard-import.service.test.ts`
- **Action**: UPDATE
- **Implement**:
  - Add one integration-style test that reads `docs/Registro de Junta Ejecutiva(Sheet1).csv` with `fs`.
  - It should assert the service can parse and normalize without DB writes.
  - Keep assertions high-level to avoid making the test brittle.
- **Validate**:
  - Targeted Vitest test passes.

### Task 8: Update Plan And GitHub Issue

Status: Completed

- **Files**:
  - `.github/plans/issue-126-chapter-eboard-normalization-engine.plan.md`
  - GitHub issue #126
- **Action**: UPDATE
- **Implement**:
  - Mark tasks complete during implementation.
  - Comment on #126 with files changed and validation results.
  - Close #126 only when all acceptance criteria pass.

## Validation Commands

Primary:

```bash
pnpm test -- lib/services/__tests__/chapter-eboard-import.service.test.ts
```

Safety grep:

```bash
rg "generateUniqueMemberId|from\\('chapter_membership'\\)|from\\(\"chapter_membership\"\\)|SupabaseClient" lib/services/chapter-eboard-import.service.ts
rg "'admin'|\"admin\"" lib/services/chapter-eboard-import.service.ts
```

Optional broader checks if the change is small and time allows:

```bash
pnpm test
pnpm run lint
```

## Acceptance Criteria

- [x] Normalizer detects the expected CSV headers for name, email, confirm email, chapter, role/title, major, and phone.
- [x] Emails are normalized, validated, and deduped by lowercase email.
- [x] Confirm-email mismatches are detected.
- [x] Chapter aliases are mapped through config and unmapped chapters produce blocking status.
- [x] Role titles are mapped to role level and functional area.
- [x] Proposed app role is only `member` or `editor` for e-board rows.
- [x] Proposed editor access always requires review.
- [x] No row can receive proposed app role `admin`.
- [x] Major values are standardized with raw values preserved.
- [x] Company visibility defaults to false.
- [x] Member ID strategy is `generate_on_import`; final member IDs are not generated.
- [x] Unit tests cover mapping, dedupe, review statuses, editor recommendations, major mapping, and no-admin/no-visibility defaults.

## Implementation Results

Created:

- `lib/services/chapter-eboard-import.service.ts`
- `lib/services/__tests__/chapter-eboard-import.service.test.ts`

Validation completed:

- `pnpm test -- lib/services/__tests__/chapter-eboard-import.service.test.ts`
  - 10 tests passed.
- `pnpm exec eslint lib/services/chapter-eboard-import.service.ts lib/services/__tests__/chapter-eboard-import.service.test.ts`
  - Passed.
- Purity/safety scans:
  - No `generateUniqueMemberId` reference.
  - No `SupabaseClient` reference.
  - No `chapter_membership` database reference.
  - No app-role admin literal in the service.

## Out Of Scope

- Writing generated artifacts to disk.
- CLI command or script.
- Local Docker chapter ID validation.
- Supabase queries.
- Auth user creation.
- Database writes.
- Member ID generation.
- QA data changes.
- Production changes.
- Human review file formatting.

## Follow-up

After #126 is complete, implement #127:

> Roadmap Phase 1.3: Add e-board dry-run CLI and artifact writer.
