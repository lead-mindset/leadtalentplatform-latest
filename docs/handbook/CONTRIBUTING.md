# Engineering Handbook: Contributing to LEAD Frontier

> **Note:** For product requirements and feature scope, see [docs/PRODUCT-SPECIFICATION.md](../PRODUCT-SPECIFICATION.md) — this is the source of truth for product decisions. This handbook covers engineering standards and workflows only.

Welcome! This document outlines the engineering standards and workflows for the LEAD Frontier platform. As we scale to support thousands of students and company representatives, maintaining high technical quality is our top priority.

## 1. Workflow: The Pull Request Process

We follow a **Trunk-Based Development** model with short-lived feature branches.

### 1.1 Branch Naming
*   `feat/[feature-name]` - For new features.
*   `fix/[bug-name]` - For bug fixes.
*   `chore/[task-name]` - For maintenance, configuration, or documentation.
*   `refactor/[domain]` - For code refactoring.

### 1.2 Commits
We use **Conventional Commits**:
*   `feat: add event registration logic`
*   `fix: resolve RLS policy leak in member approval`
*   `docs: update engineering handbook`

### 1.3 Review Process
*   **PR First:** No code is merged directly to `main`. 
*   **Approval:** Every PR must be reviewed and approved by the CTO or a designated Code Owner.
*   **CI Passes:** Build, Lint, and Tests must be green before merge.

## 2. Technical Standards

### 2.1 Architecture: The Service Layer
All business and database logic must live in `lib/services/`.
*   **Thin Server Actions:** Server actions should only handle Auth, Input Validation (Zod), and calling a service.
*   **Pure Services:** Services should be framework-agnostic and testable in isolation.

### 2.2 Testing
*   **Mandatory:** 100% unit test coverage for all new files in `lib/services/`.
*   **Framework:** Use `Vitest`.
*   **E2E:** Critical paths (auth, registration) require Playwright smoke tests.

### 2.3 Database
*   **Code-Only:** No manual edits in the Supabase Dashboard.
*   **Migrations:** All schema changes must be committed as `.sql` files via Supabase CLI.

#### Understanding Database Migrations: The "Recipe" Approach

To keep a team in sync, you have to move away from clicking buttons in a dashboard and move toward code-based changes. Think of a migration file as a "recipe" that everyone's computer follows to get the same result.

Here is the step-by-step breakdown of how this looks in your actual folders and terminal.

**Step 1: You create the "Instruction"**
Instead of going to the Supabase website to add a column, you stay in your VS Code terminal and run:
```bash
pnpm run migration:new add_learning_styles
```
*What happens:* A new file appears in your project at `supabase/migrations/[TIMESTAMP]_add_learning_styles.sql`. It is completely empty.

**Step 2: You write the SQL Change**
You open that new file and write the SQL command to change the table. It looks like this:
```sql
-- This is the "recipe" for the new column
ALTER TABLE students 
ADD COLUMN learning_style TEXT;
```

**Step 3: You apply it locally**
To make sure your own local database has this new column, you run:
```bash
pnpm run supabase:reset
```
*What it looks like:* Your local database restarts, reads all your migration files in order, and now your local "Students" table has the new column. Because of the Husky hook you set up, your `database.generated.ts` file also updates automatically to include `learning_style: string`.

**Step 4: You share the "Recipe" via GitHub**
You commit that `.sql` file just like any other piece of code:
```bash
git add .
git commit -m "feat: add learning styles to student profile"
git push
```

**Step 5: The Team Member's Perspective**
Your team member (let’s call her Sarah) is working on her own computer. Her database does not have the new column yet. She runs:
```bash
git pull
```
*What happens on her screen:*
- The `[TIMESTAMP]_add_learning_styles.sql` file is downloaded to her computer.
- The Husky Hook triggers: Because a file in the `supabase/migrations` folder changed, your script automatically runs a database update for her.

**Step 6: The Final Result**
Without Sarah doing anything extra, her terminal will show a message like `Applying migration... Success.`

Now:
- Her local database has the new column.
- Her `database.generated.ts` is automatically updated on her machine.
- She can start coding the frontend part of the "Learning Styles" feature immediately because her TypeScript is already aware of the change.

**What it looks like if you DON'T do this**
If you don't use migrations, the conversation usually looks like this:
- **You:** "Hey Sarah, I added a 'learning_style' column to the database. You need to go to the dashboard and add it manually."
- **Sarah:** "Wait, is it a text column or an ID? Did you capitalize it?"
- *Sarah's Code:* Crashes because her local types don't match the dashboard change.

The migration workflow turns that 10-minute confusing conversation into a 0-second automatic process.

**Summary of the "Invisible" Magic**
The magic happens because of the folder structure. Since the migration files are inside your Git repository, Git treats database changes exactly like code changes.

| Action | What moves between computers |
|--------|------------------------------|
| **Old Way** | Instructions via Slack/Email/Discord |
| **New Way** (Best Practice) | `.sql` files in the `migrations/` folder |

### 2.4 Type Generation
*   **Source of Truth:** `lib/database.generated.ts` is auto-generated from Supabase schema.
*   **Never Edit Manually:** Do not modify `lib/database.generated.ts` directly.
*   **Automatic Generation:** Types regenerate automatically via git hooks:
    *   After `git pull` (via `.husky/post-merge`)
    *   Before `git commit` (via `.husky/pre-commit` runs tests)
*   **Manual Generation:** Run `pnpm run types:generate` after schema changes.
*   **Import Path:** Import generated database types from `@/lib/database.generated`; use `@/lib/types` for application aliases.

#### Type Generation Workflow

1. **Create a migration:**
   ```bash
   pnpm run migration:new add_new_feature
   ```

2. **Edit the migration file** in `supabase/migrations/`

3. **Apply the migration:**
   ```bash
   pnpm run supabase:reset
   ```

4. **Types auto-generate** to `lib/database.generated.ts`

5. **Verify types in code:**
   ```typescript
   import { Database, Tables } from '@/lib/database.generated'
   
   type User = Tables<'user'>
   type Event = Tables<'event'>
   ```

#### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm run types:generate` | Generate types from local Supabase |
| `pnpm run types:watch` | Watch for changes and auto-generate |
| `pnpm run db:pull` | Pull schema from remote + generate types |
| `pnpm run db:push` | Push schema to remote + generate types |
| `pnpm run migration:new <name>` | Create a new migration |
| `pnpm run supabase:start` | Start local Supabase (requires Docker) |
| `pnpm run supabase:stop` | Stop local Supabase |
| `pnpm run supabase:status` | Check Supabase status |
| `pnpm run supabase:reset` | Reset local database |

## 3. Git Hooks

We use **Husky** to enforce quality gates:

### 3.1 Pre-Commit Hook (`.husky/pre-commit`)
Runs automatically before every commit:
*   Executes `pnpm run test` to ensure all tests pass
*   Prevents commits if tests fail
*   Ensures code quality before changes enter git history

### 3.2 Post-Merge Hook (`.husky/post-merge`)
Runs automatically after `git pull` or `git merge`:
*   Checks if `supabase/migrations/` changed
*   Auto-generates types via `pnpm run types:generate`
*   Keeps types in sync with schema changes from teammates

### 3.3 Setup
Husky is automatically installed via `pnpm install`. If hooks aren't working:
```bash
pnpm run prepare
```

## 4. AI-Assisted Development: The PIV Loop

We use GitHub-native commands for AI-assisted development. The workflow follows a **PIV Loop**: Plan → Implement → Validate.

### 4.1 Available Commands

| Command | Purpose |
|---------|---------|
| `/prime` | Load codebase context + optional GitHub issue (#123) |
| `/create-prd` | Generate PRD from conversation |
| `/prd-interactive` | Step-by-step PRD creation via Q&A |
| `/create-issues` | Generate GitHub Issues from PRD |
| `/plan` | Create implementation plan with validation strategy |
| `/implement` | Execute plan in fresh context |
| `/validate` | Run lint, type check, tests |
| `/review` | Code review (PR number, file, or folder) |
| `/install` | Install deps and start dev server |

### 4.2 Workflow Steps

**Step 1: Start fresh session**
```
/prime
```
Loads codebase context into the agent.

**Step 2: Create requirements**
```
/create-prd feature-name
```
Or for guided creation:
```
/prd-interactive
```

**Step 3: Generate issues**
```
/create-issues .github/PRDs/feature-name.prd.md
```

**Step 4: Plan implementation**
```
/plan add user authentication
```
Creates a detailed plan in `.github/plans/`.

**Step 5: Implement**
```
/implement .github/plans/user-auth.plan.md
```

**Step 6: Validate**
```
/validate
```
Record linked issue, plan artifact, validation commands/results, migration notes, UI evidence, and any System Evolution follow-up in `.github/pull_request_template.md` before requesting review.

**Step 7: Review**
```
/review src/auth/login.ts
/review 45
```

### 4.3 Output Locations

- **PRDs**: `.github/PRDs/{name}.prd.md`
- **Plans**: `.github/plans/{name}.plan.md`
- **Reviews**: `.github/reviews/{name}-review.md`

### 4.4 Golden Rules

1. **Commandify everything** - If you type something twice, make it a command
2. **Reduce assumptions** - Questions before PRD, review before executing
3. **Context is king** - Reset between planning and implementation
4. **Git log is memory** - Commit frequently with descriptive messages
5. **System evolution** - Every bug is a chance to improve the AI layer

## 5. Communication
*   **ADRs:** Major architectural decisions must be documented in `docs/adr/`.
*   **Linear/GitHub:** Use the Project Board to track all tasks.

## 6. Three-Environment Workflow

We use a three-environment workflow for development, QA/staging, and production.

| Environment | Branch | Supabase | Vercel project / URL | Purpose |
|-------------|--------|----------|----------------------|---------|
| Local | feature branches / `dev` | Docker Supabase | `localhost:3000` | Fast development and reset-heavy experiments |
| QA/Staging | `dev` | QA Supabase project | `leadqa` / `https://leadqa.vercel.app` | Shared team testing and integration validation |
| Production | `master` | Production Supabase project | `lead-talent-platform-latest` / production domain | Stable live environment |

### Branch Strategy
- `dev` is the QA integration branch. Pushing to `dev` should update QA code and apply committed migrations to the QA database.
- `master` is the production branch. Production should be promoted deliberately after QA passes.
- Feature branches should branch from `dev` and merge back into `dev`.
- Do not treat a local database dump as the source of truth for QA or production. Schema changes travel through committed migrations.

### Database Promotion Flow
1. Develop locally against Docker Supabase.
2. Create or edit migration files in `supabase/migrations/`.
3. Validate locally with `pnpm run supabase:reset`, `pnpm test`, and `pnpm build` as appropriate.
4. Commit code, migrations, generated types, and related tests.
5. Push or merge to `dev`.
6. GitHub Actions applies migrations to QA Supabase.
7. Test on `https://leadqa.vercel.app`.
8. Promote to `master` only after QA approval.

### QA Data Policy
Normal `dev` pushes must not reseed QA data. They may apply migrations, but they should preserve shared QA testing state.

Use the manual **Refresh QA Data** GitHub Action when the team intentionally wants to refresh deterministic QA fixtures.

| Action | Trigger | Database effect |
|--------|---------|-----------------|
| `Deploy to QA` | Push to `dev` | Applies migrations only |
| `Refresh QA Data` | Manual `workflow_dispatch` | Applies migrations, then runs `supabase/qa.seed.sql` |

The manual refresh action requires typing `REFRESH_QA` so accidental clicks do not mutate QA data.

GitHub only exposes manual `workflow_dispatch` actions from the repository default branch (`master`). If a manual QA workflow is introduced on `dev`, it will not appear in the Actions UI until the workflow file is also present on `master`.

### Seed Files
- `supabase/seed.sql` is the canonical local Docker baseline. It should stay deterministic and compatible with the current account model.
- `supabase/qa.seed.sql` is the current QA refresh entrypoint. It may include `seed.sql` plus QA-only fixtures.
- `supabase/seed-qa.sql` is legacy migration-test data for old `student_profile` migration paths. Do not use it for routine QA refreshes unless a migration story explicitly requires it.

### Secrets & Environment Variables
**Never commit secrets to Git.** Use environment variables:
- Local: `.env.local` (not committed)
- Vercel QA project (`leadqa`): QA Supabase URL, publishable key, service role, auth/email provider keys, and QA app URL values.
- Vercel production project (`lead-talent-platform-latest`): production Supabase credentials and production app URL values.
- GitHub Environments: database migration credentials for QA/production workflows.

#### GitHub Environments
We use two environments for secrets/variables:

| Environment | Purpose | Secrets/Variables |
|-------------|---------|-------------------|
| **Preview** | QA/Staging (`dev` branch) | QA Supabase database credentials |
| **Production** | Live site (`master` branch) | Production Supabase credentials |

**Preview Environment Variables:**
- `QA_DB_HOST` - QA database host
- `QA_DB_PORT` - QA database port
- `QA_DB_USER` - QA database user

**Preview Environment Secrets:**
- `QA_DB_PASSWORD` - QA database password
- `QA_SUPABASE_SERVICE_ROLE_KEY` - QA service role key
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI token if required by hosted migration commands

### Hosted Supabase Auth Configuration
Do not push the local `supabase/config.toml` directly to hosted QA or production. The local file contains localhost auth URLs for Docker Supabase.

Hosted auth configuration must be environment-specific:

| Environment | Site URL | Required redirect shape |
|-------------|----------|-------------------------|
| QA | `https://leadqa.vercel.app` | QA auth callback/company/dashboard URLs plus local dev URLs if needed |
| Production | Production domain | Production auth callback/company/dashboard URLs |

For QA, Google OAuth must be enabled in the QA Supabase project and should redirect through the QA Supabase callback, not localhost. Verify with the Supabase authorize endpoint before asking the team to test Google login.
