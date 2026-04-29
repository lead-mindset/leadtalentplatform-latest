# Engineering Handbook: Contributing to LEAD Frontier

Welcome! This document outlines the engineering standards and workflows for the LEAD Frontier platform. As we scale to support thousands of students and recruiters, maintaining high technical quality is our top priority.

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
*What it looks like:* Your local database restarts, reads all your migration files in order, and now your local "Students" table has the new column. Because of the Husky hook you set up, your `database.types.ts` file also updates automatically to include `learning_style: string`.

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
- Her `database.types.ts` is automatically updated on her machine.
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
*   **Source of Truth:** `lib/database.types.ts` is auto-generated from Supabase schema.
*   **Never Edit Manually:** Do not modify `lib/database.types.ts` directly.
*   **Automatic Generation:** Types regenerate automatically via git hooks:
    *   After `git pull` (via `.husky/post-merge`)
    *   Before `git commit` (via `.husky/pre-commit` runs tests)
*   **Manual Generation:** Run `pnpm run types:generate` after schema changes.
*   **Import Path:** Always import types from `@/lib/database.types` (not the old `@/lib/supabase.ts`).

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

4. **Types auto-generate** to `lib/database.types.ts`

5. **Verify types in code:**
   ```typescript
   import { Database, Tables } from '@/lib/database.types'
   
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

## 4. Communication
*   **ADRs:** Major architectural decisions must be documented in `docs/adr/`.
*   **Linear/GitHub:** Use the Project Board to track all tasks.
