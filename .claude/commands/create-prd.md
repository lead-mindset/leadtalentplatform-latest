---
description: Create a comprehensive Product Requirements Document
argument-hint: [output-filename]
---

# /create-prd

Generate a comprehensive PRD based on conversation context.

## Input
- \ — output filename (default: PRD.md)
- Conversation context with requirements

## Steps

### 1. Parse
Extract: Product/feature description, Technical constraints, Success criteria

### 2. Analyze
Identify: Required PRD sections, Missing info requiring clarification

### 3. Generate PRD
Required Sections:
1. Executive Summary — product overview, value proposition, MVP goal
2. Mission — product mission statement, core principles
3. Target Users — user personas, pain points, needs
4. MVP Scope — In/Out of scope with checkboxes
5. User Stories — 5-8 stories in As a... I want... so that format
6. Core Architecture — high-level approach, directory structure
7. Tools/Features — detailed feature specifications
8. Technology Stack — backend/frontend technologies
9. Security & Configuration — auth approach, env variables
10. API Specification — endpoints, request/response formats
11. Success Criteria — measurable MVP success definition
12. Implementation Phases — 3-4 phases with deliverables
13. Future Considerations — post-MVP enhancements
14. Risks & Mitigations — 3-5 risks with strategies

### 4. Output
Save to: .github/PRDs/{filename}
