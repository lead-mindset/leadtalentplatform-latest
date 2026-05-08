# Plan: Issue 104 - Preserve English Sponsor-Facing Public Pages

## Summary

Issue #104 preserves `/en` as an intentional public credibility layer for English-speaking sponsors, partners, and international reviewers while keeping the authenticated product Spanish-first. The implementation should polish the English public homepage, events shell, partner information, and help/contact entry points; add a clear language boundary for English visitors before unsupported authenticated workflows; and avoid translating operational portals into English.

## User Story

As an English-speaking sponsor or partner, I want public English pages that explain LEAD and partnership value, so that I can understand the organization before contacting the team.

## Metadata

| Field | Value |
| --- | --- |
| GitHub Issue | #104 |
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Public routes, locale routing, public navigation, events shell, auth/company entry copy |
| Source PRD | `.github/PRDs/spanish-first-product-language-strategy.prd.md` |

## Current Context

- `docs/handbook/LANGUAGE.md` defines Spanish as the default visible product language and English as public sponsor/partner credibility support.
- `i18n/routing.ts` keeps `locales: ['en', 'es']` and `defaultLocale: 'es'`.
- Public homepage files live under `app/[locale]/(public)/*`.
- `/en/events` currently renders the same Spanish event shell as `/es/events`, while event titles/descriptions remain authored content.
- `app/[locale]/layout.tsx` currently renders `<html lang={routing.defaultLocale}>`, so `/en/*` still gets `lang="es"`.
- Public partner/help pages already exist but are static English-only, not locale-aware.
- Auth and logged-in surfaces are intentionally Spanish-first after issues #101-#103; this issue should not reopen full app translation.

---

## Patterns to Follow

### Locale Routing

```ts
// SOURCE: i18n/routing.ts
export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'es'
});
```

Use this as the source of truth. Do not add a new i18n framework or change prefix behavior.

### Language Policy

```md
// SOURCE: docs/handbook/LANGUAGE.md
English is intentionally supported for public sponsor and partner credibility, not as a promise that every logged-in workflow is translated.
```

Every English public surface should reinforce this boundary through copy and routing, not by expanding English into all protected portals.

### Public Navigation

```tsx
// SOURCE: app/[locale]/(public)/_components/navbar-client.tsx
const isEnglish = pathname.startsWith("/en");
```

The navbar already branches by locale. Extend this pattern for public link labels and boundary copy instead of adding new global state.

### Public Event Listing

```tsx
// SOURCE: app/[locale]/events/page.tsx
const EVENT_TIME_ZONE = 'America/Lima'
const EVENT_LOCALE = 'es-PE'
```

Keep authored event content natural, but make shell labels locale-aware for `/en/events`.

---

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `app/[locale]/layout.tsx` | UPDATE | Set `html lang` from the current locale instead of always using Spanish. |
| `app/[locale]/(public)/_components/nav-links.ts` | UPDATE | Include sponsor-facing public routes in navigation where appropriate. |
| `app/[locale]/(public)/_components/navbar-client.tsx` | UPDATE | Polish English labels and route boundary CTAs without affecting Spanish defaults. |
| `app/[locale]/(public)/_components/hero.tsx` | UPDATE | Make homepage hero copy locale-aware, with English sponsor credibility copy and Spanish community copy. |
| `app/[locale]/(public)/_components/company-band.tsx` | UPDATE | Keep the partner CTA polished in English and coherent in Spanish. |
| `app/[locale]/(public)/partner-info/page.tsx` | UPDATE | Make partner page locale-aware; English copy should explain partnership value and contact path. |
| `app/[locale]/(public)/help/page.tsx` | UPDATE | Make help/contact page locale-aware and point English sponsors to the right public contact path. |
| `app/[locale]/events/page.tsx` | UPDATE | Make public event shell labels/date formatting locale-aware while preserving authored event content. |
| `app/[locale]/auth/login/page.tsx` or shared auth component | UPDATE | Add a light English-only boundary note if a public English visitor enters login. |
| `app/[locale]/company/login/page.tsx` | UPDATE | Clarify English company login is invite-only and product workspace is Spanish-first for MVP. |
| `docs/handbook/LANGUAGE.md` | UPDATE | Add validation notes for English public sponsor pages if needed. |

---

## Tasks

### Task 1: Fix Locale Semantics in Root Layout

- **File**: `app/[locale]/layout.tsx`
- **Action**: UPDATE
- **Implement**: Set `<html lang={locale}>` inside the locale-aware layout path. If the current component shape prevents direct access at the `<html>` level, minimally restructure so the resolved locale controls the `lang` attribute without changing providers.
- **Mirror**: `i18n/routing.ts` for valid locale handling.
- **Validate**: `pnpm build`
- **Status**: Completed

### Task 2: Make Public Homepage Copy Locale-Aware

- **Files**:
  - `app/[locale]/(public)/_components/hero.tsx`
  - `app/[locale]/(public)/_components/company-band.tsx`
- **Action**: UPDATE
- **Implement**: Use `useLocale()` or route params to branch public copy. English should speak to sponsors/partners and international reviewers; Spanish should remain student/community-first. Do not change the visual system except where text length requires minor fit fixes.
- **Mirror**: `app/[locale]/(public)/_components/navbar-client.tsx` locale branch pattern.
- **Validate**: Browser smoke `/en` and `/es`.
- **Status**: Completed

### Task 3: Polish English Partner and Help Pages

- **Files**:
  - `app/[locale]/(public)/partner-info/page.tsx`
  - `app/[locale]/(public)/help/page.tsx`
- **Action**: UPDATE
- **Implement**: Make both pages locale-aware. For `/en`, explain LEAD, partner value, opt-in talent visibility, event collaboration, and contact/support next steps in polished sponsor language. For `/es`, keep Spanish MVP language clear. Avoid implying English company portal support beyond invite/login help.
- **Mirror**: Existing card/button structure in these pages.
- **Validate**: Browser smoke `/en/partner-info`, `/es/partner-info`, `/en/help`, `/es/help`.
- **Status**: Completed

### Task 4: Make Public Events Shell Locale-Aware

- **File**: `app/[locale]/events/page.tsx`
- **Action**: UPDATE
- **Implement**: Accept `params.locale`, set date locale to `en-US` for `/en` and `es-PE` for `/es`, and translate only shell labels: page heading, badges, empty states, counts, CTAs, availability, and timing. Keep event titles/descriptions in their authored language.
- **Mirror**: Existing event formatting helpers and `EventCard` component structure.
- **Validate**: Browser smoke `/en/events` and `/es/events`.
- **Status**: Completed

### Task 5: Add a Light English Product Boundary Before Authenticated Flows

- **Files**:
  - `app/[locale]/auth/login/page.tsx` or the shared login component
  - `app/[locale]/company/login/page.tsx`
  - `app/[locale]/company/onboard/page.tsx`
- **Action**: UPDATE
- **Implement**: For `/en`, add concise copy that says the public overview is available in English, while the MVP workspace is Spanish-first. Keep login functional. Do not redirect all `/en/auth/*` automatically; avoid surprising users who followed an English public CTA.
- **Mirror**: Existing auth/company card patterns.
- **Validate**: Browser smoke `/en/auth/login`, `/en/company/login`, `/en/company/onboard`.
- **Status**: Completed

### Task 6: Tighten Public Navigation

- **Files**:
  - `app/[locale]/(public)/_components/nav-links.ts`
  - `app/[locale]/(public)/_components/navbar-client.tsx`
- **Action**: UPDATE
- **Implement**: Ensure English visitors can reach Events, Partner Info, and Help from public navigation without seeing protected-workflow promises. Spanish labels should remain Spanish. Keep authenticated role links unchanged.
- **Mirror**: Existing `getVisibleLinks(role)` filtering.
- **Validate**: Desktop/mobile browser smoke for `/en` and `/es`.
- **Status**: Completed

### Task 7: Update Language Documentation

- **File**: `docs/handbook/LANGUAGE.md`
- **Action**: UPDATE
- **Implement**: Add a short #104 note: public English routes include home, events shell, partner info, help/contact; authenticated product remains Spanish-first; event-authored content stays natural/original language.
- **Mirror**: Existing handbook tone.
- **Validate**: Manual doc review.
- **Status**: Completed

### Task 8: Visual and Build Validation

- **Action**: VERIFY
- **Implement**:
  - Run `pnpm lint`.
  - Run `pnpm build`.
  - Use the browser visual loop for `/en`, `/en/events`, `/en/partner-info`, `/en/help`, `/en/auth/login`, `/en/company/login`, plus Spanish counterparts where copy branches.
  - Check mobile width for nav wrapping and CTA text fit.
- **Validate**: Record results in the plan and issue comment.
- **Status**: Completed
- **Results**:
  - `pnpm build` passed.
  - `pnpm lint` passed with existing warnings only.
  - `pnpm test` passed: 16 files, 261 tests.
  - Playwright smoke passed for `/en`, `/es`, `/en/events`, `/es/events`, `/en/partner-info`, `/es/partner-info`, `/en/help`, `/es/help`, `/en/auth/login`, `/en/company/login`, and `/en/company/onboard`.
  - Mobile smoke on `/en` reported no horizontal overflow.

---

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| English pages imply the whole product is English-ready | Add explicit, light boundary copy before login/company access; keep protected app Spanish-first. |
| Event content becomes awkward if translated | Translate shell labels only; leave event-authored titles/descriptions natural. |
| Locale branching spreads too much route-local copy | Keep this issue limited to public sponsor pages and boundary notes; move repeated copy to messages only if it becomes shared. |
| `html lang` fix causes provider churn | Keep provider structure intact and only pass the resolved locale to the `<html>` tag. |
| Public navigation becomes cluttered | Add only sponsor-relevant public links; avoid exposing protected operational routes to guests. |

---

## Acceptance Criteria Mapping

- [ ] `/en` explains LEAD clearly in English for sponsors and partners.
- [ ] `/en/events` has a coherent English shell while preserving event-authored content.
- [ ] `/en/partner-info` or the current public partner route has clear value proposition and contact CTA.
- [ ] English visitors entering auth/company access see intentional Spanish-first MVP boundary copy.
- [ ] Spanish default routing and `/es` public routes do not regress.

---

## Validation Commands

```bash
pnpm lint
pnpm build
```

Manual/browser smoke:

```text
/en
/es
/en/events
/es/events
/en/partner-info
/es/partner-info
/en/help
/es/help
/en/auth/login
/en/company/login
```

---

## GitHub Work

- Comment on issue #104 with this plan path.
- Keep/add `has-plan`.
- After implementation, comment with validation results and close only if all acceptance criteria are met.
