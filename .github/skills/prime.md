---
description: Prime agent with codebase understanding
argument-hint: [github-issues] [project-discussions]
---

# Skill: Prime

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Build comprehensive understanding of this codebase by analyzing structure and key files. Use GitHub Issues and Discussions for external context.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Jira issues | GitHub Issues |
| Confluence pages | GitHub Discussions / README docs |
| External context | GitHub Project items, discussions |
| Codebase analysis | Repository file tree + GitHub MCP |

---

## Inputs
- Optional GitHub Issue number(s) (e.g., `#5` or `#5,#6,#7`)
- Optional GitHub Discussion number(s) (e.g., `123`)

---

## Execution Flow

### Step 0: Load External Context (if provided)

The first argument can be an optional GitHub Issue number or comma-separated list (e.g., `#5` or `#5,#6,#7`).

If GitHub Issues are provided:
1. Call `mcp__github__issue_read` to fetch issue details:
   - Title, body, labels
   - Acceptance criteria from body
   - Related PRs
2. Use this context to understand expected work

If GitHub Discussion numbers are provided:
1. Use repository context to understand requirements
2. Reference documentation in discussions

### Step 1: Analyze the Codebase

1. Read `CLAUDE.md` and `CODEBASE-GUIDE.md` for project conventions
2. Study the feature slice (e.g., `src/features/polls/`)
3. Study the app routes (`src/app/`)
4. Check recent commits with `git log --oneline -5`

### Step 2: Output

Produce a scannable summary:

```markdown
## Codebase Understanding

### Project Purpose
{One sentence description}

### Tech Stack
**Frontend:**
- Framework: {Next.js, React, Vue, etc.}
- UI Library: {shadcn/ui, Material-UI, etc.}
- State Management: {React Context, Redux, Zustand, etc.}

**Backend:**
- Framework: {Next.js, Express, Fastify, etc.}
- Database: {PostgreSQL, SQLite, MongoDB, etc.}
- ORM: {Drizzle, Prisma, TypeORM, etc.}
- Validation: {Zod, Yup, Joi, etc.}

### Data Model
Core entities:
- {Entity 1} — {brief description}
- {Entity 2} — {brief description}

### Key Patterns
- **Database**: {Pattern description}
- **API**: {Pattern description}
- **State Management**: {Pattern description}

### Current State
- Recent commits: {list}
- Current branch: {branch name}
- Active issues: {count if applicable}

### External Context
{If issues loaded: "Loaded context from Issues: #{numbers}"}
```

---

## GitHub Integration

Use this skill to load context before starting work on:
- New features (load related issues)
- Bug fixes (load bug report issue)
- Refactoring (load technical debt issue)

After priming:
1. Run `/plan` to create implementation plan
2. Create/update GitHub Issues as needed
3. Link work to appropriate GitHub Project
