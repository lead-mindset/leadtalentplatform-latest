# Plan: Align Product Spec And ADR With Chapter-Scoped Permissions

## Summary

Update the canonical documentation so LEAD Talent Platform no longer describes chapter operations as a simple global `user.role = editor` model. The implementation will keep the existing layered account model, add an ADR for chapter-scoped role assignments and permission grants, and update testing guidance so future work can implement preapproval, e-board roles, and permissions without treating `chapter_membership.position` or `public.user.role` as the only authorization primitive.

## User Story

As a platform admin and engineer  
I want the account, chapter role, permission, admin, and recruiter models documented consistently  
So that implementation work does not grant global access accidentally or overwrite real chapter positions.

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR / DOCUMENTATION |
| Complexity | LOW |
| Systems Affected | Product specification, ADRs, testing handbook |
| GitHub Issue | #193 |

---

## Patterns to Follow

### ADR Structure

```markdown
// SOURCE: docs/adr/003-newsletter-campaign-architecture.md
# ADR 003: Newsletter Campaign Architecture

## Status

Accepted (May 2026)

## Context
...
## Decision
...
## Consequences
...
## Verification
...
## References
...
```

### Product Spec Vocabulary

```markdown
// SOURCE: docs/PRODUCT-SPECIFICATION.md
### Domain Model

user
  Authenticated account identity and app role.

person_profile
  Reusable basic profile for event registration and outreach.

chapter_membership
  Chapter relationship, approval status, and chapter position.
```

### Testing Handbook Role Matrix

```markdown
// SOURCE: docs/handbook/TESTING.md
| **Editor** | `editor@test.com` | `public.user.role='editor'`, `person_profile`, `chapter_membership` (`position='editor'`, `status='approved'`) |
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `docs/adr/004-chapter-scoped-roles-permissions.md` | CREATE | Record the decision to separate membership, role assignment, permission grants, admin bypass, and recruiter access. |
| `docs/PRODUCT-SPECIFICATION.md` | UPDATE | Replace simple global editor language with chapter-scoped access language and add new operating-layer vocabulary. |
| `docs/handbook/TESTING.md` | UPDATE | Update seed/persona and membership testing guidance for legacy editor compatibility plus new e-board grant behavior. |
| `.github/issues/chapter-scoped-roles-permissions-and-preapproval-issues.md` | UPDATE | Already updated with created GitHub issue links; keep as upload evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add ADR 004

Status: Completed

- **File**: `docs/adr/004-chapter-scoped-roles-permissions.md`
- **Action**: CREATE
- **Implement**: Document the decision that `public.user.role` stays global, `chapter_membership` stays membership lifecycle, `chapter_role_assignment` stores official responsibilities, and `chapter_permission_grant` controls chapter dashboard capabilities.
- **Mirror**: `docs/adr/003-newsletter-campaign-architecture.md` structure.
- **Validate**: `rg -n "chapter_permission_grant|chapter_role_assignment|recruiter_access" docs/adr/004-chapter-scoped-roles-permissions.md`

### Task 2: Update Product Specification

Status: Completed

- **File**: `docs/PRODUCT-SPECIFICATION.md`
- **Action**: UPDATE
- **Implement**: Replace the outdated "permissions must stay simple" principle, editor persona, domain model, chapter membership rules, authorization section, success criteria, risks, vocabulary, and assumptions with chapter-scoped permission terminology.
- **Mirror**: Existing product spec section style and checklist language.
- **Validate**: `rg -n "Permissions must stay simple|user.role.*controls app access|Only admins can promote/demote editors|Chapter positions live" docs/PRODUCT-SPECIFICATION.md` should return no stale contradiction.

### Task 3: Update Testing Handbook

Status: Completed

- **File**: `docs/handbook/TESTING.md`
- **Action**: UPDATE
- **Implement**: Clarify that `editor@test.com` remains a legacy/backcompat seed persona, add expected future e-board permission grant state, and stop saying editor promotion should set `chapter_membership.position='editor'`.
- **Mirror**: Current seed matrix and domain-specific testing sections.
- **Validate**: `rg -n "chapter_permission_grant|legacy editor|chapter_role_assignment" docs/handbook/TESTING.md`

### Task 4: Update GitHub Issue

Status: Completed

- **File**: GitHub issue #193
- **Action**: UPDATE
- **Implement**: Add the plan link and `has-plan` / `piv-status:implementing` labels.
- **Mirror**: Existing GitHub issue workflow.
- **Validate**: `gh issue view 193 --json labels,comments,title`

---

## Validation

```bash
# Documentation checks
rg -n "Permissions must stay simple|user.role.*controls app access|Only admins can promote/demote editors|Chapter positions live" docs/PRODUCT-SPECIFICATION.md
rg -n "chapter_permission_grant|chapter_role_assignment|recruiter_access" docs/adr/004-chapter-scoped-roles-permissions.md docs/handbook/TESTING.md

# Project validation for docs-only change
pnpm lint
```

---

## Acceptance Criteria

- [x] Product Spec references chapter-scoped permissions instead of only `user.role = editor`.
- [x] ADR separates `chapter_membership`, `chapter_role_assignment`, `chapter_permission_grant`, `lead_identity`, and `recruiter_access`.
- [x] MVP role templates and admin/member/recruiter boundaries are documented.
- [x] Membership removal uses existing `inactive` status unless implementation proves a new status is required.
- [x] PRD, Product Spec, handbook, and ADR share consistent vocabulary.
