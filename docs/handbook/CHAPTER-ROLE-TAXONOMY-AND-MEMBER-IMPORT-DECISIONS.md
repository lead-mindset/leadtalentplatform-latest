# Chapter Role Taxonomy and Member Import Decisions

Last updated: 2026-05-10

## Purpose

This document records the current decision context for cleaning chapter executive board data and preparing it for import into LEAD Talent Platform.

The goal is not only to clean CSV data. The goal is to move LEAD toward a more stable, scalable, and sustainable operating model.

## Current Data Context

The current chapter executive board data comes from CSV files under `docs/`.

The strongest source appears to be:

- `docs/Registro de Junta Ejecutiva(Sheet1).csv`

Analysis showed:

- `Sheet1` has 114 valid email rows.
- `Sheet1` has 110 unique emails.
- The individual chapter CSVs combined have 95 unique emails.
- Every email in the individual chapter CSVs also appears in `Sheet1`.
- The individual chapter CSVs have 0 unique emails not present in `Sheet1`.
- `Sheet1` has 15 additional unique emails not found in individual chapter files:
  - 14 from UNSA.
  - 1 from UCSUR.

Decision:

> Use `Sheet1` as the source of truth for the first standardized import. Use individual chapter CSVs only as validation/backups, not as additional import input.

## Data Meaning

The current CSVs represent chapter executive board / leadership data, not the full LEAD member base.

These records should be treated as chapter leadership/member records, not platform admin records.

Decision:

> Imported chapter executive board members can become approved chapter members, but they should not automatically become platform admins.

## Permission Decision

Platform permissions and chapter titles are separate concepts.

For the immediate import:

- Most imported people should receive app role `member`.
- Only selected operational chapter leaders should receive app role `editor`.
- No imported chapter executive board member should receive app role `admin` from this CSV alone.

Recommended `editor` candidates:

- President / Presidenta.
- Vice President / Vicepresidente / Vicepresidenta / VP.
- Chief of Staff / Jefe de personal.
- One selected chapter operator if explicitly needed.

Decision:

> Default everyone to `member`; promote only President, VP, Chief of Staff, or selected operators to `editor`.

## Why Raw Roles Should Not Be Imported Directly

The current CSV contains many inconsistent role names. In analysis, `Sheet1` had 73 unique role strings across 114 rows.

Examples include:

- `Presidente`
- `Presidenta`
- `Vicepresidente`
- `Vicepresidenta`
- `VP`
- `Chief of Staff`
- `Chief of staff / Jefe de personal`
- `Directora de desarrollo profesional y academico`
- `Director de Lead Academia`
- `Directora de impacto comunitario`
- `Director de Logistica y Finanzas`
- `Pilar de Desarrollo de Capitulo`
- `Relaciones institucionales`
- `Voluntario`

Decision:

> Do not use raw CSV role strings as the platform's official role system.

## Long-Term Operating Model Direction

LEAD Talent Platform should support the future operating model LEAD wants to build, not simply mirror today's inconsistent chapter role naming.

The platform should eventually become the source of truth for official chapter structure.

However, this should happen with a transition layer:

- Preserve the original raw title for audit/history.
- Use standardized fields for dashboards, permissions, metrics, Impact Metrics, LEAD Pulse, and reporting.

Decision:

> Standardize around the future LEAD operating model while preserving raw current titles.

## Recommended Long-Term Role Structure

The long-term model should separate role meaning into multiple fields instead of forcing everything into one `position` value.

### Raw Title

The original title from the CSV or user input.

Example:

- `Directora de desarrollo profesional y academico`

Purpose:

- Audit.
- Historical context.
- Human nuance.

### Display Title

A cleaned human-readable title.

Example:

- `Directora de Desarrollo Profesional y Academico`

Purpose:

- UI display.
- Profiles.
- Rosters.

### Role Level

The person's structural level within the chapter.

Recommended values:

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

Purpose:

- Organizational structure.
- Leadership reporting.
- Training cohorts.
- Succession planning.

### Functional Area

The person's primary area of responsibility.

Recommended values:

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

Purpose:

- Reporting.
- Operating model consistency.
- Cross-chapter analysis.
- Impact Metrics responsibilities.
- LEAD Pulse segmentation.
- Leadership support and training.

### Platform Permission

The actual app access level.

Current values:

- `member`
- `editor`
- `admin`
- `recruiter`

Purpose:

- Access control.
- Security.
- Operational permissions.

### LEAD Identity Type

The person's official LEAD identity/status.

Current values:

- `founder`
- `staff`
- `chapter_editor`
- `chapter_member`
- `alumni`

Purpose:

- Official identity.
- Display.
- Status and recognition.

## Immediate Import Strategy

For speed and safety, do not block the first import on schema changes.

Immediate plan:

1. Use `Sheet1` as the raw source.
2. Create a normalized import artifact.
3. Deduplicate by email.
4. Normalize chapter names.
5. Normalize role level.
6. Normalize functional area.
7. Preserve raw title.
8. Assign app role conservatively.
9. Assign `chapter_membership.position` only using currently supported permission-relevant values.
10. Keep recruiter/company visibility disabled by default.

Decision:

> First create a clean normalized import file with role level, functional area, raw title, permission recommendation, and validation status. Add schema support later after validation.

## Current Schema Guidance

The current schema has `chapter_membership.position`, but that field should not be overloaded with every possible chapter title.

For now, use it conservatively for permission-relevant positions such as:

- `president`
- `vice_president`
- `secretary`
- `treasurer`
- `editor`
- `member`

If a raw role is more specific, such as `Directora de Mujeres en STEM`, preserve it in the normalized import artifact and map:

- role level: `director`
- functional area: `women_in_stem`
- app role: usually `member`
- chapter membership position: usually `member`

## Why This Matters

This structure will eventually help LEAD answer questions like:

- Which chapters have a president and VP registered?
- Which chapters are missing marketing, finance, or people/talent roles?
- How many leaders exist by functional area?
- Which chapter structures correlate with stronger LEAD Pulse results?
- Who should receive Impact Metrics responsibilities?
- Which leaders should be invited to role-specific training?
- Which chapters need operational support?
- Which leadership roles contribute to stronger event execution and member experience?

## Open Future Schema Consideration

After the normalized import is validated, consider adding explicit schema support for chapter role taxonomy.

Possible future fields/table:

- `chapter_role_assignment`
- `raw_title`
- `display_title`
- `role_level`
- `functional_area`
- `is_primary`
- `source`
- `verified_at`
- `verified_by`

This should be implemented later as a proper vertical slice with:

- Database migration.
- Service layer.
- Admin/chapter editor UI.
- Tests.
- QA validation.
- Import/update workflow.

