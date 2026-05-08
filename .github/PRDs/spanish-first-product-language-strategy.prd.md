# Spanish-First Product Language Strategy PRD

## 1. Executive Summary

LEAD Talent Platform serves a primarily Spanish-speaking student, chapter, and staff audience, while also needing enough English public-facing credibility for sponsors and international partners. The current product mixes English and Spanish across public pages, auth, events, dashboards, and operational portals, which makes the platform feel less polished and less native to its core users.

The MVP goal is to make Spanish the default visible product language while preserving an intentional English public layer for sponsor/partner discovery. Authenticated product workflows should be Spanish-first. English support should remain focused, not partial across every route.

## 2. Mission

Make LEAD feel native, clear, and trustworthy for Spanish-speaking users while still giving English-speaking sponsors enough context to understand the mission and contact the team.

Core principles:

- Spanish is the default product language.
- Public English exists for sponsor credibility, not as a promise that the full app is translated.
- Code, database names, service names, and technical internals stay English.
- A route should not mix English and Spanish UI copy unless the mixed content is intentional user-generated or event-specific content.
- Translation work should improve clarity, not create a maintenance burden before workflows stabilize.

## 3. Target Users

### Spanish-Speaking Students and Participants

Pain points:

- English login and dashboard copy creates friction.
- Mixed-language event and onboarding flows feel unfinished.
- Students need clear next actions for events, profile completion, and chapter application.

Needs:

- Spanish auth, onboarding, dashboard, profile, and event flows.
- Clear status labels and action language.
- Trust that LEAD is built for their community.

### Chapter Editors and Staff

Pain points:

- Operational tools in English slow down approval, event, check-in, and member-management work.
- Mixed labels make it harder to train chapter teams.

Needs:

- Spanish navigation and primary actions.
- Clear operational labels for members, applications, events, and check-in.
- Consistent terminology across admin and chapter workflows.

### Admins

Pain points:

- Admin surfaces are operational and dense; mixed language increases risk of mistakes.

Needs:

- Spanish-first labels for major actions and statuses.
- Technical precision where needed, but not English-only UI by default.

### Company Representatives

Pain points:

- First MVP company representatives are expected to be Spanish-speaking or LATAM-facing.
- Fully bilingual company portal would add a broad QA surface before real English partner login demand.

Needs:

- Spanish logged-in portal for MVP.
- Future English portal if international companies need login access.

### English-Speaking Sponsors and Partners

Pain points:

- Sponsors may evaluate LEAD through public pages before contacting the team.
- If public English is absent, LEAD may look less accessible to international partners.

Needs:

- English public overview of what LEAD is.
- Evidence of community activity and talent credibility.
- Clear contact/partner CTA.
- No need for full authenticated product translation in the MVP.

## 4. MVP Scope

### In Scope

- [ ] Set Spanish as the default locale and visible entry experience.
- [ ] Translate auth flows to Spanish: login, sign up, forgot password, reset/update password, auth errors where visible.
- [ ] Translate core student flows to Spanish: onboarding, dashboard, profile, events, registration, QR/status surfaces.
- [ ] Translate chapter operational basics to Spanish: navigation, overview, members, applications, events, check-in.
- [ ] Translate admin primary navigation and high-traffic operational labels to Spanish.
- [ ] Translate logged-in company portal primary navigation and common states to Spanish.
- [ ] Keep public pages Spanish-first with intentional English versions for sponsor-facing credibility.
- [ ] Document the language policy in `docs/handbook/LANGUAGE.md` or `docs/handbook/UI_UX.md`.
- [ ] Keep route behavior clear: `/es` is canonical default; `/en` is supported only where intentionally translated.

### Out of Scope

- [ ] Full English translation of authenticated app workflows.
- [ ] Full legal translation of privacy/terms unless needed for launch.
- [ ] Refactoring every legacy string in one pass.
- [ ] Translating code identifiers, database tables, service names, tests, or internal architecture docs.
- [ ] Adding a new i18n library.
- [ ] Changing business logic, auth rules, or database schema solely for language work.

## 5. User Stories

1. As a Spanish-speaking participant, I want login and onboarding to be in Spanish, so that I can understand what to do without translation friction.
2. As a returning student, I want dashboard, profile, and event actions in Spanish, so that my next step is obvious.
3. As a chapter editor, I want chapter tools and approval actions in Spanish, so that I can manage applicants and members confidently.
4. As an admin, I want high-risk admin actions and statuses in Spanish, so that operational decisions are clear.
5. As a company representative, I want the company portal MVP in Spanish, so that I can search and save visible talent without mixed-language UI.
6. As an English-speaking sponsor, I want public English pages that explain LEAD, so that I can evaluate partnership fit.
7. As a product engineer, I want documented language rules, so that future work does not reintroduce inconsistent mixed-language copy.
8. As a QA tester, I want locale behavior to be predictable, so that test flows do not accidentally validate the wrong language experience.

## 6. Core Architecture

The app already uses `next-intl` with locale-based routing in `app/[locale]/*` and message files in `messages/en.json` and `messages/es.json`. The work should use that existing structure instead of introducing a new translation system.

High-level approach:

- Keep `i18n/routing.ts` as the route-locale source of truth.
- Change the default locale from English to Spanish.
- Use message files for shared/public/auth copy where patterns already exist.
- For route-local strings not yet using message files, either move them into messages when practical or translate directly if the route is still stabilizing.
- Avoid translating code identifiers or domain model names.
- Add a language handbook page to prevent future ambiguity.

Relevant directories:

- `i18n/routing.ts`
- `messages/en.json`
- `messages/es.json`
- `app/[locale]/auth/*`
- `app/[locale]/onboarding/*`
- `app/[locale]/student/*`
- `app/[locale]/events/*`
- `app/[locale]/chapter/*`
- `app/[locale]/admin/*`
- `app/[locale]/company/*`
- `app/[locale]/(public)/*`
- `docs/handbook/*`

### Official `next-intl` Guidance

This PRD follows the official `next-intl` App Router model:

- `i18n/routing.ts` is the shared routing configuration for middleware/proxy and navigation APIs.
- `defaultLocale` is the fallback locale when no supported locale matches.
- Locale-based routing is intended to use a top-level `[locale]` segment.
- `proxy.ts` is the current Next.js 16 name for middleware-based routing setup.
- Prefix-based routing can be configured with `localePrefix`; the default is `always`, while `as-needed` can remove the prefix for the default locale.
- Locale detection may consider path prefix, cookie, `accept-language`, and finally `defaultLocale`.
- Messages should generally live in locale JSON files and be consumed through `useTranslations`.

Implication for LEAD:

- Change `defaultLocale` from `en` to `es`.
- Keep `locales: ['en', 'es']`.
- Keep `proxy.ts` and `createNavigation(routing)` aligned with the same routing object.
- Decide deliberately whether to keep `localePrefix: 'always'` (`/es`, `/en`) or move to `localePrefix: 'as-needed'` so Spanish can live at unprefixed `/`.
- Prefer moving repeated/shared user-facing strings into `messages/es.json` and `messages/en.json`; direct Spanish literals are acceptable only for unstable route-local copy during the MVP pass.

## 7. Tools and Features

### Spanish Default Locale

Set Spanish as the default app locale so first-time users land in the Spanish experience. Preserve English routing for public pages that are intentionally maintained.

### Auth Language Pass

Translate visible auth copy:

- Login
- Sign up
- Forgot password
- Update password
- Error/success messages where user-facing

### Authenticated Product Spanish Pass

Translate primary copy in:

- Student dashboard and profile
- Onboarding
- Event registration and application states
- Chapter editor tools
- Admin basics
- Company representative portal

Priority should be primary navigation, headings, buttons, statuses, empty states, and validation messages users see during standard testing.

### Public Bilingual Credibility Layer

Maintain Spanish-first public pages and intentional English versions for sponsor review:

- Home
- Events shell
- Partner/company public landing
- Help/contact/CTA surfaces where sponsors may enter

English should explain the mission and partnership value, not pretend every logged-in workflow is English-ready.

### Language Policy Documentation

Add a canonical rule page:

- Product UI defaults to Spanish.
- Public English is sponsor-facing.
- Authenticated app is Spanish-first until an English portal issue is explicitly prioritized.
- Code and schema remain English.
- Event titles remain natural/original language.

## 8. Technology Stack

- Framework: Next.js 15/16 App Router, React 19
- i18n: `next-intl`
- Routing: locale-based `app/[locale]/*`
- Database: Supabase
- Styling: Tailwind CSS 4 and Shadcn-like primitives in `components/ui`
- Testing: Vitest and Playwright visual/manual QA where useful

No new technology is required.

## 9. Security and Configuration

This work should not alter auth security, RLS, session handling, or Supabase access rules.

Configuration considerations:

- `i18n/routing.ts` default locale should become `es`.
- Any middleware/proxy locale redirects should preserve intended locale behavior.
- Authenticated redirects should not send Spanish users back to English routes.
- Environment variables remain unchanged.

Security expectations:

- No secrets added.
- No auth bypasses.
- No changes to RLS policies.
- No service-role behavior changes.

## 10. API Specification

No new API endpoints are required.

Existing server actions and API routes may return Spanish user-facing messages where those messages are surfaced directly to users. Internal error codes and service errors may remain English if they are not shown directly.

Recommended response policy:

```json
{
  "success": false,
  "error": "Mensaje claro para el usuario"
}
```

Do not localize database enum values or machine-readable status keys. Localize labels at the UI boundary.

## 11. Success Criteria

MVP success is met when:

- Spanish is the default visible route and entry experience.
- A Spanish-speaking tester can complete login, onboarding, profile review, event browsing, and event registration without English UI friction.
- A chapter/editor tester can identify member/application/event/check-in actions in Spanish.
- Public English sponsor pages remain available and coherent.
- The app no longer mixes English and Spanish inside the same primary user flow, except for event names or user-provided content.
- `pnpm lint` and `pnpm build` pass.
- A short language policy exists in the docs and is referenced by future UI work.

## 12. Implementation Phases

### Phase 1: Language Policy and Routing

Deliverables:

- Document Spanish-first language policy.
- Change default locale to Spanish.
- Audit current route behavior for `/`, `/es`, and `/en`.
- Confirm redirects and nav do not push Spanish users into English routes.

### Phase 2: Auth and Student Product Spanish Pass

Deliverables:

- Translate auth pages and common auth messages.
- Translate onboarding.
- Translate student dashboard, profile, events, registration, and QR/status surfaces.
- Validate seeded persona flows in Spanish.

### Phase 3: Operational Product Spanish Pass

Deliverables:

- Translate chapter editor navigation and primary tools.
- Translate admin primary navigation and high-traffic pages.
- Translate company logged-in portal primary surfaces.
- Keep technical/admin-only edge labels English only if they are not part of MVP testing.

### Phase 4: Public Sponsor English Layer

Deliverables:

- Ensure Spanish public pages are the canonical default.
- Keep English public pages coherent for sponsors.
- Clarify partner CTA and sponsor-facing value proposition in English.
- Add follow-up issues for deeper English portal support only if real partner login testing requires it.

## 13. Future Considerations

- Full English authenticated company portal for international partners.
- Complete bilingual authenticated app once workflows stabilize.
- Formal terminology glossary for roles, statuses, and LEAD identity concepts.
- Translation QA checklist for future features.
- Locale-aware email templates.
- Locale-aware event creation if organizers need to specify event language.

## 14. Risks and Mitigations

### Risk: Partial Translation Creates More Confusion

Mitigation: Scope Spanish-first authenticated product and English public sponsor pages clearly. Avoid claiming full bilingual app support.

### Risk: Default Locale Change Breaks Redirects

Mitigation: Audit middleware/proxy behavior and test auth redirects for `/es` and `/en`.

### Risk: Translation Work Becomes Too Large

Mitigation: Prioritize primary flows, nav, headings, buttons, statuses, and empty/error states. Leave obscure legacy surfaces for follow-up issues.

### Risk: English Sponsors Need Portal Access Earlier Than Expected

Mitigation: Create a follow-up issue for English company portal readiness, but do not include it in the MVP pass unless a real sponsor test requires login.

### Risk: Code and UI Language Rules Get Mixed

Mitigation: Document that code/schema remain English while visible product UI is Spanish-first.
