# Leadership Onboarding Flow — Architecture Recovery & Incident Investigation

**Date:** 2026-08-06
**Environment:** Production (`sboibxszratyaswwursb.supabase.co`)
**Status:** Root cause identified; invariant enforcement shipped

---

## 1. Executive Summary

An admin created the chapter **LEAD JAVERIANA** (`leadjaveriana`) and a president account, but the
president is **not linked to the chapter** (no `chapter_membership`, no `chapter_role_assignment`,
no `person_profile`). Investigation proved that the executed workflow was the **admin Lead Identity
Manager panel**, which issues a `lead_identity` **only** — it never creates a person profile,
membership, or role assignment. The president therefore has a public LEAD identity but no chapter
link.

This is **not a database bug**. It is a **product/UX design gap**: the Identity Manager panel allows
admins to create an identity for a user who has no chapter membership, silently producing an
inconsistent state. The operator used the wrong tool because the intended workflow (invite) is not
obvious, and the Identity Manager presents "issue identity" as a valid way to onboard leadership.

---

## 2. Proven Facts (evidence)

| # | Fact | Evidence |
| - | ---- | -------- |
| 1 | User exists for president | `public.user` row `ac3a1f3e-...` (`angela.cortes@leadmindset.org`, `role='member'`, created 2026-08-06 03:22:13) |
| 2 | Auth user exists | `auth.users` has `ac3a1f3e-...` (03:22:13) |
| 3 | `lead_identity` exists | `c7216373-...`: `chapter_editor`, chapter `leadjaveriana`, `is_primary=true`, `status=active`, `issued_by_id=44444444-...` (seed admin = admin's prod account), `issued_at` 03:39:53 |
| 4 | No `chapter_invite` | Zero rows for all three candidate emails |
| 5 | No `chapter_preapproval` | Zero rows for all three candidate emails / chapter |
| 6 | No `chapter_membership` | Zero rows for the three users |
| 7 | No `chapter_role_assignment` | Zero rows for the three users |
| 8 | No `person_profile` | Zero rows for the three users |
| 9 | No `chapter_audit_log` | Zero rows for chapter / target users |
| 10 | Seed admin account is the operator | `44444444-4444-4444-4444-444444444444` (`admin@test.com`, `role=admin`) exists in prod (2026-07-27); matches `issued_by_id` |
| 11 | Earlier identity on same tool | Operator's own account `c705c7ef-...` (`amcp.engineer@gmail.com`) received `chapter_member` identity 02:38:50, revoked 03:01:42 — same identity manager usage pattern |

Additional forensic detail: user `acortes8171@dbu.edu` exists in `public.user` but **not** in
`auth.users` (orphaned row). Users `acortes8171@dbu.edu` and `angy.cortes57@gmail.com` have no
identity, no profile, no membership, no role.

---

## 3. Workflow Matrix

| Workflow | user | profile | membership | role | identity | invite | preapproval | audit | Matches prod? |
| -------- | ---- | ------- | ---------- | ---- | -------- | ------ | ----------- | ----- | ------------- |
| A. Protected Invite | Y | Y | Y | Y | Y | Y (accepted) | N | Y | N |
| B. `onboardPresidentAction` | Y | Y | Y | Y | Y | N/A | N | Y | N |
| C. **Identity Manager** | Y | N | N | N | Y | N | N | N | **Y MATCH** |
| D. Preapproval activation | Y | Y | Y | Y | Y | N | Y (consumed) | Y | N |
| E. Admin correction panel | requires membership | - | - | - | - | - | - | - | N (no membership) |
| F. Verification script | - | - | - | - | - | - | - | - | N (refuses non-localhost) |

Only **Workflow C** matches the production state.

---

## 4. Complete Call Graph

### Workflow A — Protected Invite (intended production path for president creation)

```
Admin UI
  app/[locale]/admin/chapters/[id]/protected-leadership-invites.tsx
    |  roleLevel: 'president' | 'vice_president'
    v
Server Action
  lib/actions/admin/chapter-invites.ts  ->  createAdminProtectedLeadershipInvite()
    v
Service
  lib/services/chapter-protected-leadership-invite.service.ts
    v
Service
  lib/services/chapter-invite.service.ts  ->  createInvite()
    v
DB
  INSERT chapter_invite          (created_by_user_id = admin)
    v
Email invite sent -> user accepts
    v
Service
  chapter-invite.service.ts:682 -> ChapterRoleAssignmentService.assignChapterRole()
    v
DB
  person_profile (via getOrIssueLeadId)
  chapter_membership (approved)
  chapter_role_assignment
  lead_identity
  chapter_audit_log
```

**Expected final state:** user, profile, membership, role, identity, invite accepted, audit all present.

### Workflow B — Admin onboard president action

```
Server Action
  lib/actions/admin/onboard-president.ts -> onboardPresidentAction(email, chapterId)
    v
Service
  PersonProfileService.getOrIssueLeadId()      -> person_profile
    v
DB
  chapter_membership (approved, position=member)
    v
Service
  ChapterRoleAssignmentService.assignChapterRole()  -> chapter_role_assignment + audit + identity
    v
Service
  onboardPresident() -> issueChapterEditorIdentity() -> lead_identity
```

**Expected final state:** user, profile, membership, role, identity, audit all present.
**Note:** no UI component calls this action (confirmed by grep: zero `.tsx` references).

### Workflow C — Lead Identity Manager (ROOT CAUSE — the executed workflow)

```
Admin UI
  app/[locale]/admin/users/[id]/page.tsx:308
  +-- app/[locale]/admin/users/[id]/_components/lead-identity-manager.tsx
        Button "Issue" (line 270) -> issueIdentity()
        identityType: 'chapter_editor', chapterId: 'leadjaveriana', makePrimary: true
    v
Server Action
  lib/actions/admin/identities.ts -> issueLeadIdentity()
    v
Service
  lib/services/lead-identity.service.ts -> LeadIdentityService.issueIdentity()
    v
DB
  INSERT lead_identity  { user_id, identity_type, chapter_id, issued_by_id, issued_at, is_primary, status }
  (optional setPrimaryIdentity -> UPDATE is_primary)
```

**Observed final state:** user + identity present; membership, role, profile, audit all absent — **exact match**.

### Workflow D — Preapproval activation

```
Sign-up / profile activation
  lib/services/chapter-preapproval.service.ts -> activatePreapprovalForUser()
    v
  findActivePreapproval()          -> chapter_preapproval row
  ensureApprovedMembership()       -> person_profile + chapter_membership
  ensureRoleAssignment()           -> chapter_role_assignment (source='preapproval')
  grantRoleTemplatePermissions()   -> chapter_permission
  onboardPresident() (if president) -> lead_identity
  consumePreapproval()             -> chapter_preapproval.consumed_at
```

### Workflow E — Admin chapter-role correction panel

```
app/[locale]/admin/users/[id]/_components/admin-chapter-role-correction-panel.tsx
  -> lib/actions/chapter/role-assignments.ts -> assignAdminChapterRole()
  -> ChapterRoleAssignmentService.assignChapterRole()
```
Guard: requires **approved chapter_membership** before assigning a role. Rejects target without one.

---

## 5. Sequence Diagram — Executed Workflow (C)

```
Admin (seed admin 44444444-...)
  |  1. Create chapter LEAD JAVERIANA          (2026-08-06 ~02:22)
  |  2. Create user angela.cortes@...          (03:22:13)   [public.user + auth.users]
  |  3. Navigate /admin/users/ac3a1f3e-...
  |  4. LeadIdentityManager: select 'chapter_editor' + 'leadjaveriana' -> click "Issue"
  |       |
  |       v
  |  issueLeadIdentity({ userId, identityType:'chapter_editor', chapterId:'leadjaveriana', makePrimary:true })
  |       |
  |       v
  |  LeadIdentityService.issueIdentity()
  |       |  SELECT existing identity -> none
  |       v
  |  INSERT lead_identity  { ..., issued_by_id: 44444444-..., issued_at: 03:39:53, is_primary:false, status:'active' }
  |       |  makePrimary=true
  |       v
  |  setPrimaryIdentity() -> UPDATE is_primary=true  (03:39:54)
  |       v
  |  toast "LEAD identity issued." + router.refresh()
  |
  +- FINAL STATE: identity present | profile absent | membership absent | role absent | audit absent
```

---

## 6. State-Transition Diagram (intended onboarding state machine)

```
User Created
    |  (auth.users + public.user)
    v
Person Profile            <- getOrIssueLeadId / sign-up
    |
    v
Chapter Membership        <- invite acceptance / preapproval / admin approve
    |  status = approved
    +---------------->  Chapter Role Assignment   <- assignChapterRole / correction panel
    |                       (president, vp, editor, ...)  + chapter_permission + audit
    v                        |
LEAD Identity             <-+  (issued after approved membership; guards in
                                issueChapterEditorIdentity / issueForApprovedMembership)
```

**Invariant:** every LEAD identity scoped to a chapter must have an approved
`chapter_membership` for that chapter. **Workflow C violates this invariant** because
`issueIdentity()` has no membership guard (unlike `issueChapterEditorIdentity` /
`issueForApprovedMembership`).

---

## 7. Root Cause

**The president was created via the admin Lead Identity Manager panel (`lead-identity-manager.tsx`),
which calls `issueLeadIdentity()` -> `LeadIdentityService.issueIdentity()`. That service inserts a
`lead_identity` row and nothing else.** No `person_profile`, `chapter_membership`, or
`chapter_role_assignment` is created, and no `chapter_audit_log` entry is written.

The generic `issueIdentity()` (used by the admin identity panel) intentionally bypasses the
membership guard that `issueChapterEditorIdentity()` and `issueForApprovedMembership()` enforce.
The admin UI exposes "Chapter editor" as an issue-able identity type with **no warning** that the
target user lacks membership/role, so the admin produced an inconsistent state believing they had
"created a president."

Contributing factors:
- The intended "create president" flow (protected invite, Workflow A) is a separate panel under
  chapter detail pages; it is not surfaced on the user detail page where the admin was working.
- `onboardPresidentAction` (Workflow B) has no UI entry point, so it cannot be used from the app.
- There is no enforcement (service or DB) that a chapter-scoped identity requires membership.

---

## 8. Operator Confirmation & Resolution

> **Did you create the president by opening the user's detail page and clicking "Issue" in the
> "LEAD Identities" panel (selecting "Chapter editor" + LEAD JAVERIANA)?**

The executed workflow was confirmed as **Workflow C** (Lead Identity Manager panel), matching the
production state exactly. Root cause is proven: `issueIdentity()` had no membership guard.

---

## 9. Fixes (implemented 2026-08-06)

All five suggestions have been addressed:

1. **Guard in `issueIdentity()` (chokepoint):** `lib/services/lead-identity.service.ts` now calls
   `hasEligibleChapterMembership({ userId, chapterId })` for chapter-scoped identity types
   (`chapter_member`, `chapter_editor`, `alumni`). Without an approved or alumni
   `chapter_membership` for that chapter, the service returns
   `'Cannot issue a chapter-scoped identity. Assign membership first.'` — no row is inserted.
   Because the guard lives in the chokepoint, it also protects every other caller
   (`issueChapterEditorIdentity`, `issueForApprovedMembership`, role-assignment paths).
2. **Admin panel warning + disable:** `lead-identity-manager.tsx` receives
   `eligibleMembershipChapterIds` from `app/[locale]/admin/users/[id]/page.tsx` (computed from the
   target user's membership status). The "Issue" button is disabled and a destructive warning is
   shown when the selected identity type requires a chapter with no eligible membership.
3. **Surface correct flow:** no new entry point added in this change; the user-detail page still
   links to the identity manager. See `lead-083` / runbook for the invite-path UX follow-up.
4. **Data repair (prod):** `scripts/repair-president.ts` (npm script `repair:president`) reports
   chapter-scoped identities without eligible memberships. Dry-run by default; `--confirm` revokes
   invalid identities; `--flush` forces a dry-run report. Run against prod to revoke or complete
   the partial record for `ac3a1f3e-...` per business intent.
5. **Regression tests:**
   - Service layer (`lib/services/__tests__/lead-identity.service.test.ts`): chapter-scoped issue
     rejects when no membership exists; rejects when membership is pending; allows issue when an
     approved/alumni membership exists; reactivation test seeds an eligible membership.
   - Action layer (`lib/actions/admin/identities.test.ts`, new): exercises the exact boundary the
     admin panel calls (`issueLeadIdentity` with the real service against a mocked Supabase). Covers
     no-membership rejection, pending-membership rejection, approved-membership issuance +
     `revalidatePath`, founder/staff issuance without membership (no membership query), invalid input
     validation, and unauthenticated rejection. 6 tests; full suite 589 passing.

---

## 10. Cleanup & Notes

- **Post-fix code state:** guard shipped in `lead-identity.service.ts:issueIdentity()`, admin panel
  wiring in `lead-identity-manager.tsx` + `admin/users/[id]/page.tsx`, repair script
  `scripts/repair-president.ts`, plus regression tests. All verified (Vitest, `tsc --noEmit`, ESLint).
- `.env.local` points at production; do not modify env files further.
- Users `acortes8171@dbu.edu` (no auth row) and `angy.cortes57@gmail.com` (no records beyond user
  row) are orphaned test accounts; decide whether to remove.
- The chapter `leadjaveriana` itself is healthy (name, university, city, region set).
