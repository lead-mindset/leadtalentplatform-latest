---
name: Feature Request
description: Suggest a new feature or enhancement
labels: ["feature", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to suggest a feature!

  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: Who has this problem? What is the pain?
      placeholder: As a [user type], I struggle with [problem] because [reason]
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: What should be built?
      placeholder: Describe the feature or capability
    validations:
      required: true

  - type: textarea
    id: success
    attributes:
      label: Success Metrics
      description: How will we know this works?
      placeholder: Measurable outcomes or indicators

  - type: checkboxes
    id: out-of-scope
    attributes:
      label: Out of Scope
      description: What is explicitly NOT included?
      options:
        - label: Breaking changes to existing API
        - label: Mobile app support
        - label: Third-party integrations
        - label: Admin dashboard changes

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - Critical - Blocking other work
        - High - Important for next release
        - Medium - Nice to have
        - Low - Future consideration
    validations:
      required: true

  - type: dropdown
    id: complexity
    attributes:
      label: Estimated Complexity
      options:
        - Small - Single file change
        - Medium - Multiple files, clear scope
        - Large - Cross-cutting concerns
    validations:
      required: true
