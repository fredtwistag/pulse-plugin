# Quickstart

**Goal:** get the Pulse Dashboard running on your machine, reading the bundled fixture, in under 5 minutes. By the end you'll have seen every dashboard surface and you'll know your environment is set up correctly.

This is *not* the hands-on tutorial — that's the [guided walkthrough](02-guided-walkthrough.md). This is the smoke test you do first.

---

## Prerequisites

- **Node 20 or newer.** Check with `node --version`.
- **pnpm 11 or newer.** Check with `pnpm --version`. If you don't have it, `corepack enable` then `corepack prepare pnpm@latest --activate`.
- **Git.** Any recent version.

Optional for later:

- **Claude Code** installed locally (you'll need this for the guided walkthrough).
- A Vercel account (only required for the deploy walkthrough).

---

## 1. Clone and install

```bash
git clone https://github.com/fredtwistag/pulse-plugin.git pulse
cd pulse
pnpm install
```

You may see a one-line warning about `sharp` build scripts being ignored. That's expected — Pulse's `package.json` allowlists sharp explicitly via `pnpm.onlyBuiltDependencies`, but pnpm 11 prints the warning anyway. You can safely ignore it; sharp's prebuilt binaries cover dev work.

## 2. Verify the plugin

```bash
pnpm plugin:smoke
```

Expected output:

```
  ok   plugin.json exists and parses
  ok   skills/ contains at least one SKILL.md
  ok   commands/ contains at least one slash command
  ok   templates/ contains state convention scaffolds
  ok   agents/ contains all 8 guard sub-agents
  ok   pulse-guard SKILL.md references every sub-agent
  ok   agents/ contains the slice-5 ship sub-agents
  ok   pulse-ship SKILL.md references both ship sub-agents
  ok   templates/deploy/ contains starter deploy artifacts
  ok   hooks/pre-push.mjs exists and is executable

10/10 passed
```

If anything is `FAIL` here, stop and open an issue — the install is broken, not you.

## 3. Run the dashboard

```bash
pnpm dev
```

The dashboard boots on **http://localhost:3000** and reads from `fixtures/sample-repo/` by default. Open it in a browser.

You should see:

- **Sidebar** — Overview / Project (Database, API, Design system) / Epics (with `audit-log` and its features and tasks) / ADRs (with `ADR-001-audit-storage`) / Guard (Reviews + Audit).
- **Homepage** — a Guard health card showing pass rate, an overrides counter, and a clickable sparkline; an Epics section showing the `audit-log` epic card with its feature/task counts.

## 4. Click through the surfaces

Spend a minute on each:

- **[`/epics/audit-log`](http://localhost:3000/epics/audit-log)** — epic detail with its acceptance criteria, features list, and full narrative.
- **[`/features/add-audit-capture`](http://localhost:3000/features/add-audit-capture)** — feature detail showing its two tasks.
- **[`/tasks/db-schema`](http://localhost:3000/tasks/db-schema)** — task detail with three ticked `[x]` acceptance criteria, a clickable link to its linked ADR, and a Mermaid ER diagram rendering inline (the `db.md` companion).
- **[`/adr/ADR-001-audit-storage`](http://localhost:3000/adr/ADR-001-audit-storage)** — ADR detail with the Decision graph showing the back-link to `/tasks/db-schema`.
- **[`/db`](http://localhost:3000/db)** — Database page showing the hand-authored narrative plus an auto-extracted ER diagram from `fixtures/sample-repo/prisma/schema.prisma`.
- **[`/design`](http://localhost:3000/design)** — Design system page showing the hand-authored design conventions plus auto-extracted design tokens from `fixtures/sample-repo/src/styles/tokens.css`.
- **[`/reviews`](http://localhost:3000/reviews)** — three Guard reviews with verdict pills.
- **[`/reviews/5d4c3b2`](http://localhost:3000/reviews/5d4c3b2)** — a review with all 8 check verdicts shown, including the N+1 finding at the right file:line.
- **[`/audit`](http://localhost:3000/audit)** — the override audit log with a single override on the security-regression check.

Try the search:

- **[`/search?q=audit`](http://localhost:3000/search?q=audit)** — finds the epic, the task, the ADR, the Guard reviews.
- **[`/search?q=N+1`](http://localhost:3000/search?q=N+1)** — finds the one review with the N+1 finding.

## 5. Stop the server

`Ctrl-C` in the terminal.

---

## What you just verified

- The plugin is structurally sound (smoke test).
- The dashboard builds, boots, and renders.
- The fixture data is intact.
- The Prisma extractor, Tailwind extractor, Mermaid renderer, search, link-graph navigation, frontmatter parsing, and override audit are all functional.

**You haven't actually used Pulse yet.** You've only watched it render a pre-prepared fixture. The [guided walkthrough](02-guided-walkthrough.md) is where you do the real thing on a fresh demo project.

---

## Troubleshooting

If something didn't work:

- **`pnpm: command not found`** — Install pnpm via `corepack enable` then `corepack prepare pnpm@latest --activate`.
- **`Cannot find module 'next'`** — `pnpm install` didn't complete. Re-run.
- **Port 3000 already in use** — Stop whatever is on 3000, or run `cd apps/pulse-dashboard && pnpm dev -- -p 3001`.
- **Dashboard loads but no fixture content** — Check that `fixtures/sample-repo/docs/pulse/` exists. If not, your clone is incomplete.
- **Mermaid diagrams show as code blocks, not diagrams** — The Mermaid bundle dynamic-imports client-side; if your network is blocked, this fails silently. Check the browser console.

Stuck? See the full [troubleshooting](troubleshooting.md) page.

---

**Next:** [02 — Guided walkthrough](02-guided-walkthrough.md) — the hands-on tutorial on a fresh demo project.
