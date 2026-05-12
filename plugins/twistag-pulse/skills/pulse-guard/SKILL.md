---
name: pulse-guard
description: Use before pushing or merging — runs the 8-check agentic review layer against the current diff, writes structured verdicts to .pulse/reviews/<sha>.md, and blocks the push on any 'fail'. Also invoked automatically by the pre-push hook. Engineers can override a failure with `--override "<reason>"` which appends to .pulse/overrides.log.md.
---

# Pulse Guard — 8-check agentic review layer

> Slice 2 implements checks 1–3 (spec conformance, security regression, convention drift). Slice 4 adds checks 4–8. Skeleton present for plugin discoverability.

## The 8 checks

| # | Check | Catches |
|---|---|---|
| 1 | Spec conformance | Diff vs the linked task's `acceptance:` list (slice 2) |
| 2 | Security regression | Banned auth/authz patterns, secrets, known vulnerable usages (slice 2) |
| 3 | Convention drift | House style from `.pulse/config.yaml` (slice 2) |
| 4 | Anti-pattern repetition | Same poor pattern in N files (slice 4) |
| 5 | Performance pitfalls | N+1, hot-loop allocs, unbounded recursion (slice 4) |
| 6 | Test integrity | Tautological assertions, contract vs implementation (slice 4) |
| 7 | Dependency & supply-chain hygiene | New deps, version pinning, CVEs (slice 4) |
| 8 | Data & API safety | Breaking API contracts, unsafe migrations, PII (slice 4) |

Each check runs as an independent sub-agent under `plugins/twistag-pulse/agents/`. Guard dispatches them in parallel where independent, serial where ordered, and aggregates structured verdicts.

## Status

**Skeleton only.** Slice 2 lands checks 1–3 + the override audit log.
