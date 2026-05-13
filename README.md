# Twistag Pulse

> Twistag's AI-native delivery methodology. Smaller teams. More impact. Less process.

When ~90% of the code you ship was written by an AI, the review process built for human-authored code doesn't keep up. Plausible-looking code passes the tests, looks fine, and quietly reintroduces the auth pattern your team killed six months ago. Pulse is the operating layer Twistag uses to deliver client work at AI volume — five delivery agents that move work from brief to production, an eight-check agentic review layer that gates every push, and a unified dashboard that turns the project's specs, ADRs, schemas, APIs, and audit log into one screen.

---

## 90-second tour

Three pillars, one repo:

| Pillar | What it is | Where it lives |
|---|---|---|
| **Five delivery agents** | Slash commands that drive the SDLC: `/pulse-spec`, `/pulse-arch`, `/pulse-code`, `/pulse-guard`, `/pulse-ship` | [`plugins/twistag-pulse/`](plugins/twistag-pulse/) |
| **Eight-check Guard** | An agentic review layer with 8 focused sub-agents; runs pre-push; every override is logged, attributed, and visible | [`plugins/twistag-pulse/agents/`](plugins/twistag-pulse/agents/) |
| **Pulse Dashboard** | Read-only Next.js viewer over the project's artifacts; GitHub-grade typography, api-docs-style nav | [`apps/pulse-dashboard/`](apps/pulse-dashboard/) |

State convention — what Pulse writes into any host project:

```
docs/pulse/                  # the project's spec graph
  epics/<slug>/spec.md
    features/<slug>/spec.md
      tasks/<slug>/spec.md   # + db.md, api.md, design.md companions
  adr/ADR-NNN-<slug>.md
.pulse/                      # the project's Pulse config + audit
  config.yaml
  reviews/<sha>.md
  overrides.log.md           # append-only
```

---

## Start here

If you're new to Pulse, read these in order:

1. **[5-minute quickstart](docs/01-quickstart.md)** — get the dashboard running on the bundled fixture.
2. **[Guided walkthrough](docs/02-guided-walkthrough.md)** — 90-minute hands-on tutorial. You scaffold a fresh Next.js demo and drive a small feature through every Pulse skill, ticking checklist items as you go.
3. **[The methodology](docs/03-methodology.md)** — the *why* behind the three pillars and the three principles that hold them together.

Looking for something specific? Jump straight to **[the full wiki index](docs/README.md)**.

---

## Quick start

```bash
git clone https://github.com/fredtwistag/pulse-plugin.git pulse
cd pulse
pnpm install
pnpm dev               # dashboard on http://localhost:3000, reading fixtures/sample-repo
pnpm plugin:smoke      # 10/10 sanity check on the plugin
```

To use the plugin in Claude Code on a real project:

```bash
# from the pulse repo root
ln -s "$PWD/plugins/twistag-pulse" "$HOME/.claude/plugins/twistag-pulse"
# verify
claude -c "/pulse-spec --help"
```

Full install — including the pre-push Guard hook on your client repo — lives in the [guided walkthrough](docs/02-guided-walkthrough.md#phase-2--install-pulse-on-the-demo).

---

## Project layout

```
pulse/
├── README.md                 # this file
├── docs/                     # the developer wiki — start at docs/README.md
│   ├── 01-quickstart.md
│   ├── 02-guided-walkthrough.md
│   ├── 03-methodology.md
│   ├── reference/            # reference docs (plugin, state, dashboard)
│   ├── workflows/            # how each SDLC step works in depth
│   ├── recipes/              # task-shaped guides
│   ├── troubleshooting.md
│   ├── glossary.md
│   └── pulse/                # this project's own Pulse artifacts (dogfood)
├── plugins/twistag-pulse/    # the Claude Code plugin
├── apps/pulse-dashboard/     # the self-hosted Next.js dashboard
└── fixtures/sample-repo/     # the demo repo the dashboard reads in dev
```

---

## What's in it

**Plugin** — `plugins/twistag-pulse/`

- 7 skills: `pulse-spec`, `pulse-arch`, `pulse-code`, `pulse-guard`, `pulse-ship`, plus carried-over `debugging` and `verification-before-completion`.
- 5 slash commands, one per delivery agent.
- 8 Guard sub-agents (spec-conformance · security-regression · convention-drift · anti-pattern-repetition · performance-pitfalls · test-integrity · dependency-hygiene · data-api-safety).
- 2 Ship sub-agents (ship-github-actions · ship-vercel).
- Deterministic pre-push hook + an `install-hooks` script.
- Deploy templates (GitHub Actions workflow, `vercel.json`, `rollback.sh`).
- Smoke test (`pnpm plugin:smoke` → 10/10).

**Dashboard** — `apps/pulse-dashboard/`

- 17 routes, Next.js 15 + React 19 + Tailwind v4, strict TypeScript.
- Mermaid rendered client-side, GitHub-grade `.prose-pulse` typography, Stripe-style sidebar nav.
- Read-only — every edit goes through git.
- Auto-extractors: Prisma schema → `/db`, OpenAPI → `/api`, Tailwind `@theme` blocks → `/design`.
- Full-text search across every spec, ADR, review, and generated section.
- First Load JS ~110 kB.

---

## Status

**v1 complete.** The 14-week build plan in [`docs/pulse/specs/2026-05-12-twistag-pulse-design.md`](docs/pulse/specs/2026-05-12-twistag-pulse-design.md) shipped across 7 commits. Tuning the Guard sub-agent calibration against real Twistag PRs is the next phase.

---

## License

MIT
