# Testing Handbook

All new business logic in `lib/services/` **must** have 100% unit test coverage before merging.

## Philosophy

We follow a **Service Layer Pattern** (see `docs/adr/001-service-layer-pattern.md`).

- **Services** are pure functions/classes that contain all database queries and business rules.
- **Server Actions** are "thin controllers" — they only handle auth, Zod validation, and call services.
- This separation makes tests fast, deterministic, and framework-agnostic.

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
| Multi-step workflows | `updateProfile` updates `user` **and** `student_profile` |

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
