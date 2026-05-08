# Plan: Issue 105 - Future English Company Portal Readiness Scope

## Summary

Issue #105 is a planning/spike issue, not an implementation issue. The goal is to define the future scope for English company portal support so the team can say “not now” confidently during the Spanish-first MVP, while still knowing exactly what would need to be translated, tested, and stabilized if an English-speaking partner must log in later.

The correct output is a scope document or GitHub issue comment that inventories company portal surfaces, identifies copy/QA requirements, and confirms that full English company portal translation is out of the current MVP unless a real sponsor test requires authenticated access.

## User Story

As the product team, I want a scoped plan for future English company portal support, so that international partner login readiness can be implemented deliberately when needed.

## Metadata

| Field | Value |
| --- | --- |
| GitHub Issue | #105 |
| Type | SPIKE / PLANNING |
| Complexity | LOW-MEDIUM |
| Systems Affected | Company portal, company access, admin company invites, language policy, QA checklist |
| Source PRD | `.github/PRDs/spanish-first-product-language-strategy.prd.md` |
| Dependency | #104 Preserve English Sponsor-Facing Public Pages |

---

## Current Context

- `docs/handbook/LANGUAGE.md` says authenticated product workflows are Spanish-first and future international company portal support must be separately scoped.
- #104 now preserves `/en` as a public sponsor/partner credibility layer and adds boundary copy before English visitors enter login/company access.
- Company representative portal surfaces live under `app/[locale]/company/*`.
- Protected company routes currently use `requireRecruiter()` from `lib/auth.ts` and are intentionally Spanish-first.
- Company access is invite-only and independent of student onboarding.
- Admin company/invite workflows affect the company portal because English support would need invite email/access-state consistency, even if admin remains Spanish-first.

---

## Patterns to Follow

### Language Boundary

```md
// SOURCE: docs/handbook/LANGUAGE.md
| Company representative portal | Spanish-first for MVP. |
| Future international company portal | Separate scoped work when real partner login testing requires it. |
```

Do not implement English portal translation in this issue. Keep this as a readiness scope.

### Company Auth Boundary

```ts
// SOURCE: lib/auth.ts
export const COMPANY_ACCESS_HELP_PATH = '/company/onboard?access=missing'
```

Future English support must account for missing, inactive, revoked, expired, and error access states.

### Company Sidebar

```tsx
// SOURCE: components/ui/sidebars/company-sidebar.tsx
<SidebarGroupLabel className="text-sidebar-foreground font-medium">
  Portal de empresa
</SidebarGroupLabel>
```

Navigation is one of the first surfaces that would need bilingual support if the portal becomes English-ready.

### Company Navigation Config

```ts
// SOURCE: lib/nav-config.ts
export const COMPANY_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Resumen', href: '/company/dashboard', icon: LayoutDashboard },
  { id: 'browse', label: 'Explorar talento', href: '/company/browse', icon: Users },
  { id: 'saved', label: 'Talento guardado', href: '/company/saved', icon: Heart },
  { id: 'profile', label: 'Perfil', href: '/company/profile', icon: User },
]
```

Future work should avoid duplicating labels across route files and sidebars.

---

## Surface Inventory

| Surface | Files | Future English Scope |
| --- | --- | --- |
| Company login | `app/[locale]/company/login/page.tsx` | Already has English public/login copy from #104; future work should verify OTP success/error states and email language. |
| Company onboard/access help | `app/[locale]/company/onboard/page.tsx`, `app/[locale]/company/onboard/error.tsx`, `app/[locale]/company/onboard/loading.tsx` | Translate invite/access states: missing, inactive, revoked, expired, invalid token, loading, unexpected error. |
| Protected shell | `app/[locale]/company/(protected)/layout.tsx`, `components/ui/sidebars/company-sidebar.tsx`, `lib/nav-config.ts` | Locale-aware sidebar label, mobile title/subtitle, and nav labels. |
| Dashboard | `app/[locale]/company/(protected)/dashboard/page.tsx` | Headings, stats, quick actions, recent saved empty state. |
| Browse talent | `app/[locale]/company/(protected)/browse/page.tsx`, `_components/browse-filters.tsx`, `_components/search-filter.tsx`, `_components/students-table.tsx` | Search labels, filters, empty state, table/card labels, save buttons, profile CTA. |
| Saved talent | `app/[locale]/company/(protected)/saved/page.tsx` | Saved count grammar, empty state, table/card labels. |
| Student profile detail | `app/[locale]/company/(protected)/students/[id]/page.tsx`, `_components/save-student-button.tsx`, `_components/resume-access-button.tsx`, `_components/student-quick-view.tsx`, `_components/student-profile.tsx` | Profile headings, eligibility explanation, resume/link sections, save/resume action labels, toast text. |
| Company profile/settings | `app/[locale]/company/(protected)/profile/page.tsx`, `profile-form.tsx`, `settings/page.tsx` | Profile form labels, access metadata, success/error toasts, settings states. |
| Protected errors/loaders | `app/[locale]/company/(protected)/**/error.tsx`, `loading.tsx` | Loading skeleton text and recovery actions. |
| Admin invite dependency | `app/[locale]/admin/invites/*`, `app/[locale]/admin/companies/*` | Do not translate admin now, but document invite/access wording that must remain compatible with English company users. |

---

## Files to Create or Modify

| File | Action | Purpose |
| --- | --- | --- |
| `.github/plans/issue-105-future-english-company-portal-readiness-scope.plan.md` | CREATE | Implementation plan and traceability for #105. |
| `docs/handbook/LANGUAGE.md` | UPDATE | Add a short readiness note saying English company portal remains future-scoped and requires a complete bilingual QA pass. |
| `docs/handbook/ENGLISH_COMPANY_PORTAL_READINESS.md` | CREATE | Canonical scope document for future English company portal support. |
| GitHub issue #105 | UPDATE | Comment with scope summary and close if accepted. |

---

## Tasks

### Task 1: Create Future Scope Document

**Status**: Completed

- **File**: `docs/handbook/ENGLISH_COMPANY_PORTAL_READINESS.md`
- **Action**: CREATE
- **Implement**: Document the future English company portal scope with sections for decision, non-goals, surface inventory, trigger conditions, implementation approach, QA matrix, and follow-up issue recommendations.
- **Mirror**: `docs/handbook/LANGUAGE.md` tone and route policy.
- **Validate**: Manual review.

### Task 2: Document Trigger Conditions

**Status**: Completed

- **File**: `docs/handbook/ENGLISH_COMPANY_PORTAL_READINESS.md`
- **Action**: UPDATE
- **Implement**: Define clear triggers before implementation starts:
  - A real English-speaking company representative must log in for a sponsor/partner test.
  - The team has a named company/account owner to validate terminology.
  - QA has at least one seeded or QA company representative account.
  - The team accepts the extra maintenance cost for bilingual company workflows.
- **Mirror**: `docs/handbook/LANGUAGE.md` “Future international company portal” rule.
- **Validate**: Confirm the doc explicitly says this does not block Spanish-first MVP.

### Task 3: Create Bilingual QA Matrix

**Status**: Completed

- **File**: `docs/handbook/ENGLISH_COMPANY_PORTAL_READINESS.md`
- **Action**: UPDATE
- **Implement**: Add a QA checklist for English company portal readiness:
  - `/en/company/login`
  - `/en/company/onboard`
  - `/en/company/dashboard`
  - `/en/company/browse`
  - `/en/company/saved`
  - `/en/company/students/[id]`
  - `/en/company/profile`
  - `/en/company/settings`
  - access denied/expired/revoked/missing states
  - mobile sidebar and table/card responsive behavior
  - save/unsave, resume open, filters, empty states, toasts, and errors
- **Mirror**: `docs/handbook/UI_UX.md` visual product builder workflow.
- **Validate**: Checklist covers browse, saved talent, profile detail, access, invites, settings, empty states, and errors.

### Task 4: Add Language Handbook Cross-Reference

**Status**: Completed

- **File**: `docs/handbook/LANGUAGE.md`
- **Action**: UPDATE
- **Implement**: Add a short note linking to the English company portal readiness document and reaffirming that the current MVP company portal remains Spanish-first.
- **Mirror**: Existing “Public English Sponsor Layer” section.
- **Validate**: No contradiction with #104 public English rules.

### Task 5: Recommend Future Follow-Up Issues Without Creating Them Yet

**Status**: Completed

- **File**: `docs/handbook/ENGLISH_COMPANY_PORTAL_READINESS.md`
- **Action**: UPDATE
- **Implement**: Include recommended future issue slices:
  - English company portal message architecture and copy map.
  - English company portal browse/saved/profile surfaces.
  - English company access/invite states and email copy.
  - English company portal QA and visual regression pass.
- **Mirror**: Existing GitHub issue style in `.github/issues/spanish-first-product-language-strategy-issues.md`.
- **Validate**: Mark them as “create only when trigger conditions are met.”

### Task 6: Update GitHub Issue #105

**Status**: Completed

- **Action**: UPDATE
- **Implement**: Comment with:
  - Scope doc path.
  - Decision summary.
  - Surface inventory summary.
  - QA requirements.
  - Confirmation that implementation is deferred.
- **Validate**: Issue #105 has `has-plan` if available and can be closed after the scope doc is accepted.

---

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| The spike turns into a translation implementation | Keep tasks docs-only and explicitly defer implementation until trigger conditions are met. |
| Future team translates only visible happy path | Surface inventory includes errors, loading, empty states, access states, toasts, and mobile. |
| English company portal conflicts with Spanish-first MVP | Handbook note confirms current MVP remains Spanish-first. |
| Admin invite language gets forgotten | Scope doc includes admin invite/access dependencies without translating admin. |
| Copy gets scattered across route files later | Future issue recommendation includes message architecture/copy map before UI translation. |

---

## Acceptance Criteria Mapping

- [ ] Company portal surfaces requiring future English support are identified.
- [ ] Browse, saved talent, profile detail, access, invites, settings, empty states, and errors are accounted for.
- [ ] Scope confirms English company portal is out of current MVP unless real sponsor testing requires login.
- [ ] Future work includes bilingual QA requirements.

---

## Validation

```bash
pnpm lint
pnpm build
```

For this planning/spike issue, validation is mostly document review. Run build/lint only if implementation touches executable code. If only docs are created, record “not run, docs-only.”

---

## GitHub Work

## Implementation Result

- Scope document created: `docs/handbook/ENGLISH_COMPANY_PORTAL_READINESS.md`.
- Language handbook cross-reference added.
- GitHub issue #105 updated and closed.
- Validation: manual documentation review completed. `pnpm lint` and `pnpm build` were not run for #105 because this implementation was docs-only and did not change executable product code beyond the handbook cross-reference.

- Comment on #105 with plan path.
- Add `has-plan`.
- During implementation, comment with scope document path and close #105 if the scope is accepted.
