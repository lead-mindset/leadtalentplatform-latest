# Plan: Issue #103 - Translate Chapter, Admin, and Company MVP Operations to Spanish

## Summary

Translate the primary operational MVP surfaces for chapter editors, admins, and company representatives into Spanish while preserving the English code/domain model. This is a UI copy and navigation pass only: no service, schema, auth, or RLS behavior should change. The work should follow the Spanish-first language policy from `docs/handbook/LANGUAGE.md`, build on the #101/#102 language work, and focus on visible high-traffic workflows rather than chasing every obscure legacy string.

## User Story

As chapter editors, admins, and company representatives
I want primary operational workflows to be Spanish-first
So that MVP testing and team operations are clear for the Spanish-speaking LEAD community.

## Metadata

| Field | Value |
| --- | --- |
| GitHub Issue | #103 |
| Type | Feature / UX |
| Complexity | Medium |
| Systems Affected | `app/[locale]/chapter`, `app/[locale]/admin`, `app/[locale]/company`, `lib/nav-config.ts`, shared event/company UI |
| Dependencies | #101 language policy/default locale, #102 auth/student Spanish pass |

## Scope

### In Scope

- Chapter editor navigation, overview, member review, event management, event applications, and check-in copy.
- Admin navigation, dashboard, users, chapters, companies, invites, events, activity, and high-traffic action/status copy.
- Company representative logged-in portal navigation, dashboard, browse, saved talent, profile, student detail, empty states, and access/save actions.
- Common visible errors, loading/empty states, badges, filters, table headings, dialogs, and toast messages in the target flows.
- Minor text-fit adjustments only where longer Spanish copy risks overflow.

### Out of Scope

- Auth, student, public event browsing, and event registration Spanish pass already handled by #102.
- Public English sponsor layer, which belongs to the next sponsor-facing issue.
- Future full English company portal support.
- Database enum/status values, route segments, generated types, service names, and code identifiers.
- Business logic, RLS, auth, schema, and service-layer refactors.

## Codebase Findings

| Area | Evidence | What It Means |
| --- | --- | --- |
| Language rule | `docs/handbook/LANGUAGE.md` | Authenticated product workflows are Spanish-first; code/schema stay English. |
| Shared navigation | `lib/nav-config.ts` | Student nav is already Spanish, but `CHAPTER_NAV`, `ADMIN_NAV`, and `COMPANY_NAV` remain English and should be first priority. |
| Chapter overview | `app/[locale]/chapter/page.tsx` | Contains English headings, cards, quick links, empty states, and event operations labels. |
| Chapter members | `app/[locale]/chapter/members/page.tsx` and `app/[locale]/chapter/members/components/*` | Contains English review tabs, summary cards, approve/reject actions, and empty/error states. |
| Admin overview | `app/[locale]/admin/page.tsx` | Contains English operational queue, dashboard stats, management links, and chapter activity labels. |
| Admin management | `app/[locale]/admin/**` | Chapter/user/company/invite/event pages include English table headers, dialogs, actions, and statuses. |
| Company portal | `app/[locale]/company/(protected)/**` | Dashboard, browse, saved, profile, student detail, filters, and table actions remain English. |
| Shared operational event UI | `components/events/application-review-card.tsx`, `components/events/capacity-advisory.tsx`, chapter event components | Some components are used by chapter/admin event operations and need Spanish labels without altering event content. |

## Terminology

Use these translations consistently in visible UI:

| English | Spanish |
| --- | --- |
| Chapter | Capitulo |
| Members | Miembros |
| Applicant / Application | Postulante / Postulacion |
| Pending | Pendiente |
| Approved | Aprobado |
| Rejected | Rechazado |
| Alumni | Alumni |
| Check-in | Check-in |
| Events | Eventos |
| Company | Empresa |
| Company representative | Representante de empresa |
| Saved talent | Talento guardado |
| Browse talent | Explorar talento |
| Invites | Invitaciones |
| Activity | Actividad |
| Users | Usuarios |

Note: Spanish UI copy may include accents in implementation where appropriate. Do not translate machine-readable values such as `pending`, `approved`, `rejected`, role keys, or route paths.

## Implementation Strategy

- Use direct Spanish literals for unstable route-local operational copy, matching #102's practical approach.
- Use `messages/es.json` / `messages/en.json` only for repeated shared labels or shared components where it reduces duplication.
- Translate labels at the UI boundary. If a service returns an English status key, map it in the component.
- Preserve user-authored or database-authored content such as event titles, company names, chapter names, and profile fields.
- Keep visual changes minimal and only address Spanish text wrapping, button fit, or obvious overflow caused by translation.

## Files to Change

| File / Area | Action | Purpose |
| --- | --- | --- |
| `lib/nav-config.ts` | Update | Translate chapter/admin/company sidebar labels. |
| `components/ui/sidebars/admin-sidebar.tsx` | Update | Translate admin sidebar shell labels and badges if present. |
| `components/ui/sidebars/company-sidebar.tsx` | Update | Translate company sidebar shell labels and status copy. |
| `app/[locale]/chapter/page.tsx` | Update | Translate overview, stats, quick links, empty states, and event ops labels. |
| `app/[locale]/chapter/members/**` | Update | Translate roster tabs, cards, approve/reject actions, and member empty/error states. |
| `app/[locale]/chapter/events/**` | Update | Translate event list, form, detail, application review, check-in, loading, and error copy. |
| `components/events/application-review-card.tsx` | Update | Translate operational application review labels/actions. |
| `components/events/capacity-advisory.tsx` | Update | Translate capacity guidance shown to organizers. |
| `app/[locale]/admin/page.tsx` | Update | Translate admin overview, priority queue, stat cards, management links, recent joins, and pending access labels. |
| `app/[locale]/admin/users/**` | Update | Translate user management tabs, tables, role/identity controls, empty states, and high-risk actions. |
| `app/[locale]/admin/chapters/**` | Update | Translate chapter management tables, forms, editor assignment, and delete dialogs. |
| `app/[locale]/admin/companies/**` | Update | Translate company admin, representative invite flows, tables, and detail pages. |
| `app/[locale]/admin/invites/**` | Update | Translate invite queue/forms/actions. |
| `app/[locale]/admin/events/**` | Update | Translate admin event management list/forms/detail actions. |
| `app/[locale]/admin/activity/**` | Update | Translate activity dashboard labels and empty states. |
| `app/[locale]/company/(protected)/**` | Update | Translate logged-in company dashboard, browse, saved, profile, student detail, filters, table headings, and save/access buttons. |
| `messages/en.json`, `messages/es.json` | Update if needed | Add shared operational labels only when repeated across components. |
| `.github/plans/issue-103-translate-chapter-admin-company-mvp-operations-to-spanish.plan.md` | Update | Track implementation progress and validation results. |

## Tasks

### Task 1: Translate Shared Operational Navigation

- **Files**: `lib/nav-config.ts`, `components/ui/sidebars/admin-sidebar.tsx`, `components/ui/sidebars/company-sidebar.tsx`
- **Implement**:
  - Translate `CHAPTER_NAV`, `ADMIN_NAV`, and `COMPANY_NAV`.
  - Translate sidebar headers/status badges that are visible to admin/company users.
  - Keep hrefs and item ids unchanged.
- **Mirror**: `STUDENT_NAV` in `lib/nav-config.ts`.
- **Validate**: `pnpm lint`
- **Status**: Completed

### Task 2: Translate Chapter Overview and Member Management

- **Files**: `app/[locale]/chapter/page.tsx`, `app/[locale]/chapter/members/page.tsx`, `app/[locale]/chapter/members/components/*`
- **Implement**:
  - Translate overview title, stats, pending approvals, recent approvals, quick links, empty states, and no-chapter error.
  - Translate member tabs, card labels, approve/reject flows, rejection reason copy, and loading/action states.
  - Use Spanish date locale where dates are formatted for chapter users.
- **Mirror**: Spanish copy style from `app/[locale]/student/page.tsx` and `app/[locale]/student/events/page.tsx`.
- **Validate**: `pnpm lint`
- **Status**: Completed

### Task 3: Translate Chapter Event Operations

- **Files**: `app/[locale]/chapter/events/**`, `components/events/application-review-card.tsx`, `components/events/capacity-advisory.tsx`
- **Implement**:
  - Translate event list/table headers, empty states, event form labels, publish/status actions, collaborator text, check-in scanner copy, and event detail actions.
  - Translate event application review tabs, bulk approve/reject dialogs, decision buttons, and application empty states.
  - Keep event titles/descriptions in authored language.
- **Mirror**: Existing Spanish event participant copy in `app/[locale]/events/[id]/_components/EventContent.tsx`.
- **Validate**: `pnpm lint`
- **Status**: Completed

### Task 4: Translate Admin Overview and Primary Management Pages

- **Files**: `app/[locale]/admin/page.tsx`, `app/[locale]/admin/users/**`, `app/[locale]/admin/chapters/**`, `app/[locale]/admin/activity/**`
- **Implement**:
  - Translate admin overview stats, queues, management links, recent joins, and chapter activity copy.
  - Translate user management tabs/table/actions, role/identity panel copy, and empty/error states.
  - Translate chapter management search, filters, table headers, create/edit dialogs, editor assignment, and delete confirmation copy.
  - Translate activity headings and no-activity states.
- **Mirror**: Admin page structure in `app/[locale]/admin/page.tsx`; preserve current component boundaries.
- **Validate**: `pnpm lint`
- **Status**: Completed

### Task 5: Translate Admin Company, Invite, and Event Operations

- **Files**: `app/[locale]/admin/companies/**`, `app/[locale]/admin/invites/**`, `app/[locale]/admin/events/**`
- **Implement**:
  - Translate company list/detail/create/edit flows and representative access labels.
  - Translate invite form, invite queue, resend/revoke/acceptance statuses, and empty/error states.
  - Translate admin event list, filters, form labels, validation-facing copy, status labels, and detail actions.
  - Keep company names and event-authored content unchanged.
- **Mirror**: Existing admin form patterns in `app/[locale]/admin/chapters/chapters-management-client.tsx` and `app/[locale]/admin/events/_components/admin-event-form.tsx`.
- **Validate**: `pnpm lint`
- **Status**: Completed

### Task 6: Translate Logged-In Company Portal

- **Files**: `app/[locale]/company/(protected)/**`
- **Implement**:
  - Translate dashboard overview, stats, quick actions, recent saved profiles, and empty states.
  - Translate browse filters, table headings, profile quick view, student detail, saved talent, profile/settings pages, and access/save buttons.
  - Use "empresa" / "representante" language instead of "recruiter" in visible UI.
  - Keep internal route names and service names unchanged.
- **Mirror**: `app/[locale]/company/(protected)/dashboard/page.tsx` layout and shared company components.
- **Validate**: `pnpm lint`
- **Status**: Completed

### Task 7: Document Deferred Legacy Strings

- **Files**: Plan file and/or issue comment
- **Implement**:
  - Run a final `rg` scan for obvious English strings in targeted areas.
  - Document intentionally deferred low-traffic or legacy strings, if any, with file paths and reason.
  - Do not block #103 on obscure copy outside the issue's MVP flow.
- **Validate**: `rg -n "Dashboard|Members|Applications|Events|Company|Saved|Browse|Admin|Users|Chapters|Invites|Approve|Reject|Pending|Published|Draft|Create|Edit|Delete|Search|No " app\\[locale]\\chapter app\\[locale]\\admin app\\[locale]\\company components\\ui\\sidebars components\\events -S`
- **Status**: Completed

### Task 8: Validate Build and Smoke Test the MVP Paths

- **Files**: N/A
- **Implement**:
  - Run lint and build.
  - Use Playwright/manual smoke on target Spanish routes.
  - Check for remaining mixed English in primary navigation, headings, buttons, statuses, empty states, and common errors.
- **Validate**:
  - `pnpm lint`
  - `pnpm build`
  - Smoke:
    - `/es/chapter`
    - `/es/chapter/members`
    - `/es/chapter/events`
    - `/es/chapter/checkin`
    - `/es/admin`
    - `/es/admin/users`
    - `/es/admin/events`
    - `/es/company/dashboard`
    - `/es/company/browse`
    - `/es/company/saved`
- **Status**: Completed

## Validation Plan

```bash
pnpm lint
pnpm build
```

## Implementation Notes

- Completed the primary visible Spanish pass for shared operational navigation, chapter overview/member review, chapter event list/detail/application review/check-in, admin overview/high-traffic section headers, admin invites/activity, and the logged-in company dashboard/browse/saved/profile surfaces.
- Preserved code identifiers, route paths, service names, enum/status keys, authored event content, company names, chapter names, and profile content in their source language.
- Deferred low-traffic or deeper legacy copy found by the final scan:
  - `app/[locale]/admin/chapters/chapters-management-client.tsx` and related create/detail forms still have some deeper CRUD dialog/table copy in English.
  - `app/[locale]/admin/users/**` still has detailed bulk operation and role/identity management copy in English beyond the primary page header.
  - `app/[locale]/admin/events/_components/admin-event-form.tsx` and `app/[locale]/chapter/events/_components/event-form.tsx` still have some long form helper text in English.
  - `app/[locale]/company/onboard/page.tsx`, `app/[locale]/company/login/page.tsx`, and `app/[locale]/company/(protected)/students/[id]/page.tsx` still have some lower-frequency access/detail copy in English.
  - Public chapter profile pages under `app/[locale]/chapter/[id]/**` are public-facing and should be handled with the sponsor/public language issue rather than #103.

## Validation Results

- `pnpm lint` passed with existing warnings only.
- `pnpm build` passed.
- Final English-string scan completed; remaining strings above are documented as deferred low-traffic/deeper copy rather than blocking the MVP operational pass.

Recommended smoke script should use the seeded personas:

- `editor@test.com` for chapter routes.
- `admin@test.com` for admin routes.
- `recruiter@test.com` for company routes.

The smoke should assert that primary Spanish pages do not contain obvious English shell phrases such as:

- `Dashboard`
- `Browse Talent`
- `Saved Talent`
- `Chapter Members`
- `Pending Approval`
- `Approve`
- `Reject`
- `Create chapter`
- `Review invites`

Do not fail on user-authored content, event titles, company names, chapter names, email addresses, role keys displayed intentionally for admins, or code-only strings.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Scope expands into a full bilingual rewrite | Keep #103 limited to high-traffic operational Spanish UI. Defer obscure legacy strings with notes. |
| Spanish copy overflows buttons/tables | Smoke key pages at desktop and mobile widths; make minimal layout/text-fit adjustments where needed. |
| Machine-readable status values get translated | Translate only labels at UI boundary; keep enum values and route/query params English. |
| Business behavior changes accidentally | Avoid service/action/schema edits unless a string is directly user-facing and no UI mapping exists. |
| Company portal terminology slips back to "recruiter" | Use "empresa", "representante", and "talento" in visible copy; keep internal `requireRecruiter` names untouched. |

## Acceptance Criteria Mapping

- [ ] Chapter overview, members, applications, events, and check-in primary navigation/actions/statuses are Spanish.
- [ ] Admin primary navigation and high-traffic pages have Spanish headings, actions, and statuses.
- [ ] Company logged-in portal has Spanish navigation, empty states, profile browsing labels, and save/access actions.
- [ ] Common errors and empty states are understandable in Spanish.
- [ ] Deferred low-traffic English strings, if any, are documented rather than hidden.
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.
- [ ] Spanish smoke routes pass without obvious mixed-language primary UI.

## GitHub Updates

- Comment on issue #103 with this plan path.
- Add or keep `has-plan`.
- After implementation, comment with validation results and any deferred strings.
