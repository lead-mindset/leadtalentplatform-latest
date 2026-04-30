---
name: Bug Report
description: Report a bug or unexpected behavior
labels: ["bug", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for reporting a bug! Please fill out as much as you can.

  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: What happened?
      placeholder: A clear description of the bug
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: How can we reproduce this?
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should have happened?
      placeholder: Describe the expected outcome
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happened?
      placeholder: Describe what actually occurred
    validations:
      required: true

  - type: input
    id: environment
    attributes:
      label: Environment
      description: Browser, OS, or runtime environment
      placeholder: Chrome 120, macOS 14, Node.js 20

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots / Logs
      description: Add screenshots or error logs if applicable

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options:
        - Critical - Data loss, security issue, crash
        - High - Major feature broken
        - Medium - Feature works with workarounds
        - Low - Minor inconvenience
    validations:
      required: true
