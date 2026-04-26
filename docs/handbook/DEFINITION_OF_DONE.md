# Definition of Done (DoD)

This checklist must be satisfied before any Pull Request is considered "Done" and ready for merge into `main`.

## 1. Quality Standards
- [ ] **Type Safety:** TypeScript types are strictly defined. No `any` types used.
- [ ] **Linting:** `npm run lint` passes with zero warnings.
- [ ] **Build:** `npm run build` succeeds.

## 2. Testing Requirements
- [ ] **Service Logic:** 100% unit test coverage for all functions in `lib/services/*` affected by the change.
- [ ] **Manual Verification:** The feature has been verified on the Vercel Preview/Staging environment.
- [ ] **Regressions:** No existing unit or E2E tests are broken.

## 3. Architecture & Security
- [ ] **Service Layer:** All database logic is in a service, not a server action or component.
- [ ] **Zod Validation:** All user inputs are validated with Zod.
- [ ] **Security:** RLS policies have been reviewed to ensure data isolation.
- [ ] **Environment Variables:** No secrets or credentials are hardcoded.

## 4. Database Lifecycle
- [ ] **Migrations:** If the schema changed, a new `.sql` migration file is included in `supabase/migrations/`.
- [ ] **Idempotency:** Migrations can be run multiple times without error.

## 5. Documentation
- [ ] **Comments:** Complex logic is documented with "Why" comments.
- [ ] **ADR:** If a major architectural pattern changed, an ADR has been created in `docs/adr/`.
- [ ] **README:** Any new setup steps or env variables are added to `README.md`.
