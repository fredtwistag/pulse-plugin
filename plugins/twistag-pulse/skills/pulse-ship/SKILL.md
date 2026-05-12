---
name: pulse-ship
description: Use when ready to deploy — generates a GitHub Actions deploy workflow, Vercel project config, and rollback script for the target in .pulse/config.yaml, runs the full test suite as a final gate, and refuses to emit deploy artifacts on red.
---

# Pulse Ship — deploy generation + final test gate

> Slice 5 implements this skill in full. Skeleton present for plugin discoverability.

## What this skill does (preview)

- Reads `.pulse/config.yaml` deploy target (Vercel + GitHub Actions in v1)
- Generates:
  - `.github/workflows/deploy.yml`
  - `vercel.json`
  - `scripts/rollback.sh`
- Runs the full test suite as a final gate. **Refuses to emit deploy artifacts on red.**
- For repos with existing CI: diff-mode proposes minimal additions rather than rewriting.

## Status

**Skeleton only.** Full implementation lands in Slice 5.
