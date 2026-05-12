---
name: pulse-spec
description: Use when starting any new feature, epic, or task — turns a brief, transcript, or stakeholder ask into a structured Pulse spec with acceptance criteria and artifact stubs under docs/pulse/epics/<slug>/features/<slug>/tasks/<slug>/. Forked from superpowers:brainstorming and tuned for Twistag's client-delivery flow.
---

# Pulse Spec — discovery → spec

> Slice 1 will fully implement this skill. For Slice 0 (Foundation) this file exists so the plugin manifest passes its smoke test and `/pulse-spec` is discoverable in Claude Code.

## What this skill does (preview)

Drives a brainstorming-style interview to produce:

- `docs/pulse/epics/<slug>/spec.md` (if new epic) — frontmatter + acceptance criteria + narrative
- `docs/pulse/epics/<slug>/features/<slug>/spec.md` — feature-level spec
- `docs/pulse/epics/<slug>/features/<slug>/tasks/<slug>/spec.md` — task-level spec
- `docs/pulse/epics/<slug>/features/<slug>/tasks/<slug>/db.md` — Mermaid ER + narrative (if data work)
- `docs/pulse/epics/<slug>/features/<slug>/tasks/<slug>/api.md` — endpoints + contracts (if API work)
- `docs/pulse/epics/<slug>/features/<slug>/tasks/<slug>/design.md` — UI notes + tokens (if UI work)

Every artifact uses the frontmatter contract in `plugins/twistag-pulse/templates/`.

## Status

**Skeleton only.** Full implementation lands in Slice 1.
