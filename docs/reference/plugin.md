# Plugin reference

Canonical reference for `twistag-pulse` — every skill, every slash command, every sub-agent, every hook, every script. Look here when you know what you want.

The plugin lives at [`plugins/twistag-pulse/`](../../plugins/twistag-pulse/) in this repo. Its layout follows the Claude Code plugin convention:

```
plugins/twistag-pulse/
├── .claude-plugin/plugin.json    manifest
├── README.md                     plugin-internal readme
├── package.json                  scripts: smoke, install-hooks
├── skills/<name>/SKILL.md        seven skill bundles
├── commands/<name>.md            five slash commands
├── agents/<name>.md              ten sub-agents (8 Guard + 2 Ship)
├── hooks/pre-push.mjs            executable git pre-push hook
├── templates/                    state-convention + deploy starters
└── scripts/                      smoke + install-hooks
```

---

## Skills

A skill is a Markdown file with YAML frontmatter that Claude Code loads at startup. Each skill has a `description:` that tells Claude when to invoke it.

The five delivery skills follow the SDLC. The two utility skills are carried over from `superpowers`.

| Skill | Path | Purpose |
|---|---|---|
| `pulse-spec` | [`skills/pulse-spec/SKILL.md`](../../plugins/twistag-pulse/skills/pulse-spec/SKILL.md) | Discovery → spec; produces the full artifact tree under `docs/pulse/` |
| `pulse-arch` | [`skills/pulse-arch/SKILL.md`](../../plugins/twistag-pulse/skills/pulse-arch/SKILL.md) | Architecture decision → ADR |
| `pulse-code` | [`skills/pulse-code/SKILL.md`](../../plugins/twistag-pulse/skills/pulse-code/SKILL.md) | TDD implementation; ticks spec acceptance as criteria pass |
| `pulse-guard` | [`skills/pulse-guard/SKILL.md`](../../plugins/twistag-pulse/skills/pulse-guard/SKILL.md) | Orchestrates the 8-check review layer |
| `pulse-ship` | [`skills/pulse-ship/SKILL.md`](../../plugins/twistag-pulse/skills/pulse-ship/SKILL.md) | Deploy artifact generation + final test gate |
| `pulse-debug` | (carried over) | Systematic debugging discipline |
| `pulse-verify` | (carried over) | Verification before completion |

See each file for the full skill prompt — they are reference material in their own right.

---

## Slash commands

Each slash command invokes its matching skill, passing through any arguments via `$ARGUMENTS`.

### `/pulse-spec <brief>`

Turn a brief, transcript, or one-line ask into a structured Pulse spec.

**Argument:** free-text brief — anything from "add an audit log" to a pasted stakeholder transcript.

**Produces:** under `docs/pulse/epics/<slug>/...`:
- `spec.md` (always)
- `features/<slug>/spec.md` (if feature-sized)
- `tasks/<slug>/spec.md` (if task-sized) plus `db.md`, `api.md`, `design.md` companions when relevant

**Interview style:** one question per turn, multiple-choice when reasonable.

**Exit state:** every planned file exists, frontmatter is valid, every spec has at least one outcome-shaped acceptance criterion, open questions are surfaced with an owner attached.

### `/pulse-arch <task-slug>`

Propose 2–3 implementation paths and write the chosen one as an ADR.

**Argument:** task / feature / epic slug. Looks up the artifact under `docs/pulse/`.

**Produces:**
- `docs/pulse/adr/ADR-NNN-<slug>.md` (NNN auto-incremented from the existing ADRs)
- Patches the parent spec's `links.adr` array

**Hard rules:** one ADR per invocation, never deletes a prior ADR (supersedes), `status: accepted` only on user confirmation.

### `/pulse-code <task-slug>`

TDD implementation against a task's acceptance criteria.

**Argument:** task slug.

**Process:** for each acceptance criterion, red → green → refactor → full-suite-green → tick `- "[x]"` in the spec frontmatter.

**Status transitions:** `draft` → `active` on start. Never transitions to `shipped` — that's `/pulse-ship`'s job.

### `/pulse-guard [--override "<reason>"]`

Run the 8-check review on the current diff. Writes `.pulse/reviews/<full-sha>.md` and exits non-zero on fail (headless).

**Arguments:**
- `--override "<reason>"` — for waving through a failed check. Appends a YAML block to `.pulse/overrides.log.md`. If the failed check is in `overrides.require_second_engineer`, the reason MUST match the regex `/by\s+\S+/i` (e.g. `"approved by joao for hotfix window"`); the matched name lands in `second_engineer:`.

**Verdict aggregation:**
- `pass` if every check passes.
- `warning` if any warning and no fails.
- `fail` if any unoverridden fail.
- `overridden` if every fail has an override entry.

**Pre-push hook calls this same skill** headlessly — same review file, same exit code.

### `/pulse-ship [target] [--task <slug>]`

Generate deploy artifacts. Hard test gate runs every invocation.

**Arguments:**
- `target` — `vercel` (default; v1 only target) or `github-actions`.
- `--task <slug>` — if provided, transitions the task's spec `status:` to `shipped` after a successful generation.

**Files produced (Vercel target):**
- `.github/workflows/deploy.yml`
- `vercel.json`
- `scripts/rollback.sh`

**Refusal cases:**
- Missing `.pulse/config.yaml.ship` block.
- Test command non-zero.
- Test command suspicious (`true`, `exit 0`, `echo passed`).
- Test command times out (>15 min).
- Not in a git repo.
- Task already `status: shipped`.
- Most recent review `overall: fail` without overrides.

---

## Guard sub-agents

Each sub-agent is a focused agent file under [`agents/`](../../plugins/twistag-pulse/agents/). The orchestrator dispatches them in parallel and aggregates their structured YAML output.

Every sub-agent emits the same shape:

```yaml
check: <check-id>
status: pass | warning | fail
findings:
  - file: <repo-relative path>
    lines: <start>-<end>
    severity: info | warning | error
    message: <one-sentence what>
    suggestion: <one-sentence how to fix>
overall_note: <one or two sentences for the human>
```

### 1. `guard-spec-conformance`

**Catches:** diff drift from the linked task's `acceptance:` list. Both scope creep AND missing pieces.

**Inputs:** diff, linked `spec.md` paths.

**Severity calibration:**
- **error** — diff implements something the spec did not ask for, AND that something is non-trivial (new endpoint, new dep, new column).
- **warning** — small unsanctioned change that's recoverable.
- **info** — partial satisfaction of an acceptance item.

**File:** [`agents/guard-spec-conformance.md`](../../plugins/twistag-pulse/agents/guard-spec-conformance.md).

### 2. `guard-security-regression`

**Catches:** banned patterns from `.pulse/config.yaml.guard.security_regression.banned_patterns`, secrets in added lines, deprecated auth/authz patterns reintroduced, known-vulnerable usages (`eval`, raw SQL concatenation, etc).

**Inputs:** diff, `.pulse/config.yaml`.

**Severity calibration:** secrets in diff = always `error` and always `fail` overall. Banned-pattern matches in added lines = `error`. Ambiguous high-entropy literals = `warning`.

**Hard rule:** never echoes a suspected secret in its output. Reports file/line + description only.

**File:** [`agents/guard-security-regression.md`](../../plugins/twistag-pulse/agents/guard-security-regression.md).

### 3. `guard-convention-drift`

**Catches:** house-style violations against `guard.convention_drift.rules` in `.pulse/config.yaml`. Also catches consistency drift — if 8 neighbor files do X and this diff does Y, it surfaces even without an explicit rule.

**Severity calibration:** mostly `warning`. `error` only when `severity_on_fail: error` AND the violation breaks a hard project rule.

**Hard rule:** one finding per file per violation, not one per occurrence.

**File:** [`agents/guard-convention-drift.md`](../../plugins/twistag-pulse/agents/guard-convention-drift.md).

### 4. `guard-anti-pattern-repetition`

**Catches:** the same load-bearing poor shape across N+ files in a single diff, where N is `guard.anti_pattern_repetition.threshold` (default 3). The "future-refactor signal."

**Output:** one finding per shape, with an `also_in:` list of the additional files.

**Hard rule:** finding must suggest a destination ("lift to `safeCall` helper").

**File:** [`agents/guard-anti-pattern-repetition.md`](../../plugins/twistag-pulse/agents/guard-anti-pattern-repetition.md).

### 5. `guard-performance-pitfalls`

**Catches:** eight named failure modes — N+1 queries, hot-loop allocations, missing indexes (schema-verified), unbounded recursion, accidental quadratic, unbounded fetch, sync I/O on hot paths, cache-busting React renders.

**Hard rule:** schema-dependent findings need schema evidence (reads the schema file before claiming an index is missing).

**File:** [`agents/guard-performance-pitfalls.md`](../../plugins/twistag-pulse/agents/guard-performance-pitfalls.md).

### 6. `guard-test-integrity`

**Catches:** tautological assertions, implementation-coupled tests, vacuous mocks, snapshot-only assertions, disabled tests (`.skip()` / `xit()`), tests-of-mocks, coverage theater, and — most importantly — **acceptance criteria with zero test coverage**.

**Refusal:** if no test files touched in the diff, returns `warning` with "If new code shipped, the implementation lacks test coverage."

**File:** [`agents/guard-test-integrity.md`](../../plugins/twistag-pulse/agents/guard-test-integrity.md).

### 7. `guard-dependency-hygiene`

**Catches:** new direct deps with a license outside `allowlist_licenses`, unused new deps (added to `package.json` but never imported), duplicate-purpose adds, unpinned production ranges, major-version bumps without a documented reason, single direct adds that pull in >10 transitive deps.

**Hard rule:** trust the allowlist. Do not reinterpret which licenses are "actually compatible."

**File:** [`agents/guard-dependency-hygiene.md`](../../plugins/twistag-pulse/agents/guard-dependency-hygiene.md).

### 8. `guard-data-api-safety`

**Catches:** three families.

- **Migration safety:** NOT NULL without backfill, DROP COLUMN, RENAME, type narrowing, unique constraint added without verifying uniqueness, large-table index without `CONCURRENTLY`, `DROP TABLE` / `TRUNCATE`.
- **API contract breakage:** removed endpoint, removed/renamed/retyped response field, required↔optional flips on request body, status-code changes, query/path/header param renames.
- **PII handling:** newly logged, newly exposed in a response, sensitive field exfiltrated through analytics, encryption-at-rest regressions.

**Special input:** receives the base ref from `/pulse-guard` so it can run `git show <base>:<path>` and compare prior state.

**File:** [`agents/guard-data-api-safety.md`](../../plugins/twistag-pulse/agents/guard-data-api-safety.md).

---

## Ship sub-agents

Two adapters, one per deploy target. Both are read by `/pulse-ship` after the test gate passes.

### `ship-github-actions`

Writes `.github/workflows/deploy.yml`. Greenfield (from template) or diff-mode (Edit-patches existing CI to satisfy: test job gates deploy, `concurrency.cancel-in-progress: false`, `production` environment declared).

**Hard rules:** test job is non-negotiable; secrets only via `${{ secrets.* }}`; never cancel running deploys; never invent commands not in `package.json`; pin actions to major versions.

**File:** [`agents/ship-github-actions.md`](../../plugins/twistag-pulse/agents/ship-github-actions.md).

### `ship-vercel`

Writes `vercel.json` (greenfield, diff, or no-op) and `scripts/rollback.sh`.

**Asymmetric rule:** existing `scripts/rollback.sh` is NEVER overwritten silently — rollback paths are load-bearing operationally.

**Hard rules:** `vercel.json.github.enabled` must be false (so the GH Actions workflow is the single deploy path; no racing auto-deploys from git pushes); `set -euo pipefail` in the rollback script; no embedded `VERCEL_TOKEN`.

**File:** [`agents/ship-vercel.md`](../../plugins/twistag-pulse/agents/ship-vercel.md).

---

## Hooks

### `hooks/pre-push.mjs`

Deterministic Node script. Runs on every `git push`. Reads `.pulse/reviews/<HEAD-sha>.md`, extracts the `overall:` field via crude frontmatter extraction (no YAML parser needed), and decides:

| `overall:` | Behavior |
|---|---|
| `pass`, `warning`, `overridden` | exit 0 — push allowed |
| `fail` | exit 1 — push refused; engineer fixes or overrides |
| (no review file) | exit 1 — refused with hint to run `/pulse-guard` |
| (no `.pulse/` directory) | exit 0 with "skipping" notice |

**Bypass for emergencies:** `PULSE_SKIP_GUARD=1 git push`. Surfaces an explicit yellow warning when used.

**File:** [`hooks/pre-push.mjs`](../../plugins/twistag-pulse/hooks/pre-push.mjs).

---

## Scripts

### `scripts/install-hooks.mjs`

Symlinks the pre-push hook into the current repo's `.git/hooks/pre-push`. Backs up any existing non-Pulse hook to a timestamped file. Idempotent — safe to re-run.

**Usage from any project:**

```bash
node /path/to/pulse/plugins/twistag-pulse/scripts/install-hooks.mjs
```

**File:** [`scripts/install-hooks.mjs`](../../plugins/twistag-pulse/scripts/install-hooks.mjs).

### `scripts/smoke.mjs`

The plugin's own structural test. Verifies manifest parses, skills exist, commands exist, templates exist, all 10 sub-agents (8 Guard + 2 Ship) exist, both orchestrator skills cross-reference their sub-agents, the pre-push hook is executable, and the deploy templates are in place.

**Run with:** `pnpm plugin:smoke` (from repo root) or directly: `node plugins/twistag-pulse/scripts/smoke.mjs`.

**Current pass rate:** 10/10.

---

## Templates

Pulse ships starter templates engineers can copy into their projects. Location: [`plugins/twistag-pulse/templates/`](../../plugins/twistag-pulse/templates/).

### State-convention templates

- `epic.md`, `feature.md`, `task.md`, `adr.md`, `review.md` — frontmatter scaffolds for each artifact type.
- `config.yaml` — annotated `.pulse/config.yaml` starter.
- `overrides.log.md` — empty append-only audit log seed.

See [state convention reference](state-convention.md) for the full schema each template implements.

### Deploy templates

- `deploy/github-actions-deploy.yml` — starter Vercel-via-GH-Actions workflow with test gate.
- `deploy/vercel.json` — minimal config with `github.enabled: false`.
- `deploy/rollback.sh` — operator-runnable rollback with `set -euo pipefail`.

The ship sub-agents start from these and adapt to the project they're running against.

---

**Related:** [State convention reference](state-convention.md) · [Dashboard reference](dashboard.md) · [The SDLC loop](../workflows/sdlc-loop.md)
