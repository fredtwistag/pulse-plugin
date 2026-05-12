---
description: Pulse Guard — run the 8-check agentic review on the current diff and write verdicts.
argument-hint: "[--override <reason>]"
---

Invoke the `pulse-guard` skill. Run the 8 review sub-agents against the current diff (vs the base branch in `.pulse/config.yaml`). Write a structured verdict file to `.pulse/reviews/<sha>.md`. Block on any `fail`.

If invoked with `--override "<reason>"`, append an entry to `.pulse/overrides.log.md` with: PR sha, engineer, check id, reason, timestamp. Re-run the suite to confirm only overridden checks remain `fail`.

Arguments: $ARGUMENTS
