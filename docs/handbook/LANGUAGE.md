# Language Policy

This document is the canonical language rule for LEAD product work.

## Product Rule

Spanish is the default visible product language.

The primary MVP audience is Spanish-speaking students, chapter teams, admins, staff, and LATAM company representatives. Authenticated product workflows should therefore be Spanish-first.

English is intentionally supported for public sponsor and partner credibility, not as a promise that every logged-in workflow is translated.

## Route Policy

- Keep `next-intl` as the i18n framework.
- Keep `i18n/routing.ts` as the locale routing source of truth.
- Keep `locales: ['en', 'es']`.
- Keep `defaultLocale: 'es'`.
- Keep explicit `/es` and `/en` prefixes for now.
- Do not switch to unprefixed Spanish URLs with `localePrefix: 'as-needed'` unless a separate issue scopes that migration.

## Surface Policy

| Surface | Language Rule |
| --- | --- |
| Public Spanish pages | Spanish-first and canonical for the MVP audience. |
| Public English pages | Supported for sponsors, partners, and international reviewers. |
| Auth pages | Spanish-first. |
| Student flows | Spanish-first. |
| Chapter editor flows | Spanish-first. |
| Admin flows | Spanish-first for visible product UI. |
| Company representative portal | Spanish-first for MVP. |
| Future international company portal | Separate scoped work when real partner login testing requires it. |

## Engineering Rule

Keep code, database schema, generated types, service names, test names, and internal architecture language in English.

Translate user-facing labels at the UI boundary. Do not translate database enum values, role keys, status keys, route segment names, or machine-readable identifiers.

## Content Rule

Event titles, user-provided profile content, company names, chapter names, and uploaded content stay in their authored language.

Avoid mixing English and Spanish inside one route's interface copy unless the mixed content is user-authored, event-authored, or intentionally sponsor-facing.

## Implementation Guidance

- Prefer `messages/es.json` and `messages/en.json` for shared or repeated UI copy.
- Direct Spanish literals are acceptable for unstable route-local copy during active MVP iteration.
- When a route becomes stable, move repeated copy into message files.
- Public English copy should be polished and credible, but should not imply that the full authenticated app is English-ready.
- Follow `docs/handbook/UI_UX.md` for visual consistency while translating copy.

## Public English Sponsor Layer

Issue #104 defines the intentional English public layer. Supported English public routes include the homepage, public event shell, partner information, and help/contact surfaces.

English public pages should help sponsors, partners, and international reviewers understand LEAD, review public community activity, and find the right contact or company-access path. They must not imply that logged-in student, chapter, admin, or company workflows are fully English-ready.

Event titles, descriptions, chapter names, company names, and user-authored content stay in their original authored language. Translate the route shell, navigation labels, CTAs, status labels, empty states, and help text only.

## Future English Company Portal

The company representative portal remains Spanish-first for the MVP. Future English company portal support is scoped in `docs/handbook/ENGLISH_COMPANY_PORTAL_READINESS.md` and should begin only when a real English-speaking partner must test authenticated company workflows.

Do not partially translate protected company routes as opportunistic cleanup. English company portal support requires a complete bilingual copy map, access-state review, and QA pass across login, onboarding/access help, dashboard, browse, saved talent, profile detail, settings, empty states, toasts, and errors.

## Validation Checklist

For language-related work, verify:

- Spanish users are not redirected to English by default.
- Explicit `/en` public routes still work where supported.
- Authenticated product flows do not mix English and Spanish in primary navigation, headings, buttons, or status labels.
- User-facing errors and empty states are understandable in Spanish for MVP paths.
- `pnpm lint` and `pnpm build` pass.
