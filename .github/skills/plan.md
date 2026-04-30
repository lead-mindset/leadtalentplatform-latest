---
description: Create implementation plan with codebase analysis
argument-hint: <feature description | path/to/prd.md>
---

# Skill: Plan

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Transform input into a battle-tested implementation plan through codebase exploration and pattern extraction. Creates context-rich documents for one-pass implementation.

**Core Principle**: PLAN ONLY — no code written.

**Order**: CODEBASE FIRST. Solutions must fit existing patterns.

**Input**: `$ARGUMENTS`

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Jira Issue reference | GitHub Issue number in metadata |
| Feature specification | PRD or issue description |
| Implementation tracking | Plan markdown + GitHub Issues |
| Task breakdown | Plan tasks + GitHub Issue sub-tasks |

---

## Inputs
- `$ARGUMENTS` — feature description or path to PRD
- GitHub Issue number from conversation context (optional)

---

## Execution Flow

### 1. Parse

#### Determine Input Type
| Input | Action |
|-------|--------|
| `.prd.md` file | Read PRD, extract next pending phase |
| Other `.md` file | Read and extract feature description |
| Free-form text | Use directly as feature input |
| Blank | Use conversation context |

#### Extract Feature Understanding
- **Problem**: What are we solving?
- **User Story**: As a [user], I want to [action], so that [benefit]
- **Type**: NEW_CAPABILITY / ENHANCEMENT / REFACTOR / BUG_FIX
- **Complexity**: LOW / MEDIUM / HIGH
- **GitHub Issue**: If issue number is available in context (e.g., `#5`), capture it for plan metadata

### 2. Explore

#### Study the Codebase
Use the Explore agent to find:
1. **Similar implementations** — analogous features with file:line references
2. **Naming conventions** — actual examples from codebase
3. **Error handling patterns** — how errors are created and handled
4. **Type definitions** — relevant interfaces and types
5. **Test patterns** — test file structure and assertion styles

#### Document Patterns
| Category | File:Lines | Pattern |
|----------|------------|---------|
| NAMING | `path/to/file.ts:10-15` | {pattern} |
| ERRORS | `path/to/file.ts:20-30` | {pattern} |
| TYPES | `path/to/file.ts:1-10` | {pattern} |
| TESTS | `path/to/test.ts:1-25` | {pattern} |

### 3. Design

#### Map the Changes
- What files need to be created?
- What files need to be modified?
- What's the dependency order?

#### Identify Risks
| Risk | Mitigation |
|------|------------|
| {potential issue} | {how to handle} |

### 4. Generate

#### Create Plan File
**Output path**: `.github/plans/{kebab-case-name}.plan.md`

```bash
mkdir -p .github/plans
```

```markdown
# Plan: {Feature Name}

## Summary
{One paragraph: What we're building and approach}

## User Story
As a {user type}  
I want to {action}  
So that {benefit}

## Metadata
| Field | Value |
|-------|-------|
| Type | {type} |
| Complexity | {LOW/MEDIUM/HIGH} |
| Systems Affected | {list} |
| GitHub Issue | {issue number or "N/A"} |

---

## Patterns to Follow

### Naming
```
// SOURCE: {file:lines}
{actual code snippet}
```

### Error Handling
```
// SOURCE: {file:lines}
{actual code snippet}
```

### Tests
```
// SOURCE: {file:lines}
{actual code snippet}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `path/to/file.ts` | CREATE | {why} |
| `path/to/other.ts` | UPDATE | {why} |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: {Description}
- **File**: `path/to/file.ts`
- **Action**: CREATE / UPDATE
- **Implement**: {what to do}
- **Mirror**: `path/to/example.ts:lines` — follow this pattern
- **Validate**: `pnpm run build`

{Continue for each task...}

---

## Validation
```bash
# Type check
pnpm run build

# Lint
pnpm run lint

# Tests
pnpm test
```

---

## Acceptance Criteria
- [ ] All tasks completed
- [ ] Type check passes
- [ ] Tests pass
- [ ] Follows existing patterns
```

### 5. Output

```markdown
## Plan Created

**File**: `.github/plans/{name}.plan.md`

**Summary**: {2-3 sentence overview}

**Scope**:
- {N} files to CREATE
- {M} files to UPDATE
- {K} total tasks

**Key Patterns**:
- {Pattern 1 with file:line}
- {Pattern 2 with file:line}

**Next Step**: Review the plan, then run `/implement` skill to execute tasks.
```

---

## Integration with GitHub Issues

If a GitHub Issue number was captured:

1. Add plan reference to issue:
   ```markdown
   Implementation plan created: `.github/plans/{name}.plan.md`
   ```

2. Update issue labels:
   - Add `has-plan` label
   - Update status if using status labels

3. Create sub-issues for major tasks using `mcp__github__sub_issue_write`:
   - Link child issues to parent issue
   - Assign to appropriate milestone
