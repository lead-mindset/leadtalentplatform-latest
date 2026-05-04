# Plan: LEAD-069 Consolidate Company Representative Portal Routes

## Summary

Make `/company/*` the canonical protected company representative portal while preserving `/recruiter/access?token=...` as the invite acceptance entrypoint. The implementation should replace old non-access `/recruiter/*` talent pages with redirects to canonical company routes, remove route-only dead UI, update app-generated links/revalidation paths, and avoid broader copy/schema renaming that belongs to #73.

## User Story

As a company representative,
I want one canonical portal URL surface,
So that browsing, saved profiles, and student profile details do not drift across duplicate company and recruiter routes.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #69 |
| Type | Stabilization / Route Consolidation |
| Complexity | Small |
| Systems Affected | App routes, company/recruiter UI, route revalidation, architecture tests |
| Parent | LEAD-027 / #28 |
| Dependencies | #70, #71 |
| Blocks | #72 manual QA, #73 user-facing language cleanup |

## Decisions

- `/company/*` is the canonical protected portal.
- `/recruiter/access?token=...` remains functional and is not renamed in #69.
- `/recruiter/browse`, `/recruiter/saved`, and `/recruiter/[studentId]` redirect instead of returning 404.
- Redirects are route-level App Router pages, not middleware/proxy rules.
- Delete obvious route-only UI components under old non-access `/recruiter/*` routes when they are no longer imported.
- Do not delete shared services/actions unless they are obviously dead and unrelated to invite acceptance.
- Keep internal `recruiter_access`, `RecruiterService`, and schema naming unchanged.
- Broad visible language cleanup is deferred to #73; only route-adjacent copy may be touched.

## Patterns To Follow

### Canonical Company Portal

Source: `app/[locale]/company/(protected)/browse/page.tsx` and `app/[locale]/company/(protected)/saved/page.tsx`

Company routes already use `requireRecruiter()` and `CompanyService`-backed actions. These remain the canonical browse and saved surfaces.

### Old Recruiter Talent Routes

Source: `app/[locale]/recruiter/browse/page.tsx`, `app/[locale]/recruiter/saved/page.tsx`, and `app/[locale]/recruiter/[studentId]/page.tsx`

These pages duplicate company talent browse/saved/profile behavior and should be replaced by redirects.

### Invite Acceptance Exception

Source: `app/[locale]/recruiter/access/page.tsx` and `lib/actions/recruiter/access.ts`

This route remains the canonical signed-in invite acceptance path. Do not redirect or delete it.

### Current Source References

Source audit:

- `lib/actions/company/toggle-save.ts` still revalidates `/recruiter/browse` and `/recruiter/saved`.
- `lib/actions/recruiter/talent-pool.ts` still revalidates `/recruiter/browse`.
- Old recruiter browse/saved/profile pages generate `/recruiter/*` profile and return URLs.
- Docs/plans intentionally mention old routes as recovery history; no runtime behavior depends on those references.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/lead-069-consolidate-company-representative-portal-routes.plan.md` | Create | Track plan and validation |
| `app/[locale]/recruiter/browse/page.tsx` | Replace | Redirect to `/company/browse` |
| `app/[locale]/recruiter/saved/page.tsx` | Replace | Redirect to `/company/saved` |
| `app/[locale]/recruiter/[studentId]/page.tsx` | Replace | Redirect to `/company/students/[studentId]` |
| `app/[locale]/recruiter/browse/*` | Delete as applicable | Remove route-only UI after redirect replacement |
| `app/[locale]/recruiter/saved/*` | Delete as applicable | Remove route-only UI after redirect replacement |
| `app/[locale]/recruiter/[studentId]/download-resume-button.tsx` | Delete if unused | Remove route-only resume button after profile redirect |
| `lib/actions/company/toggle-save.ts` | Update | Revalidate canonical `/company/*` routes only |
| `lib/actions/recruiter/talent-pool.ts` | Update or leave with rationale | Remove old route revalidation if the actions are no longer used by runtime pages |
| `tests/architecture.test.ts` | Update if needed | Remove allowlists for deleted old route files while preserving `/recruiter/access` |
| GitHub Issue #69 | Update | Add plan/evidence and close when accepted |

## Tasks

## Progress

- [x] Task 1: Confirm Route And Link Inventory
- [x] Task 2: Replace Old Recruiter Talent Pages With Redirects
- [x] Task 3: Delete Unused Route-Only Components
- [x] Task 4: Update Canonical Revalidation And Source Links
- [x] Task 5: Update Tests And Architecture Allowlists
- [x] Task 6: Validate And Update GitHub

### Task 1: Confirm Route And Link Inventory

- **Files**:
  - `app/[locale]/recruiter/**/*`
  - `app/[locale]/company/**/*`
  - `lib/actions/company/toggle-save.ts`
  - `lib/actions/recruiter/talent-pool.ts`
- **Action**: Audit
- **Implement**:
  - Confirm `/recruiter/access` remains untouched.
  - Confirm old non-access route files are route-only and safe to redirect/delete.
  - Find app-generated links to `/recruiter/browse`, `/recruiter/saved`, and `/recruiter/[studentId]`.
- **Validate**: `rg -n "/recruiter/browse|/recruiter/saved|/recruiter/\\$\\{|/recruiter/access" app components lib tests`

### Task 2: Replace Old Recruiter Talent Pages With Redirects

- **Files**:
  - `app/[locale]/recruiter/browse/page.tsx`
  - `app/[locale]/recruiter/saved/page.tsx`
  - `app/[locale]/recruiter/[studentId]/page.tsx`
- **Action**: Update
- **Implement**:
  - `/recruiter/browse` redirects to `/company/browse`.
  - `/recruiter/saved` redirects to `/company/saved`.
  - `/recruiter/[studentId]` redirects to `/company/students/[studentId]`.
  - Preserve query params only if straightforward; otherwise prioritize canonical destination correctness.
- **Mirror**: Existing App Router `redirect()` usage in `app/[locale]/recruiter/access/page.tsx`.
- **Validate**: `pnpm build`

### Task 3: Delete Unused Route-Only Components

- **Files**:
  - `app/[locale]/recruiter/browse/student-card.tsx`
  - `app/[locale]/recruiter/browse/recruiter-save-student-button.tsx`
  - `app/[locale]/recruiter/browse/talent-pool-filters.tsx`
  - `app/[locale]/recruiter/saved/saved-students-grid.tsx`
  - `app/[locale]/recruiter/[studentId]/download-resume-button.tsx`
- **Action**: Delete if unused
- **Implement**:
  - Use `rg` per component before deleting.
  - Keep loading/error files only if they are useful with redirects; otherwise delete route-only shells.
  - Do not delete `/recruiter/access/*`.
- **Validate**: `rg -n "student-card|recruiter-save-student-button|talent-pool-filters|saved-students-grid|download-resume-button" app components lib tests`

### Task 4: Update Canonical Revalidation And Source Links

- **Files**:
  - `lib/actions/company/toggle-save.ts`
  - `lib/actions/recruiter/talent-pool.ts`
  - any source file found by Task 1
- **Action**: Update
- **Implement**:
  - Replace app-generated old protected portal links with `/company/*`.
  - Update `revalidatePath('/recruiter/browse')` and `revalidatePath('/recruiter/saved')` to canonical company routes where the action is still used.
  - Keep `/recruiter/access` references intact.
- **Validate**: `rg -n "/recruiter/browse|/recruiter/saved|/recruiter/\\$\\{" app components lib tests`

### Task 5: Update Tests And Architecture Allowlists

- **Files**:
  - `tests/architecture.test.ts`
  - relevant route/action tests if failures surface
- **Action**: Update as needed
- **Implement**:
  - Remove allowlists for old route files if deleted/replaced and no longer direct DB users.
  - Keep architecture allowlists for `/recruiter/access` because invite acceptance remains.
  - Add simple tests only if existing test structure makes route redirect behavior easy to test; otherwise rely on build/source audit.
- **Validate**: `pnpm vitest run tests/architecture.test.ts`

### Task 6: Validate And Update GitHub

- **Files**: all changed files
- **Action**: Validate and update issue
- **Implement**:
  - Run route source audit and automated validation.
  - Comment on #69 with plan path, route mapping, and validation evidence.
  - Add/keep `has-plan`.
  - Close #69 when acceptance criteria are met.
- **Validate**:

```bash
rg -n "/recruiter/browse|/recruiter/saved|/recruiter/\\$\\{|/recruiter/access" app components lib tests
pnpm vitest run tests/architecture.test.ts
pnpm test
pnpm lint
pnpm build
git diff --check
```

## Acceptance Criteria Mapping

- [x] Company representatives use `/company/*` as the canonical protected portal.
- [x] Old `/recruiter/browse`, `/recruiter/saved`, and `/recruiter/[studentId]` URLs redirect to company routes.
- [x] `/recruiter/access?token=...` remains functional.
- [x] Documentation/plan language uses company representative/company portal while leaving broad copy cleanup to #73.

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Accidentally breaking invite acceptance | Do not touch `/recruiter/access` except source audits |
| Dead route-only components linger | Use `rg` before and after deletion |
| Removing too much service code | Keep shared services/actions unless obviously unused |
| Internal links continue generating old routes | Audit `/recruiter/browse`, `/recruiter/saved`, and dynamic profile links |
| Scope creep into copy rename | Keep broad language cleanup in #73 |

## Out Of Scope

- Renaming `recruiter_access` schema.
- Renaming `RecruiterService` or invite action internals.
- Broad visible copy cleanup across admin/company UI.
- Manual browser QA checklist, handled by #72.
- Company portal redesign.
