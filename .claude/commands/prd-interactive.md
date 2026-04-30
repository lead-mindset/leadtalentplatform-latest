---
description: Interactive PRD creation with guided questions
argument-hint: [feature-name]
---

# /prd-interactive

Create a PRD through interactive Q&A with the user.

## Input
- $ARGUMENTS — optional feature name to start with

## Steps

### 1. Start Conversation
Ask the user about the feature:
- What problem are we solving?
- Who is the target user?
- What is the core functionality?
- What is out of scope for MVP?

### 2. Gather Requirements
Through Q&A, gather:
- User stories
- Technical constraints
- Success criteria
- Implementation phases

### 3. Generate PRD
Create .github/PRDs/{feature-name}.prd.md

### 4. Output
Show created file path and summary
