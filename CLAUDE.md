# Linke - Engineering Guide

This file documents the project for both human developers and AI coding agents.

---

## ⚠️ Source of Truth

For **product decisions**, features, and scope: see [docs/PRODUCT-SPECIFICATION.md](./docs/PRODUCT-SPECIFICATION.md) (v2.0)

This file covers **engineering** standards and patterns only.

---

## Project Overview

**Linke** - Student-recruiter platform connecting students with opportunities through events and chapters.
**GitHub Repo:** `abigailbrionesa/leadtalentplatform-latest`

### Tech Stack
- **Framework:** Next.js 15 (App Router, React 19)
- **Database:** Supabase
- **Styling:** Tailwind CSS 4
- **i18n:** next-intl with locale routing (`app/[locale]/*`)
- **Package Manager:** pnpm
- **Testing:** Vitest (service layer required)

---

## Folder Structure

```
linke/
├── app/                    # Next.js App Router pages
│   └── [locale]/           # Internationalized routes
├── components/
│   └── ui/                # Reusable Shadcn-like UI primitives
├── lib/
│   ├── services/          # Business logic (REQUIRED for all logic)
│   ├── supabase/          # Database clients (server, client, admin)
│   ├── actions/           # Server Actions (thin, validation only)
│   └── types/             # TypeScript types
├── docs/
│   ├── adr/               # Architecture Decision Records
│   └── handbook/          # Developer handbook
└── supabase/              # Database migrations
```

### Ownership Rules

| Location | Purpose | When to Use |
|----------|---------|--------------|
| `lib/services/` | Business logic, DB operations | **Always** - all data logic goes here |
| `lib/actions/` | Server Actions | Thin wrappers - auth + validation + call service |
| `lib/supabase/` | DB clients | Use appropriate client for context |
| `components/ui/` | Shared UI | Buttons, inputs, cards - reusable |
| `app/` | Routes + UI components | Only UI logic, no business logic |

---

## Key Patterns

### Service Layer Pattern (MANDATORY)

All business logic MUST live in `lib/services/`:

```typescript
// lib/services/studentService.ts
export const getStudentById = async (id: string) => {
  const student = await db.student.findUnique({ where: { id } })
  if (!student) throw new Error('Student not found')
  return student
}
```

**Why:** Testable, maintainable, single source of truth.

**Enforcement:** PRs will be rejected if business logic is in components or actions.

### Server Actions (Thin)

```typescript
// lib/actions/student.ts
export async function getStudentAction(id: string) {
  // 1. Auth check
  const session = await getServerSession()
  if (!session) throw new Error('Unauthorized')

  // 2. Validation
  const validated = z.string().uuid().parse(id)

  // 3. Call service (all logic there)
  return getStudentById(validated)
}
```

### File Naming
- **Files:** camelCase (`studentService.ts`)
- **Components:** PascalCase (`StudentProfile.tsx`)
- **Constants:** SCREAMING_SNAKE_CASE

---

## Development Workflow

### 1. Branch Naming
```
feat/description          # New feature
fix/description            # Bug fix
docs/description          # Documentation
refactor/description       # Code cleanup
```

### 2. Making Changes
1. `git checkout main && git pull`
2. `git checkout -b feat/your-feature`
3. Implement following Service Layer pattern
4. Write tests for services (required)
5. Run linting: `pnpm lint`
6. Run tests: `pnpm test`

### 3. Pull Request (REQUIRED)
Even for solo development, create PRs to:
- Document what changed and why
- Practice code review habits
- Maintain project history

**PR Template:**
```markdown
## Summary
Brief description of changes

## Why
Why this change is needed

## How to Test
Steps to verify it works

## Checklist
- [ ] Service layer used for logic
- [ ] Tests added for services
- [ ] Linting passes
```

### 4. Commit Messages
Use Conventional Commits:
```
feat: add student profile page
fix: resolve login redirect issue
docs: update README
refactor: simplify student service
```

---

## Testing Requirements

### Service Layer Tests (REQUIRED)
All services MUST have tests in `lib/services/__tests__/`:

```typescript
// lib/services/__tests__/studentService.test.ts
import { describe, it, expect } from 'vitest'
import { getStudentById } from '../studentService'

describe('studentService', () => {
  it('returns student by id', async () => {
    const student = await getStudentById('uuid-here')
    expect(student).toBeDefined()
  })
})
```

**Run tests:** `pnpm test`

### Other Tests (Optional but Recommended)
- Component tests for complex UI
- E2E tests for critical flows

---

## Getting Started

### 1. Install
```bash
pnpm install
```

### 2. Environment Setup
```bash
# Copy template
cp .env.example .env.local

# Get required values from Supabase dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# - SUPABASE_SERVICE_ROLE_KEY (NEVER commit)
```

### 3. Run Development
```bash
pnpm dev
```

### 4. Build for Production
```bash
pnpm build
```

---

## Common Tasks

### Add New Feature
1. Create service in `lib/services/`
2. Create server action in `lib/actions/`
3. Create UI in `app/[locale]/`
4. Add tests in `lib/services/__tests__/`

### Add New Database Table
1. Create migration in `supabase/migrations/`
2. Run `pnpm db:generate` to update types
3. Create/update service

### Add Component
1. Check `components/ui/` first
2. If not reusable, create in feature folder

---

## Resources

- [Service Layer ADR](./docs/adr/001-service-layer-pattern.md)
- [Contributing Guide](./docs/handbook/CONTRIBUTING.md)
- [Testing Guide](./docs/handbook/TESTING.md)

---

## Questions?

- Can't find where code should go? → Check Service Layer Pattern
- Need to add business logic? → Always in `lib/services/`
- Want to understand existing code? → Start with services

---

## Supabase

| Service | Port |
|---------|------|
| API | 54321 |
| Studio | 54323 |

**Generate types** (Windows):
```bash
pnpm run types:generate
```

⚠️ **Windows gotchas:**
- Never use PowerShell piping (`Get-Content | Out-File`) - corrupts output
- Use direct `>` redirection only
- If file shows "binary" error, delete and regenerate clean

**MCP config** (`opencode.json`):
```json
{
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "http://127.0.0.1:54321/mcp"
    }
  }
}
```

**Commands:** `pnpm supabase start` / `pnpm supabase stop` / `pnpm supabase db reset`

**Quick query:** `docker exec <container-name> psql -U postgres -d postgres -c "SELECT ..."`
