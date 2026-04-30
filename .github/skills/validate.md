---
description: Run linter, type checker, and tests - report any failures
---

# Skill: Validate

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Run all validation checks (lint, type check, tests) and report results.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Validation checks | GitHub Actions CI/CD |
| Status reporting | GitHub Checks API |
| Failure tracking | GitHub Issues |

---

## Inputs
None required

---

## Execution Flow

### Checks to Run

All commands from project root:

```bash
# Lint (Biome, ESLint, etc.)
bun run lint

# Type check
bunx tsc --noEmit

# Tests with coverage
bun test
```

### Process

1. Run lint, capture output
2. Run type check, capture output
3. Run tests, capture output
4. Collect all failures
5. Report results

### Output

Report in this format:

```markdown
## Validation Results

| Check | Result | Details |
|-------|--------|---------|
| Lint | ✅/❌ | {N errors or "passed"} |
| Type check | ✅/❌ | {N errors or "passed"} |
| Tests | ✅/❌ | {N passed, M failed} |

### Summary
- **Status**: ✅ ALL PASSING / ❌ {N} FAILURES
- **Action needed**: {None / list of things to fix}
```

### If Failures Found

List each failure with:
1. File and line number
2. Error message
3. Suggested fix (if obvious)

Example:
```markdown
### Failures

1. **src/features/polls/service.ts:42**
   - Error: `Type 'string' is not assignable to type 'number'`
   - Fix: Check type annotation or value

2. **src/features/polls/components/vote-form.tsx:15**
   - Error: `'x' is defined but never used`
   - Fix: Remove unused variable or prefix with `_`
```

---

## GitHub Integration

### CI/CD Integration

For GitHub Actions workflows:

**File**: `.github/workflows/validate.yml`

```yaml
name: Validate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bunx tsc --noEmit
      - run: bun test
```

### Status Badges

Add to README.md:
```markdown
![Validate](https://github.com/{owner}/{repo}/workflows/Validate/badge.svg)
```

### Issue Creation

If validation fails on main branch:
1. Create GitHub Issue:
   ```markdown
   **Validation Failure on Main**
   - Check: {lint/type/test}
   - Error: {brief description}
   - Action: Fix required
   ```
2. Add `ci-failure` label
3. Assign to relevant developer

---

## Usage in Development

Run before every commit:
```bash
# Quick check
bun run lint && bunx tsc --noEmit

# Full validation
bun run validate  # if defined in package.json
```

---

## Success Criteria

All checks must pass:
- [ ] Lint passes with no errors
- [ ] Type check passes with no errors
- [ ] All tests pass
- [ ] No test coverage regressions (optional)
