# GitHub-Native Skills

> **System Principle**: This skills system operates entirely within GitHub-native workflows using Issues, Projects, Labels, and Actions. No external ticketing systems required.

## Available Skills

| Skill | Purpose | Usage |
|-------|---------|-------|
| `create-prd` | Generate Product Requirements Document | `/create-prd [filename]` |
| `create-rules` | Create CLAUDE.md from codebase | `/create-rules` |
| `create-issues` | Generate GitHub Issues from PRD | `/create-issues <prd-path>` |
| `plan` | Create implementation plan | `/plan <feature description>` |
| `implement` | Execute implementation plan | `/implement <plan-path>` |
| `install` | Install deps and start dev server | `/install` |
| `prd-interactive` | Interactive PRD generator | `/prd-interactive [idea]` |
| `prime` | Load full codebase context | `/prime [github-issues]` |
| `prime-client` | Load frontend context | `/prime-client [github-issues]` |
| `prime-server` | Load backend context | `/prime-server [github-issues]` |
| `prime-components` | Learn component patterns | `/prime-components [github-issues]` |
| `prime-endpoint` | Learn API endpoint patterns | `/prime-endpoint [github-issues]` |
| `review` | Code review | `/review <pr-number\|file\|folder>` |
| `security-review` | Security-focused review | `/security-review [path]` |
| `validate` | Run all validation checks | `/validate` |

## GitHub Project Setup

### Recommended Custom Fields

Create these fields in your GitHub Project:

| Field | Type | Options |
|-------|------|---------|
| **Phase** | Single select | Discovery, Design, Implementation, Review, Done |
| **Priority** | Single select | Critical, High, Medium, Low |
| **Type** | Single select | Feature, Enhancement, Bug, Technical, Spike |
| **Complexity** | Single select | Small, Medium, Large |
| **Domain** | Single select | Frontend, Backend, API, Database, DevOps |

### Recommended Labels

| Label | Color | Use |
|-------|-------|-----|
| `feature` | #a2eeef | New functionality |
| `enhancement` | #84b6eb | Improvements |
| `bug` | #d73a4a | Bug fixes |
| `technical` | #bfd4f2 | Infrastructure/refactoring |
| `spike` | #f9d0c4 | Research/investigation |
| `frontend` | #7057ff | Frontend work |
| `backend` | #0052cc | Backend work |
| `api` | #5319e7 | API changes |
| `ui` | #ededed | UI components |
| `security` | #b60205 | Security issues |
| `documentation` | #0075ca | Docs changes |
| `in-review` | #fbca04 | Ready for review |
| `has-plan` | #c2e0c6 | Has implementation plan |

### Recommended Project Views

1. **Intake** — New issues to triage
2. **Discovery** — Phase: Discovery
3. **Design** — Phase: Design
4. **In Progress** — Phase: Implementation
5. **Review** — Phase: Review
6. **Done** — Phase: Done

## Workflow Examples

### Feature Development Flow

```
1. /prd-interactive "Build a new feature"
   → Creates .github/PRDs/feature.prd.md

2. /create-issues .github/PRDs/feature.prd.md
   → Creates GitHub Issues for each user story
   → Adds to GitHub Project

3. /plan .github/PRDs/feature.prd.md
   → Creates .github/plans/feature.plan.md
   → Links to GitHub Issue

4. /implement .github/plans/feature.plan.md
   → Executes plan
   → Updates GitHub Issue with progress
   → Creates PR when complete
```

### Bug Fix Flow

```
1. GitHub Issue created with `bug` label

2. /prime #42
   → Loads context from Issue #42

3. /plan "Fix issue described in #42"
   → Creates plan referencing the issue

4. /implement .github/plans/fix-issue.plan.md
   → Fixes the bug
   → Updates Issue #42
   → Links PR to issue
```

## Directory Structure

```
.github/
├── skills/
│   ├── README.md              # This file
│   ├── create-prd.md
│   ├── create-rules.md
│   ├── create-issues.md
│   ├── plan.md
│   ├── implement.md
│   ├── install.md
│   ├── prd-interactive.md
│   ├── prime.md
│   ├── prime-client.md
│   ├── prime-server.md
│   ├── prime-components.md
│   ├── prime-endpoint.md
│   ├── review.md
│   ├── security-review.md
│   └── validate.md
├── ISSUE_TEMPLATE/
│   ├── feature_request.md
│   ├── bug_report.md
│   └── technical_spike.md
├── workflows/
│   └── validate.yml
├── PRDs/                      # Generated PRDs
├── plans/                     # Generated plans
│   └── completed/
├── reports/                   # Implementation reports
└── reviews/                   # Code review reports
```

## System Transformation

This skills system replaces:

| Before (Jira-based) | After (GitHub-native) |
|---------------------|------------------------|
| Jira Issues | GitHub Issues |
| Jira Epics | Parent issues or milestones |
| Jira Projects | GitHub Projects v2 |
| Jira Boards | GitHub Project views |
| Jira Automation | GitHub Actions |
| Confluence | GitHub Wiki / README docs |
| Atlassian MCP | GitHub MCP |

## Required MCP Servers

- **GitHub MCP** — For issue/PR management
- **Repository context** — For codebase analysis

## Migration from Jira

To migrate existing Jira workflows:

1. Export Jira issues to CSV
2. Import to GitHub Issues using GitHub CLI or API
3. Map Jira issue types to GitHub Labels
4. Map Jira statuses to GitHub Project status field
5. Update skill references from Jira to GitHub
