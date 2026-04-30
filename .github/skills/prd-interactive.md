---
description: Interactive PRD generator - asks questions to build a PRD
argument-hint: [feature/product idea] (blank = start with questions)
---

# Skill: PRD Interactive

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Generate a Product Requirements Document through interactive questioning. Acts as a sharp product manager who starts with problems, not solutions.

**Anti-pattern**: Don't fill sections with fluff. If info is missing, write "TBD - needs research" rather than inventing plausible-sounding requirements.

**Input**: `$ARGUMENTS`

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Requirements gathering | Interactive conversation |
| PRD document | `.github/PRDs/{name}.prd.md` |
| Feature requests | GitHub Issues templates |
| User story tracking | GitHub Project fields |

---

## Inputs
- `$ARGUMENTS` — feature/product idea (optional, blank starts with questions)

---

## Execution Flow

### Phase 1: INITIATE

**If no input provided**, ask:
> What do you want to build? Describe the product or feature in a few sentences.

**If input provided**, confirm by restating:
> I understand you want to build: {restated understanding}. Is this correct?

**Wait for user response before proceeding.**

### Phase 2: FOUNDATION

Ask these questions together:

> **Foundation Questions:**
> 1. **Who** has this problem? Be specific about the person/role.
> 2. **What** problem are they facing? Describe the observable pain.
> 3. **Why** can't they solve it today? What alternatives exist?
> 4. **Why now?** What changed that makes this worth building?
> 5. **How** will you know if you solved it?

**Wait for user responses before proceeding.**

### Phase 3: DEEP DIVE

Based on answers, ask:

> **Vision & Scope:**
> 1. **Vision**: One sentence — what's the ideal end state?
> 2. **Job to Be Done**: "When [situation], I want to [motivation], so I can [outcome]."
> 3. **MVP**: What's the absolute minimum to test if this works?
> 4. **Out of Scope**: What are you explicitly NOT building?
> 5. **Constraints**: Time, budget, or technical limitations?

**Wait for user responses before proceeding.**

### Phase 4: GENERATE

**Output path**: `.github/PRDs/{kebab-case-name}.prd.md`

Create directory if needed:
```bash
mkdir -p .github/PRDs
```

Write the PRD:

```markdown
# {Product/Feature Name}

## Problem Statement
{2-3 sentences: Who has what problem, and what's the cost of not solving it?}

## Key Hypothesis
We believe {capability} will {solve problem} for {users}.
We'll know we're right when {measurable outcome}.

## Users

**Primary User**: {Specific description, role, context}

**Job to Be Done**: When {situation}, I want to {motivation}, so I can {outcome}.

**Non-Users**: {Who this is NOT for}

## Solution
{One paragraph: What we're building and why this approach}

### MVP Scope

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | {Feature} | {Why essential} |
| Must | {Feature} | {Why essential} |
| Should | {Feature} | {Why important but not blocking} |
| Won't | {Feature} | {Explicitly deferred and why} |

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| {Primary metric} | {Specific number} | {Method} |

## Open Questions
- [ ] {Unresolved question 1}
- [ ] {Unresolved question 2}

## Implementation Phases

| # | Phase | Description | Status | Depends |
|---|-------|-------------|--------|---------|
| 1 | {Phase name} | {What this delivers} | pending | - |
| 2 | {Phase name} | {What this delivers} | pending | 1 |

---

*Generated: {timestamp}*  
*Status: DRAFT - needs validation*
```

### Phase 5: SUMMARY

After generating, report:

```markdown
## PRD Created

**File**: `.github/PRDs/{name}.prd.md`

**Problem**: {One line}  
**Solution**: {One line}  
**Key Metric**: {Primary success metric}

### Open Questions ({count})
{List questions that need answers}

### Recommended Next Steps
{User research, technical spike, prototype, etc.}

### GitHub Integration
- Create GitHub Issues from this PRD: Run `/create-issues` skill
- Add to GitHub Project for tracking
- Link to milestone if applicable
```

---

## GitHub Issue Template (Optional)

If the user wants to standardize future feature requests, suggest creating an issue template:

**File**: `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature Request
about: Suggest a new feature
title: '[Feature] '
labels: feature, needs-triage
assignees: ''
---

## Problem Statement
Who has what problem?

## Proposed Solution
What should be built?

## Success Metrics
How will we know this works?

## Out of Scope
What is explicitly NOT included?
```
