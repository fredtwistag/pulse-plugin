---
id: review-<short-sha>
type: review
sha: <full-sha>
base: <base-branch>
engineer: <git-user>
created: YYYY-MM-DDTHH:MM:SSZ
verdicts:
  spec-conformance: pass
  security-regression: pass
  convention-drift: pass
  anti-pattern-repetition: pass
  performance-pitfalls: pass
  test-integrity: pass
  dependency-hygiene: pass
  data-api-safety: pass
overall: pass        # pass | warning | fail | overridden
---

# Guard review — <short-sha>

## Summary

<One line: pass / N warnings / N failures.>

## Findings

### spec-conformance
*<status>* — <message, or "no issues">

### security-regression
*<status>* — <message>

### convention-drift
*<status>* — <message>

<!-- ... one section per check -->

## Overrides

<If any. Each entry shows: check, engineer, reason, timestamp. Auto-generated from .pulse/overrides.log.md.>
