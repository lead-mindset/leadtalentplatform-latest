# Plan: LEAD-024 Canonical Account Model Agent Rules

## Summary

Update the repository's agent-facing instructions so future AI/human-assisted implementation starts from the canonical layered account model instead of rebuilding the deprecated `student_profile` assumption. This is a documentation and process hardening task: keep rules brief, enforceable, and close to the files agents read first.

## User Story

As the engineering team,
I want AI agent instructions to define the canonical account model and PIV workflow,
So that future agents implement features through `user`, `person_profile`, `chapter_membership`, `lead_identity`, and `recruiter_access` without reintroducing old profile dependencies.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #25 |
| Parent | #66 |
| Type | DOCUMENTATION / SYSTEM_EVOLUTION |
| Complexity | SMALL |
| Systems Affected | `AGENTS.md`, `CLAUDE.md`, optional `.github/skills/*` references |

## Codebase Findings

| Source | Finding |
|--------|---------|
| `AGENTS.md` | Strong service-layer and workflow guidance exists, but it does not define the canonical account model or warn against new `student_profile` dependencies. |
| `CLAUDE.md` | Still uses older "Linke" / student-recruiter framing and has service-layer guidance, but no account-model section. |
| `docs/PRODUCT-SPECIFICATION.md` | Defines the account reset: public participants can exist without chapter membership; admins/staff can have LEAD IDs without chapter membership; recruiters should not require student profiles. |
| `docs/handbook/TESTING.md` | Documents seed personas and layered model testing expectations. |
| `.github/plans/audit-live-student-profile-references.plan.md` | Completed #67 audit: live `student_profile` dependencies were migrated; generated/migration/docs references remain legacy-safe. |
| `.github/plans/fix-admin-chapter-page-build-blocker.plan.md` | Completed #68 verification: admin chapter page now uses `person_profile` and `chapter_membership`. |

## Canonical Account Model Rules To Add

| Concept | Agent Rule |
|---------|------------|
| `public.user` | Auth-linked app user and global role/contact surface. Keep universal contact data here: name, email, phone, role. Do not treat `user.role` as chapter position. |
| `person_profile` | Reusable basic profile for onboarding, event registration, recruiter visibility, and profile details. It does not imply chapter membership. |
| `chapter_membership` | Chapter application, approval, alumni state, member ID, and chapter position. Chapter permissions must come from approved membership unless admin bypass applies. |
| `lead_identity` | Official LEAD identity display/issuance for member/editor/staff/founder/alumni identity surfaces. Do not use admin as a public identity type. |
| `recruiter_access` | Invite/scoped recruiter access to talent flows. Recruiters are not chapter members by default and should not require `student_profile`. |
| `student_profile` | Deprecated legacy/migration source only. Do not add new live app/service/action/UI dependencies. Generated types and migration validation docs may still reference it intentionally. |

## Workflow Rules To Add

- `/plan` must inspect the current codebase and write a plan file under `.github/plans/{kebab-case}.plan.md`.
- Fresh-session `/implement` must read the plan file first, verify task checkboxes, execute in order, update the plan, validate, and update GitHub.
- When an implementation reveals repeated confusion, architecture drift, or agent misbehavior, create or update a `phase:system-evolution` issue instead of hiding the rule inside feature work.
- Service-layer rule remains mandatory: business/database logic belongs in `lib/services/`; actions stay thin with auth, validation, and service calls.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `AGENTS.md` | UPDATE | Add canonical account model, deprecated `student_profile` rule, PIV workflow, and System Evolution trigger. |
| `CLAUDE.md` | UPDATE | Mirror the same concise rules because this file is also read by coding agents. Fix project naming if touched. |
| `.github/skills/create-rules.md` | REVIEW / UPDATE IF NEEDED | Ensure generated future rules do not omit canonical account model guidance. |
| `.github/skills/prime.md` | REVIEW / UPDATE IF NEEDED | Ensure priming asks agents to read the canonical rules before issue work. |
| `.github/plans/lead-024-canonical-account-model-agent-rules.plan.md` | CREATE | Plan and checklist for this issue. |

## Tasks

- [x] Update `AGENTS.md` with a short "Canonical Account Model" section.
  - Define the five canonical tables.
  - State that `student_profile` is legacy/migration-only.
  - Include field ownership rules: contact data in `user`; reusable profile data in `person_profile`; membership state in `chapter_membership`.

- [x] Update `AGENTS.md` with PIV execution rules.
  - `/plan` creates `.github/plans/{name}.plan.md`.
  - `/implement` loads the plan, follows tasks in order, updates the plan, validates, and updates GitHub.
  - Foundation/stabilization issues should be handled before dependent feature PIVs.

- [x] Update `AGENTS.md` with System Evolution escalation rules.
  - Repeated agent mistakes, stale schema assumptions, workflow gaps, or recurring validation failures should create/update a `phase:system-evolution` issue.

- [x] Mirror the account-model and workflow rules into `CLAUDE.md`.
  - Keep it concise.
  - Avoid duplicating long docs.
  - Point to `docs/PRODUCT-SPECIFICATION.md`, `docs/handbook/TESTING.md`, and the service-layer ADR.

- [x] Review `.github/skills/create-rules.md` and `.github/skills/prime.md`.
  - If they generate or load agent rules, add one line requiring canonical account model awareness.
  - If they are only historical helpers, document no change needed in this plan.

- [x] Validate documentation changes.
  - Run `rg -n "student_profile|person_profile|chapter_membership|lead_identity|recruiter_access" AGENTS.md CLAUDE.md .github/skills`.
  - Run `pnpm lint` only if Markdown tooling or changed TS/JS requires it; otherwise record docs-only validation.

- [x] Update GitHub #25.
  - Comment with plan path, changed files, and validation result.
  - Add/keep `has-plan`.
  - Close #25 only after implementation validates.

## Risks

| Risk | Mitigation |
|------|------------|
| Rules become too long and agents ignore them | Keep sections short, table-driven, and action-oriented. |
| Rules duplicate product docs and drift | Link product/testing docs for details; keep AGENTS/CLAUDE focused on enforceable engineering constraints. |
| Future agents still use `student_profile` from generated types | Explicitly distinguish generated/migration references from live app/service/action/UI dependencies. |
| Workflow rules conflict with local command skills | Describe outcomes and required files, not tool-specific internals. |

## Validation

```bash
rg -n "student_profile|person_profile|chapter_membership|lead_identity|recruiter_access" AGENTS.md CLAUDE.md .github/skills
```

Result: passed. The canonical model and legacy `student_profile` rule now appear in `AGENTS.md`, `CLAUDE.md`, and `.github/skills/create-rules.md`.

No executable code changed, so `pnpm lint`, `pnpm test`, and `pnpm build` were not required for this docs-only implementation.

Optional if implementation touches executable code:

```bash
pnpm lint
pnpm test
pnpm build
```

## Output

Tasks completed: 7/7.
