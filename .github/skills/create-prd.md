---
description: Create a comprehensive Product Requirements Document from conversation context
argument-hint: [output-filename]
---

# Skill: Create PRD

> **System Rule**: This skill operates in a GitHub-native execution environment. It does NOT assume Jira, Confluence, or external ticketing systems. All outputs map to GitHub Issues + GitHub Projects structure only.

## Purpose
Generate a comprehensive Product Requirements Document (PRD) based on conversation context. Creates structured documentation that feeds directly into GitHub Issues and GitHub Projects workflows.

---

## GitHub Workflow Mapping

| Original Concept | GitHub-Native Equivalent |
|------------------|--------------------------|
| Requirements document | `.github/PRDs/` directory + PRD markdown files |
| Feature tracking | GitHub Issues with `feature` label |
| Project planning | GitHub Project board with custom fields |
| Documentation | Repository wiki or docs folder |

---

## Inputs
- `$ARGUMENTS` — output filename (default: `PRD.md`)
- Conversation context with requirements

---

## Execution Flow

### 1. Parse
Extract intent from conversation:
- Product/feature description
- Technical constraints
- Success criteria

### 2. Analyze
Identify:
- Required PRD sections based on product type
- Missing information requiring clarification
- GitHub Issue categories needed

### 3. Generate PRD
Create markdown document with:

**Required Sections:**
1. **Executive Summary** — Concise product overview, value proposition, MVP goal
2. **Mission** — Product mission statement, core principles
3. **Target Users** — User personas, pain points, needs
4. **MVP Scope** — In/Out of scope with checkboxes
5. **User Stories** — 5-8 stories in "As a... I want... so that..." format
6. **Core Architecture & Patterns** — High-level approach, directory structure
7. **Tools/Features** — Detailed feature specifications
8. **Technology Stack** — Backend/Frontend technologies, dependencies
9. **Security & Configuration** — Auth approach, env variables, security scope
10. **API Specification** — Endpoints, request/response formats (if applicable)
11. **Success Criteria** — Measurable MVP success definition
12. **Implementation Phases** — 3-4 phases with deliverables
13. **Future Considerations** — Post-MVP enhancements
14. **Risks & Mitigations** — 3-5 risks with strategies
15. **Appendix** — Related documents, dependencies

### 4. Output to GitHub Structure
- Save PRD to `.github/PRDs/{filename}`
- Generate initial GitHub Issue templates from user stories
- Create GitHub Project field definitions for tracking

---

## Output

**Files Created:**
- `.github/PRDs/{name}.prd.md` — Full Product Requirements Document

**GitHub Project Setup:**
Suggested custom fields for project tracking:
| Field | Type | Options |
|-------|------|---------|
| Phase | Single select | Discovery, Design, Implementation, Review, Done |
| Priority | Single select | Critical, High, Medium, Low |
| Type | Single select | Feature, Enhancement, Bug, Technical, Spike |
| Complexity | Single select | Small, Medium, Large |

---

## Process Details

### Phase 1: EXTRACT
- Review conversation history
- Identify explicit and implicit requirements
- Note technical constraints
- **If critical info missing**: Ask clarifying questions

### Phase 2: SYNTHESIZE
- Organize into PRD sections
- Fill reasonable assumptions
- Ensure technical feasibility
- Maintain consistency

### Phase 3: GENERATE
Use:
- Clear, professional language
- Concrete examples
- Markdown formatting (headings, lists, code blocks, checkboxes)
- Technical code snippets where helpful

### Phase 4: VALIDATE
Quality checks:
- [ ] All required sections present
- [ ] User stories have clear benefits
- [ ] MVP scope is realistic
- [ ] Technology choices justified
- [ ] Implementation phases actionable
- [ ] Success criteria measurable

### Phase 5: OUTPUT
```markdown
## PRD Created

**File**: `.github/PRDs/{name}.prd.md`
**Product**: {Product name}
**Problem**: {One line}
**Solution**: {One line}

### Sections Summary
- {Count} user stories defined
- {Count} MVP features in scope
- {Count} implementation phases
- {Count} risks identified

### Recommended Next Steps
1. Review PRD with stakeholders
2. Validate assumptions
3. Create implementation issues: Run `/plan` skill
4. Begin Phase 1 implementation
```
