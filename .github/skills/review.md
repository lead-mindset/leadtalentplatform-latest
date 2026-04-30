---
description: Code review - reviews PRs, files, folders, or any code scope
argument-hint: <pr-number|file|folder|scope>
---

# Skill: Review

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Perform a thorough code review on PRs, files, folders, or any code scope.

**Golden Rule**: Be constructive and actionable. Every issue should have a clear recommendation.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| PR review | GitHub PR review via MCP |
| File/folder review | Local analysis + report |
| Issue tracking | GitHub Issues for follow-up |
| Review reports | `.github/reviews/` directory |

---

## Inputs
- `$ARGUMENTS` — PR number, file path, folder path, or blank (unstaged changes)

---

## Execution Flow

### Phase 1: Determine Scope

#### Parse Input
| Input Type | Example | Action |
|------------|---------|--------|
| PR number | `123`, `#123` | Fetch PR with `mcp__github__pull_request_read` |
| PR URL | `github.com/.../pull/123` | Extract number, fetch PR |
| File path | `src/api/flags.ts` | Review single file |
| Folder path | `server/src/` | Review all files |
| Blank | (none) | Review unstaged changes |

#### Get Review Target

**For PR:**
```bash
gh pr view {NUMBER} --json number,title,author,files
gh pr diff {NUMBER}
```

**For file/folder:**
```bash
find {path} -name "*.ts" -o -name "*.tsx" | grep -v node_modules
```

**For blank (unstaged):**
```bash
git diff --name-only
git diff
```

### Phase 2: Context

#### Read Project Rules
- Read `CLAUDE.md` for conventions
- Understand codebase patterns

#### Understand Intent
- For PRs: Read title and description
- For files: Understand file's purpose
- For changes: What was modified and why?

### Phase 3: Review

#### Review Each File

For each file, check:

| Category | Check |
|----------|-------|
| **Correctness** | Does the code work as intended? |
| **Type Safety** | Are types explicit, no implicit `any`? |
| **Patterns** | Does it follow existing conventions? |
| **Error Handling** | Are errors handled appropriately? |
| **Tests** | Are there tests for this code? |

#### Categorize Issues

| Severity | Criteria |
|----------|----------|
| **Critical** | Security issues, data loss, crashes |
| **High** | Type violations, missing error handling, logic errors |
| **Medium** | Pattern inconsistencies, missing edge cases |
| **Low** | Style suggestions, minor improvements |

### Phase 4: Validate

Run automated checks:
```bash
# Type check
pnpm run build

# Lint
pnpm run lint

# Tests
pnpm test
```

### Phase 5: Report

#### Create Report
**Output path**: `.github/reviews/{scope-name}-review.md`

```bash
mkdir -p .github/reviews
```

```markdown
# Code Review: {SCOPE}

**Scope**: {PR #N / file path / folder path / unstaged changes}  
**Recommendation**: {APPROVE / NEEDS WORK}

## Summary
{2-3 sentences: What was reviewed and overall assessment}

## Issues Found

### Critical
{List or "None"}

### High Priority
{List or "None"}

### Medium Priority
{List or "None"}

### Suggestions
{List or "None"}

## Validation Results

| Check | Status |
|-------|--------|
| Type Check | {PASS/FAIL} |
| Lint | {PASS/FAIL} |
| Tests | {PASS/FAIL} |

## What's Good
{Acknowledge positive aspects}

## Recommendation
{What needs to happen next}
```

#### Post to GitHub (if PR)
Using `mcp__github__pull_request_review_write`:
- `method`: `"create"`
- `event`: `"COMMENT"`, `"APPROVE"`, or `"REQUEST_CHANGES"`
- `body`: Review summary

### Phase 6: Output

```markdown
## Review Complete

**Scope**: {what was reviewed}  
**Recommendation**: {APPROVE / NEEDS WORK}

### Issues Found

| Severity | Count |
|----------|-------|
| Critical | {N} |
| High | {N} |
| Medium | {N} |

### Validation

| Check | Result |
|-------|--------|
| Type Check | {PASS/FAIL} |
| Lint | {PASS/FAIL} |
| Tests | {PASS/FAIL} |

### Report
`.github/reviews/{scope-name}-review.md`
```

---

## GitHub Integration

For PR reviews:
1. Use `mcp__github__pull_request_read` to get PR details
2. Use `mcp__github__pull_request_review_write` to submit review
3. Create GitHub Issue for critical issues if not already tracked
4. Update GitHub Project status if applicable
