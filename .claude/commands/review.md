---
description: Code review - reviews PRs, files, folders, or any code scope
argument-hint: <pr-number|file|folder|scope>
---

# /review

Perform a thorough code review on PRs, files, folders, or any code scope.

## Input
- \ — PR number, file path, folder path, or blank (unstaged changes)

## Steps

### Phase 1: Determine Scope
| Input Type | Example | Action |
|------------|---------|--------|
| PR number | 123, #123 | Fetch PR with mcp__github__pull_request_read |
| PR URL | github.com/.../pull/123 | Extract number, fetch PR |
| File path | src/api/flags.ts | Review single file |
| Folder path | server/src/ | Review all files |
| Blank | (none) | Review unstaged changes |

### Phase 2: Review
For each file check: Correctness, Type Safety, Patterns, Error Handling, Tests

Categorize issues: Critical, High, Medium, Low

### Phase 3: Validate
Run: pnpm run build, pnpm run lint, pnpm test

### Phase 4: Report
Output: .github/reviews/{scope-name}-review.md
Use mcp__github__pull_request_review_write to post review
