---
name: "source-command-create-issues"
description: "Generate GitHub Issues from a PRD"
---

# source-command-create-issues

Use this skill when the user asks to run the migrated source command `create-issues`.

## Command Template

# /create-issues

Generate structured GitHub Issues from a Product Requirements Document.

## Input
- \ — path to PRD file
- --project — GitHub Project name (optional)
- --milestone — Milestone to assign issues (optional)

## Steps

### 1. Parse
Read PRD file. Extract: user stories, acceptance criteria, implementation phases, technical constraints

### 2. Analyze
Break down each feature/requirement into issues with:
- Title and description
- Acceptance criteria as task list (3-5 per issue)
- Complexity: Small/Medium/Large
- Dependencies between issues

### 3. Structure
Use labels: feature, enhancement, bug, technical, spike

### 4. GitHub Integration (if MCP available)
Use mcp__github__issue_write to create issues
Use mcp__github__addIssueToProject to add to project

### 5. Output
- .github/issues/{name}-issues.md — Issue specifications
- Report created issues with table
