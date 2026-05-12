---
description: Pulse Spec — drive a spec interview, produce a full artifact tree under docs/pulse/.
argument-hint: "[<brief or one-line ask>]"
---

Invoke the `pulse-spec` skill to turn the user's brief into a structured Pulse spec. Ask clarifying questions one at a time. Produce:

- An epic / feature / task hierarchy under `docs/pulse/epics/<slug>/...` with valid frontmatter
- `spec.md` with acceptance criteria
- `db.md`, `api.md`, `design.md` artifact stubs where relevant (with Mermaid sketches if applicable)

User brief: $ARGUMENTS
