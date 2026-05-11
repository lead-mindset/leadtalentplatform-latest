# Chapter Discovery Visual QA Report

## Scope

Issue: #159 - Chapter Discovery visual QA and accessibility gate.

Validated local target:

- `http://127.0.0.1:3100/es/chapters`
- `http://127.0.0.1:3100/es/chapter/leadpucp`
- `http://127.0.0.1:3100/es/chapter/leadtecsup`

## Evidence

Screenshots:

- `tmp/chapter-qa/chapters-desktop.png`
- `tmp/chapter-qa/chapters-mobile.png`
- `tmp/chapter-qa/chapter-profile-desktop.png`
- `tmp/chapter-qa/chapter-profile-mobile.png`
- `tmp/chapter-qa/chapter-profile-sparse-mobile.png`

Machine-readable results:

- `tmp/chapter-qa/qa-results.json`
- `tmp/chapter-qa/sparse-profile-results.json`

## Findings

### Directory

- Desktop and mobile `/es/chapters` render successfully.
- Mobile width `390px` has no horizontal overflow.
- Cards show chapter name, university, city/region, approved members, upcoming events, and clear `Ver chapter` CTAs.
- Sparse chapters show an intentional `Actividad proximamente` state.
- No public member emails were detected in visible text.

### Active Chapter Profile

- `/es/chapter/leadpucp` renders outside the protected chapter editor layout after moving the public route into the `(public)` route group.
- Hero, chapter snapshot, upcoming events, community preview, location card, and footer render on desktop and mobile.
- Event cards link to public event detail routes; Playwright navigated successfully to the first event link.
- Local-only Supabase cover image URLs are hidden in favor of the standard `LEAD event` fallback to avoid broken local image blocks.
- No horizontal overflow was detected on desktop or mobile.
- No public member emails were detected in visible text.

### Sparse Chapter Profile

- `/es/chapter/leadtecsup` renders the no-upcoming-events state cleanly on mobile.
- Sparse profile shows zero upcoming events, zero approved members, zero past events, and intentional empty community preview copy.
- No horizontal overflow and no public member emails were detected.

### Accessibility Basics

- Pages have a single clear `h1` followed by `h2`/`h3` section and card headings.
- Interactive CTAs have visible text labels.
- Images checked in the rendered DOM had `alt` attributes.
- Focusable elements are present for navigation, chapter cards, CTAs, event links, map links, and footer links.
- Contrast/readability looked acceptable in screenshots for primary content and CTAs.

## Fixes Applied During QA

- Moved public chapter profile route from `app/[locale]/chapter/[id]` to `app/[locale]/(public)/chapter/[id]` so it is not wrapped by the protected chapter editor layout.
- Replaced the embedded Supabase `chapter_membership -> user` join with explicit public-safe user lookup because the local schema cache does not expose that relationship.
- Improved directory card wrapping so chapter names and activity badges do not appear cramped.
- Added local cover-image fallback handling for public chapter event cards.

## Validation Commands

- `pnpm test -- chapter-profile.service` passed.
- `pnpm lint` passed with pre-existing warnings and no errors.
- `pnpm build` was attempted and compiled successfully, but final type check is currently blocked by unrelated growth-reflection work in `app/[locale]/student/growth-reflection/page.tsx`.

## Verdict

Pass for this slice. The chapter discovery directory and public chapter profile MVP are ready for internal review, with the remaining build blocker unrelated to this chapter discovery work.
