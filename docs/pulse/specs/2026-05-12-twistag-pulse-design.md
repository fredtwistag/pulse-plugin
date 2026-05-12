# Twistag Pulse — Design & Implementation Plan

## Context

Twistag ships ~90% AI-generated, spec-driven code. The remaining 10% is where senior engineers spend their judgment. At that volume, the existing review process — five disconnected tools (Snyk, Sonar, Codacy, LinearB, etc.), human reviewers reading plausible-looking diffs at 5pm — breaks. The slow incident is coming; Pulse is the system that catches it first.

**Pulse v1** is Twistag's AI-native delivery methodology, codified as:

1. A **Claude Code plugin** (`twistag-pulse`) — five delivery agents as slash commands, an 8-check pre-push Guard hook, all built on a fork of the `superpowers` skill pack.
2. A **repo-level state convention** (`docs/pulse/` + `.pulse/`) — markdown + YAML frontmatter + Mermaid, organized as `epics → features → tasks` with attached artifacts.
3. A **self-hosted Next.js dashboard** (`pulse-dashboard`) — a read-only "super code wiki" rendering every project artifact (specs, ADRs, DB models, API design, design system, audit log) for engineers and clients. Same codebase scales to multi-tenant SaaS later.

The intended outcome: smaller Twistag squads ship more, with consistency that doesn't depend on individual heroics, and a complete audit trail of every override a tired reviewer ever waves through. Ships to the Claude Code marketplace publicly; freemium SaaS dashboard is a v2 roadmap item.

## Non-goals (v1)

- External integrations (GitHub PR metrics, Sonar, Snyk, OTel, Stripe) — handled by the existing separate `pulse-agent` repo.
- Hosted SaaS / multi-tenant auth.
- Dashboard categories that require external data: Cost & ROI, People, Adoption, Ops.
- CI-side PR gating. v1 is **pre-push hook only**; CI parity is v2.

---

## Architecture

### Component 1 — `twistag-pulse` plugin (public marketplace)

**Skills** (forked from `superpowers`, rebranded):

| Pulse skill | Forked from | Purpose |
|---|---|---|
| `pulse-spec` | `brainstorming` | Discovery → spec; produces full artifact tree under `epics/features/tasks` |
| `pulse-arch` | `writing-plans` | Codebase-aware ADRs; proposes 2–3 paths, picks one with trade-offs |
| `pulse-code` | `executing-plans` + `test-driven-development` | TDD implementation; convention enforcement |
| `pulse-guard` | (new) | Orchestrates 8 review sub-agents; emits structured verdicts |
| `pulse-ship` | (new) | Generates CI/CD workflow + rollback; final test-suite gate |
| `pulse-debug` | `systematic-debugging` | Carried over largely as-is |
| `pulse-verify` | `verification-before-completion` | Carried over largely as-is |

**Slash commands:** `/pulse-spec`, `/pulse-arch`, `/pulse-code`, `/pulse-guard`, `/pulse-ship`. Each invokes its skill and writes artifacts to the standardized tree.

**Hooks:** `pre-push` runs `pulse-guard` headlessly. Configurable via repo `.pulse/config.yaml`. Failures block the push; overrides must include a reason and append to `.pulse/overrides.log.md`.

**Sub-agents:**
- Under Guard: 8 check sub-agents, each tuned to one failure mode, dispatched in parallel where independent.
- Under Ship: deploy-target adapters (Vercel + GitHub Actions in v1).

### Component 2 — repo state convention

```
docs/pulse/
  epics/<slug>/
    spec.md                      # epic-level spec + acceptance
    arch.md                      # epic-level architecture decisions
    features/<slug>/
      spec.md
      tasks/<slug>/
        spec.md
        db.md                    # Mermaid ER + narrative
        api.md                   # endpoints + contracts
        design.md                # UI notes + tokens
  _generated/                    # auto-extracted by dashboard build
    schema.md                    # from Prisma/Drizzle/SQL
    endpoints.md                 # from OpenAPI / route defs
    tokens.md                    # from Tailwind config
  adr/
    ADR-NNN-<slug>.md            # cross-cutting decisions

.pulse/
  config.yaml                    # per-project conventions, banned patterns,
                                 #   deploy target, override policy, check tuning
  overrides.log.md               # append-only audit
  reviews/<sha>.md               # Guard verdicts per PR / push
```

**Frontmatter contract** (every artifact MD):

```yaml
---
id: <stable-slug>
type: epic | feature | task | adr | review | override
status: draft | active | shipped | archived
owners: [<engineer>, ...]
created: YYYY-MM-DD
updated: YYYY-MM-DD
acceptance:                       # required for spec.md
  - <criterion>
links:                            # cross-references
  parent: <id>
  related: [<id>, ...]
---
```

Hand-authored narrative + Mermaid diagrams below the frontmatter. Auto-extracted facts merge from `_generated/` at render time in the dashboard.

### Component 3 — `pulse-dashboard` (self-hosted Next.js 15)

Stack: Next.js 15 (App Router) + Tailwind + shadcn/ui. Matches Alice's stack for shared patterns.

**Reading model:**
- Build time: walk `docs/pulse/` + `.pulse/`, parse frontmatter, build a sidebar tree + full-text search index, run auto-extractors for `_generated/`.
- Dev/local: filesystem mode (file watcher → live reload).
- Future hosted: same parser running against a cloned mirror.

**Routes:**
- `/` — project overview (epic cards, recent activity, Guard pass-rate sparkline)
- `/epics`, `/epics/[slug]`, `/features/[slug]`, `/tasks/[slug]` — artifact tree
- `/adr`, `/adr/[id]` — ADR index + detail
- `/db`, `/api`, `/design` — hybrid pages (auto-extracted facts + manual narrative)
- `/audit` — sortable / filterable override log
- `/reviews/[sha]` — per-PR Guard verdict view

**UI principles:**
- GitHub-grade typography (system font stack, generous line-height, monospace for code blocks identical to github.com).
- Stripe/api-docs-style sidebar navigation, auto-built from the artifact tree, collapsible.
- Mermaid rendered client-side via `mermaid` package.
- Read-only — every "edit" link points to the file in the repo / GitHub blob URL.

**Auth (v1):** none. Operators run behind Cloudflare Access / VPN. SaaS auth (orgs/teams/roles, GitHub OAuth) lands in v2.

---

## The 5 delivery agents — detailed behavior

### `/pulse-spec`
- Interviews the user (brainstorming-style, one question at a time).
- Decides whether the work is an epic, feature, or task (asks if ambiguous).
- Writes `spec.md` with acceptance criteria, plus artifact stubs (`db.md`, `api.md`, `design.md`) seeded with whatever it learned during the interview (often Mermaid sketches).
- Cross-references parent epic/feature in frontmatter.

### `/pulse-arch`
- Reads the relevant `spec.md`, the existing codebase, and prior ADRs.
- Proposes 2–3 implementation paths.
- Writes an ADR with chosen option, trade-offs, and consequences.
- Updates the parent task's `spec.md` frontmatter with the ADR id.

### `/pulse-code`
- Reads `spec.md` + relevant ADRs + `.pulse/config.yaml` conventions.
- Drives a TDD loop: write failing test → minimal implementation → refactor.
- Updates `spec.md` status (`draft` → `active`) and acceptance check-marks as criteria pass.

### `/pulse-guard`
- Two invocation modes:
  - Manual (`/pulse-guard` in the editor): runs on the current diff, prints verdicts inline.
  - Hook (`pre-push`): runs headlessly, writes `.pulse/reviews/<sha>.md`, exits non-zero on `fail`.
- Dispatches 8 check sub-agents in parallel (read-only against the diff and acceptance criteria).
- Aggregates verdicts; engineer can override a `fail` by re-running with `--override "<reason>"`, which appends to `.pulse/overrides.log.md`.

### `/pulse-ship`
- Reads `.pulse/config.yaml` to learn the deploy target (Vercel + GH Actions in v1).
- Generates `.github/workflows/deploy.yml`, Vercel project config, and a rollback script.
- Runs the full test suite as a final gate; refuses to emit deploy artifacts on red.
- For existing pipelines: diff-mode that proposes minimal additions rather than rewriting.

---

## The 8 Guard checks

Each is a focused sub-agent with a tight prompt, read-only repo access, and a structured output contract:

```yaml
check: spec-conformance | security-regression | convention-drift |
       anti-pattern-repetition | performance-pitfalls | test-integrity |
       dependency-hygiene | data-api-safety
status: pass | warning | fail
findings:
  - file: <path>
    lines: <start>-<end>
    severity: info | warning | error
    message: <what>
    suggestion: <how to fix>
```

1. **Spec conformance** — diff vs the linked task's `acceptance` list. AI tends to over-deliver; this keeps scope honest.
2. **Security regression** — banned patterns from `.pulse/config.yaml` (e.g., specific auth/authz patterns the team killed), secrets in code, known vulnerable usages.
3. **Convention drift** — house style: naming, error handling, logging, file structure, module boundaries. Rules live in `.pulse/config.yaml`.
4. **Anti-pattern repetition** — same poor pattern echoed in N files in one PR. Threshold configurable.
5. **Performance pitfalls** — N+1 queries, hot-loop allocations, missing indexes, unbounded recursion, accidental quadratic work.
6. **Test integrity** — tautological assertions, tests that verify the implementation rather than the contract, missing edge cases from the acceptance list.
7. **Dependency & supply-chain hygiene** — new packages introduced, version pinning, license risk, transitive CVEs, unused additions.
8. **Data & API safety** — breaking API contract changes, unsafe migrations, PII handling, schema compatibility.

**Override policy** (configurable per project): any `fail` can be overridden with a reason; `security-regression` and `data-api-safety` may require approval from a second engineer (configured via `.pulse/config.yaml`).

---

## Critical files to be created

### Plugin
- `plugins/twistag-pulse/plugin.json` — manifest
- `plugins/twistag-pulse/skills/pulse-spec.md` (and per-agent skill files)
- `plugins/twistag-pulse/commands/pulse-*.md` — slash command definitions
- `plugins/twistag-pulse/hooks/pre-push.sh` — invokes guard headlessly
- `plugins/twistag-pulse/subagents/guard-{spec-conformance,security-regression,convention-drift,anti-pattern,performance,test-integrity,dependency,data-api}.md`
- `plugins/twistag-pulse/subagents/ship-{vercel,github-actions}.md`
- `plugins/twistag-pulse/templates/{epic,feature,task,adr,review,config}.md` — frontmatter scaffolds

### Dashboard
- `apps/pulse-dashboard/` — Next.js app
- `apps/pulse-dashboard/src/lib/parser/` — frontmatter + Mermaid + tree builder
- `apps/pulse-dashboard/src/lib/generators/{prisma,openapi,tailwind}.ts` — auto-extractors
- `apps/pulse-dashboard/src/app/(routes)/{epics,features,tasks,adr,db,api,design,audit,reviews}/...`
- `apps/pulse-dashboard/src/components/{Sidebar,ArtifactTree,MermaidDiagram,VerdictCard,OverrideRow}.tsx`

### Repo convention (shipped as templates)
- `docs/pulse/.gitkeep`, `docs/pulse/_generated/.gitkeep`
- `.pulse/config.yaml` (template)
- `.pulse/overrides.log.md` (empty append-only)

---

## Existing utilities to reuse

- **`superpowers` skills** as starting points (fork & rebrand): `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `using-git-worktrees`.
- **Alice's UI patterns** (`/Users/fred/Documents/GitHub/alice/src/app/organization/[organizationId]/`) — settings/billing/members layouts inform the dashboard's nav patterns.
- **Mermaid** (`mermaid` npm) for diagrams; **shadcn/ui** for components; **next-mdx-remote** or `@next/mdx` for MD rendering with frontmatter.
- **gray-matter** for frontmatter parsing; **remark** + **rehype** for the MD pipeline.

---

## Vertical-slice build plan (~14 weeks)

| Slice | Duration | Deliverable |
|---|---|---|
| **0. Foundation** | ~1 wk | Plugin skeleton (manifest + smoke-test command); `docs/pulse/` + `.pulse/` conventions + templates; dashboard Next.js shell + parser stub; marketplace publish pipeline; dev DX (`pnpm dev` runs plugin + dashboard against a fixture repo). |
| **1. Spec + render** | ~2 wks | `/pulse-spec` writes full artifact trees (epic/feature/task with stubs). Dashboard renders `/`, `/epics`, `/epics/[slug]`, `/features/[slug]`, `/tasks/[slug]` with the auto-built sidebar and frontmatter-driven metadata. Mermaid renders. |
| **2. Guard MVP + audit** | ~3 wks | `/pulse-guard` with checks **1, 2, 3** (spec conformance, security regression, convention drift). Pre-push hook wired. `.pulse/overrides.log.md` append + reason required. Dashboard `/audit` view (sortable, filterable). `/reviews/[sha]` view. |
| **3. Arch + Code** | ~2 wks | `/pulse-arch` writes ADRs (linked to specs in frontmatter). `/pulse-code` runs TDD loop against a task's acceptance criteria, updates spec status. Dashboard `/adr` index + detail. |
| **4. Guard expansion** | ~2 wks | Checks **4–8** (anti-pattern repetition, performance pitfalls, test integrity, dependency hygiene, data/API safety). Tune each on real Twistag client diffs. |
| **5. Ship** | ~2 wks | `/pulse-ship` generates GitHub Actions + Vercel config + rollback. Full test-suite gate. Diff-mode for repos that already have CI. |
| **6. Artifact polish** | ~2 wks | Dashboard `/db`, `/api`, `/design` — auto-extractors (Prisma/Drizzle, OpenAPI, Tailwind) producing `_generated/` + merging with hand-written narrative. Full-text search index. |

Each slice ends with a runnable, demoable end-to-end product. Slip a slice rather than cut quality.

---

## Verification

End-to-end smoke test on a real Twistag client repo (e.g., Alice):

1. Install the plugin from the local marketplace dev channel.
2. `git init` a fixture branch on Alice; run `/pulse-spec "Add per-organization audit log to the members page"`.
3. Confirm `docs/pulse/epics/.../tasks/audit-log/spec.md` exists with acceptance criteria and a Mermaid DB sketch in `db.md`.
4. Run `/pulse-arch` — confirm an ADR appears with 2–3 trade-offs and a chosen path.
5. Run `/pulse-code` — confirm tests are written before implementation; suite goes green.
6. Edit one line to violate a known convention. Run `git push` — pre-push hook invokes Guard, the convention-drift sub-agent flags it, push is blocked.
7. Re-run with `--override "approved by reviewer X for migration window"` — push succeeds, `.pulse/overrides.log.md` gets the entry, override appears in dashboard `/audit` within the next reload with engineer + sha + reason + timestamp.
8. Run `/pulse-ship` — `.github/workflows/deploy.yml`, Vercel config, and `scripts/rollback.sh` are generated; rerun with a deliberately-failing test, confirm Ship refuses.
9. Open the dashboard locally — every artifact created in steps 2–8 is navigable, Mermaid renders, sidebar reflects the tree, `/audit` shows the override.

Dashboard typography QA: open the same spec page in GitHub's blob view and in Pulse Dashboard side-by-side. Body text, code blocks, and headings should be visually indistinguishable at the type level.

---

## Risks & open questions for the implementation phase

- **Tuning Guard sub-agents** to a low false-positive rate is the hardest part; budget time in slice 4 for tuning on real Twistag PRs rather than synthetic cases.
- **Auto-extractors** for `_generated/` need fallbacks for repos that don't use Prisma/Drizzle/OpenAPI/Tailwind. Default behavior: skip silently, render the manual narrative only.
- **Marketplace listing** copy + screenshots for public launch — plan a marketing pass before slice 6 wraps.
- **Per-project config drift** — `.pulse/config.yaml` will accumulate per-client rules over time. A `config-lint` sub-command at some point will be useful.
