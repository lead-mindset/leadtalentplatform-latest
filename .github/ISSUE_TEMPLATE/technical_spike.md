---
name: Technical Spike
description: Research or investigation task
title: "[Spike] "
labels: ["spike", "technical"]
body:
  - type: textarea
    id: question
    attributes:
      label: Research Question
      description: What do we need to learn?
      placeholder: "Should we migrate from X to Y? How would we implement Z?"
    validations:
      required: true

  - type: textarea
    id: context
    attributes:
      label: Context
      description: Why is this research needed?
      placeholder: Background information and motivation

  - type: textarea
    id: deliverables
    attributes:
      label: Expected Deliverables
      description: What should this spike produce?
      value: |
        - [ ] Research findings documented
        - [ ] Proof of concept (if applicable)
        - [ ] Recommendation with trade-offs
        - [ ] Implementation plan (if proceeding)

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - Critical - Blocking other work
        - High - Needed for upcoming sprint
        - Medium - Good to know
        - Low - Future consideration
    validations:
      required: true

  - type: dropdown
    id: timebox
    attributes:
      label: Timebox
      description: How long to spend on this spike?
      options:
        - 1 day
        - 2 days
        - 3 days
        - 1 week
    validations:
      required: true
