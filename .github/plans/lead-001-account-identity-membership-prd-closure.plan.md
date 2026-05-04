# LEAD-001: Account, Identity, and Membership PRD Closure

## Summary

Close the original account-model PRD approval gate now that the layered account model has been implemented, documented, and enforced across follow-up foundation and UI work. This issue is a documentation/planning gate; no runtime code changes are expected.

## Issue

- GitHub: #2
- Type: Documentation
- Complexity: Small
- Phase: Strategic Planning

## Acceptance Criteria

- [x] Account model decisions are approved or explicitly revised.
- [x] Issue vocabulary consistently uses `user`, `person_profile`, `chapter_membership`, `lead_identity`, and `recruiter_access`.
- [x] Unresolved product questions were resolved or converted into follow-up issues.
- [x] Implementation uses plan artifacts before edits.

## Evidence

- Canonical source: `docs/PRODUCT-SPECIFICATION.md`.
- Agent rules: `AGENTS.md` and `CLAUDE.md` define the layered account model and mark `student_profile` as deprecated for live app work.
- Service/architecture guardrails: #24 and #25 completed.
- Foundation stabilization gate: #66 completed.
- Live `student_profile` audit and migration pass: #67 completed.
- LEAD-028 redesign sequence #74 through #87 completed with plan artifacts and validation evidence.

## Implementation

1. Confirm no tracked work is waiting to commit before closure.
2. Add this closure plan as the final plan artifact for #2.
3. Comment on #2 with evidence and note the missing `.agents/PRDs/PROJECT-SPECIFICATION-FINAL.md` path is superseded by tracked docs.
4. Close #2 as completed.
5. Commit only this plan artifact.

## Validation

- `rg "student_profile|person_profile|chapter_membership|lead_identity|recruiter_access" AGENTS.md CLAUDE.md docs/PRODUCT-SPECIFICATION.md`
- Commit hook runs `pnpm test`.
