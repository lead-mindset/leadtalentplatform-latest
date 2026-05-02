# ADR 002: Automated Database Type Generation with Git Hooks

## Status
Accepted (April 2026)

## Context
As LEAD Frontier scales with multiple developers working on database schema changes, we faced several challenges:

1. **Type Drift:** Developers would modify the database schema but forget to regenerate TypeScript types, causing runtime errors that TypeScript couldn't catch.
2. **Manual Process:** Type generation required developers to remember to run `supabase gen types` after every schema change.
3. **Inconsistent Naming:** The original type file was named `lib/supabase.ts`, which was ambiguous and didn't clearly indicate it was auto-generated.
4. **Team Coordination:** When pulling changes with new migrations, developers would work with stale types until they manually regenerated them.
5. **Quality Gates:** No automated enforcement to ensure tests pass before committing code.

## Decision
We will implement an **automated type generation system with git hooks**:

### 1. Standardized Type File Naming
We have **two** type files for different purposes:

| File | Purpose |
|------|---------|
| `lib/database.generated.ts` | Auto-generated from Supabase (DO NOT EDIT) - contains all tables/rows |
| `lib/database.types.ts` | Custom type augmentations (YOU CAN EDIT) - for aliases, custom types |

- **Rationale:** Split allows custom types without being overwritten by regeneration
- **Usage:** Import `database.generated.ts` for table types; augment in `database.types.ts` for custom needs

### 2. Automated Type Generation via Git Hooks
We use **Husky** to automate type generation at critical points in the development workflow:

#### Post-Merge Hook (`.husky/post-merge`)
```bash
#!/bin/sh
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep --quiet "supabase/migrations/"; then
  echo "📦 Migrations changed, regenerating types..."
  pnpm run types:generate
fi
```
- **Triggers:** After `git pull` or `git merge`
- **Action:** Checks if `supabase/migrations/` changed, auto-generates types
- **Benefit:** Developers always have up-to-date types after pulling teammate changes

#### Pre-Commit Hook (`.husky/pre-commit`)
```bash
#!/bin/sh
pnpm run test
```
- **Triggers:** Before every `git commit`
- **Action:** Runs full test suite (142 tests across 7 files)
- **Benefit:** Prevents broken code from entering git history

### 3. NPM Scripts for Database Management
Added convenience scripts to `package.json`:

| Command | Purpose |
|---------|---------|
| `types:generate` | Generate types from local Supabase |
| `types:watch` | Watch for changes and auto-generate |
| `db:pull` | Pull schema from remote + generate types |
| `db:push` | Push schema to remote + generate types |
| `migration:new` | Create a new migration file |

### 4. Single Source of Truth
- `lib/database.types.ts` is the **only** source for database types
- All application code imports from `@/lib/database.types`
- The file is marked in documentation as "auto-generated, do not edit"

## Implementation Details

### Type Generation Workflow
1. Developer creates migration: `pnpm run migration:new add_feature`
2. Developer edits SQL in `supabase/migrations/`
3. Developer applies migration: `pnpm run supabase:reset`
4. Types auto-generate to `lib/database.types.ts`
5. Developer imports types: `import { Tables } from '@/lib/database.types'`

### Git Hook Installation
- Husky installs automatically via `pnpm install`
- Hooks are committed to `.husky/` directory
- Team members get hooks automatically when cloning repo

## Educational Context: The "Recipe" Approach to Database Migrations

To help team members understand *why* this workflow is crucial, we use the "recipe" analogy:

To keep a team in sync, you have to move away from clicking buttons in a dashboard and move toward code-based changes. Think of a migration file as a "recipe" that everyone's computer follows to get the same result.

**The Workflow:**
1. **Create the "Instruction":** Run `pnpm run migration:new add_feature`. An empty SQL file is created.
2. **Write the Change:** Add the SQL to the new file (the "recipe").
3. **Apply Locally:** Run `pnpm run supabase:reset`. The database runs the recipe, and the Husky hook automatically regenerates `database.types.ts`.
4. **Share via GitHub:** Commit and push the `.sql` file.
5. **Team Sync:** A teammate runs `git pull`. The Husky post-merge hook detects the new `.sql` file, automatically applies it to their local database, and regenerates their `database.types.ts`.

**Why we do this:**
Without this, database changes require manual out-of-band communication ("Hey, add this column in the dashboard"), leading to misaligned schemas, runtime crashes, and lost time. With this workflow, database changes travel through Git exactly like code changes, turning a confusing coordination problem into an invisible, automatic 0-second process.

## Consequences

### Positive
- ✅ **Zero Type Drift:** Types are always in sync with database schema
- ✅ **Developer Experience:** No manual type generation to remember
- ✅ **Team Coordination:** Pulling changes automatically updates types
- ✅ **Quality Assurance:** Tests must pass before committing
- ✅ **Clear Conventions:** `.types.ts` naming makes auto-generation obvious
- ✅ **Reduced Bugs:** Runtime errors from stale types are eliminated
- ✅ **Faster Onboarding:** New developers get automated workflow out of the box

### Negative
- ⚠️ **Slightly Slower Commits:** Pre-commit hook adds ~15-20 seconds for test execution
- ⚠️ **Git Hook Dependency:** Requires Husky to be properly installed
- ⚠️ **Docker Requirement:** Local Supabase requires Docker Desktop to be running

### Neutral
- 📝 **Documentation Overhead:** Required updates to README and CONTRIBUTING.md
- 📝 **Migration Path:** One-time effort to rename `supabase.ts` → `database.types.ts`

## Alternatives Considered

### Alternative 1: Manual Type Generation
**Rejected:** Too error-prone, relies on developer discipline

### Alternative 2: CI-Only Type Generation
**Rejected:** Developers would still work with stale types locally, pushing the problem to CI

### Alternative 3: Watch Mode Only
**Rejected:** Requires developers to keep a terminal running, doesn't help with git pull

### Alternative 4: Pre-Push Hook Instead of Pre-Commit
**Rejected:** Would allow broken commits in local history, making git bisect unreliable

## Verification
This decision was implemented and verified with:
- ✅ All 142 tests passing after migration
- ✅ Successful type generation on `git pull` simulation
- ✅ Pre-commit hook blocking commits when tests fail
- ✅ Zero TypeScript errors across codebase
- ✅ Documentation updated in README and CONTRIBUTING.md

## References
- [Husky Documentation](https://typicode.github.io/husky/)
- [Supabase CLI Type Generation](https://supabase.com/docs/guides/api/generating-types)
- [Conventional Commits](https://www.conventionalcommits.org/)
- Related: ADR 001 - Service Layer Pattern (establishes testing requirements)

## Revision History
- **2026-04-29:** Initial decision and implementation
