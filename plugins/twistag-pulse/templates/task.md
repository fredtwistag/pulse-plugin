---
id: <task-slug>
type: task
status: draft        # draft | active | shipped | archived
owners: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
acceptance:
  - <testable criterion — pulse-code will mark `[x]` when the test passes>
links:
  parent: <feature-slug>
  adr: []            # populated by pulse-arch
  related: []
artifacts:
  db: ./db.md        # remove if no data work
  api: ./api.md      # remove if no API work
  design: ./design.md  # remove if no UI work
---

# <Task title>

## Context

<Why this task exists. Link the feature spec.>

## Requirements

<Detailed requirements derived from the acceptance criteria.>

## Edge cases

<Cases the implementation must handle. Pulse-spec interviews to extract these.>

## Open questions

<Anything still TBD — flagged for human decision before pulse-code begins.>
