---
description: Execute an implementation plan with validation loops
argument-hint: <path/to/plan.md>
---

# Skill: Implement Plan

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Execute an implementation plan end-to-end with rigorous self-validation. Works with GitHub Issues for task tracking and creates comprehensive reports.

**Plan**: `$ARGUMENTS`

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Jira Issue tracking | GitHub Issue status updates |
| Implementation tasks | Issue task lists + PRs |
| Status transitions | Issue state changes + labels |
| Comments/updates | Issue comments with progress |

---

## Inputs
- `$ARGUMENTS` — path to plan.md file
- GitHub Issue reference in plan metadata (optional)

---

## Execution Flow

### 1. Load
Extract from plan file:
- **Summary** — What we're building
- **Patterns to Mirror** — Code to copy from
- **Files to Change** — CREATE/UPDATE list
- **Tasks** — Implementation order
- **Validation Commands** — How to verify
- **GitHub Issue** — Check Metadata table for issue number (e.g., `#5`)

### 2. Prepare

#### Git State
```bash
git branch --show-current
git status
```

| State | Action |
|-------|--------|
| On main, clean | Create branch: `git checkout -b feature/{plan-name}` |
| On main, dirty | STOP: "Stash or commit changes first" |
| On feature branch | Use it |

### 3. Execute

**For each task in the plan:**

#### 3.1 Verify Assumptions
- Read target file (create or modify)
- Read adjacent files (imports, callers)
- Verify plan references exist
- Adapt if assumptions are wrong

#### 3.2 Implement
- Read MIRROR file and understand pattern
- Make change as specified
- Check integration: imports, callers, data flow

#### 3.3 Validate Immediately
After EVERY task:
```bash
pnpm run build
```

**If it fails:**
1. Read error
2. Fix issue
3. Re-run validation
4. Only proceed when passing

#### 3.4 Track Progress
```
Task 1: CREATE src/x.ts ✅
Task 2: UPDATE src/y.ts ✅
```

### 4. Validate

Run all checks:
```bash
# Type check
pnpm run build

# Lint
pnpm run lint

# Tests
pnpm test
```

All must pass with zero errors.

#### Write Tests
- Every new function needs at least one test
- Error cases and edge cases need tests
- Update existing tests if behavior changed
- Test across boundaries (APIs, services)

#### REQUIRED: End-to-End Verification
> **⚠️ Do NOT proceed to Phase 5 until all E2E steps pass.**

Execute every E2E test from the plan:
- [ ] Start the application
- [ ] Execute each E2E test exactly as described
- [ ] Verify expected outcome matches plan
- [ ] Fix failures, re-run, confirm passes

**If plan has no E2E tests:** Perform basic smoke test.

### 5. Report

Create implementation report:
**Output path**: `.github/reports/{plan-name}-report.md`

```bash
mkdir -p .github/reports
```

```markdown
# Implementation Report

**Plan**: `{plan-path}`  
**Branch**: `{branch-name}`  
**Status**: COMPLETE

## Summary
{Brief description}

## Tasks Completed
| # | Task | File | Status |
|---|------|------|--------|
| 1 | {description} | `src/x.ts` | ✅ |
| 2 | {description} | `src/y.ts` | ✅ |

## Validation Results
| Check | Result |
|-------|--------|
| Type check | ✅ |
| Lint | ✅ |
| Tests | ✅ ({N} passed) |

## Files Changed
| File | Action | Lines |
|------|--------|-------|
| `src/x.ts` | CREATE | +{N} |
| `src/y.ts` | UPDATE | +{N}/-{M} |

## Deviations from Plan
{List or "None"}

## Tests Written
| Test File | Test Cases |
|-----------|------------|
| `src/x.test.ts` | {list} |
```

### Archive Plan
```bash
mkdir -p .github/plans/completed
mv $ARGUMENTS .github/plans/completed/
```

### 6. Update GitHub Issue (if specified)

**Mandatory if plan Metadata contains GitHub Issue number.**

#### 6.1 Update Issue Status
Using `mcp__github__issue_write`:
- `method`: `"update"`
- `issue_number`: Issue number from plan
- `state`: `"open"` (keep open)
- `labels`: Add `in-review` or `completed` label

#### 6.2 Add Implementation Comment
Using `mcp__github__add_issue_comment`:
- `issue_number`: Issue number
- `body`: Summary including:
  - What was implemented
  - Branch name
  - Files created/updated (count)
  - Tests written (count)
  - Any deviations
  - Link to report file

#### 6.3 Create Pull Request (optional)
Using `mcp__github__create_pull_request`:
- `title`: Descriptive PR title
- `body`: Reference to implementation report
- `head`: Feature branch name
- `base`: `main`

### 7. Output

```markdown
## Implementation Complete

**Plan**: `{plan-path}`  
**Branch**: `{branch-name}`  
**Status**: ✅ Complete

### Validation
| Check | Result |
|-------|--------|
| Type check | ✅ |
| Lint | ✅ |
| Tests | ✅ |

### Files Changed
- {N} files created
- {M} files updated
- {K} tests written

### Deviations
{Summary or "Implementation matched the plan"}

### Artifacts
- Report: `.github/reports/{name}-report.md`
- Plan archived: `.github/plans/completed/`

### GitHub
{If issue updated: "Updated #{ISSUE_NUMBER}: added implementation comment."  
If PR created: "Created PR #{PR_NUMBER}."}

### Next Steps
1. Review the report
2. Review PR if created
3. Merge when approved
```

---

## Handling Failures

| Failure | Action |
|---------|--------|
| Type check fails | Read error, fix, re-run |
| Tests fail | Fix implementation or test, re-run |
| Lint fails | Run `pnpm run lint --fix`, then manual fixes |
| Build fails | Check output, fix and re-run |
