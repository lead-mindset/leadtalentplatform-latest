# Issue #224: Admin Funding Review UI

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/224

Source PRD: `.github/PRDs/lead-funding-request-workflow.prd.md`

Depends on: #222 service/actions and #223 shared funding display helpers.

## Problem

LEAD admin/finance needs a Spanish-first review queue for request-based funding. They need to see which chapter is asking, what the request supports, whether it is late, how it maps to OKRs/pillars, and then approve, partially approve, request changes, reject, or tag an internal funding source.

## Codebase Findings

- Admin navigation is centralized in `lib/nav-config.ts` and rendered by `components/ui/sidebars/admin-sidebar.tsx`.
- Admin pages use `MainContainer`, `Breadcrumb`, `PageHeader`, cards, badges, and compact operational tables/cards.
- Funding service/actions already expose `getAdminFundingData`, `reviewFundingRequest`, `setFundingSource`, and `closeAdminFundingRequest`.
- `funding_request` rows currently contain `chapter_id` and requester id but not joined names, so the UI should load chapter/user display metadata server-side without moving business logic out of the service layer.
- Shared labels/currency/status helpers from #223 can be reused to keep chapter/admin terminology aligned.

## Design

Routes:

- `/admin/funding`: server-rendered review queue with status filters and request cards.

Components:

- Client `AdminFundingReviewPanel` for per-request review actions and funding source updates.

UX decisions:

- Default filter is `submitted` so the first view is the actionable queue.
- Status tabs are plain links so URL state is shareable and stable.
- Destructive-looking styling is reserved for real rejection only; request changes stays secondary/outline.
- Partial approval clearly requires an amount and note.
- Internal funding source is admin-only and optional.

## Tasks

- [x] Add admin funding nav item.
- [x] Add server page for `/admin/funding` with filter parsing and metadata lookup.
- [x] Render status filters, summary counts, and request cards with chapter/requester/context details.
- [x] Add client review panel for approve full, approve partial, request changes, reject, and funding source tag.
- [x] Run targeted validation and visual QA for admin desktop/mobile.

## Validation

- `pnpm run lint`
- `pnpm exec tsc --noEmit`
- `pnpm run test -- lib/services/__tests__/funding.service.test.ts`
- Browser/Playwright screenshot of `/es/admin/funding` desktop and mobile after local server is running.

Validated on `http://localhost:3101` with seeded `admin@test.com`:

- `outputs/lead-funding-admin-review-desktop.png`
- `outputs/lead-funding-admin-review-mobile.png`

## Risks

- Admin cards can become noisy. Keep decision controls grouped and hide optional source details behind a compact panel.
- Review actions only apply to `submitted`; other statuses should still be visible but not show invalid action buttons.
- Admin metadata joins should not introduce a new service dependency cycle.
