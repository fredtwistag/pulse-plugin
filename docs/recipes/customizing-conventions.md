# Customizing conventions and Guard rules

`.pulse/config.yaml` is per-project. The defaults shipped with Pulse are a starting point — every team tunes them to match what they actually want to enforce. This recipe walks through the common customizations.

About 20 minutes to read; ongoing as you tune.

---

## The mental model

Three categories of customization, each in a different config section:

| Category | Where | What it tunes |
|---|---|---|
| **Banned patterns** | `guard.security_regression.banned_patterns` | Patterns that, if they reappear in added lines, fail security-regression |
| **Convention rules** | `guard.convention_drift.rules` | House-style rules the convention-drift sub-agent enforces |
| **Override policy** | `overrides` | When an override is acceptable and what it requires |

Each is independent. You can be liberal on conventions and strict on security, or vice versa.

---

## Adding banned patterns

The principle: every time the team consciously kills a pattern, add it here so it stays dead.

### The shape

```yaml
guard:
  security_regression:
    banned_patterns:
      - "Authorization: Bearer dev-token"
      - "skipAuth\\("
      - "process\\.env\\.LEGACY_ADMIN_PASSWORD"
```

Each entry is a regex (anchored as a substring match). Applied to **added (+) lines** in diffs only — removed lines and context don't count.

### Examples by category

**Deprecated auth/authz patterns:**

```yaml
banned_patterns:
  - "skipAuth\\(true\\)"                    # the test-mode auth bypass
  - "isAdmin\\s*=\\s*req\\.headers"         # header-based admin assertion (replaced by middleware)
  - "TODO: remove this auth bypass"         # the magic comment we leave when killing one
```

**Deprecated library usage:**

```yaml
banned_patterns:
  - "from ['\"]request['\"]"                # deprecated request package
  - "moment\\.format"                       # use dayjs/Intl
  - "Buffer\\(\\s*[a-zA-Z]"                 # Buffer constructor is deprecated
```

**Insecure patterns:**

```yaml
banned_patterns:
  - "child_process\\.exec\\("               # use execFile/spawn
  - "dangerouslySetInnerHTML"               # explicit allowlist needed
  - "eval\\("                               # never
```

**Internal markers you don't want shipping:**

```yaml
banned_patterns:
  - "console\\.log"                         # if you've banned them in prod code
  - "@ts-ignore"                            # if you've banned them in prod code
  - "FIXME:"                                # if you treat these as commit-blockers
```

### When to add one

You don't need a banned pattern for everything. The bar is: **a pattern we've consciously killed and don't want to debate again**. If a pattern is genuinely a "judgment call by file" thing, leave it out — the noise isn't worth it.

### Maintenance

Banned-pattern lists accumulate dead entries. Once a quarter:

- Grep the codebase for each entry; if zero matches anywhere, the entry is doing its job — leave it.
- If 50 matches exist (in legacy code), the entry isn't catching new violations either way — consider removing or replacing with a more specific regex.

---

## Adding convention rules

Convention rules are natural language, not regex. The convention-drift sub-agent reads them and applies judgment.

### The shape

```yaml
guard:
  convention_drift:
    rules:
      - "Service files under src/services use kebab-case filenames."
      - "Database queries go through the `db` client, not raw `pg`."
      - "Imports never reach across feature boundaries (no ../../../feature)."
```

### How they're applied

The sub-agent:

1. Reads each rule.
2. Reads the diff.
3. Reads 1–2 neighbor files (to understand the project's existing style).
4. Surfaces violations citing the rule that triggered.

A good rule is:

- **Verifiable from the diff alone** — "Component files match `[A-Z]*.tsx`" yes; "Code is well-tested" no (test-integrity's domain).
- **Project-specific** — "We never use default exports" is a good project rule; "Use semicolons" is a linter concern, not a Pulse concern.
- **Stated as the desired state**, not as a prohibition. "Files X use Y" reads better than "Files X must not use Z."

### Examples by category

**File-system conventions:**

```yaml
rules:
  - "Files under src/app use kebab-case for route segments."
  - "Component files are PascalCase; everything else is kebab-case."
  - "Test files live next to the file under test as `<name>.test.ts`."
  - "Service files use named exports, not default exports."
```

**Import discipline:**

```yaml
rules:
  - "Imports never reach across feature boundaries (no `../../../feature/...`)."
  - "Imports from `@/lib` are allowed from any feature; the reverse is not."
  - "Third-party imports come first, then local imports, separated by a blank line."
```

**Logging / error handling:**

```yaml
rules:
  - "Logging goes through `logger` from `@/lib/logger`, not `console`."
  - "Errors thrown in API routes extend `HttpError`; everything else extends `Error`."
  - "Caught errors are always re-thrown or logged; never silently swallowed."
```

**Domain-specific:**

```yaml
rules:
  - "Database queries go through `db` from `@/lib/db`, not raw `pg`."
  - "User-facing strings live in `@/lib/copy/<locale>.ts`, not inline."
  - "Currency values are stored as integers (cents), never as floats."
```

### Severity tuning

```yaml
guard:
  convention_drift:
    enabled: true
    severity_on_fail: warning   # default; the sub-agent rarely escalates
    rules: [...]
```

The default is `warning` because convention is judgment-call territory. Set to `error` only for projects where convention violations have bitten you (e.g. a project where feature-boundary violations have caused real bugs).

### Maintenance

Add rules as patterns emerge. Watch `/audit` for clusters of overrides on convention-drift — they signal either:

- A rule that's wrong (too strict, too broad).
- A pattern your codebase actually follows but you haven't codified.

Both call for editing the rules list.

---

## Tuning the override policy

```yaml
overrides:
  require_second_engineer:
    - security_regression
    - data_api_safety
  weekly_threshold_per_engineer: 5
```

### `require_second_engineer`

Checks where overrides require a co-signer (the override reason must contain `by <name>`; the matched name lands in the audit log's `second_engineer` field).

Default list: `security_regression`, `data_api_safety` — both high-blast-radius.

Reasons to extend the list:

- `dependency_hygiene` if your team has been burned by license-incompatible deps shipping.
- `test_integrity` if there's been a culture of waving through "tests will be added next sprint" overrides.
- `performance_pitfalls` for projects with strict SLAs.

Reasons to shrink the list:

- A solo-engineer project with no second engineer to co-sign. Document the deviation in your team README.

### `weekly_threshold_per_engineer`

A soft alarm. The dashboard flags an engineer whose 7-day rolling override count exceeds this number.

Default: 5. Tuning:

- Lower (3) for small teams where most code is reviewed twice anyway.
- Higher (10) for teams with high churn or large surface area work.

This is NOT a hard limit. It doesn't block overrides. It just makes leadership-level pattern visibility easier.

---

## Per-check disabling

You can disable any of the 8 Guard checks for a specific project:

```yaml
guard:
  performance_pitfalls:
    enabled: false
```

The check will short-circuit to `pass` with an "Check disabled in `.pulse/config.yaml`" note. Use this when:

- A check is genuinely not relevant (e.g. `data_api_safety` on a pure CLI tool with no DB or public API).
- You're rolling out Pulse to an existing repo and want to enable checks gradually (start with 3 enabled, add the rest one per sprint).

Don't use it to silence noisy checks. Tune them instead.

---

## Per-check severity tuning

Each check has `severity_on_fail`:

```yaml
guard:
  convention_drift:
    severity_on_fail: warning   # findings are warnings, don't block
  data_api_safety:
    severity_on_fail: error     # findings are errors, block
```

The defaults match what the checks were calibrated for. Adjust when:

- Your project has tighter or looser thresholds than the default audience.
- You're rolling out a new check and don't yet trust its calibration — set to `warning` initially, escalate to `error` once you've seen a quarter of clean runs.

---

## A worked example — onboarding a strict project

A regulated-industry client where security and data safety are paramount; performance and convention are lower-priority.

```yaml
guard:
  spec_conformance:
    enabled: true
    severity_on_fail: error

  security_regression:
    enabled: true
    severity_on_fail: error
    banned_patterns:
      - "TODO: remove this auth bypass"
      - "skipAuth\\("
      - "Authorization: Bearer dev-"
      - "process\\.env\\.LEGACY_ADMIN_PASSWORD"
      - "console\\.log\\(.*password"
      - "console\\.log\\(.*email"
    secret_scan: true

  convention_drift:
    enabled: true
    severity_on_fail: warning           # soft, not the team's main concern
    rules:
      - "API routes log via the audit logger when they mutate org state."
      - "Database queries never use string concatenation; always parameterized."

  anti_pattern_repetition:
    enabled: true
    threshold: 3
    severity_on_fail: warning

  performance_pitfalls:
    enabled: true
    severity_on_fail: warning           # team has SLAs but not Twitter-scale

  test_integrity:
    enabled: true
    severity_on_fail: error

  dependency_hygiene:
    enabled: true
    severity_on_fail: error
    allowlist_licenses: [MIT, ISC, Apache-2.0]    # stricter than default

  data_api_safety:
    enabled: true
    severity_on_fail: error

overrides:
  require_second_engineer:
    - security_regression
    - data_api_safety
    - dependency_hygiene
    - test_integrity
  weekly_threshold_per_engineer: 3       # very low — most overrides should be rare
```

A team's `.pulse/config.yaml` is a statement of values. The values above say: security and safety errors block; conventions are signal not gates; second-engineer review is required for high-stakes decisions.

---

## Where this config lives

`.pulse/config.yaml` is git-tracked, in the host repo's root. Every engineer on the project sees the same rules. Changes are PR-reviewed like any other code.

Convention: tune the file in the same PR as the change that revealed the need. "Add `Authorization: Bearer dev-` to banned-patterns" lands in the same commit as the test-helper refactor that surfaced it.

---

**Related:** [Plugin reference: Guard sub-agents](../reference/plugin.md#guard-sub-agents) · [Overriding Guard](../workflows/overriding-guard.md) · [State convention: config.yaml field reference](../reference/state-convention.md#pulseconfigyaml--field-reference)
