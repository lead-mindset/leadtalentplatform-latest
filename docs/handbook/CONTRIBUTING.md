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

## 3. Communication
*   **ADRs:** Major architectural decisions must be documented in `docs/adr/`.
*   **Linear/GitHub:** Use the Project Board to track all tasks.
