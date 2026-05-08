# Issues: Spanish-First Product Language Strategy

Source PRD: `.github/PRDs/spanish-first-product-language-strategy.prd.md`

## Summary

Create a focused language stabilization track that makes Spanish the default product language, translates core authenticated MVP workflows, and preserves an intentional English public layer for sponsors and partners.

## Issue Table

| Proposed Title | Type | Complexity | Dependencies |
| --- | --- | --- | --- |
| LEAD: Establish Spanish Default Locale and Language Policy | Technical / Documentation | Small | None |
| LEAD: Translate Auth and Student MVP Flows to Spanish | Feature / UX | Medium | Spanish default + policy |
| LEAD: Translate Chapter, Admin, and Company MVP Operations to Spanish | Feature / UX | Medium | Spanish default + policy |
| LEAD: Preserve English Sponsor-Facing Public Pages | Enhancement / Public | Medium | Spanish default + policy |
| LEAD: Add Future English Company Portal Readiness Scope | Spike / Future | Small | Sponsor public layer |

---

## 1. LEAD: Establish Spanish Default Locale and Language Policy

**Type:** Technical / Documentation  
**Complexity:** Small  
**Labels:** `LEAD`, `i18n`, `technical`, `documentation`, `phase:system-evolution`

### Description

As a product team, we want Spanish to be the default visible product language and the language policy to be documented, so that future UI work does not continue mixing English and Spanish accidentally.

This issue should align the app with the official `next-intl` routing model already used by the codebase. It should not introduce a new i18n library or change auth/security behavior.

### Acceptance Criteria

- [ ] Given the app routing config, when no explicit locale is selected, then Spanish is the default locale.
- [ ] Given locale-based routing, when `/es` and `/en` are visited, then routing remains predictable and does not break existing public/auth flows.
- [ ] Given authenticated redirects, when a Spanish user logs in or is redirected, then they are not accidentally pushed into English routes.
- [ ] Given future UI work, when agents/developers inspect docs, then the Spanish-first product language policy is documented.
- [ ] Given code review, when implementation is inspected, then code/schema/service identifiers remain English while visible product UI defaults to Spanish.

### Technical Notes

- Update `i18n/routing.ts` default locale from `en` to `es`.
- Decide whether to keep `localePrefix: 'always'` or explicitly plan a later `localePrefix: 'as-needed'` migration.
- Review `proxy.ts` and `lib/supabase/proxy.ts` redirect behavior.
- Add `docs/handbook/LANGUAGE.md` or a clear section in `docs/handbook/UI_UX.md`.
- Reference official `next-intl` guidance from the PRD.

### Validation

- `pnpm lint`
- `pnpm build`
- Manual route smoke test: `/`, `/es`, `/en`, `/es/auth/login`, `/en/auth/login`

---

## 2. LEAD: Translate Auth and Student MVP Flows to Spanish

**Type:** Feature / UX  
**Complexity:** Medium  
**Labels:** `LEAD`, `i18n`, `auth`, `student`, `frontend`, `phase:active-piv-loop`

### Description

As a Spanish-speaking participant, I want login, onboarding, dashboard, profile, and event participation flows to be in Spanish, so that I can use the product without translation friction.

This issue focuses on the highest-volume participant path. It should prioritize visible UI copy, headings, buttons, statuses, empty states, validation messages, and core navigation.

### Acceptance Criteria

- [ ] Given a Spanish-speaking participant, when they visit auth pages, then login, sign-up, forgot-password, and reset-password UI copy is Spanish.
- [ ] Given a new user, when they complete onboarding, then the primary onboarding copy, labels, buttons, and states are Spanish.
- [ ] Given a returning participant, when they open student dashboard/profile/events, then primary navigation and actions are Spanish.
- [ ] Given event browsing/registration, when a user views list/detail/register states, then user-facing labels and statuses are Spanish.
- [ ] Given seeded personas, when `participant@test.com` tests the flow, then the experience is coherent in Spanish without mixed English UI in the primary path.

### Technical Notes

- Prefer `messages/es.json` and `messages/en.json` for repeated/shared auth and navigation copy.
- Direct Spanish literals are acceptable for unstable route-local copy if they avoid overengineering.
- Do not translate event titles unless the event itself is authored in Spanish.
- Localize UI labels at the boundary; do not change database enum/status keys.

### Validation

- `pnpm lint`
- `pnpm build`
- Playwright/manual smoke:
  - `/es/auth/login`
  - `/es/auth/sign-up`
  - `/es/onboarding`
  - `/es/student`
  - `/es/student/profile`
  - `/es/events`
  - `/es/events/[id]`

### Dependencies

- Depends on: `LEAD: Establish Spanish Default Locale and Language Policy`

---

## 3. LEAD: Translate Chapter, Admin, and Company MVP Operations to Spanish

**Type:** Feature / UX  
**Complexity:** Medium  
**Labels:** `LEAD`, `i18n`, `chapter`, `admin`, `company`, `frontend`, `phase:active-piv-loop`

### Description

As chapter editors, admins, and company representatives, we want primary operational workflows to be Spanish-first, so that MVP testing and team operations are clear for the Spanish-speaking LEAD community.

This issue should focus on high-traffic operational surfaces rather than every obscure legacy string.

### Acceptance Criteria

- [ ] Given a chapter editor, when they use chapter overview, members, applications, events, and check-in, then primary navigation/actions/statuses are Spanish.
- [ ] Given an admin, when they use primary admin navigation and high-traffic pages, then major headings, actions, and statuses are Spanish.
- [ ] Given a company representative, when they use the logged-in company portal, then primary navigation, empty states, profile browsing labels, and save/access actions are Spanish.
- [ ] Given operational users, when they encounter common errors or empty states, then messages are understandable in Spanish.
- [ ] Given the MVP scope, when obscure or low-traffic legacy copy remains English, then it is documented as follow-up rather than blocking this issue.

### Technical Notes

- Use `lib/nav-config.ts` and sidebar components as high-priority translation targets.
- Keep route names and code identifiers English.
- Keep technical labels English only where they are not visible to non-technical users or are clearly internal.
- Avoid changing service/business logic.

### Validation

- `pnpm lint`
- `pnpm build`
- Manual/Playwright smoke:
  - `/es/chapter`
  - `/es/chapter/members`
  - `/es/chapter/events`
  - `/es/chapter/checkin`
  - `/es/admin`
  - `/es/admin/users`
  - `/es/admin/events`
  - `/es/company/browse`
  - `/es/company/dashboard`

### Dependencies

- Depends on: `LEAD: Establish Spanish Default Locale and Language Policy`

---

## 4. LEAD: Preserve English Sponsor-Facing Public Pages

**Type:** Enhancement / Public  
**Complexity:** Medium  
**Labels:** `LEAD`, `i18n`, `public`, `sponsors`, `frontend`, `phase:active-piv-loop`

### Description

As an English-speaking sponsor or partner, I want public English pages that explain LEAD and partnership value, so that I can understand the organization before contacting the team.

This issue should preserve intentional English public support without implying that the full logged-in product is English-ready.

### Acceptance Criteria

- [ ] Given an English-speaking sponsor, when they visit `/en`, then the public homepage explains LEAD clearly in English.
- [ ] Given public events/community pages, when viewed in English, then the UI shell is coherent while event titles remain natural/original language.
- [ ] Given partner/company public entry points, when viewed in English, then the value proposition and contact CTA are clear.
- [ ] Given an English public visitor, when they attempt to enter unsupported authenticated product flows, then behavior is intentional and not misleading.
- [ ] Given Spanish as the product default, when public English pages are maintained, then they do not regress Spanish-first routing.

### Technical Notes

- Keep `/en` available for intentional public sponsor pages.
- Do not translate the full authenticated app into English in this issue.
- Consider copy that makes public English a credibility/contact layer, not a complete product promise.
- Keep English sponsor-facing terminology polished and professional.

### Validation

- `pnpm lint`
- `pnpm build`
- Manual/Playwright smoke:
  - `/en`
  - `/en/events`
  - `/en/partner-info` or current partner/company public route
  - `/en/help`

### Dependencies

- Depends on: `LEAD: Establish Spanish Default Locale and Language Policy`

---

## 5. LEAD: Add Future English Company Portal Readiness Scope

**Type:** Spike / Future  
**Complexity:** Small  
**Labels:** `LEAD`, `i18n`, `company`, `sponsors`, `spike`, `phase:system-evolution`

### Description

As the product team, we want a scoped plan for future English company portal support, so that international partner login readiness can be implemented deliberately when needed.

This should not block the Spanish-first MVP. It is a future readiness issue to prevent accidental half-translation of company workflows.

### Acceptance Criteria

- [ ] Given future English-speaking partner login demand, when planning starts, then the company portal surfaces requiring English support are identified.
- [ ] Given company portal workflows, when scope is documented, then browse, saved talent, profile detail, access, invites, settings, empty states, and errors are accounted for.
- [ ] Given the current MVP, when this issue completes, then it confirms English company portal is out of current MVP unless a real sponsor test requires it.
- [ ] Given implementation planning, when future work is created, then it includes QA requirements for bilingual company workflows.

### Technical Notes

- This is a planning/spike issue only.
- Use findings from Spanish-first company portal work.
- Do not implement English company portal translation here.

### Validation

- Scope document or issue comment accepted.
- Follow-up implementation issues created only if needed.

### Dependencies

- Depends on: `LEAD: Preserve English Sponsor-Facing Public Pages`

