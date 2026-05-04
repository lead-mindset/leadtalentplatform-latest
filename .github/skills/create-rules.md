---
description: Create global rules (CLAUDE.md) from codebase analysis
---

# Skill: Create Rules

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Generate project-specific global rules (`CLAUDE.md`) by analyzing the codebase and extracting patterns. Creates living documentation that helps AI assistants understand the project structure and conventions.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Global rules | `CLAUDE.md` in repository root |
| Codebase analysis | GitHub file tree + file contents via MCP |
| Pattern extraction | Local code analysis + documentation |

---

## Inputs
- Repository context via GitHub MCP
- Existing configuration files (`package.json`, `tsconfig.json`, etc.)

---

## Execution Flow

### 1. Parse
Identify project type and structure:
| Type | Indicators |
|------|------------|
| Web App (Full-stack) | Separate client/server dirs, API routes |
| Web App (Frontend) | React/Vue/Svelte, no server code |
| API/Backend | Express/Fastify/etc, no frontend |
| Library/Package | `main`/`exports` in package.json |
| CLI Tool | `bin` in package.json |
| Monorepo | Multiple packages, workspaces config |

### 2. Analyze

#### Extract Tech Stack
From `package.json` and configs:
- Runtime/Language (Node, Bun, Deno, browser)
- Framework(s)
- Database
- Testing tools
- Build tools
- Linting/formatting

#### Identify Patterns
Study existing code for:
- **Naming**: File, function, class conventions
- **Structure**: Code organization within files
- **Errors**: Error creation and handling patterns
- **Types**: Type/interface definitions
- **Tests**: Test structure and assertions

#### Map Directory Structure
- Source code locations
- Test locations
- Shared code
- Configuration locations

### 3. Generate

Create `CLAUDE.md` with:

**Required Sections:**
1. **Project Overview** — What is this project and what does it do?
2. **Tech Stack** — Technologies used with versions
3. **Commands** — How to dev, build, test, lint
4. **Structure** — Code organization
5. **Patterns** — Conventions to follow
6. **Key Files** — Important files to know

For this repo, also include a **Canonical Account Model** section covering `public.user`, `person_profile`, `chapter_membership`, `lead_identity`, `recruiter_access`, and the rule that `student_profile` is legacy/migration-only.

**Optional Sections:**
- Architecture (complex apps)
- API endpoints (backends)
- Component patterns (frontends)
- Database patterns

### 4. Output
- Save to `CLAUDE.md` (project root)

---

## Process Details

### Phase 1: DISCOVER
Analyze root configuration:
- `package.json` → dependencies, scripts, type
- `tsconfig.json` → TypeScript settings
- `vite.config.*` → Build tool
- `*.config.js/ts` → Tool configs

### Phase 2: ANALYZE
Explore codebase structure:
- Where does source code live?
- Where are tests?
- Shared code locations?
- Configuration locations?

### Phase 3: GENERATE
Adapt template from `.github/skills/templates/CLAUDE-template.md`:
- Remove irrelevant sections
- Add project-specific sections
- Keep concise and focused

### Phase 4: OUTPUT
```markdown
## Global Rules Created

**File**: `CLAUDE.md`

### Project Type
{Detected project type}

### Tech Stack Summary
{Key technologies}

### Structure
{Brief overview}

### Next Steps
1. Review generated `CLAUDE.md`
2. Add project-specific notes
3. Remove irrelevant sections
4. Update as project evolves
```

---

## Tips
- Keep CLAUDE.md scannable
- Don't duplicate other docs (link instead)
- Focus on patterns and conventions
- Update as project evolves
