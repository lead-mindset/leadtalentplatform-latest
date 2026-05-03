# Testing Handbook

All new business logic in `lib/services/` **must** have 100% unit test coverage before merging.

## Philosophy

We follow a **Service Layer Pattern** (see `docs/adr/001-service-layer-pattern.md`).

- **Services** are pure functions/classes that contain all database queries and business rules.
- **Server Actions** are "thin controllers" — they only handle auth, Zod validation, and call services.
- This separation makes tests fast, deterministic, and framework-agnostic.

## Multi-Role Testing Strategy

Due to the complex, multi-role nature of the platform (Participants, Members, Editors, Admins, Staff, Recruiters, and Alumni), tests should rely on **deterministic seed personas** rather than ad-hoc setups.

### Seed Personas Matrix
We maintain standard accounts in `supabase/seed.sql` pre-loaded with the necessary auth and schema structures:

| Persona | Email | Required Tables / State |
|---------|-------|-------------------------|
| **Public Participant** | `participant@test.com` | `public.user.role='member'`, `person_profile` |
| **Member** | `member@test.com` | `public.user.role='member'`, `person_profile`, `chapter_membership` (`position='member'`, `status='approved'`) |
| **Editor** | `editor@test.com` | `public.user.role='editor'`, `person_profile`, `chapter_membership` (`position='editor'`, `status='approved'`) |
| **Admin** | `admin@test.com` | `public.user.role='admin'`, `person_profile`, `lead_identity` (`identity_type='founder'`) |
| **Staff** | `staff@test.com` | `public.user.role='admin'`, `person_profile`, `lead_identity` (`identity_type='staff'`) |
| **Recruiter** | `recruiter@test.com` | `public.user.role='recruiter'`, `person_profile`, active accepted `recruiter_access` |
| **Alumni** | `alumni@test.com` | `public.user.role='member'`, `person_profile`, `chapter_membership` (`position='member'`, `status='alumni'`) |

*(All seed accounts share the same password: `password123` for manual UI testing).*

### Auth in Tests
For unit testing service functions (`lib/services/`), **do not use real authentication**. Mock the Supabase Client as the correct user context.
If testing server actions or E2E flows, utilize the standard seed credentials rather than relying on external providers like Google OAuth.

### Basic Person Profile Flow (LEAD-005)

The public participant profile foundation is intentionally separate from chapter membership:

- `PersonProfileService.upsertBasicProfile()` must update `public.user` contact fields and upsert `person_profile`.
- Basic profile tests must assert `chapter_membership` is not required and not written.
- Returning-user flows should call `PersonProfileService.getBasicProfile()` and prefill reusable fields.
- Manual validation should use `participant@test.com` and confirm the account can complete/reuse `person_profile` without a `chapter_membership` row.
- RLS validation should confirm authenticated users can insert/update/select only their own `person_profile`; admins may access all profiles.

### Chapter Membership Flow (LEAD-006)

Chapter affiliation is explicit and separate from basic profile data:

- Applying to a chapter must create or reuse a `chapter_membership` row with `status='pending'` and `position='member'`.
- Approval must update the specific `(user_id, chapter_id)` membership row to `status='approved'`, assign `member_id`, set `approved_by_id`, and preserve one approved chapter membership per user.
- Editor promotion must require an approved membership first; assigning a chapter editor should set membership `position='editor'`.
- Alumni should be represented as `chapter_membership.status='alumni'` with a valid position such as `member`; do not encode alumni as a position.
- Manual validation should use `member@test.com`, `editor@test.com`, and `alumni@test.com` to confirm roster tabs, member IDs, positions, and pending approval counts come from `chapter_membership`.

### Testing Concurrency (Event Registrations)
When validating risk-prone flows like event registration (e.g., maximum capacity checks), you **must** write unit tests simulating concurrency.

Use `Promise.all()` to simulate simultaneous requests. Example:

```typescript
it('prevents registering over capacity via concurrent requests', async () => {
  // Mock event capacity = 1
  const registrations = Array(5).fill(null).map((_, i) =>
    EventService.registerUser(mockSupabase, { eventId: '123', userId: `user-${i}` })
      .catch(e => e) // Catch errors to prevent Promise.all from failing early
  );

  const results = await Promise.all(registrations);
  const successes = results.filter(r => !(r instanceof Error));

  expect(successes.length).toBe(1); // Only one should succeed
});
```

## Running Tests

```bash
pnpm test         # Run once (CI mode)
pnpm test:watch   # Run in watch mode (development)
```

## Writing Service Tests

### Pattern: Mock the Supabase Client

Services accept `SupabaseClient<Database>` as a parameter. In tests, pass a mocked client:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { EventService } from '../event.service';
import { SupabaseClient } from '@supabase/supabase-js';

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn(),
} as unknown as SupabaseClient;

it('should create an event', async () => {
  (mockSupabase.single as any).mockResolvedValue({
    data: { id: '123', title: 'Test' },
    error: null,
  });

  const result = await EventService.createEvent(mockSupabase, { /* params */ });
  expect(result.id).toBe('123');
});
```

### What to Test

| Scenario | Example |
|---|---|
| Happy path | Service returns expected data on success |
| Validation edge cases | Empty strings, nulls, boundary values |
| Error handling | Supabase returns error → service throws meaningful message |
| Security logic | HTML sanitization strips `<script>` tags |
| Multi-step workflows | `upsertBasicProfile` updates `user` **and** `person_profile` without `chapter_membership` |

### What NOT to Test

- UI rendering (use Playwright for E2E smoke tests)
- Next.js framework behavior (middleware, caching)
- Real database connections (keep tests fast and offline)

## Test File Location

Place tests alongside the service they cover:

```
lib/services/
  event.service.ts
  student.service.ts
  __tests__/
    event.service.test.ts
    student.service.test.ts   # ← add when refactoring Student domain
```

## CI Integration

Tests run automatically in GitHub Actions before any PR can merge:

```yaml
# .github/workflows/ci.yml (to be created)
- run: pnpm test
```

## Coverage Checklist (Definition of Done)

Before submitting a PR:

- [ ] All new functions in `lib/services/*` have at least one test.
- [ ] Both success and error paths are covered.
- [ ] No `any` types in test files.
- [ ] `pnpm test` passes locally.
