# Plan: Chapter Directory Public Browse MVP

## Summary

Implement #158 by adding a public, locale-routed `/chapters` browse page backed by the service layer. The directory will let students scan chapters by name, university, and location, see reliable activity context, and open each chapter profile.

## User Story

As a student exploring LEAD,
I want to browse available chapters,
So that I can find a community that matches my campus or location and learn more before engaging.

## Metadata

| Field | Value |
| --- | --- |
| GitHub Issue | #158 |
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | Chapter profile service, public chapter directory route, public navigation, service tests |
| Status | Completed |

## Patterns to Follow

| Category | Source | Pattern |
| --- | --- | --- |
| Service layer | `lib/services/chapter-profile.service.ts` | Keep Supabase data rules in `lib/services`, log errors, return presentation-ready public DTOs. |
| Public pages | `app/[locale]/events/page.tsx` | Server-render public browse page with `Navbar`, locale copy, cards, loading/empty states. |
| Locale links | `app/[locale]/events/page.tsx` | Use `Link` from `@/i18n/routing` for app routes. |
| Tests | `lib/services/__tests__/chapter-profile.service.test.ts` | Use lightweight Supabase chain mocks and assert mapped DTO behavior. |

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/services/chapter-profile.service.ts` | UPDATE | Add public chapter directory types and resolver. |
| `lib/services/__tests__/chapter-profile.service.test.ts` | UPDATE | Cover directory resolution and sparse chapter rows. |
| `app/[locale]/chapters/page.tsx` | CREATE | Add public chapter directory route. |
| `app/[locale]/(public)/_components/nav-links.ts` | UPDATE | Make the directory reachable from public navigation. |
| `app/[locale]/(public)/_components/navbar-client.tsx` | UPDATE | Add Spanish label for Chapters. |
| `.github/plans/chapter-directory-public-browse-mvp.plan.md` | UPDATE | Track implementation and validation. |

## Tasks

### Task 1: Add Directory Service DTO

- **File**: `lib/services/chapter-profile.service.ts`
- **Action**: UPDATE
- [x] **Implement**: Add `PublicChapterDirectoryItem`, `PublicChapterDirectory`, and `getPublicChapterDirectory`.
- [x] **Validate**: Directory data includes chapter identity, location, approved member count, upcoming event count, and sparse flags.

### Task 2: Add Service Tests

- **File**: `lib/services/__tests__/chapter-profile.service.test.ts`
- **Action**: UPDATE
- [x] **Implement**: Test directory mapping with counts and sparse chapter rows.
- [x] **Validate**: `pnpm test -- chapter-profile.service`

### Task 3: Build Public Directory Page

- **File**: `app/[locale]/chapters/page.tsx`
- **Action**: CREATE
- [x] **Implement**: Render student-oriented directory cards, activity context, links to `/chapter/[id]`, and a polished empty state.
- [x] **Validate**: Mobile-first grid, no horizontal overflow, public-safe content only.

### Task 4: Add Public Navigation Entry

- **Files**: `app/[locale]/(public)/_components/nav-links.ts`, `app/[locale]/(public)/_components/navbar-client.tsx`
- **Action**: UPDATE
- [x] **Implement**: Add Chapters to public nav and Spanish label.
- [x] **Validate**: Public route is discoverable without auth.

### Task 5: Validate and Update GitHub

- **Commands**:
  - `pnpm test -- chapter-profile.service`
  - `pnpm lint`
- [x] **Implement**: Update this plan, comment on #158, and close #158.

## Risks

| Risk | Mitigation |
| --- | --- |
| Counts become expensive later | MVP uses simple rows and maps; can optimize with RPC/view later if needed. |
| Directory exposes operational-only data | DTO includes only public chapter fields and reliable counts. |
| `/chapter` protected dashboard confusion | Use plural `/chapters` for public discovery and keep `/chapter` for editor tools. |

## Acceptance Criteria

- [x] Public chapter directory route exists and is locale-routed.
- [x] Directory cards show chapter name, university, city/region when available, and activity context.
- [x] Each card links to the public chapter profile.
- [x] Directory uses service-layer resolver.
- [x] Empty state is clear and polished.
- [x] Mobile and desktop layouts are scannable without horizontal overflow.
- [x] Tests cover directory data resolution and sparse chapter rows.

## Validation Results

- `pnpm test -- chapter-profile.service` passed.
- `pnpm lint` passed with pre-existing warnings and no errors.
- `pnpm build` compiled successfully but failed during final TypeScript check on unrelated dirty pathway work in `app/[locale]/student/pathway-check-in/page.tsx`.
