---
description: Pulse Ship — generate deploy workflow + rollback, run full test gate, refuse on red.
argument-hint: "[<target: vercel|github-actions>]"
---

Invoke the `pulse-ship` skill. Read the deploy target from `.pulse/config.yaml` (or override with $ARGUMENTS). Generate:

- `.github/workflows/deploy.yml`
- `vercel.json` (if Vercel)
- `scripts/rollback.sh`

Run the full test suite as a final gate. If anything is red, refuse to write deploy artifacts and report what failed.

Target override: $ARGUMENTS
