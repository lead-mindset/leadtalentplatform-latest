# PRD: Chapter E-board Import Dry-run Normalization and Validation

## Problem Statement

LEAD Talent Platform needs a fast, safe way to activate real organization members ahead of LEAD SPARK and future platform adoption. The current strongest available member dataset is the chapter executive board CSV export, but the data is not yet clean enough to insert directly into the platform schema.

The CSV data contains useful official chapter leadership information, but it also includes inconsistent role titles, duplicate emails, inconsistent academic major naming, chapter naming differences, and permission-sensitive leadership roles. Importing this data directly would risk creating incorrect memberships, over-permissioning chapter leaders, confusing platform admins with chapter leaders, and polluting the local Docker database that is currently being treated as the schema source of truth for QA and production cutover.

The immediate need is a dry-run normalization and validation workflow that transforms the raw chapter e-board CSV into reviewable, standardized import artifacts without writing to the database. This gives LEAD a controlled bridge between messy organizational data and a long-term sustainable operating model.

## Solution

Build a reusable dry-run data normalization workflow for the chapter executive board import.

The workflow will read the master e-board CSV, normalize and validate the data against the current local Docker schema, produce proposed import decisions, and generate human-review artifacts. It will not create auth users, write to local Docker, send invitations, update QA, or touch production.

The output should make the import decision transparent:

- Which people are ready for member import.
- Which people need chapter reviewer confirmation.
- Which people are proposed for editor access.
- Which duplicates were detected.
- Which roles were mapped to standardized role levels and functional areas.
- Which academic majors were standardized.
- Which chapters mapped to canonical local database chapter IDs.
- Which rows are blocked or require human review.

The dry run should support LEAD's future operating model rather than copying the current inconsistent role naming into the platform. Raw titles and raw majors should be preserved in generated artifacts, but standardized fields should be produced for review and future import.

## Ownership and Review Governance

This work requires a clear separation between technical/data ownership and organizational truth ownership.

Abigail should own the platform and data process, but Abigail should not be the only person responsible for confirming whether every chapter leader is still active or whether every role is organizationally accurate. The dry-run process should make the data reviewable so the right organizational owners can validate it before any database import happens.

### Abigail: Platform and Data Owner

Abigail owns:

- Building and maintaining the dry-run normalization workflow.
- Cleaning and standardizing the raw CSV data.
- Mapping the CSV data to the platform schema and future operating model.
- Detecting duplicates, invalid emails, unmapped chapters, unclear roles, and risky permission recommendations.
- Preparing review files for chapter and executive review.
- Protecting the platform permission model.
- Defining what is technically safe to import.
- Executing the final import only after review and approval in a later slice.

Abigail is not expected to personally know whether every chapter leader is currently active or whether every local chapter title is still accurate.

### Executive / Operations Review Group: Organizational Truth and Access Approval

The executive/operations review group should validate organizational truth and approve sensitive access decisions.

Recommended review group:

- Nicole Jimenez: operations owner.
- Antonny Porlles: strategy / COO alignment.
- Xiomara Landa: people and member experience.
- Christopher Lozada: Peru and chapter context.
- Abigail Briones: platform and data owner.

This group owns:

- Confirming whether the imported roster is organizationally accurate.
- Confirming which people are active or inactive.
- Confirming who should be trusted as chapter operators.
- Approving who receives platform `editor` access.
- Resolving unclear chapter, role, or access cases.
- Deciding whether the reviewed artifact is ready for the later database import slice.

### Chapter Presidents / VPs: Chapter-Level Verification

Chapter presidents should be the primary reviewers for their chapter roster when available. Vice presidents should act as backup reviewers. Chief of Staff may act as an operational backup when present.

Chapter reviewers own:

- Confirming their chapter roster.
- Correcting names, emails, titles, and active/inactive status.
- Confirming whether a person belongs to their chapter.
- Recommending who should operate the platform for their chapter.

Chapter reviewers do not have final authority to grant platform admin or editor permissions. They provide roster truth and recommendations; executive/staff admins approve final access.

### Responsibility Split

| Area | Owner |
| --- | --- |
| Data cleaning | Abigail |
| Technical validation | Abigail |
| Schema/import safety | Abigail |
| Chapter roster accuracy | Chapter Presidents / VPs |
| Cross-chapter organizational approval | Executive / Operations review group |
| Editor access approval | Executive / Operations review group + Abigail |
| Final import execution | Abigail, in a later import slice |
| QA/production rollout decision | Executive / Operations review group + Abigail |

### Review Flow

1. Abigail runs the dry-run workflow.
2. The workflow creates normalized artifacts, review queues, editor approval queues, reviewer assignments, and a validation report.
3. Chapter presidents/VPs verify chapter-level roster accuracy.
4. Executive/operations reviewers validate cross-chapter consistency and approve sensitive access decisions.
5. Abigail updates mappings or data artifacts based on review outcomes.
6. The executive/operations review group approves the final reviewed artifact.
7. A separate follow-up issue handles actual database import into local Docker.

## User Stories

1. As Abigail, I want to normalize the chapter e-board CSV before importing, so that I can avoid corrupting the local source-of-truth database with messy data.

2. As Abigail, I want a dry-run output before any database write, so that I can review decisions and correct mistakes safely.

3. As Abigail, I want the workflow to use `Sheet1` as the source of truth, so that the import includes the most complete known e-board dataset.

4. As Abigail, I want individual chapter CSVs treated as validation references only, so that duplicate split exports do not create duplicate members.

5. As Abigail, I want duplicate emails surfaced explicitly, so that identity conflicts are not silently discarded.

6. As Abigail, I want duplicate rows with conflicting chapter, name, or role data to require review, so that one email does not accidentally represent the wrong person or chapter.

7. As Abigail, I want every CSV chapter mapped to a canonical local database chapter ID, so that imported memberships attach to the correct chapter.

8. As Abigail, I want the dry run to fail hard on unmapped chapters, so that no row can be imported into an incorrect fallback chapter.

9. As Abigail, I want the workflow to validate mapped chapter IDs against local Docker, so that the artifact reflects the current schema source of truth.

10. As Abigail, I want chapter names like UP, UNFV, UPN-Trujillo, and UNSA mapped consistently, so that platform data matches canonical chapter records.

11. As Abigail, I want raw role titles preserved, so that historical and human context is not lost.

12. As Abigail, I want raw role titles mapped to standardized role levels, so that LEAD can move toward a sustainable operating model.

13. As Abigail, I want raw role titles mapped to standardized functional areas, so that reporting and future Impact Metrics can reason about chapter structure.

14. As Abigail, I want app permission recommendations separated from role title normalization, so that chapter titles do not automatically become platform access.

15. As Abigail, I want most imported e-board records to default to member access, so that the platform does not over-permission people.

16. As Abigail, I want President, Vice President, Chief of Staff, or selected operator roles to be proposed for editor access, so that chapters can operate dashboards without giving access too broadly.

17. As Abigail, I want every proposed editor to require human approval, so that elevated access is deliberate.

18. As a chapter president, I want to review my chapter's proposed roster, so that I can confirm who belongs to the chapter.

19. As a chapter president, I want to review names, emails, titles, and active status, so that the platform starts with credible chapter data.

20. As a chapter VP or Chief of Staff, I want to act as backup reviewer, so that the review process does not block if the president is unavailable.

21. As a platform admin, I want chapter reviewers to validate data but not grant final app permissions, so that access control remains centrally governed.

22. As an executive leader, I want a validation report summarizing import readiness, so that I can understand launch risk without reading raw CSVs.

23. As an operations leader, I want review queues by chapter, so that follow-up can be delegated to the right e-board leaders.

24. As a future developer, I want mapping rules versioned in the repo, so that role, chapter, and major decisions are not hidden inside a one-off script.

25. As a future developer, I want generated artifacts kept separate from source mappings, so that repeatable rules and temporary outputs are not confused.

26. As a future developer, I want a reusable dry-run script, so that future e-board exports can be normalized with the same workflow.

27. As a future developer, I want the dry-run script to avoid database writes, so that running the tool is safe during analysis.

28. As a future developer, I want clear validation statuses per row, so that later import scripts can consume only approved rows.

29. As a future developer, I want blocked rows separated from review rows, so that critical data failures do not get mixed with ordinary review items.

30. As a member, I want my imported profile to preserve my correct name, email, chapter, and academic area, so that my profile starts from a useful baseline.

31. As a member, I want my company visibility disabled by default, so that being imported as a member does not expose me to recruiters without consent.

32. As a member, I want the ability to correct my profile later, so that imported data does not become permanent if it is outdated or incomplete.

33. As LEAD, I want official member IDs to remain global LEAD identifiers, so that identity is not tied to a single chapter.

34. As LEAD, I want member IDs generated only during final import or approval, so that dry-run artifacts do not reserve or imply final identity issuance.

35. As LEAD, I want self-signup users to receive member IDs only after editor/admin approval, so that public participation remains separate from official membership.

36. As LEAD, I want e-board imports to eventually issue member IDs only for approved imported members, so that approved imported membership aligns with the current platform model.

37. As LEAD, I want standardized major names in the artifact, so that future analytics and talent workflows are cleaner.

38. As LEAD, I want raw major values preserved, so that standardization can be audited and corrected.

39. As LEAD, I want major mapping confidence surfaced, so that uncertain mappings can be reviewed before import.

40. As LEAD, I want the dry run to produce focused review files, so that reviewers do not need to parse the entire master artifact.

41. As Abigail, I want ownership boundaries documented, so that I am responsible for the platform/data process but not solely responsible for confirming every chapter's organizational truth.

42. As an executive/operations reviewer, I want a clear review queue, so that I can validate active leaders and approve sensitive access decisions.

43. As a chapter president, I want a chapter-specific roster review artifact, so that I can validate only my chapter's data without reviewing every chapter.

44. As a chapter VP, I want to be assigned as backup reviewer, so that chapter validation can continue if the president is unavailable.

45. As Abigail, I want executive/staff approval before editor access is imported, so that permissions are governed centrally.

46. As LEAD, I want chapter reviewers to recommend platform operators but not grant final access, so that roster validation and permission approval remain separate.

## Implementation Decisions

- The first implementation is a dry-run normalization and validation slice only.
- The dry run will not write to local Docker, QA, or production.
- The dry run will not create Supabase auth users.
- The dry run will not send invitations or emails.
- The dry run will not generate final member IDs.
- The source of truth for the first e-board import is the master `Sheet1` CSV export.
- Individual chapter CSVs are validation references only and should not be imported as additional source data.
- The workflow should deduplicate by normalized lowercase email.
- Duplicate email handling should produce explicit review records instead of silently discarding conflicts.
- Duplicate rows with the same email and materially identical data may be deduped into one canonical row with an audit note.
- Duplicate rows with conflicting name, chapter, or role data should be marked for review.
- Every row must map to a canonical local database chapter ID.
- Unmapped chapters are blocking failures.
- The workflow should validate canonical chapter IDs against local Docker.
- The expected chapter mapping includes UP, PUCP, TECSUP, UCSUR, UNI, UNMSM, UNSA, UPC, UPN, UPN-Trujillo, USIL, UTEC, UTP, and UNFV.
- The local canonical chapter IDs are expected to include `leadpacifico`, `leadpucp`, `leadtecsup`, `leaducsur`, `leaduni`, `leadunmsm`, `leadunsa`, `leadupc`, `leadupn`, `leadupntrujillo`, `leadusil`, `leadutec`, `leadutp`, and `leadvillareal`.
- The `other` chapter should not be used for this import unless explicitly reviewed and approved.
- Raw chapter values should be preserved in the artifact.
- Raw role titles should be preserved in the artifact.
- Raw role titles should be mapped into standardized role levels.
- Raw role titles should be mapped into standardized functional areas.
- Standardized role level and functional area support the future LEAD operating model.
- Current platform app roles remain separate from chapter title semantics.
- Proposed app roles should be only `member` or `editor` for e-board rows.
- No e-board row should become `admin` from this import.
- Organization-level admins and staff are governed separately from chapter e-board import data.
- Editor access should be recommendation-first and approval-required.
- President, Vice President, Chief of Staff, or selected operators may be recommended for editor access.
- Directors, coordinators, volunteers, and specialized functional leads should generally remain app role `member` unless manually selected.
- `chapter_membership.position` should remain conservative and permission-relevant for the current schema.
- Detailed role taxonomy should not be forced into `chapter_membership.position` until future schema support exists.
- Raw title, role level, functional area, mapping confidence, and review status should live in generated artifacts for this slice.
- Majors should be standardized to exact display names where confidence is high enough.
- Raw major values should be preserved.
- Major family may be produced as a derived artifact field for future analytics.
- Low-confidence major mappings should be marked for review.
- Phone numbers should be included as unverified operational contact data in artifacts.
- Phone normalization may be included, but phone numbers should not be treated as verified consent.
- Company/recruiter visibility should be false by default for all imported e-board rows.
- Member ID strategy in the artifact should be `generate_on_import`, not a generated final value.
- Member IDs should be global LEAD IDs and should not encode chapter.
- The current canonical member ID format is `LEAD-######`.
- Self-signup users should receive member IDs only after approval, not at account creation.
- Final import, in a later slice, should create/invite auth-linked users with controlled invitation timing.
- Chapter reviewers should verify roster truth.
- Central admins/staff should approve final access control.
- The dry run should assign each row to a chapter reviewer where possible.
- The chapter president should be the primary reviewer when present.
- The chapter VP should be backup reviewer when present.
- Chief of Staff should be an operational backup reviewer when present.
- UPC should be flagged if no clear president is detected in the current deduped data.
- Abigail is the platform/data owner for this workflow.
- Chapter presidents and VPs validate chapter-level roster truth.
- The executive/operations review group validates cross-chapter truth and approves sensitive access.
- Chapter reviewers may recommend operators but should not have final authority to grant platform editor/admin access.
- The dry-run outputs should make ownership visible by assigning each review row to a chapter reviewer and/or executive review queue.
- The final reviewed artifact must be approved before a later DB import issue is implemented.
- Generated output should include one master normalized artifact and focused review artifacts.
- Versioned mapping/config should live in repo-controlled documentation or data-import config.
- Generated dry-run artifacts should live under a temporary import output directory.

## Testing Decisions

- Tests should focus on external behavior of the normalization workflow rather than internal helper implementation.
- Tests should verify that the workflow reads the expected CSV shape and produces deterministic normalized output.
- Tests should verify chapter mapping behavior, including known aliases and fail-hard unmapped chapters.
- Tests should verify that canonical chapter IDs are checked when local validation is enabled.
- Tests should verify dedupe behavior for identical duplicate emails.
- Tests should verify review-required behavior for duplicate emails with conflicting data.
- Tests should verify role level mapping for known examples such as Presidenta, Vicepresidente, VP, Chief of Staff, Director, Subdirector, Coordinador, Secretaria, Tesorero, and Voluntario.
- Tests should verify functional area mapping for known examples such as Marketing, Impacto Comunitario, Lead Academia, Desarrollo Profesional, Mujeres en STEM, Finanzas, Legal, Recursos Humanos, Innovacion, and Alianzas.
- Tests should verify that proposed editor access is produced only as a review-required recommendation.
- Tests should verify that app role `admin` is never proposed for e-board import rows.
- Tests should verify that company visibility defaults to false.
- Tests should verify that final member IDs are not generated during dry run.
- Tests should verify that `member_id_strategy` is set to generate on import.
- Tests should verify major standardization for common variants such as Ingenieria de Sistemas, Ing. Sistemas, Ingenieria Industrial, Computer Science, Administracion y Marketing, and Diseno y Desarrollo de Software.
- Tests should verify that low-confidence major mappings are flagged.
- Tests should verify that invalid emails are blocked.
- Tests should verify that confirm-email mismatches are detected when present.
- Tests should verify that output status values are assigned consistently.
- Tests should verify that review queue, editor approval, chapter reviewer, and validation summary outputs are generated.
- Tests should use small fixture CSVs rather than depending on the full real CSV for every case.
- One integration-style dry-run validation may use the real CSV to ensure current data can be processed without DB writes.

## Out of Scope

- Writing imported records into local Docker.
- Creating Supabase auth users.
- Sending invitations.
- Creating passwords or magic links.
- Updating QA data.
- Updating production data.
- Migrating production Supabase.
- Creating or changing member IDs in the database.
- Creating final LEAD identities in the database.
- Creating `chapter_membership` records.
- Creating `person_profile` records.
- Creating `public.user` records.
- Adding long-term chapter role taxonomy schema.
- Building admin UI for import approval.
- Building chapter reviewer UI.
- Building company/recruiter visibility flows.
- Importing the full member base beyond the e-board dataset.
- Importing Microsoft tenant users.
- Making individual chapter CSVs the source of truth.
- Solving every possible academic major taxonomy issue.
- Finalizing LEAD-wide member ID governance beyond confirming global, non-chapter-coded IDs for this workflow.

## Further Notes

This PRD intentionally separates dry-run normalization from final database import. The dry-run workflow is a governance and readiness layer. It should create enough evidence for Abigail and the LEAD team to approve, correct, or reject import decisions before any database state changes.

The follow-up implementation should be a separate PRD or issue for local Docker import execution. That later slice should create or invite auth-linked users, insert or update platform records, generate global member IDs, create LEAD identities, validate counts, and produce rollback notes.

This work supports LEAD's larger strategy of turning LEAD Talent Platform into the operational backbone for chapter operations, member activation, LEAD SPARK readiness, Impact Metrics, LEAD Pulse, and future reporting.
