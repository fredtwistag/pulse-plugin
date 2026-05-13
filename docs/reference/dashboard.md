# Dashboard reference

The Pulse Dashboard is a read-only Next.js viewer over `docs/pulse/` and `.pulse/`. Self-hosted in v1; same code path scales to multi-tenant SaaS in v2.

This page is the canonical reference. For a tour, see the [quickstart](../01-quickstart.md). For deeper context, see [the methodology page](../03-methodology.md#pillar-3--the-pulse-dashboard).

---

## Stack

- **Next.js 15** with the App Router (every route is a Server Component unless explicitly client).
- **React 19**.
- **Tailwind v4** — CSS-first config; tokens live in `apps/pulse-dashboard/src/app/globals.css` under `@theme { }` blocks (light + dark).
- **TypeScript strict**, ESM only.
- **Three dependencies of note:**
  - `gray-matter` — frontmatter parser.
  - `react-markdown` + `remark-gfm` — GFM markdown rendering.
  - `mermaid` — client-side diagram rendering, dynamic-imported to keep the bundle small.

First Load JS settles around **110 kB**.

---

## Configuration

The dashboard reads from a single environment variable.

| Env | Default | Purpose |
|---|---|---|
| `PULSE_REPO_ROOT` | `../../fixtures/sample-repo` (resolved from `apps/pulse-dashboard/`) | Path to the project the dashboard should render |

Pointing at a real repo:

```bash
PULSE_REPO_ROOT=/path/to/your/repo pnpm dev
# or for prod
PULSE_REPO_ROOT=/path/to/your/repo pnpm --filter pulse-dashboard build
PULSE_REPO_ROOT=/path/to/your/repo pnpm --filter pulse-dashboard start
```

Internally the env var resolves to four paths the dashboard reads (see [`apps/pulse-dashboard/src/lib/config.ts`](../../apps/pulse-dashboard/src/lib/config.ts)):

| Constant | Path |
|---|---|
| `REPO_ROOT` | `PULSE_REPO_ROOT` |
| `ARTIFACTS_ROOT` | `<repo>/docs/pulse` |
| `PULSE_DIR` | `<repo>/.pulse` |
| `REVIEWS_DIR` | `<repo>/.pulse/reviews` |
| `OVERRIDES_LOG` | `<repo>/.pulse/overrides.log.md` |

---

## Routes

17 routes total. All Server Components; React `cache()` wraps the per-request load so multiple components share one parse pass.

### Overview

| Route | Mode | Renders |
|---|---|---|
| `/` | SSG | Counts (epics/features/tasks/adrs/companions), Guard health (pass rate + sparkline + override total), recent-epic cards |

### Artifacts — epics / features / tasks

| Route | Mode | Renders |
|---|---|---|
| `/epics` | SSG | All epics, newest-first, with feature/task counts |
| `/epics/[slug]` | SSG | One epic — frontmatter card, features list, full body, any epic-level companion files |
| `/features/[slug]` | SSG | One feature — frontmatter card, tasks list, full body, any feature-level companions |
| `/tasks/[slug]` | SSG | One task — frontmatter card, linked ADRs, full body, every task-level companion (`db.md` / `api.md` / `design.md`) inline |

Frontmatter `links.parent` / `links.adr` / `links.related` slugs render as clickable links via the [`resolve-link`](../../apps/pulse-dashboard/src/lib/resolve-link.ts) helper.

### ADRs

| Route | Mode | Renders |
|---|---|---|
| `/adr` | SSG | All ADRs, newest-first |
| `/adr/[id]` | SSG | One ADR — frontmatter card, Decision graph (Decides / Supersedes / Superseded-by), full body |

### Guard

| Route | Mode | Renders |
|---|---|---|
| `/reviews` | SSG | Every Guard review, newest-first, with verdict pills per check |
| `/reviews/[sha]` | SSG | One review — full verdict table, override block (if any), full body |
| `/audit` | Dynamic | The override log, sortable + filterable by check and engineer via URL search params |

The dynamic `/audit` route uses search params (`?check=...&engineer=...`) — bookmarkable filters.

### Project-wide artifacts

| Route | Mode | Renders |
|---|---|---|
| `/db` | SSG | `docs/pulse/db.md` narrative + auto-extracted Prisma schema |
| `/api` | SSG | `docs/pulse/api.md` narrative + auto-extracted OpenAPI |
| `/design` | SSG | `docs/pulse/design.md` narrative + auto-extracted Tailwind tokens |

### Search

| Route | Mode | Renders |
|---|---|---|
| `/search?q=...` | Dynamic | Term-AND search across every artifact, companion, ADR, review, and generated section |

---

## Auto-extractors

Each extractor reads project source and produces Markdown that the dashboard renders. All three are pure functions — no caching beyond React's per-request `cache()`. Source code: [`apps/pulse-dashboard/src/lib/generators/`](../../apps/pulse-dashboard/src/lib/generators/).

### Prisma → `/db`

**Source lookup order:** `prisma/schema.prisma` → `schema.prisma` → `db/schema.prisma`.

**Parses:** every `model { ... }` block. Per-field attributes captured as strings.

**Renders:**
- A Mermaid ER diagram when 2+ models cross-reference (heuristic: a field's type matches another model's name).
- One section per model with a field table.

**Out of scope (v1):** `generator` blocks, `datasource` blocks, `enum` blocks, multi-file schemas. Silently skipped — the dashboard still renders what it could parse.

### OpenAPI → `/api`

**Source lookup order:** `openapi.yaml` → `openapi.yml` → `openapi.json` → `docs/openapi.yaml` → `api/openapi.yaml` → `spec/openapi.yaml`.

**Parses:** the `paths:` object; every method/path pair becomes an endpoint.

**Renders:** endpoints grouped by first tag; method/path/summary table.

### Tailwind → `/design`

**Source:** scans the repo (up to 3 directories deep, up to 50 CSS files) for any `.css` file containing an `@theme { }` block.

**Parses:** every `--<token-name>: <value>;` line inside `@theme` blocks.

**Renders:** tokens grouped by prefix (color-*, font-*, radius-*, etc.); table per group.

---

## Manual narrative merge

For each of `/db`, `/api`, `/design`, the dashboard reads an optional hand-authored narrative at `docs/pulse/<slug>.md` (e.g. `docs/pulse/db.md`). The narrative half is rendered above the auto-extracted half on the page.

If both are missing, an empty-state UI tells the engineer exactly which file to add or which source to drop in to populate the page.

---

## Search

**Index:** built per-request from every artifact body, companion body, ADR body, review body, and generated section body. Title hits weighted 10×, body hits 1×. Term-AND match — all terms must appear.

**Excerpt:** ±80 chars around the first match.

**Cap:** 50 hits.

**No client lib.** v1 uses server-side substring search; small enough that this is instant. A future iteration may add a build-time prebuilt index for larger projects.

Implementation: [`apps/pulse-dashboard/src/lib/search.ts`](../../apps/pulse-dashboard/src/lib/search.ts).

---

## UI primitives

Components live under [`apps/pulse-dashboard/src/components/`](../../apps/pulse-dashboard/src/components/). The notable ones:

| Component | Purpose |
|---|---|
| `Sidebar` | Server component; auto-builds the nav tree from the parsed view |
| `SidebarLink` | Client component for active-route highlighting |
| `SidebarSearch` | Client component — the sidebar input that POSTs to `/search` |
| `Markdown` | `react-markdown` wrapper with Mermaid integration for ` ``` mermaid ` blocks |
| `Mermaid` | Client component, dynamic-imports `mermaid`, renders SVG; light/dark aware |
| `FrontmatterCard` | Renders structured frontmatter fields (status, owners, links, acceptance) |
| `AcceptanceList` | Honors `[x] ` markers as checked boxes |
| `StatusBadge` | Pill for `draft` / `active` / `shipped` / etc. |
| `VerdictPill` | Pill for `pass` / `warning` / `fail` / `overridden` |
| `CompanionBlock` | Renders a task's `db.md` / `api.md` / `design.md` inline |
| `PageShell` + `PageHeader` | Shared page chrome |

---

## Typography

The `.prose-pulse` class in [`globals.css`](../../apps/pulse-dashboard/src/app/globals.css) implements GitHub-grade body type: system font stack, generous line-height, header anchors via the file's body parser. Code blocks use the same monospace stack as github.com.

Goal: open a spec page in the Pulse Dashboard next to the same file on github.com — body text, code blocks, and headings should be visually indistinguishable at the type level.

---

## Self-hosting

For Twistag's internal use, the dashboard is run behind Cloudflare Access or a VPN — no auth in v1.

Two common patterns:

### Pattern A: dev-time only

Each engineer runs `pnpm dev` against their working client repo:

```bash
PULSE_REPO_ROOT=/path/to/client-repo pnpm dev
```

Cheap, always fresh, no infra. The right call when only engineers need to see it.

### Pattern B: shared instance

Build once, deploy as a small Next.js container or Vercel project. Set `PULSE_REPO_ROOT` to a path that's kept in sync via cron `git pull` or a webhook. Read-only is the whole product — engineers and clients can both consume.

```bash
PULSE_REPO_ROOT=/var/pulse-mirror/client-x pnpm --filter pulse-dashboard build
PULSE_REPO_ROOT=/var/pulse-mirror/client-x pnpm --filter pulse-dashboard start
```

### Future: hosted SaaS

The dashboard codebase is structured so the same parser runs against any directory — a cloned mirror, a checked-out git working tree, or (in v2) an indexed write through a SaaS sync. No code changes needed; only the deployment topology.

---

## What's deliberately out of scope (v1)

- **Auth / SSO / multi-tenancy.** v2.
- **Live updates.** The dashboard re-renders on full page reload. No WebSocket, no SSE.
- **External integrations.** GitHub PR metrics, Sonar, Snyk, OTel, Stripe — none read by the dashboard. v2.
- **Editing.** Every change is a git commit. The dashboard never writes.
- **Per-user state.** Filters and search are URL-driven; no cookies, no local storage.

---

**Related:** [Plugin reference](plugin.md) · [State convention reference](state-convention.md) · [Deploying with Ship](../workflows/deploying.md)
