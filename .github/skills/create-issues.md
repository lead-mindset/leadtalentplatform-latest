---
description: Generate GitHub Issues from a PRD
argument-hint: <path-to-prd> [--project PROJECT_NAME] [--milestone MILESTONE_NAME]
---

# Skill: Create Issues from PRD

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Generate structured GitHub Issues from a Product Requirements Document. When GitHub MCP is configured, automatically creates the issues in your repository and links them to Projects.

**Input**: `$ARGUMENTS`

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Jira user stories | GitHub Issues with labels |
| Jira Epic | Parent issue or milestone |
| Jira Project | GitHub Project |
| Jira issue types | Issue labels (`feature`, `bug`, `tech`, `spike`) |
| Jira acceptance criteria | Issue task lists |
| Jira issue links | GitHub issue references (`blocks #123`) |

---

## Inputs
- `$ARGUMENTS` — path to PRD file
- `--project` — GitHub Project name (optional)
- `--milestone` — Milestone to assign issues to (optional)

---

## Execution Flow

### 1. Parse
Read the PRD file. If no path given, look for:
1. `.github/PRDs/*.prd.md` files
2. `PRD.md` at project root
3. Ask user which PRD to use

Extract:
- User stories already defined
- Acceptance criteria
- Implementation phases
- Technical constraints and dependencies

### 2. Analyze

#### Break Down into Issues
For each feature/requirement:

1. **Create issue** with title and description
2. **Define acceptance criteria** as task list (3-5 per issue)
3. **Estimate complexity**: Small / Medium / Large
4. **Identify dependencies** between issues (for linking)

#### Issue Categories
Group by type using labels:
| Label | Use Case |
|-------|----------|
| `feature` | New functionality |
| `enhancement` | Improvement to existing |
| `bug` | Fix for known issues |
| `technical` | Infrastructure, refactoring |
| `spike` | Research/investigation |

### 3. Structure

#### For Each Issue
```markdown
## Issue: {Title}

**Type**: Feature | Enhancement | Technical | Spike  
**Priority**: High | Medium | Low  
**Complexity**: Small | Medium | Large  
**Phase**: (from PRD implementation phases)  
**Labels**: feature, frontend, backend, api, database

### Description
As a [user type], I want to [action], so that [benefit].

### Acceptance Criteria
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

### Technical Notes
- Key implementation details
- Files likely to be modified
- Patterns to follow (reference CLAUDE.md)

### Dependencies
- Blocked by: #{issue-number}
- Blocks: #{issue-number}
```

#### Ordering
Order issues by:
1. Phase (from PRD)
2. Dependencies (blocked items after blockers)
3. Priority (High first)

### 4. Validate
Before creation, verify:
- [ ] Every PRD requirement maps to at least one issue
- [ ] No issue is too large (> 1 day of work)
- [ ] Acceptance criteria are testable
- [ ] Dependencies form valid DAG (no circular)
- [ ] Issues cover full SDLC

### 5. GitHub Integration (when MCP available)

**Check if GitHub MCP server is available** (tools prefixed with `mcp__github__`).

#### If GitHub MCP IS available:

1. **Ask user confirmation**:
   ```
   I've generated {count} issues. Create them in GitHub?
   - Repository: {owner}/{repo}
   - Project: {PROJECT_NAME} (or ask)
   - Milestone: {MILESTONE_NAME} (optional)
   ```

2. **If confirmed**, create issues using `mcp__github__issue_write`:
   - `method`: `"create"`
   - `owner`: Repository owner
   - `repo`: Repository name
   - `title`: Issue title
   - `body`: Full description + acceptance criteria
   - `labels`: Array of labels (create if needed)
   - `milestone`: Milestone number if specified

3. **Add to Project** using `mcp__github__addIssueToProject`:
   - Set custom fields: Phase, Priority, Type, Complexity

4. **Create dependency links** via issue body references:
   - Add "Blocked by: #123" in description
   - Add "Blocks: #456" in description

5. **Report created issues**:
   ```markdown
   ## GitHub Issues Created

   | # | Title | Type | Priority |
   |---|-------|------|----------|
   | #2 | Issue title | feature | High |
   | #3 | Issue title | technical | Medium |

   **Milestone**: v1.0  
   **Project**: {PROJECT_NAME}  
   **Board URL**: https://github.com/{owner}/{repo}/projects/{number}
   ```

#### If GitHub MCP is NOT available:
Output issues as markdown and note:
```
GitHub MCP not configured. To push issues automatically:
1. Configure .mcp.json with GitHub MCP server credentials
2. Re-run this command
```

---

## Output

**Files Created:**
- `.github/issues/{name}-issues.md` — Issue specifications

**GitHub Artifacts:**
- GitHub Issues created
- Project cards added
- Labels applied
- Dependencies linked

---

## Tips
- Keep issues small enough for 1-2 days
- Acceptance criteria should be verifiable
- Technical issues need criteria too (build passes, tests pass)
- Include "definition of done" issue if needed
- Reference PRD section for traceability
