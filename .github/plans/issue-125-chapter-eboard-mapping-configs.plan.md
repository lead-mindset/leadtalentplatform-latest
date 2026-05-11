# Plan: Roadmap Phase 1.1 - Chapter E-board Mapping Configs

## Summary

Create the versioned mapping configuration files that define how the chapter e-board CSV will be interpreted by the later dry-run workflow. This issue creates the rules layer only: chapter aliases map to canonical local chapter IDs, raw e-board titles map to standardized role levels and functional areas, and raw majors/careers map to standardized major names with confidence and review behavior.

This issue intentionally does **not** implement the normalization engine, dry-run CLI, database import, auth users, member IDs, QA updates, or production changes.

## User Story

As Abigail and the LEAD activation team,  
I want versioned mapping rules for chapters, roles, and majors,  
so that the e-board import dry run uses consistent operating-model decisions instead of hidden one-off script logic.

## Metadata

| Field | Value |
| --- | --- |
| Type | NEW_CAPABILITY / Data Import Configuration |
| Complexity | MEDIUM |
| GitHub Issue | #125 |
| GitHub URL | `https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/125` |
| Parent Issue | #124 |
| Roadmap Phase | Phase 1.1 |
| Source PRD | `.github/PRDs/chapter-eboard-import-dry-run-normalization.prd.md` |
| Decision Doc | `docs/handbook/CHAPTER-ROLE-TAXONOMY-AND-MEMBER-IMPORT-DECISIONS.md` |
| Systems Affected | Documentation, import config, future dry-run normalizer |

## Current Codebase Context

The repo already uses the layered account model defined in `AGENTS.md` and existing docs:

- `public.user` owns app account and global app role.
- `person_profile` owns reusable member profile data and recruiter visibility.
- `chapter_membership` owns chapter membership, approval state, member ID, and chapter position.
- `lead_identity` owns official LEAD identity display.
- `recruiter_access` owns company/recruiter access.

Important current decisions:

- `docs/handbook/CHAPTER-ROLE-TAXONOMY-AND-MEMBER-IMPORT-DECISIONS.md:32` establishes `Sheet1` as the first import source of truth.
- `docs/handbook/CHAPTER-ROLE-TAXONOMY-AND-MEMBER-IMPORT-DECISIONS.md:52` says e-board rows should not automatically become platform admins.
- `docs/handbook/CHAPTER-ROLE-TAXONOMY-AND-MEMBER-IMPORT-DECISIONS.md:63` says default everyone to `member`; promote only President, VP, Chief of Staff, or selected operators to `editor`.
- `docs/handbook/CHAPTER-ROLE-TAXONOMY-AND-MEMBER-IMPORT-DECISIONS.md:250` warns not to overload `chapter_membership.position` with every raw chapter title.
- `supabase/seed.sql:1` includes the canonical local chapter IDs and also includes `other`, which must not become a silent fallback for this import.
- `lib/utils/member-id.ts:42` generates global `LEAD-######` IDs, but this issue must not generate member IDs.
- `package.json:18` defines the test command as `vitest run`; JSON config validation can be done with `node`.

## Current Data Context

The relevant CSVs are under `docs/`.

Observed shape of `docs/Registro de Junta Ejecutiva(Sheet1).csv`:

| Index | Column |
| --- | --- |
| 0 | `Id` |
| 1 | `Start time` |
| 2 | `Completion time` |
| 3 | `Email` |
| 4 | `Name` |
| 5 | `Nombres y Apellidos�` |
| 6 | `Email�` |
| 7 | `Confirmar Email�` |
| 8 | `Chapter�` |
| 9-10 | Split quoted role title header |
| 11 | `Carrera` |
| 12 | `Tel�fono de Contacto` |

The CSV has encoding artifacts, so mapping aliases should be robust to accents, mojibake, spacing, punctuation, and common variants. The actual parsing/normalization behavior belongs to #126, but #125 should provide enough aliases/patterns for #126 to consume.

## Safety Rules

- Do not write to local Docker, QA, or production.
- Do not create auth users.
- Do not generate member IDs.
- Do not create import artifacts from the real CSV.
- Do not include full member PII in mapping configs.
- Do not use `other` as a silent chapter fallback.
- Do not propose app role `admin`.
- Do not treat e-board rows as platform admins.
- Keep company/recruiter visibility out of scope and implicitly false-by-default for future import consumers.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/data-import/chapter-eboard-chapter-mapping.json` | CREATE | Canonical chapter alias mapping from CSV values to local chapter IDs. |
| `docs/data-import/chapter-eboard-role-mapping.json` | CREATE | Raw title pattern mapping to role level, functional area, app role recommendation, membership position, identity type, confidence, and review requirement. |
| `docs/data-import/chapter-eboard-major-mapping.json` | CREATE | Major/career variant mapping to standardized major, broad family, confidence, and review requirement. |
| `.github/plans/issue-125-chapter-eboard-mapping-configs.plan.md` | UPDATE | Mark task progress during implementation. |

## Config Shape

### Chapter Mapping

Use JSON because the immediate acceptance criteria require valid JSON configs.

Recommended shape:

```json
{
  "version": 1,
  "source": "chapter_eboard_csv_2026_05",
  "noFallback": true,
  "normalizationHints": ["trim", "lowercase", "remove_accents", "collapse_whitespace"],
  "chapters": [
    {
      "canonicalChapterId": "leaduni",
      "canonicalName": "LEAD UNI",
      "aliases": ["UNI", "LEAD UNI"],
      "notes": "Universidad Nacional de Ingenieria"
    }
  ]
}
```

Required canonical mappings:

| CSV Alias | Canonical Chapter ID |
| --- | --- |
| UP | `leadpacifico` |
| PUCP | `leadpucp` |
| TECSUP | `leadtecsup` |
| UCSUR | `leaducsur` |
| UNI | `leaduni` |
| UNMSM | `leadunmsm` |
| UNSA | `leadunsa` |
| UPC | `leadupc` |
| UPN | `leadupn` |
| UPN-Trujillo | `leadupntrujillo` |
| USIL | `leadusil` |
| UTEC | `leadutec` |
| UTP | `leadutp` |
| UNFV | `leadvillareal` |

Include alias variants for:

- accents and no-accents,
- spacing and hyphen variants,
- `UPN Trujillo` / `UPN-Trujillo` / `UPN - Trujillo`,
- `UNFV` / `Villarreal` / `Villareal`,
- `Universidad ...` long names where obvious.

### Role Mapping

Recommended shape:

```json
{
  "version": 1,
  "source": "chapter_eboard_csv_2026_05",
  "allowedProposedAppRoles": ["member", "editor"],
  "default": {
    "roleLevel": "member",
    "functionalArea": "other",
    "proposedAppRole": "member",
    "proposedMembershipPosition": "member",
    "proposedIdentityType": "chapter_member",
    "confidence": "low",
    "requiresReview": true
  },
  "mappings": [
    {
      "id": "president",
      "match": ["presidente", "presidenta"],
      "roleLevel": "president",
      "functionalArea": "general_leadership",
      "proposedAppRole": "editor",
      "proposedMembershipPosition": "president",
      "proposedIdentityType": "chapter_editor",
      "confidence": "high",
      "requiresReview": true
    }
  ]
}
```

Role levels to support:

- `president`
- `vice_president`
- `chief_of_staff`
- `director`
- `subdirector`
- `coordinator`
- `analyst`
- `volunteer`
- `member`
- `advisor`

Functional areas to support:

- `general_leadership`
- `strategy_operations`
- `marketing_communications`
- `finance_legal`
- `people_talent`
- `chapter_development`
- `events_experience`
- `academic_excellence`
- `professional_development`
- `community_impact`
- `women_in_stem`
- `innovation_technology`
- `partnerships_external_relations`
- `entrepreneurship`
- `other`

Permission rules:

- Allowed proposed app roles in this config: `member`, `editor`.
- Never propose `admin`.
- President, VP, and Chief of Staff may propose `editor`, but must set `requiresReview=true`.
- Directors, coordinators, volunteers, and default mappings should generally propose `member`.
- `proposedMembershipPosition` should stay conservative:
  - `president`,
  - `vice_president`,
  - `secretary`,
  - `treasurer`,
  - `editor`,
  - `member`.

### Major Mapping

Recommended shape:

```json
{
  "version": 1,
  "source": "chapter_eboard_csv_2026_05",
  "default": {
    "standardizedMajor": "Otra / Por confirmar",
    "majorFamily": "Other / Review",
    "confidence": "low",
    "requiresReview": true
  },
  "mappings": [
    {
      "id": "systems-engineering",
      "match": ["ingenieria de sistemas", "ingeniería de sistemas", "ing. sistemas"],
      "standardizedMajor": "Ingenieria de Sistemas",
      "majorFamily": "Computing / Technology",
      "confidence": "high",
      "requiresReview": false
    }
  ]
}
```

Major families to support:

- `Computing / Technology`
- `Engineering`
- `Business`
- `Marketing`
- `Economics / Finance`
- `Law`
- `Communications`
- `International Relations`
- `Other / Review`

High-priority variants to include:

- Ingenieria / Ingeniería de Sistemas
- Ing. Sistemas
- Ingenieria / Ingeniería de Software
- Diseno / Diseño y Desarrollo de Software
- Computer Science / Ciencia de la Computacion / Ciencia de la Computación
- Ingenieria Industrial
- Telecomunicaciones
- Informatica / Informática
- Mecatronica / Mecatrónica
- Administracion / Administración
- Administracion y Marketing
- Administracion y Negocios Internacionales
- Marketing
- Economia / Economía
- Finanzas
- Derecho
- Comunicaciones
- Relaciones Internacionales

## Implementation Tasks

### Task 1: Create Data Import Config Directory

Status: Completed

- **File**: `docs/data-import/`
- **Action**: CREATE
- **Implement**:
  - Create directory for versioned import mapping configs.
  - Keep these configs under `docs/data-import` because they are operating-model import decisions, not runtime app state.
- **Validate**:
  - Directory exists.

### Task 2: Create Chapter Mapping Config

Status: Completed

- **File**: `docs/data-import/chapter-eboard-chapter-mapping.json`
- **Action**: CREATE
- **Implement**:
  - Add version metadata.
  - Add `noFallback: true`.
  - Add all required canonical chapter IDs.
  - Add aliases for abbreviations, long names, accents, common spelling variants, and UPN Trujillo / UNFV variants.
  - Do not map unknown values to `other`.
- **Validate**:
  - JSON parses.
  - All 14 expected canonical chapter IDs appear.
  - Config contains `noFallback: true`.

### Task 3: Create Role Mapping Config

Status: Completed

- **File**: `docs/data-import/chapter-eboard-role-mapping.json`
- **Action**: CREATE
- **Implement**:
  - Add version metadata.
  - Add default mapping requiring review.
  - Add leadership mappings for President/Presidenta, Vice President/Vicepresidente/Vicepresidenta/VP, and Chief of Staff/Jefe de personal.
  - Add governance/support mappings for secretary, treasurer/finance, logistics, director, subdirector, coordinator, analyst, volunteer, and advisor.
  - Add functional-area mappings for marketing, academic excellence / lead academia, professional development, community impact / impact lab, women in STEM / impulso femenino, people/talent/RRHH/GTH, chapter development, partnerships/external relations, legal, technology/innovation, entrepreneurship, and events/experience.
  - Ensure every editor recommendation has `requiresReview: true`.
  - Ensure no mapping proposes `admin`.
- **Validate**:
  - JSON parses.
  - Search confirms no `"proposedAppRole": "admin"`.
  - Search confirms editor mappings require review.

### Task 4: Create Major Mapping Config

Status: Completed

- **File**: `docs/data-import/chapter-eboard-major-mapping.json`
- **Action**: CREATE
- **Implement**:
  - Add version metadata.
  - Add default low-confidence review mapping.
  - Add high-priority variants listed above.
  - Use standardized display names consistently.
  - Include broad major family, confidence, and review flag.
- **Validate**:
  - JSON parses.
  - Common variants such as `ing. sistemas`, `administracion y marketing`, and `computer science` are covered.

### Task 5: Validate Config Syntax And Safety

Status: Completed

- **Files**:
  - `docs/data-import/chapter-eboard-chapter-mapping.json`
  - `docs/data-import/chapter-eboard-role-mapping.json`
  - `docs/data-import/chapter-eboard-major-mapping.json`
- **Action**: VALIDATE
- **Implement**:
  - Parse all three JSON files with Node.
  - Check chapter count and required IDs.
  - Check no admin role is proposed.
  - Check no chapter fallback is enabled.
- **Validate**:

```bash
node -e "const fs=require('fs'); const files=['docs/data-import/chapter-eboard-chapter-mapping.json','docs/data-import/chapter-eboard-role-mapping.json','docs/data-import/chapter-eboard-major-mapping.json']; for (const f of files) { JSON.parse(fs.readFileSync(f,'utf8')); console.log('ok', f) }"
rg '\"proposedAppRole\"\\s*:\\s*\"admin\"' docs/data-import
rg '\"noFallback\"\\s*:\\s*true' docs/data-import/chapter-eboard-chapter-mapping.json
```

### Task 6: Update Plan And GitHub Issue

Status: Completed

- **Files**:
  - `.github/plans/issue-125-chapter-eboard-mapping-configs.plan.md`
  - GitHub issue #125
- **Action**: UPDATE
- **Implement**:
  - Mark completed tasks in this plan during implementation.
  - Comment on #125 with created config paths and validation results.
  - Close #125 only when acceptance criteria are met.
- **Validate**:
  - GitHub issue references the config files and validation command output.

## Acceptance Criteria

- [x] Chapter mapping config exists and maps all expected CSV chapters to canonical local chapter IDs.
- [x] Chapter mapping includes UP, PUCP, TECSUP, UCSUR, UNI, UNMSM, UNSA, UPC, UPN, UPN-Trujillo, USIL, UTEC, UTP, and UNFV.
- [x] No silent `other` fallback is used.
- [x] Role mapping config exists and maps raw title patterns to role level, functional area, proposed app role, proposed membership position, proposed identity type, confidence, and review requirement.
- [x] Role mapping never proposes app role `admin`.
- [x] Major mapping config exists and maps observed/high-priority major variants to standardized major, family, confidence, and review flag.
- [x] Raw values are expected to be preserved by future consumers of these mappings.
- [x] All mapping config files are valid JSON.

## Implementation Results

Created:

- `docs/data-import/chapter-eboard-chapter-mapping.json`
- `docs/data-import/chapter-eboard-role-mapping.json`
- `docs/data-import/chapter-eboard-major-mapping.json`

Validation completed:

- Parsed all three JSON files with Node.
- Confirmed all 14 expected canonical chapter IDs exist.
- Confirmed `noFallback` is `true`.
- Confirmed no role mapping proposes `admin`.
- Confirmed every `editor` recommendation requires review.
- Confirmed high-priority major variants include `ing. sistemas`, `administracion y marketing`, and `computer science`.

## Out Of Scope

- Normalization engine implementation.
- CSV parser implementation.
- Dry-run artifact generation.
- Local Docker writes.
- QA writes.
- Production writes.
- Supabase auth user creation.
- Invitation emails.
- Member ID creation.
- Schema changes for long-term role taxonomy.
- Admin/chapter reviewer UI.

## Follow-up

After #125 is complete, implement #126:

> Roadmap Phase 1.2: Build pure e-board normalization engine and unit tests.
