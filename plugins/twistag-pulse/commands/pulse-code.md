---
description: Pulse Code — TDD implementation of a task against its acceptance criteria.
argument-hint: "[<task slug or spec path>]"
---

Invoke the `pulse-code` skill. Read the referenced task spec + linked ADRs + `.pulse/config.yaml`. Drive a TDD loop per acceptance criterion: failing test → minimal implementation → refactor. Update acceptance check-marks in the spec frontmatter as criteria pass. Transition `status: draft` → `active` when work begins.

Target: $ARGUMENTS
