---
description: Create implementation plan with codebase analysis
argument-hint: <feature description or path/to/prd.md>
---

# /plan

Create a battle-tested implementation plan through codebase exploration.

## Input
- $ARGUMENTS — feature description or path to PRD file
- GitHub Issue number from context (optional, e.g., #5)

## Steps

### 1. Parse Input
| Input Type | Action |
|------------|--------|
| .prd.md file | Read PRD, extract next pending phase |
| Other .md file | Read and extract feature description |
| Free-form text | Use directly as feature input |

Extract: Problem, User Story, Type, Complexity

### 2. Explore Codebase
Use Explore agent to find: similar implementations, naming conventions, error handling patterns, type definitions, test patterns

### 3. Design
Map: What files to create, modify, dependency order, risks

### 4. Generate Plan
Output: .github/plans/{kebab-case-name}.plan.md

### 5. GitHub Integration
- Add plan reference to issue
- Add has-plan label
- Create sub-issues for major tasks

## Output
File: .github/plans/{name}.plan.md