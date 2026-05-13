# State convention reference

Pulse writes two directories into every host project: `docs/pulse/` for the spec graph, `.pulse/` for config and audit. This page is the canonical reference for what goes where and what each frontmatter field means.

If you're trying to *use* this convention, start with the [guided walkthrough](../02-guided-walkthrough.md). This page is for engineers who already know it and want the schema in one place.

---

## Top-level layout

```
docs/pulse/
  epics/<epic-slug>/
    spec.md                                    # epic-level spec + acceptance
    arch.md                                    # epic-level arch decisions (optional)
    features/<feature-slug>/
      spec.md                                  # feature-level spec
      tasks/<task-slug>/
        spec.md                                # task-level spec
        db.md                                  # data model companion (optional)
        api.md                                 # API design companion (optional)
        design.md                              # UI design companion (optional)
  adr/
    ADR-NNN-<slug>.md                          # cross-cutting decisions
  _generated/                                  # auto-extracted by dashboard build
    schema.md                                  # from Prisma/Drizzle/SQL
    endpoints.md                               # from OpenAPI / route defs
    tokens.md                                  # from Tailwind tokens
  db.md / api.md / design.md                   # project-wide narratives (optional)

.pulse/
  config.yaml                                  # per-project config
  overrides.log.md                             # append-only audit
  reviews/<sha>.md                             # one per /pulse-guard run
```

Two cross-cutting rules:

1. **`spec.md` defines a node.** Other `.md` files in the same directory are *companion* artifacts of that node, not standalone artifacts. The dashboard renders companions inline on the node's detail page.
2. **All paths are kebab-case, all slugs are stable.** A slug appears in URLs, in frontmatter `links:`, and in shell commands; renames break references. Pick wisely up front.

---

## Frontmatter — the contract every artifact must follow

Every Markdown artifact starts with a YAML frontmatter block. Fields below.

### Common fields (every artifact)

```yaml
---
id: <stable-kebab-slug>      # unique across this project; used in URLs
type: epic | feature | task | adr | review
status: draft                # see status table below
owners: [<name>, ...]
created: YYYY-MM-DD          # the day the artifact was written
updated: YYYY-MM-DD          # last modification day
acceptance:                  # required on every spec.md
  - <outcome-shaped criterion>
links:
  parent: <parent-id-or-null>
  related: []
---
```

#### Status

| Status | Used by | Meaning |
|---|---|---|
| `draft` | `pulse-spec` | Just written. Awaiting refinement or arch. |
| `proposed` | `pulse-arch` (for ADRs) | ADR draft awaiting user confirmation. |
| `accepted` | `pulse-arch` | ADR has been confirmed. |
| `active` | `pulse-code` | Implementation in progress. |
| `shipped` | `pulse-ship` | Deployed. |
| `superseded` | `pulse-arch` | This ADR has been replaced; see `links.superseded-by`. |
| `archived` | manual | No longer relevant; kept for history. |

#### Acceptance — outcome-shaped, testable, machine-readable

Each entry is one criterion. Entries that have passed get a `[x] ` prefix; pending entries get `[ ] ` or no prefix. `/pulse-code` writes the `[x]` mark when its TDD test passes; the dashboard renders it as a checked checkbox.

```yaml
acceptance:
  - "[x] audit_events table created with org/actor/action/target/payload columns"
  - "[ ] Index on (organization_id, created_at desc) exists"
  - Backfill migration leaves existing data untouched   # no marker = treated as pending
```

#### Links

The link graph is what makes the dashboard navigable. Slugs in `links.*` are resolved against every known artifact:

- `links.parent` — id of the parent (epic for features, feature for tasks, task for ADRs).
- `links.adr` — array of ADR ids that bear on this artifact.
- `links.related` — array of other artifact ids worth surfacing.
- `links.supersedes` / `links.superseded-by` — for ADRs only.
- `links.task` — for ADRs, the task they answer.

Slugs that don't resolve render as muted plain text — they don't break the page.

### Task-only fields

Tasks may attach companion artifacts:

```yaml
artifacts:
  db: ./db.md                # remove if no db.md exists
  api: ./api.md              # remove if no api.md exists
  design: ./design.md        # remove if no design.md exists
```

These are hints for tooling, not required for the dashboard (which discovers companions by filesystem walk).

### Companion artifacts (`db.md` / `api.md` / `design.md`)

These are not standalone artifacts. They use a *lighter* frontmatter — no `type:`, no `status:` — so they don't pollute dashboard counts:

```yaml
---
kind: db | api | design
created: YYYY-MM-DD
updated: YYYY-MM-DD
links:
  parent: <parent-task-id>
---
```

Body: free-form Markdown with embedded Mermaid for diagrams.

### Review files (`.pulse/reviews/<sha>.md`)

Written by `/pulse-guard`. The frontmatter holds the verdict map; the body is the narrative summary + per-check findings.

```yaml
---
id: review-<short-sha>
sha: <full-sha>
base: <base-branch>
engineer: <git-user>
created: <ISO-8601 timestamp>
verdicts:
  spec-conformance: pass | warning | fail | overridden
  security-regression: pass | warning | fail | overridden
  convention-drift: pass | warning | fail | overridden
  anti-pattern-repetition: pass | warning | fail | overridden
  performance-pitfalls: pass | warning | fail | overridden
  test-integrity: pass | warning | fail | overridden
  dependency-hygiene: pass | warning | fail | overridden
  data-api-safety: pass | warning | fail | overridden
overall: pass | warning | fail | overridden
---
```

**Immutable per-sha.** `/pulse-guard` refuses to overwrite an existing review for the same sha — amend or rebase to get a new sha first.

### Override-log entries (`.pulse/overrides.log.md`)

`.pulse/overrides.log.md` is a Markdown file. Each override is a single fenced ```yaml block. Headers and prose between blocks are decorative; only the YAML blocks are parsed.

Schema:

```yaml
sha: <full-git-sha>
base: <base-branch>
engineer: <git-user>
check: <check-id>            # one of the 8 Guard check ids
reason: <free-text, required>
second_engineer: <name>      # required when the check is in
                             # overrides.require_second_engineer
created: <ISO-8601 timestamp>
```

Convention: precede each block with a markdown heading like:

```markdown
## 2026-05-12T11:14:55Z — joao — security-regression

```yaml
sha: ...
```
```

These headings are decorative — the parser reads the YAML blocks only — but they keep the file grep-able for humans.

---

## `.pulse/config.yaml` — field reference

Annotated example. All fields shown are optional; defaults documented inline.

```yaml
version: 1

# Branch the diff is computed against when running /pulse-guard.
base_branch: main

# Where the dashboard reads artifacts from.
paths:
  artifacts: docs/pulse              # default shown
  audit: .pulse/overrides.log.md     # default shown
  reviews: .pulse/reviews            # default shown

# /pulse-ship configuration.
ship:
  target: vercel                     # v1: only `vercel` supported
  vercel:
    project: <vercel-project-id>
    team: <vercel-team-id>
  test_command: pnpm test            # run as the final gate

# Per-check Guard tuning. Each check can be disabled with enabled: false.
guard:
  spec_conformance:
    enabled: true
    severity_on_fail: error          # error | warning

  security_regression:
    enabled: true
    severity_on_fail: error
    banned_patterns:                 # regex list — applied to added (+) lines
      - "Authorization: Bearer dev-token"
    secret_scan: true                # turn on heuristic secret detection

  convention_drift:
    enabled: true
    severity_on_fail: warning
    rules:                           # natural-language conventions
      - "Service files under src/services use kebab-case filenames."
      - "Database queries go through the `db` client, not raw `pg`."

  anti_pattern_repetition:
    enabled: true
    threshold: 3                     # N files where same shape triggers a fail
    severity_on_fail: warning

  performance_pitfalls:
    enabled: true
    severity_on_fail: error

  test_integrity:
    enabled: true
    severity_on_fail: error

  dependency_hygiene:
    enabled: true
    severity_on_fail: error
    allowlist_licenses:              # any new dep must have one of these
      - MIT
      - ISC
      - Apache-2.0
      - BSD-2-Clause
      - BSD-3-Clause

  data_api_safety:
    enabled: true
    severity_on_fail: error

# Override policy.
overrides:
  # Checks that require a second engineer's name in the override reason.
  # The reason must match /by\s+\S+/i; the matched name lands in
  # second_engineer on the log entry.
  require_second_engineer:
    - security_regression
    - data_api_safety

  # Soft alarm — the dashboard flags an engineer whose override count over
  # the last 7 rolling days exceeds this number.
  weekly_threshold_per_engineer: 5
```

### A template ships with the plugin

Copy from [`plugins/twistag-pulse/templates/config.yaml`](../../plugins/twistag-pulse/templates/config.yaml) — it includes all the comments and defaults. Customize from there.

---

## How the dashboard reads this

The dashboard's parser (in [`apps/pulse-dashboard/src/lib/parser/`](../../apps/pulse-dashboard/src/lib/parser/)) walks the artifacts root once per request:

1. Every `*.md` file gets parsed by `gray-matter` (frontmatter + body).
2. `_generated/` is skipped (auto-extracted by separate generators).
3. The tree builder groups artifacts by **path** — `spec.md` defines a node; sibling `.md` files are companions of that node.
4. YAML dates (`created: 2026-05-12`) are normalized to ISO strings so React can render them.

If you do something unusual in your repo and the dashboard surfaces it as "unplaced artifacts" on the homepage, the path didn't match the convention. Move the file or add the missing `spec.md` to make it a proper node.

---

## Things this convention deliberately doesn't do

- **No database.** Everything is git-tracked Markdown. Diff-able, reviewable, portable across forks.
- **No GUI editor.** Edit in your IDE, commit, dashboard re-renders on next reload.
- **No global tag system.** Use `links.related` for cross-references. Tags accumulate noise; cross-refs surface real relationships.
- **No required ordering inside a directory.** `spec.md` is the entry point; everything else is alphabetical in the dashboard.

---

**Related:** [Plugin reference](plugin.md) · [Dashboard reference](dashboard.md) · [The SDLC loop](../workflows/sdlc-loop.md)
