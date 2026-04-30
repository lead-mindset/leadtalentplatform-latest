---
description: Prime agent with server/backend codebase understanding
argument-hint: [github-issues]
---

# Skill: Prime Server

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Build comprehensive understanding of the server/backend codebase by analyzing structure and key files.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Jira issues | GitHub Issues with `backend` label |
| API specs | Issue body with endpoint requirements |
| Technical context | GitHub Project items |

---

## Inputs
- Optional GitHub Issue number(s) for context (e.g., `#5` or `#5,#6,#7`)

---

## Execution Flow

### Step 0: Load External Context (if provided)

If GitHub Issue numbers are provided:
1. Call `mcp__github__issue_read` for each issue:
   - `method`: `"get"`
   - Extract title, body, labels
   - Look for API requirements, data models
2. Use this context to understand expected backend work

### Step 1: Analyze the Codebase

1. Study the vertical feature slice (e.g., `src/features/polls/`):
   - `models.ts` — TypeScript types
   - `schemas.ts` — Zod validation
   - `repository.ts` — Database queries
   - `service.ts` — Business logic
   - `errors.ts` — Custom error classes
   - `actions.ts` — Server Actions

2. Study the database setup (`src/core/database/`):
   - Schema definitions
   - Client configuration
   - Migrations

3. Study shared utilities (`src/shared/`)
4. Check `package.json` for backend dependencies

### Step 2: Output

Produce a scannable summary:

```markdown
## Backend Understanding

### Purpose
What the data layer does: {brief description}

### Tech Stack
- Framework: {Next.js Server Actions / Express / Fastify}
- Database: {SQLite / PostgreSQL / MySQL}
- ORM: {Drizzle / Prisma / TypeORM}
- Validation: {Zod / Yup / Joi}
- Logging: {Pino / Winston}

### Data Model
Core tables and relationships:
- `{table1}` — {description}
- `{table2}` — {description}

### Patterns
**Vertical Slice Architecture:**
- `models` → TypeScript types inferred from schema
- `schemas` → Zod validation for inputs
- `repository` → Database queries (no business logic)
- `service` → Business logic, throws typed errors
- `errors` → Custom error classes with HTTP codes
- `actions` → Server Actions for UI

**Server Actions:**
- UI → Action → Service → Repository flow
- Error catching and state objects
- Validation at service layer

### External Context
{If issues loaded: "Loaded from Issues: #{numbers}"}
```

---

## GitHub Integration

When working on backend features:

1. Load related GitHub Issue(s) for context
2. After priming, update issue with findings:
   ```markdown
   Backend analysis complete:
   - Data model: {entities}
   - API endpoints needed: {list}
   - Patterns: {vertical slice}
   - Estimated scope: {small/medium/large}
   ```

3. Add `backend` label to issue
4. Update GitHub Project status field
