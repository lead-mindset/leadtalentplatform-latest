---
description: Learn how to build new API endpoints end-to-end
argument-hint: [github-issues]
---

# Skill: Prime Endpoint

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Understand the full endpoint pattern from database to UI so you can build new endpoints correctly.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Jira issues | GitHub Issues with `api` label |
| API specs | Issue body with endpoint requirements |
| Technical requirements | GitHub Project items |

---

## Inputs
- Optional GitHub Issue number(s) for context (e.g., `#5` or `#5,#6,#7`)

---

## Execution Flow

### Step 0: Load External Context (if provided)

If GitHub Issue numbers are provided:
1. Call `mcp__github__issue_read` for each issue:
   - `method`: `"get"`
   - Extract API requirements from body
   - Look for endpoint specifications
2. Use this context to inform endpoint design

### Step 1: Analyze the Codebase

Study files in order (full data flow example):

1. **Models**: `src/features/*/models.ts` — TypeScript types inferred from schema
2. **Schemas**: `src/features/*/schemas.ts` — Zod validation for inputs
3. **Repository**: `src/features/*/repository.ts` — Drizzle queries (no business logic)
4. **Service**: `src/features/*/service.ts` — Business logic, calls repository, throws typed errors
5. **Errors**: `src/features/*/errors.ts` — Custom error classes with HTTP status codes
6. **Actions**: `src/features/*/actions.ts` — Server Actions called by Client Components
7. **Components**: `src/features/*/components/` — Forms use `useActionState`

### Step 2: Output

Produce a scannable summary:

```markdown
## Endpoint Patterns

### Type Flow
1. **Models** (inferred from Drizzle schema) →
2. **Service** (business logic) →
3. **Components** (consumed)

```typescript
// models.ts - Inferred from Drizzle
export type Poll = typeof polls.$inferSelect

// service.ts - Uses models
export async function getPoll(id: string): Promise<Poll> {}
```

### Validation
- **Zod schemas** in `schemas.ts`
- **Validated in service layer** (not middleware)
- **Pattern**:
  ```typescript
  const result = createPollSchema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(result.error)
  }
  ```

### Service Pattern
```typescript
// service.ts
export async function createPoll(data: CreatePollInput) {
  // 1. Validate input
  // 2. Check business rules
  // 3. Call repository
  // 4. Handle errors, throw domain errors
  // 5. Return result
}
```

### Server Action Pattern
```typescript
// actions.ts
export async function createPollAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const result = await createPoll(data)
    return { success: true, data: result }
  } catch (error) {
    // Catch domain errors, return state object
    return { success: false, error: error.message }
  }
}
```

### Component Pattern
- **Mutations**: `useActionState(action, initialState)`
- **Reads**: Server Components fetch directly from service
- **Forms**: 
  ```tsx
  const [state, formAction] = useActionState(createPollAction, {})
  ```

### External Context
{If issues loaded: "Loaded from Issues: #{numbers}"}
```

---

## GitHub Integration

When building new endpoints:

1. Load related GitHub Issue(s) for API requirements
2. After analysis, update issue with endpoint plan:
   ```markdown
   Endpoint analysis complete:
   - Files needed: {models, schemas, repository, service, actions}
   - Input validation: {Zod schema}
   - Error handling: {domain errors}
   - Estimated effort: {small/medium/large}
   ```

3. Add `api` and `backend` labels
4. Update GitHub Project status
