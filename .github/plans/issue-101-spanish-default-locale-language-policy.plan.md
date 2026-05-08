# Issue #101: Establish Spanish Default Locale and Language Policy

GitHub: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/101

## Summary

Make Spanish the default product locale and document the language rules that future product/UI work must follow. This is the foundation issue for the broader Spanish-first language track, so it should stay small and avoid translating the whole app. The goal is predictable routing, Spanish-first redirects, and a canonical policy that explains where English is still intentionally supported.

## Problem

The app currently has `next-intl` routing with `locales: ['en', 'es']` but `defaultLocale: 'en'`. Product direction has changed: the primary audience is Spanish-speaking students, chapter teams, admins, and LATAM company representatives. English should remain available for sponsor-facing public pages, but it should not drive authenticated product UX.

There is also a hardcoded auth redirect fallback to English in `lib/supabase/proxy.ts`, which can push unauthenticated users to `/en/auth/login` even after Spanish becomes the product default.

## User Story

As a product team,
I want Spanish to be the default visible product language and the language policy to be documented,
so that future UI work does not continue mixing English and Spanish accidentally.

## Type and Complexity

| Field | Value |
| --- | --- |
| Type | Technical / Documentation |
| Complexity | Small |
| Phase | System Evolution |
| GitHub Issue | #101 |
| Source PRD | `.github/PRDs/spanish-first-product-language-strategy.prd.md` |
| Issue Spec | `.github/issues/spanish-first-product-language-strategy-issues.md` |

## Current Codebase Findings

- `i18n/routing.ts` is the source of truth for `next-intl` routing and currently sets `defaultLocale: 'en'`.
- `proxy.ts` creates `next-intl` middleware from `routing` and uses `routing.defaultLocale` when protected-route redirect locations need a locale prefix.
- `lib/supabase/proxy.ts` strips locale prefixes to detect public routes, but uses a hardcoded fallback locale of `'en'` when redirecting unauthenticated protected requests.
- `messages/en.json` and `messages/es.json` already exist.
- `docs/handbook/UI_UX.md` is the current UI/UX contract, but there is no dedicated language policy.
- `CODEBASE-GUIDE.md` is not present; current guidance comes from `AGENTS.md`, `CLAUDE.md`, PRDs, issues, and handbook docs.

## Design Decisions

### Keep Locale Prefixes For Now

Use the existing prefixed routing model for this issue:

- `/es/...` remains explicit Spanish.
- `/en/...` remains explicit English.
- `/` should resolve through `next-intl` using Spanish as the default locale.

Do not switch to `localePrefix: 'as-needed'` in this issue. That is a broader URL behavior migration and should be handled separately if the team wants Spanish at unprefixed URLs.

### Spanish Default, English Public Layer

Document the policy:

- Spanish is the default product language.
- Authenticated product flows are Spanish-first.
- Public English exists for sponsor/partner credibility.
- Code, schema, service names, and technical internals stay English.
- Event titles and user-provided content keep their authored language.

### No Business Logic Changes

This issue should not change auth rules, RLS, database schema, service logic, or translations for full authenticated flows.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `i18n/routing.ts` | UPDATE | Set `defaultLocale` to `es`; optionally add a short comment about prefixed routing. |
| `lib/supabase/proxy.ts` | UPDATE | Replace hardcoded English fallback with Spanish/default routing behavior. |
| `docs/handbook/LANGUAGE.md` | CREATE | Canonical Spanish-first language policy. |
| `.github/plans/issue-101-spanish-default-locale-language-policy.plan.md` | UPDATE | Track implementation and validation results. |

## Implementation Tasks

- [x] Update routing default locale.
  - **File**: `i18n/routing.ts`
  - **Action**: Change `defaultLocale` from `'en'` to `'es'`.
  - **Guardrail**: Keep `locales: ['en', 'es']`.

- [x] Fix auth redirect fallback locale.
  - **File**: `lib/supabase/proxy.ts`
  - **Action**: Replace hardcoded fallback `'en'` with Spanish/default-locale behavior.
  - **Guardrail**: Preserve public-route detection for `/auth`, `/company/login`, and `/company/onboard`.

- [x] Add the language policy handbook.
  - **File**: `docs/handbook/LANGUAGE.md`
  - **Action**: Document Spanish-first product policy, public English sponsor layer, code/schema English rule, and future translation boundaries.
  - **Guardrail**: Keep it practical and enforceable, not a giant localization essay.

- [x] Smoke test route behavior.
  - **Routes**:
    - `/`
    - `/es`
    - `/en`
    - `/es/auth/login`
    - `/en/auth/login`
    - unauthenticated `/es/student`
    - unauthenticated `/en/student`
  - **Expected**: Spanish default/fallback behavior; explicit English remains available; protected redirects preserve the requested locale.

- [x] Validate.
  - `pnpm lint`
  - `pnpm build`

- [x] Update GitHub issue #101.
  - Add a completion comment with changed files, validation, and routing decision.
  - Keep/confirm `piv-status:plan-ready` until implementation starts; update if the workflow uses status labels.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Changing default locale accidentally breaks English public pages | Keep `locales: ['en', 'es']` and explicit `/en` routes. |
| Auth redirects still force English | Replace hardcoded fallback in `lib/supabase/proxy.ts`. |
| URL behavior becomes too broad | Do not add `localePrefix: 'as-needed'` in this issue. |
| Future agents reintroduce mixed language | Add `docs/handbook/LANGUAGE.md` as a canonical rule. |

## Validation Results

- [x] Route smoke test passed with Playwright.
  - `/` redirects to `/es`.
  - `/es` renders.
  - `/en` renders.
  - `/es/auth/login` renders Spanish login copy.
  - `/en/auth/login` renders English login copy.
  - `/es/student` unauthenticated redirects to `/es/auth/login`.
  - `/en/student` unauthenticated redirects to `/en/auth/login`.
  - `/student` unauthenticated redirects to `/es/auth/login`.
- [x] `pnpm lint` passed with existing warnings only.
- [x] `pnpm build` passed.

## Follow-Up Notes

- Some `/es` public marketing copy is still English. That is intentionally deferred to #102 and #104 so this issue stays focused on locale policy and routing foundation.
- We kept explicit `/es` and `/en` prefixes. Do not switch to `localePrefix: 'as-needed'` without a separate routing migration issue.

## Out of Scope

- Translating auth/student/chapter/admin/company copy.
- Full English authenticated app support.
- Switching to unprefixed Spanish URLs via `localePrefix: 'as-needed'`.
- Changing Supabase auth or RLS behavior.
- Adding new i18n libraries.
