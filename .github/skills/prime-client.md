---
description: Prime agent with client/frontend codebase understanding
argument-hint: [github-issues]
---

# Skill: Prime Client

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Build comprehensive understanding of the client/frontend codebase by analyzing structure and key files.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Jira issues | GitHub Issues with `frontend` label |
| Feature specs | Issue body with acceptance criteria |
| Work context | GitHub Project items |

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
   - Look for acceptance criteria in body
2. Use this context to understand expected frontend work

### Step 1: Analyze the Codebase

1. Study the app routes (`src/app/`) — pages, layouts, loading/error boundaries
2. Study the feature components (`src/features/*/components/`)
3. Study the shared UI primitives (`src/components/ui/`)
4. Check `package.json` for frontend dependencies

### Step 2: Output

Produce a scannable summary:

```markdown
## Frontend Understanding

### Purpose
What the UI does: {brief description}

### Tech Stack
- Framework: {Next.js App Router / Pages Router}
- UI Library: {shadcn/ui, Radix, Material-UI}
- Styling: {Tailwind CSS 4 / CSS Modules / Styled Components}
- State: {React Context / Redux / Zustand}

### Components
Key components and responsibilities:
- `{ComponentName}` — {what it does}
- `{ComponentName}` — {what it does}

### Data Flow
- **Server Components**: Fetch data directly
- **Client Components**: Use Server Actions for mutations
- **Forms**: Server Actions + `useActionState` pattern

### Patterns
- **Server vs Client** component split
- **Forms**: `useActionState` + `useFormStatus`
- **Styling**: Tailwind + `cn()` utility
- **Props**: Inline types vs exported interfaces

### External Context
{If issues loaded: "Loaded from Issues: #{numbers}"}
```

---

## GitHub Integration

When working on frontend features:

1. Load related GitHub Issue(s) for context
2. After priming, create/update issue with findings:
   ```markdown
   Frontend analysis complete:
   - Components identified: {list}
   - Patterns to follow: {patterns}
   - Estimated scope: {small/medium/large}
   ```

3. Add `frontend` label to issue
4. Update GitHub Project status field
