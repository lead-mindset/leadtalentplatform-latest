# LEAD Funding Request Workflow PRD

## 1. Executive Summary

LEAD Funding adds a request-based funding workflow to LEAD Talent Platform so chapter leaders can request support for events or initiatives, and LEAD admin/finance can review, decide, and track receipts in one accountable place.

The MVP solves the immediate operational problem described in the LEAD finance docs: funding requests and receipts are currently scattered, difficult to review consistently, and easy to lose after events. This is not a payments or accounting system. It is a structured approval and accountability workflow that connects funding to chapters, events or initiatives, OKRs, pillars, budget breakdowns, receipts, and impact evidence.

## 2. Mission

Help LEAD fund student-led impact with clarity, trust, and lightweight accountability.

Core principles:

- Funding is an investment in purpose, collaboration, and measurable student growth.
- Chapter leaders should understand what information LEAD needs without needing finance expertise.
- Admin/finance should have a clear review queue and decision history.
- Receipts and evidence should be first-class parts of the workflow, but not punitive during the controlled pilot.
- The platform should teach LEAD's funding rules while keeping the process flexible.

## 3. Target Users

### Chapter E-board

Presidents, vice presidents, and approved e-board members request funding for chapter events or initiatives. They need Spanish-first guidance, simple budget itemization, and a clear status timeline.

### LEAD Admin / Finance / Operations

Admins review requests across chapters, approve full or partial amounts, request changes, reject requests, assign internal funding sources, and monitor receipts due.

### Regular Members

Regular members do not submit or view funding requests in v1. They may propose ideas internally to their chapter leadership outside the platform.

### Recruiters / Companies

Recruiters and companies have no visibility into funding data.

## 4. MVP Scope

### In Scope

- [ ] Chapter-scoped funding request records.
- [ ] Request statuses: `draft`, `submitted`, `changes_requested`, `approved`, `rejected`, `receipts_due`, `closed`.
- [ ] Spanish-first chapter and admin UI.
- [ ] Request-based funding only.
- [ ] Optional event link; initiative-only requests are allowed.
- [ ] Required budget breakdown by item.
- [ ] OKR and LEAD pillar alignment.
- [ ] Late-request warning when event date is less than 14 days away.
- [ ] Admin review queue with full approval, partial approval, changes requested, and rejection.
- [ ] Internal admin funding source tag with flexible values.
- [ ] Post-event accountability: actual spend, receipts, evidence links/files, impact/reflection note.
- [ ] Soft warning for chapters with pending receipts; no automatic funding block in v1.
- [ ] Service-layer business logic and Vitest coverage.
- [ ] Focused Playwright or browser QA for chapter and admin funding flows.

### Out of Scope

- [ ] Real payment transfer or bank integrations.
- [ ] Base chapter allocation engine.
- [ ] Performance-based funding score calculation.
- [ ] Public cross-chapter funding transparency.
- [ ] Member-submitted funding requests.
- [ ] Email delivery for every status change unless existing notification infrastructure is already trivial to reuse.
- [ ] Full accounting exports.
- [ ] Automatic lockout for chapters with missing receipts.

## 5. User Stories

1. As a chapter e-board member, I want to create a draft funding request, so that I can prepare the details before submitting it to LEAD.
2. As a chapter president or vice president, I want request context to be linked to my chapter and optionally to an existing event, so that funding stays accountable to official chapter activity.
3. As a chapter e-board member, I want to itemize the requested amount, so that admin/finance can understand what the money is for.
4. As a chapter leader, I want to see whether my request is pending, approved, rejected, or needs changes, so that I know what to do next.
5. As an admin, I want to review all submitted funding requests across chapters, so that decisions are centralized and auditable.
6. As an admin, I want to approve a partial amount or request changes with a note, so that LEAD can support good ideas without silently accepting unclear budgets.
7. As a chapter leader, I want to upload receipts and impact evidence after the event, so that my chapter can close the funding request responsibly.
8. As finance/operations, I want to see pending receipts and actual spend, so that LEAD can reduce receipt disorganization without making the pilot too restrictive.

## 6. Core Architecture

Use a vertical slice:

- Database: funding request tables, status/source check constraints, RLS policies, storage access for attachments if needed.
- Service: `lib/services/funding.service.ts` owns business rules and database access.
- Actions: `lib/actions/funding/*` validate input/auth and call the service.
- Chapter UI: `app/[locale]/chapter/funding/*`.
- Admin UI: `app/[locale]/admin/funding/*`.
- Shared UI: funding status badges, request summary cards, budget item rows, decision forms.
- Tests: service tests for permissions, status transitions, late warnings, receipt closing, admin decisions.

The feature must use the existing chapter permission model:

- `chapter.funding.view`
- `chapter.funding.submit`
- `chapter.funding.review`

Admin bypass remains allowed through existing admin auth. Recruiters remain blocked.

## 7. Tools / Features

### Chapter Funding Home

Route: `/[locale]/chapter/funding`

Shows own chapter requests grouped by active statuses:

- Drafts
- En revisión
- Cambios solicitados
- Aprobadas
- Comprobantes pendientes
- Cerradas

Primary action: `Nueva solicitud`.

### Funding Request Form

Route: `/[locale]/chapter/funding/new`

Required before submit:

- Event or initiative title.
- Chapter, inferred from approved membership.
- Amount requested.
- Budget items: label, category, amount.
- Event/initiative date.
- Purpose.
- OKRs.
- LEAD pillars.
- Expected audience.
- Responsible requester, inferred from auth.

Optional:

- Existing event link.
- External partner.
- Supporting notes.
- Supporting materials/files.

Late requests are allowed but flagged when the date is less than 14 days away.

Eligible expense guidance shown in-form:

- Eligible: food/modest refreshments, event materials, minimal decorations, educational/program materials, certificates or recognition tied to learning/leadership impact.
- Admin-approved exceptions: software/platform/logistics for mentorship or learning, speaker honorariums, special transportation under special funding source.
- Not eligible by default: personal expenses, giveaways, unapproved merch, social-only spending, normal transportation to/from university events.

### Admin Review

Route: `/[locale]/admin/funding`

Admin can filter by:

- Pendientes
- Cambios solicitados
- Aprobadas
- Comprobantes pendientes
- Cerradas
- Todas

Decision actions:

- Aprobar monto completo.
- Aprobar monto parcial.
- Solicitar cambios.
- Rechazar.

Admin-only optional internal funding source:

- LEAD Peru chapter budget.
- LEAD-wide event budget.
- Sponsor/partner funding.
- HOLA/Benevity or volunteer matching.
- Other.
- Unassigned.

For partial approval, changes requested, and rejection, admin note is required. Approved amount is required for partial approval.

### Post-event Accountability

When approved, the request expects:

- Actual amount spent.
- Receipts/comprobantes.
- Evidence files or links.
- Short impact/reflection note.
- Result versus original purpose.

The target completion date is 7 days after the event/initiative date. Overdue receipt requirements show warnings only; they do not automatically block new requests in v1.

## 8. Technology Stack

- Next.js 15 App Router.
- React 19 server components by default.
- Supabase Postgres, RLS, and Storage.
- Service Layer Pattern in `lib/services`.
- Server Actions in `lib/actions`.
- Tailwind CSS 4 and existing Shadcn-like components.
- `next-intl` locale routes, Spanish-first UI text.
- Vitest for service logic.
- Playwright/browser QA for critical flows.

## 9. Security & Configuration

Security rules:

- Chapter e-board can view and submit requests only for their own approved chapter membership.
- Chapter e-board cannot approve/reject requests.
- Admin can view/review all requests.
- Recruiters cannot access chapter/admin funding routes.
- Regular members cannot access funding requests.
- Other chapters cannot see request-level funding data.
- Uploaded files must be private and scoped to the request/chapter/admin review path.

No new public environment variables are expected for v1 unless storage upload patterns require existing Supabase bucket configuration.

## 10. API / Action Specification

Use Server Actions instead of public APIs unless a route handler is necessary for file upload.

### Chapter Actions

`createFundingRequest(input)`

- Creates `draft` by default.
- Validates chapter permission and approved membership.

`saveFundingRequestDraft(input)`

- Updates a draft or changes-requested request owned by the same chapter.

`submitFundingRequest(input)`

- Validates required fields.
- Sets status to `submitted`.
- Computes late-request flag.

`addFundingReceiptOrEvidence(input)`

- Adds actual spend, receipts/evidence metadata, links, and reflection.

`closeFundingRequest(input)`

- Allows closure when accountability fields are present, or admin closure with note.

### Admin Actions

`reviewFundingRequest(input)`

- Decision: `approve_full`, `approve_partial`, `request_changes`, `reject`.
- Requires admin auth.
- Records approved amount, decision note, reviewer, reviewed timestamp, and status.

`setFundingSource(input)`

- Admin-only.
- Internal tag, optional and flexible.

## 11. Success Criteria

- Chapter e-board can submit a complete request in Spanish without admin help.
- Admin can review and decide a request in under 5 business days.
- Requests less than 14 days before the event are flagged, not blocked.
- Approved requests show receipt/evidence expectations.
- Admin can identify requests with pending receipts.
- Regular members, recruiters, and other chapters cannot access request-level funding data.
- Service tests cover permission and status transition rules.
- Visual QA confirms desktop/mobile usability for chapter and admin funding routes.

## 12. Implementation Phases

### Phase 1: Database Foundation

- Add funding request tables, budget item table, decision/audit fields, attachment/evidence metadata.
- Add RLS policies and generated types.
- Add seed data for one submitted, one approved, and one receipts-due request.

### Phase 2: Service and Actions

- Implement service-layer rules.
- Implement thin server actions.
- Add Vitest coverage.

### Phase 3: Chapter UI

- Add chapter funding navigation.
- Build list, form, detail/status, and accountability UI.
- Keep Spanish-first, low-friction copy.

### Phase 4: Admin Review UI

- Add admin funding navigation.
- Build review queue, detail view, decision actions, internal funding source tag, and receipt visibility.

### Phase 5: QA and Documentation

- Add targeted tests and visual QA.
- Update product docs/runbook with v1 process and out-of-scope boundaries.

## 13. Future Considerations

- Base chapter allocation pools.
- Biannual funding review and chapter scoring.
- ROI estimation and impact metrics dashboard.
- LEAD Pulse correlation for funding context.
- Funding recognition for LEAD GALA.
- Partner/sponsor attribution and donor reports.
- Email notifications and SLA reminders.
- Finance export.

## 14. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| The form becomes too bureaucratic for chapter leaders. | Keep required fields focused and Spanish-first; use inline guidance and drafts. |
| Funding data leaks across chapters or to recruiters. | Enforce RLS, service permission checks, and route guards. |
| Receipts remain disorganized. | Make receipts/evidence a visible status and admin queue, but avoid punitive lockouts in v1. |
| Admin/finance workflow is unclear. | Provide explicit decision states, notes, and internal funding source tags. |
| Scope drifts into accounting/payments. | Keep payments offline and document out-of-scope boundaries. |

