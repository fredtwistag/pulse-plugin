# Glossary

Every Pulse term defined once.

---

### Acceptance criterion

An outcome-shaped, testable statement in a spec's `acceptance:` frontmatter list. `/pulse-code` ticks each one to `[x]` when its corresponding test passes. `/pulse-guard`'s spec-conformance check diffs the PR against this list to catch scope drift.

### ADR (Architecture Decision Record)

A point-in-time record of an architecture choice: the context, the options considered, the chosen one, and the consequences accepted. Written by `/pulse-arch`, lives at `docs/pulse/adr/ADR-NNN-<slug>.md`. Never deleted — only superseded.

### Agent / sub-agent

A focused Markdown agent file under `plugins/twistag-pulse/agents/`. Pulse has 10: 8 Guard sub-agents and 2 Ship sub-agents. The orchestrator skill (`pulse-guard` or `pulse-ship`) dispatches them in parallel via the Agent tool and aggregates their structured YAML output.

### Artifact

Any Markdown file under `docs/pulse/`. Five canonical types: epic, feature, task, ADR, review. Plus companion files (`db.md` / `api.md` / `design.md`) attached to tasks.

### Audit log

`.pulse/overrides.log.md`. Append-only Markdown file containing one fenced ```yaml block per override. The dashboard renders it at `/audit`.

### Banned pattern

A regex in `.pulse/config.yaml.guard.security_regression.banned_patterns`. Patterns that, if they appear in added lines (`+`) of a diff, fail the security-regression check. The convention: every pattern the team consciously kills gets added so it stays dead.

### Base branch

The branch your diff is computed against. Set in `.pulse/config.yaml.base_branch`; default `main`.

### Companion artifact

A `db.md`, `api.md`, `design.md`, or `arch.md` file sibling to a node's `spec.md`. Companions use lighter frontmatter (`kind:` only — no `type:`, no `status:`) and render inline on the parent node's dashboard detail page.

### Convention rule

A natural-language statement in `.pulse/config.yaml.guard.convention_drift.rules`. The convention-drift sub-agent reads these and applies judgment to find violations.

### Decision graph

The Supersedes / Superseded-by / Decides backlink section the dashboard renders on every ADR detail page. Lets you trace the history of a decision and the task it answers.

### Diff-mode

`/pulse-ship`'s behavior when the target repo already has CI. Instead of rewriting from templates, it reads the existing workflow / `vercel.json` / rollback script and proposes the **minimum** Edits needed to satisfy Ship's contract (test gates deploy, no cancel-in-progress, production environment declared).

### Eight checks

The 8 Guard sub-agents: spec-conformance, security-regression, convention-drift, anti-pattern-repetition, performance-pitfalls, test-integrity, dependency-hygiene, data-api-safety. See [methodology](03-methodology.md#pillar-2--the-eight-check-agentic-review-layer).

### Epic / feature / task

The three levels of the spec hierarchy. Epic = multi-feature, multi-week. Feature = single user-visible outcome, fits a sprint. Task = one engineer, one or two days.

### Extractor

A pure-function reader in `apps/pulse-dashboard/src/lib/generators/` that produces auto-extracted Markdown from project source. Three in v1: Prisma → `/db`, OpenAPI → `/api`, Tailwind `@theme` blocks → `/design`.

### Final test gate

`/pulse-ship`'s rule: run `.pulse/config.yaml.ship.test_command` every invocation; refuse to write any deploy artifact if it returns non-zero. No skip flag, no exceptions.

### Five delivery agents

`/pulse-spec`, `/pulse-arch`, `/pulse-code`, `/pulse-guard`, `/pulse-ship`. The slash commands that drive the SDLC.

### Fixture

`fixtures/sample-repo/` — the demo project the dashboard reads in dev. Has a tiny but realistic epic / feature / 2-tasks hierarchy with an ADR, 3 Guard reviews exercising every verdict, and an override log.

### Frontmatter

The YAML block at the top of every Pulse artifact. See [state-convention reference: frontmatter contract](reference/state-convention.md#frontmatter--the-contract-every-artifact-must-follow).

### Greenfield

`/pulse-ship`'s behavior when the target repo has no existing CI. Writes deploy artifacts from the templates in `plugins/twistag-pulse/templates/deploy/`. Opposite of diff-mode.

### Guard

`/pulse-guard`. The 8-check agentic review layer. Orchestrator + 8 sub-agents.

### House style

The collection of project-specific conventions enforced by the convention-drift Guard sub-agent. Stated as natural-language rules in `.pulse/config.yaml.guard.convention_drift.rules`.

### `kind:`

The lighter frontmatter field used on companion artifacts (`db.md` / `api.md` / `design.md`) instead of `type:`. Values: `db`, `api`, `design`. The dashboard uses this to render companions on the right parent page.

### Linked ADR

An ADR id appearing in a task's `frontmatter.links.adr` array. The dashboard renders linked ADRs as a prominent section on the task's detail page and a back-link on the ADR's detail page.

### Manual narrative

The hand-authored half of `/db`, `/api`, `/design`. Lives at `docs/pulse/<slug>.md` (one of `db.md`, `api.md`, `design.md`). Rendered above the auto-extracted half on the page.

### Override

A deliberate, attributed, audit-logged decision to accept a Guard `fail`. Filed with `/pulse-guard --override "<reason>"`. For high-stakes checks (security-regression, data-api-safety), the reason must contain `by <name>` and the matched name lands in `second_engineer:` in the audit entry.

### Override-log entry

A YAML object describing one override. Stored as a fenced ```yaml block inside `.pulse/overrides.log.md`. Fields: `sha`, `base`, `engineer`, `check`, `reason`, `second_engineer` (optional), `created`.

### Pillar

One of the three components of the Pulse methodology: (1) five delivery agents, (2) eight-check Guard, (3) Pulse Dashboard.

### Plugin

The Claude Code plugin at `plugins/twistag-pulse/`. Contains the skills, commands, sub-agents, hooks, templates, and scripts.

### Pre-push hook

`plugins/twistag-pulse/hooks/pre-push.mjs`. A deterministic Node script that runs before every `git push`. Reads `.pulse/reviews/<HEAD-sha>.md`, allows the push on `pass` / `warning` / `overridden`, blocks on `fail` or missing review.

### Pulse Dashboard

The self-hosted Next.js viewer at `apps/pulse-dashboard/`. Read-only; renders specs, ADRs, reviews, override audit, project-wide artifacts, and search.

### `PULSE_REPO_ROOT`

The env var that tells the Pulse Dashboard which directory to read from. Defaults to `fixtures/sample-repo` in dev; set to a real client repo path to render that project's artifacts.

### `PULSE_SKIP_GUARD`

The emergency-exit env var for the pre-push hook. `PULSE_SKIP_GUARD=1 git push` skips the review check. Use sparingly.

### Review file

A per-sha Markdown file at `.pulse/reviews/<full-sha>.md` written by `/pulse-guard`. Frontmatter contains the 8 verdict slots and the `overall:` aggregate. Immutable — `/pulse-guard` refuses to overwrite.

### `require_second_engineer`

The list of Guard checks in `.pulse/config.yaml.overrides.require_second_engineer` whose overrides must include a co-signer in the reason text. Default: security-regression, data-api-safety.

### Severity

Each Guard sub-agent's per-finding severity: `info`, `warning`, `error`. Severities aggregate to a verdict via the per-check `severity_on_fail` setting.

### Skill

A Markdown file with YAML frontmatter under `plugins/twistag-pulse/skills/<name>/SKILL.md`. Claude Code reads these at startup; the `description:` tells it when to invoke each one. Pulse has 7 skills.

### Slash command

A Markdown file under `plugins/twistag-pulse/commands/<name>.md`. Defines a `/<name>` slash command in Claude Code, with a `description:` and `argument-hint:`. Pulse has 5: pulse-spec, pulse-arch, pulse-code, pulse-guard, pulse-ship.

### Slug

A stable kebab-case identifier in an artifact's frontmatter `id:` field. Used in URLs and in `links:` references. Renaming a slug breaks references; pick wisely.

### Smoke test

`pnpm plugin:smoke` (or directly `node plugins/twistag-pulse/scripts/smoke.mjs`). The plugin's own structural test. Verifies the manifest, skills, commands, templates, sub-agents, hook, and orchestrator cross-references. 10 checks; should always be 10/10.

### Sub-agent

See [agent](#agent--sub-agent).

### Superseding

The relationship between two ADRs where one replaces the other. `links.supersedes` on the new ADR; `links.superseded-by` and `status: superseded` on the old one. Old ADRs are never deleted.

### Test gate

See [final test gate](#final-test-gate).

### Vertical slice

A unit of build work covering plugin + dashboard + fixture changes for one phase. The v1 plan was built in 7 vertical slices (`cec8cf3` → `ee23d77`).

### Verdict

The status of a single Guard check on a review. Four values: `pass`, `warning`, `fail`, `overridden`.

### Verdict pill

The colored badge the dashboard renders for a verdict. Green for pass, amber for warning, red for fail, blue for overridden.

---

**Related:** [Plugin reference](reference/plugin.md) · [State convention reference](reference/state-convention.md) · [Dashboard reference](reference/dashboard.md)
