---
description: Install dependencies and start the dev server
---

# Skill: Install

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Install project dependencies, set up the database, and start the development server. Standard initialization workflow for GitHub-hosted projects.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Environment setup | Local dev environment + GitHub Codespaces support |
| Dependency installation | `bun install` / `npm install` |
| Database setup | Local DB + migration scripts |
| Dev server start | `bun run dev` / `npm run dev` |

---

## Inputs
None required

---

## Execution Flow

### 1. Install & Setup

Execute in sequence:

```bash
# 1. Install dependencies
bun install

# 2. Push database schema (if applicable)
bun run db:push

# 3. Start dev server
bun run dev

# 4. Verify running
# Check http://localhost:3000 (or configured port)
```

> **Note**: This is a Next.js monolith — one package.json, one dev server, no separate backend.

### 2. Verify

Check that:
- [ ] Dependencies installed without errors
- [ ] Database schema pushed (if using local DB)
- [ ] Dev server started at expected URL
- [ ] Application loads in browser

### 3. Report

Output results in concise format:

```markdown
## Installation Complete

### Status
- ✅ Dependencies: installed (or already up to date)
- ✅ Database: schema pushed to `local.db`
- ✅ Dev server: http://localhost:3000

### Issues Encountered
{List or "None"}

### Next Steps
1. Open browser at http://localhost:3000
2. Verify application loads correctly
3. Run `/prime` skill to load codebase context
```

---

## GitHub Codespaces Support

If running in GitHub Codespaces, the dev server should be forwarded automatically. Verify port forwarding is configured in `.devcontainer/devcontainer.json`:

```json
{
  "forwardPorts": [3000],
  "portsAttributes": {
    "3000": {
      "label": "Next.js Dev Server",
      "onAutoForward": "openBrowser"
    }
  }
}
```
