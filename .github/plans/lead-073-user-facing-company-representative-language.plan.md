# Plan: LEAD-073 User-Facing Company Representative Language

## Summary

Update visible product copy so external users see company representative/company portal language instead of recruiter language, while preserving internal schema, service, role, type, and route names. This is a copy cleanup after route/access recovery, not a technical rename.

## User Story

As a company representative,
I want the portal language to describe me as a company representative,
So that the product feels professional and avoids awkward recruiter terminology where it is user-facing.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #73 |
| Type | Copy / UX polish |
| Complexity | Small |
| Systems Affected | Company UI copy, invite/admin UI copy, public FAQ/partner copy, emails/docs |
| Parent | LEAD-027 / #28 |
| Dependencies | #69, #70, #71, #72 |
| Blocks | Future company portal redesign |

## Decisions

- Use "company representative", "company portal", "saved talent", or "saved profiles" for visible product copy.
- Keep internal names unchanged: `recruiter_access`, `RecruiterService`, `user.role='recruiter'`, `recruiter_email`, route files, generated types, tests, and schema docs.
- Do not rename `/recruiter/access?token=...` in this issue.
- Do not rename database columns, service methods, action files, or TypeScript types.
- Avoid exact-copy churn in historical plan docs unless they are linked as current handbook guidance.
- Keep changes surgical; no layout redesign.

## Patterns To Follow

### Recovery Naming Decision

Source: `docs/handbook/RECRUITER-PORTAL-RECOVERY.md`

The recovery plan already states: use "company representative" or "company portal" in user-facing product language, while keeping internal code/schema names such as `recruiter_access`, `RecruiterService`, and `user.role='recruiter'`.

### Canonical Company Portal

Source: `app/[locale]/company/(protected)/dashboard/page.tsx`, `app/[locale]/company/(protected)/saved/page.tsx`, `app/[locale]/company/(protected)/profile/page.tsx`

These are the highest-value company representative surfaces and currently contain visible copy such as "Recruiter Dashboard", "Saved Students", and "Recruiter Profile".

### Invite/Admin Surfaces

Source: `app/[locale]/admin/invites/page.tsx`, `app/[locale]/admin/invites/components/invite-form.tsx`, `app/[locale]/admin/companies/[id]/manage-company-client.tsx`, `app/[locale]/admin/companies/page.tsx`

Admin UI can still operate on internal recruiter fields, but visible labels should describe company representatives/access where natural.

### Invite Acceptance Surface

Source: `app/[locale]/recruiter/access/page.tsx` and `app/[locale]/recruiter/access/error.tsx`

The route stays `/recruiter/access`, but visible page copy should say "Company Access" or "Company representative access".

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/lead-073-user-facing-company-representative-language.plan.md` | Create | Track plan and validation |
| `lib/nav-config.ts` | Update | Replace company nav labels like "Browse Students" / "Saved Students" |
| `app/[locale]/company/(protected)/dashboard/page.tsx` | Update | Replace recruiter/saved student labels in dashboard |
| `app/[locale]/company/(protected)/saved/page.tsx` | Update | Rename saved student copy to saved talent/profiles |
| `app/[locale]/company/(protected)/saved/error.tsx` | Update | Rename saved student error copy |
| `app/[locale]/company/(protected)/profile/page.tsx` | Update | Rename recruiter profile copy and fallback name |
| `app/[locale]/company/(protected)/browse/page.tsx` | Update | Replace "students available" copy if desired |
| `app/[locale]/company/(protected)/layout.tsx` | Update | Replace visible fallback name if needed |
| `app/[locale]/recruiter/access/page.tsx` | Update | Keep route, change visible copy to company access |
| `app/[locale]/recruiter/access/error.tsx` | Update | Rename visible error copy |
| `app/[locale]/admin/invites/page.tsx` | Update | Rename visible invite headings/descriptions |
| `app/[locale]/admin/invites/components/invite-form.tsx` | Update | Rename form copy and placeholder where appropriate |
| `app/[locale]/admin/invites/components/invite-actions.tsx` | Update | Rename revoke/resend dialog copy |
| `app/[locale]/admin/companies/page.tsx` | Update | Rename visible company management copy |
| `app/[locale]/admin/companies/companies-management-client.tsx` | Update | Rename visible active recruiter labels |
| `app/[locale]/admin/companies/[id]/page.tsx` | Update | Rename visible stats labels |
| `app/[locale]/admin/companies/[id]/manage-company-client.tsx` | Update | Rename visible recruiter labels |
| `app/[locale]/admin/page.tsx` | Update | Rename dashboard-visible recruiter request/opt-in copy where user-facing |
| `app/[locale]/faq/page.tsx` | Update | Rename public-facing recruiter copy |
| `app/[locale]/(public)/partner-info/page.tsx` | Update | Rename public-facing recruiter copy |
| `emails/templates/WelcomeEmail.tsx` | Update | Rename visible recruiter email copy only |
| `emails/templates/MemberApprovalEmail.tsx` | Update | Rename visible recruiter visibility/resume copy |
| `docs/handbook/TESTING.md` | Update lightly | Clarify user-facing company representative persona while preserving internal role names |
| `docs/handbook/COMPANY-PORTAL-QA.md` | Update lightly | Replace non-technical "recruiter-role user" wording if clearer |
| GitHub Issue #73 | Update | Add plan/evidence and close when complete |

## Tasks

## Progress

- [x] Task 1: Create Plan And Classify Copy Targets
- [x] Task 2: Update Company Portal Copy
- [x] Task 3: Update Invite And Admin Copy
- [x] Task 4: Update Public/Email/Handbook Copy
- [x] Task 5: Audit Internal Names Were Preserved
- [x] Task 6: Validate And Update GitHub

### Task 1: Create Plan And Classify Copy Targets

- **File**: `.github/plans/lead-073-user-facing-company-representative-language.plan.md`
- **Action**: Create
- **Implement**:
  - Capture scope decisions and file targets.
  - Classify remaining "recruiter" terms as either user-facing copy, internal identifiers, or historical docs.
  - Keep `.agents/` and `.codex/` unstaged.
- **Validate**: `rg -n "Recruiter|recruiter|Saved Students|saved students" app components emails docs lib`

### Task 2: Update Company Portal Copy

- **Files**:
  - `lib/nav-config.ts`
  - `app/[locale]/company/(protected)/dashboard/page.tsx`
  - `app/[locale]/company/(protected)/saved/page.tsx`
  - `app/[locale]/company/(protected)/saved/error.tsx`
  - `app/[locale]/company/(protected)/profile/page.tsx`
  - `app/[locale]/company/(protected)/browse/page.tsx`
  - `app/[locale]/company/(protected)/layout.tsx`
- **Action**: Update
- **Implement**:
  - Replace "Recruiter Dashboard" with "Company Portal".
  - Replace "Saved Students" with "Saved Talent" or "Saved Profiles".
  - Replace "Browse Students" with "Browse Talent" where it is company-facing.
  - Replace "Recruiter Profile" with "Company Representative Profile".
  - Keep data variable names unchanged unless needed for readability in edited code.
- **Validate**: `rg -n "Recruiter Dashboard|Recruiter Profile|Saved Students|saved students|Browse Students" app/[locale]/company lib/nav-config.ts`

### Task 3: Update Invite And Admin Copy

- **Files**:
  - `app/[locale]/recruiter/access/page.tsx`
  - `app/[locale]/recruiter/access/error.tsx`
  - `app/[locale]/admin/invites/page.tsx`
  - `app/[locale]/admin/invites/components/invite-form.tsx`
  - `app/[locale]/admin/invites/components/invite-actions.tsx`
  - `app/[locale]/admin/companies/page.tsx`
  - `app/[locale]/admin/companies/companies-management-client.tsx`
  - `app/[locale]/admin/companies/[id]/page.tsx`
  - `app/[locale]/admin/companies/[id]/manage-company-client.tsx`
  - `app/[locale]/admin/page.tsx`
- **Action**: Update
- **Implement**:
  - Use "Company Representative Invites", "Company representative email", and "company access".
  - Keep internal fields like `recruiter_email` displayed as email values only; do not rename data shapes.
  - Preserve admin clarity that these are company representatives, not chapter members.
- **Validate**: `rg -n "Recruiter|recruiter access|recruiter invitations|Active Recruiters|Recruiter Email|Recruiter Invites|Pending Recruiter" app/[locale]/admin app/[locale]/recruiter/access`

### Task 4: Update Public/Email/Handbook Copy

- **Files**:
  - `app/[locale]/faq/page.tsx`
  - `app/[locale]/(public)/partner-info/page.tsx`
  - `app/[locale]/(public)/page.tsx`
  - `emails/templates/WelcomeEmail.tsx`
  - `emails/templates/MemberApprovalEmail.tsx`
  - `docs/handbook/TESTING.md`
  - `docs/handbook/COMPANY-PORTAL-QA.md`
- **Action**: Update
- **Implement**:
  - Public copy should say "partner companies" or "company representatives" instead of "recruiters" when that sounds better.
  - Keep explicit technical notes for `user.role='recruiter'` and `recruiter_access`.
  - Email copy should refer to company representative access.
  - Do not rewrite product spec or historical migration plans unless the text is current user-facing guidance.
- **Validate**: `rg -n "Can recruiters|recruiters|recruiter access|Recruiter" app/[locale]/faq app/[locale]/\\(public\\) emails docs/handbook`

### Task 5: Audit Internal Names Were Preserved

- **Files**: all changed files
- **Action**: Audit
- **Implement**:
  - Confirm no schema/type/service names were renamed.
  - Confirm `/recruiter/access?token=...` references still exist.
  - Confirm `recruiter_access`, `RecruiterService`, and `user.role='recruiter'` remain intact.
  - Classify remaining matches as internal identifier, test fixture, or historical docs.
- **Validate**:

```bash
rg -n "recruiter_access|RecruiterService|role.*recruiter|/recruiter/access" lib app docs emails
rg -n "\"Recruiter|>Recruiter|Recruiter |Saved Students|saved students|Browse Students" app components emails docs/handbook
```

### Task 6: Validate And Update GitHub

- **Files**: all changed files
- **Action**: Validate and update issue
- **Implement**:
  - Run targeted source audits.
  - Run tests/lint/build because copy changes touch app and email TSX.
  - Comment on #73 with plan path, summary, and validation evidence.
  - Add/keep `has-plan`.
  - Close #73 when acceptance criteria are met.
- **Validate**:

```bash
rg -n "\"Recruiter|>Recruiter|Recruiter |Saved Students|saved students|Browse Students" app components emails docs/handbook
pnpm test
pnpm lint
pnpm build
git diff --check
```

## Acceptance Criteria Mapping

- [x] Public UI copy replaces recruiter language where it is user-facing.
- [x] Internal code/schema names are not renamed.
- [x] Saved talent surfaces avoid "Saved Students" where possible.
- [x] Invite/access pages use company representative/company portal language clearly.

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Accidental technical rename | Use source audit for internal identifiers and avoid changing types/schema/services |
| Scope creep into redesign | Change copy only; no layout/component redesign |
| Over-renaming technical docs | Skip product spec/migration/historical plan docs unless current handbook guidance |
| Breaking invite route expectations | Keep `/recruiter/access?token=...` route and action names untouched |
| Lint/build failures from TSX edits | Run full lint/build after copy changes |

## Out Of Scope

- Renaming routes, database columns, Supabase types, services, actions, or role values.
- Company portal UI redesign.
- New tests beyond existing validation unless copy changes reveal failures.
- Product specification rewrite.
- Historical migration/plan cleanup.
