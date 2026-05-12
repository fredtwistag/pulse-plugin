---
name: pulse-code
description: Use after pulse-arch when implementing a task — drives a TDD loop against the task's acceptance criteria, enforces conventions from .pulse/config.yaml, and updates the spec's acceptance check-marks as criteria pass. Forked from superpowers:executing-plans + superpowers:test-driven-development.
---

# Pulse Code — TDD implementation

> Slice 3 will fully implement this skill. Skeleton present for plugin discoverability.

## What this skill does (preview)

- Reads `spec.md` + linked ADRs + `.pulse/config.yaml` conventions
- Drives a TDD loop per acceptance criterion: failing test → minimal impl → refactor
- Enforces house style from `.pulse/config.yaml`
- Marks acceptance criteria complete in the spec frontmatter as tests pass
- Transitions spec `status` from `draft` → `active` → ready for `/pulse-guard`

## Status

**Skeleton only.** Full implementation lands in Slice 3.
