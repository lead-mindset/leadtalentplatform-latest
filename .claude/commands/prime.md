---
description: Prime agent with codebase understanding
argument-hint: [github-issues] [project-discussions]
---

# /prime

Build comprehensive understanding of this codebase by analyzing structure and key files.

## Input
- Optional GitHub Issue number(s) (e.g., #5 or #5,#6,#7)
- Optional GitHub Discussion number(s)

## Steps

### Step 0: Load External Context
If GitHub Issues provided:
1. Use mcp__github__issue_read to fetch: title, body, labels, acceptance criteria
2. Use this context for expected work

### Step 1: Analyze Codebase
1. Read CLAUDE.md and CODEBASE-GUIDE.md for conventions
2. Study feature slice (e.g., src/features/polls/)
3. Study app routes (src/app/)
4. Check recent commits: git log --oneline -5

### Step 2: Output
Scannable summary with: Project Purpose, Tech Stack, Data Model, Key Patterns, Current State
