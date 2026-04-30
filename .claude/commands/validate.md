---
description: Run linter, type checker, and tests - report any failures
---

# /validate

Run all validation checks and report results.

## Checks to Run
`ash
# Lint
bun run lint

# Type check
bunx tsc --noEmit

# Tests
bun test
`

## Output

`markdown
## Validation Results

| Check | Result | Details |
|-------|--------|---------|
| Lint | ✅/❌ | {N errors or passed} |
| Type check | ✅/❌ | {N errors or passed} |
| Tests | ✅/❌ | {N passed, M failed} |

### Summary
- Status: ✅ ALL PASSING / ❌ {N} FAILURES
`

## If Failures Found
List each failure with file:line, error message, suggested fix.

## GitHub Integration
- Use .github/workflows/validate.yml for CI
- Add status badges to README
- Create GitHub Issues for failures
