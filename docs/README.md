# Pulse — developer wiki

Everything you need to use, customize, or extend Twistag Pulse.

This wiki is organized by **what you came here to do**, not by component. If you know what you want — a quick demo, a tutorial, a reference page, a recipe for a specific task — pick the matching section below. If you're brand new, just go in order.

---

## Learning path (read in order)

Three documents. About two hours end-to-end. After this you can use Pulse on real client work.

1. **[01 — Quickstart](01-quickstart.md)** *(5 minutes)*
   Clone, install, get the dashboard running on the bundled fixture. Confirms your environment is sane before you go deeper.

2. **[02 — Guided walkthrough](02-guided-walkthrough.md)** *(~90 minutes)*
   The marquee tutorial. You scaffold a fresh Next.js demo, install Pulse on it, and drive a small feature through every Pulse skill — `/pulse-spec` → `/pulse-arch` → `/pulse-code` → `/pulse-guard` → `/pulse-ship`. The page is structured as markdown checkboxes you tick off as you go. By the end you have a working Pulse-instrumented demo project and you have *used* every part of the system.

3. **[03 — The methodology](03-methodology.md)** *(~30 minutes)*
   The *why*. The diagnosis (review broke at AI volume), the three pillars (agents · review layer · dashboard), the three principles that hold them together. Read this once and the rest of the wiki clicks into place.

---

## Reference

When you know what you're looking for and want the canonical answer.

- **[Plugin reference](reference/plugin.md)** — every skill, every slash command (with flags), every Guard sub-agent (target failure modes + severity tables), every Ship sub-agent, the pre-push hook, the install-hooks script.
- **[State convention reference](reference/state-convention.md)** — `docs/pulse/` + `.pulse/` directory layout, the frontmatter contract for every artifact type, the full `.pulse/config.yaml` field reference, the review file format, the override-log entry format.
- **[Dashboard reference](reference/dashboard.md)** — every route + what it shows, the three auto-extractors (Prisma · OpenAPI · Tailwind), search, configuration (`PULSE_REPO_ROOT`), self-hosting.

---

## Workflows

Deep-dive explanations of the SDLC steps. Read these when you want to understand a phase in depth, not just run a command.

- **[The SDLC loop](workflows/sdlc-loop.md)** — narrative walkthrough of spec → arch → code → guard → ship with annotated examples drawn from the fixture.
- **[Overriding Guard](workflows/overriding-guard.md)** — when to override a failed check, how the audit works, what the `require_second_engineer` policy enforces, how to feed override patterns back into Guard calibration.
- **[Deploying with Ship](workflows/deploying.md)** — the test gate, what files get generated, the rollback procedure, and how diff-mode integrates Pulse into a repo that already has CI.

---

## Recipes

Task-shaped guides. Each one starts with "you want to do X" and walks you through it.

- **[Setting up Pulse on an existing repo](recipes/setup-on-existing-repo.md)** — for repos that already have code in them.
- **[Adopting Pulse on a repo with existing CI](recipes/existing-ci-diff-mode.md)** — how Ship's diff-mode preserves your existing pipeline.
- **[Customizing conventions and Guard rules](recipes/customizing-conventions.md)** — banned patterns, convention rules, override policy, per-project Guard tuning.

---

## When something goes wrong

- **[Troubleshooting](troubleshooting.md)** — the common gotchas, in one place.
- **[Glossary](glossary.md)** — every Pulse term defined once.

---

## How the wiki is organized

This wiki follows the [Diátaxis](https://diataxis.fr/) four-quadrant model:

| Quadrant | Purpose | Where |
|---|---|---|
| **Tutorial** | Learning by doing | `01-quickstart.md`, `02-guided-walkthrough.md` |
| **How-to** | Solving a specific problem | `recipes/` |
| **Reference** | Looking up canonical facts | `reference/` |
| **Explanation** | Understanding the system | `03-methodology.md`, `workflows/` |

Each piece has one job. Tutorials don't explain; explanations don't tutor; references don't story-tell. If you find a doc trying to do two things, that's a bug — open an issue.

---

## Project artifacts (not reading material)

This repo also contains its own Pulse-format artifacts, eating its own dog food:

- **[`docs/pulse/specs/2026-05-12-twistag-pulse-design.md`](pulse/specs/2026-05-12-twistag-pulse-design.md)** — the v1 design and 14-week build plan that was executed across the 7 slice commits.

That's project-internal content (specs for the build itself); it's not part of the wiki.

---

← **[Back to the top-level README](../README.md)**
