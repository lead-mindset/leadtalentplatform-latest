---
description: Learn how to build components in this codebase
argument-hint: [github-issues]
---

# Skill: Prime Components

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Understand the component patterns used in this codebase so you can build new components correctly.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Jira issues | GitHub Issues with `ui` or `component` label |
| Component specs | Issue body with design requirements |
| Design context | GitHub Discussions or linked designs |

---

## Inputs
- Optional GitHub Issue number(s) for context (e.g., `#5` or `#5,#6,#7`)

---

## Execution Flow

### Step 0: Load External Context (if provided)

If GitHub Issue numbers are provided:
1. Call `mcp__github__issue_read` for each issue:
   - `method`: `"get"`
   - Extract UI requirements from body
   - Check for design references
2. Use this context to inform component building

### Step 1: Analyze the Codebase

1. Study the UI primitives in `src/components/ui/` (shadcn/ui components)
2. Study `src/lib/utils.ts` for the `cn()` utility
3. Study feature components as examples:
   - Form components using Server Actions with `useActionState`
   - Radio/select components with pending state
   - Minimal Client Component examples

### Step 2: Output

Produce a scannable summary:

```markdown
## Component Patterns

### UI Library
Available shadcn/ui components:
- `{Button}` — {usage}
- `{Input}` — {usage}
- `{Card}` — {usage}
- ...

### Styling
- **Tailwind 4** with CSS variables
- **`cn()` utility**: Conditional class merging
- **Pattern**:
  ```tsx
  className={cn(
    "base-classes",
    condition && "conditional-class",
    className
  )}
  ```

### Props Pattern
- **Inline types** for simple components:
  ```tsx
  export function Button({ 
    children, 
    variant = "default" 
  }: { 
    children: React.ReactNode
    variant?: "default" | "outline" 
  }) {}
  ```
- **Exported interfaces** for complex components

### Server vs Client
- **Server Components** (default): No directive
- **Client Components**: `"use client"` at top
- **Forms**: Server Actions + `useActionState`
- **Interactive elements**: `useFormStatus` for loading states

### Forms Pattern
```tsx
// Server Action
async function createAction(prevState: State, formData: FormData) {
  // validation, service call
}

// Client Component
const [state, formAction] = useActionState(createAction, initialState)
```

### External Context
{If issues loaded: "Loaded from Issues: #{numbers}"}
```

---

## GitHub Integration

When building new components:

1. Load related GitHub Issue(s) for UI requirements
2. After analysis, update issue with component plan:
   ```markdown
   Component analysis complete:
   - Shadcn components to use: {list}
   - Pattern: {Server/Client Component}
   - Form handling: {useActionState pattern}
   - Estimated effort: {small/medium/large}
   ```

3. Add `ui` and `component` labels
4. Link to design discussions if available
