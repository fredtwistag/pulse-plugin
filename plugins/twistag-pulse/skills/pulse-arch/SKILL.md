---
name: pulse-arch
description: Use after pulse-spec when a task needs an architecture decision — reads the linked spec, the existing codebase, and prior ADRs, proposes 2-3 implementation paths, then writes an ADR with the chosen option and trade-offs to docs/pulse/adr/. Forked from superpowers:writing-plans.
---

# Pulse Arch — architecture → ADR

> Slice 3 will fully implement this skill. Skeleton present for plugin discoverability.

## What this skill does (preview)

- Reads `docs/pulse/epics/.../tasks/<slug>/spec.md`
- Inspects existing codebase patterns and prior ADRs under `docs/pulse/adr/`
- Proposes 2–3 implementation paths with trade-offs
- Writes `docs/pulse/adr/ADR-NNN-<slug>.md` with chosen option and consequences
- Updates the parent task's `spec.md` frontmatter `links:` to reference the ADR

## Status

**Skeleton only.** Full implementation lands in Slice 3.
