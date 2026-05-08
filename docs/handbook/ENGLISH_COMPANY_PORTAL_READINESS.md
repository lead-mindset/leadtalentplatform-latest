# English Company Portal Readiness

This document scopes future English support for the company representative portal. It is intentionally a readiness plan, not approval to translate the portal now.

## Decision

The company representative portal remains Spanish-first for the MVP.

English public pages support sponsor and partner discovery, but authenticated company workflows should become English-ready only when there is real English-speaking partner login demand.

## Non-Goals

- Do not translate the full company portal as part of the current MVP.
- Do not translate admin, chapter, or student operational portals as part of this scope.
- Do not change company access authorization, recruiter access rules, RLS, or invite security.
- Do not create a second company portal route tree.
- Do not translate database values, role keys, status keys, service names, or generated types.

## Trigger Conditions

Start implementation only when all of these are true:

- A real English-speaking company representative must log in for a sponsor or partner test.
- The team has a named company or account owner who can validate terminology.
- QA has at least one seeded or QA company representative account with active accepted access.
- The team accepts the maintenance cost of bilingual company workflows.
- Product agrees which company workflows are required for that partner test.

This does not block the Spanish-first MVP.

## Surface Inventory

| Surface | Current Files | Future English Requirement |
| --- | --- | --- |
| Company login | `app/[locale]/company/login/page.tsx` | Verify English login, OTP success, OTP failure, invite-only explanation, and Spanish-first boundary copy. |
| Company onboard/access help | `app/[locale]/company/onboard/page.tsx`, `error.tsx`, `loading.tsx` | Translate missing, inactive, revoked, expired, invalid token, loading, and unexpected error states. |
| Protected shell | `app/[locale]/company/(protected)/layout.tsx`, `components/ui/sidebars/company-sidebar.tsx`, `lib/nav-config.ts` | Locale-aware sidebar label, mobile title/subtitle, workspace labels, and navigation. |
| Dashboard | `app/[locale]/company/(protected)/dashboard/page.tsx` | Translate headings, stats, quick actions, recent saved profiles, and empty states. |
| Browse talent | `app/[locale]/company/(protected)/browse/page.tsx`, `_components/browse-filters.tsx`, `_components/search-filter.tsx`, `_components/students-table.tsx` | Translate filters, search, table/card labels, save actions, empty states, and profile CTA. |
| Saved talent | `app/[locale]/company/(protected)/saved/page.tsx` | Translate saved count grammar, empty state, table/card labels, and return-to-browse CTA. |
| Student profile detail | `app/[locale]/company/(protected)/students/[id]/page.tsx`, `_components/save-student-button.tsx`, `_components/resume-access-button.tsx`, `_components/student-quick-view.tsx`, `_components/student-profile.tsx` | Translate profile headings, eligibility explanation, resume/link sections, save/resume labels, toasts, and unavailable data states. |
| Company profile | `app/[locale]/company/(protected)/profile/page.tsx`, `profile-form.tsx` | Translate form labels, company access metadata, success/error toasts, and cancel/save actions. |
| Settings | `app/[locale]/company/(protected)/settings/page.tsx` | Translate account/company settings labels, loading, error, and access state copy. |
| Protected errors/loaders | `app/[locale]/company/(protected)/**/error.tsx`, `loading.tsx` | Translate recovery actions, loading labels, error headings, and support guidance. |
| Admin invite dependency | `app/[locale]/admin/invites/*`, `app/[locale]/admin/companies/*` | Admin may remain Spanish-first, but invite wording, link behavior, and access-state explanations must remain compatible with English company users. |

## Implementation Approach

1. Create a company portal copy map before editing UI.
2. Prefer shared message keys for repeated company terms: company portal, company representative, visible talent, saved talent, company access, invite, expired, revoked, inactive, resume, profile visibility.
3. Keep authored content in its original language: names, chapter names, company names, skills, majors, resumes, and profile text.
4. Keep protected route structure unchanged under `app/[locale]/company/*`.
5. Keep service and action errors machine-oriented where appropriate, but translate user-facing labels at the UI boundary.
6. Use the visual product builder loop from `docs/handbook/UI_UX.md` after the copy pass: desktop, mobile, empty states, error states, and representative workflows.

## Bilingual QA Matrix

When English company portal implementation is triggered, validate all of these:

| Route / State | Required Checks |
| --- | --- |
| `/en/company/login` | Login copy, invite-only explanation, OTP success, OTP failure, loading state, mobile fit. |
| `/en/company/onboard` | Missing access, inactive access, revoked access, expired access, invalid token, valid token, loading, unexpected error. |
| `/en/company/dashboard` | Stats, quick actions, recent saved profiles, empty saved state, company name display. |
| `/en/company/browse` | Search, filters, no-results state, table/card labels, save/unsave, profile navigation. |
| `/en/company/saved` | Saved list, zero saved state, saved count grammar, return-to-browse CTA. |
| `/en/company/students/[id]` | Profile detail headings, eligibility explanation, resume access, LinkedIn link, missing resume, missing LinkedIn, save/unsave. |
| `/en/company/profile` | Profile form labels, company access details, save success, save error, cancel/back behavior. |
| `/en/company/settings` | Account/company settings labels, access status, loading and error states. |
| Mobile shell | Sidebar open/close, active nav labels, no horizontal overflow, tap targets, table-to-card behavior. |
| Toasts and inline errors | Save/unsave errors, resume access errors, profile update errors, auth errors. |
| Access security | English UI must not bypass `requireRecruiter()` or active `recruiter_access`. |

Minimum validation commands:

```bash
pnpm lint
pnpm build
pnpm test
```

Minimum browser checks:

```text
/en/company/login
/en/company/onboard
/en/company/dashboard
/en/company/browse
/en/company/saved
/en/company/students/[id]
/en/company/profile
/en/company/settings
```

## Future Issue Slices

Create these only when the trigger conditions are met:

1. **English Company Portal Message Architecture and Copy Map**
   - Define shared message keys and terminology.
   - Avoid route-local duplicated copy.
   - Decide which admin invite copy must be compatible with English company users.

2. **English Company Portal Browse, Saved, and Profile Surfaces**
   - Translate dashboard, browse, saved talent, student profile detail, save/resume actions, empty states, and toasts.
   - Preserve authored profile and event data in original language.

3. **English Company Access, Invite, and Account States**
   - Translate company login, onboard/access states, loading/error screens, and support guidance.
   - Confirm invite links and OTP redirects preserve locale.

4. **English Company Portal QA and Visual Regression Gate**
   - Run desktop/mobile browser QA.
   - Validate empty, loading, error, unauthorized, expired, revoked, and happy paths.
   - Capture screenshots for high-value screens.

## Acceptance Checklist

- [x] Future English company portal surfaces are fully inventoried.
- [x] Browse, saved talent, profile detail, access, invites, settings, empty states, and errors are accounted for.
- [x] The current MVP remains Spanish-first.
- [x] English portal implementation is gated by real partner login demand.
- [x] QA expectations include functional, visual, mobile, and access-state checks.
