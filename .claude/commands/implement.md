---
description: Implement features from a plan file
argument-hint: <path-to-plan.md>
---

# /implement

Execute implementation tasks from a plan file.

## Input
- $ARGUMENTS — path to plan file (e.g., .github/plans/my-feature.plan.md)

## Steps

### 1. Load Plan
Read the plan file and verify tasks exist.

### 2. Execute Tasks
For each task in order:
1. Read the target file or create new
2. Implement according to task description
3. Follow the Mirror pattern reference
4. Validate with specified command

### 3. Track Progress
- Mark tasks complete in plan file
- Run /validate after each task

### 4. GitHub Integration
- Update issue status if linked
- Add labels as tasks complete

## Output
Tasks completed: N/Total
