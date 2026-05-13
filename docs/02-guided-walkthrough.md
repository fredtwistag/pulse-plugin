# Guided walkthrough — your first Pulse project

**Audience:** an engineer who has never used Pulse.
**Time:** about 90 minutes.
**What you'll have at the end:** a small Next.js demo with a fully Pulse-instrumented feature — spec, ADR, code with TDD tests, Guard review, deploy artifacts, and a dashboard rendering all of it. You will have *used* every Pulse skill at least once.

This document is structured as a checklist. The expectation is that you copy it into your editor (or your terminal's pager) and tick `- [ ]` items off as you go. Every command has its expected output shown so you can verify each step. Every gotcha has a callout.

---

## Phase 0 — Prerequisites

Confirm your environment before you start. Five minutes.

- [ ] **Node 20 or newer.** `node --version` should print `v20.x` or higher.
- [ ] **pnpm 11 or newer.** `pnpm --version`.
- [ ] **Git** installed and a `user.email` / `user.name` configured. `git config --global user.email` should print your email.
- [ ] **Claude Code** installed locally and signed in. Open a terminal and run `claude --version`.
- [ ] **The Pulse repo cloned.** If you haven't yet:
  ```bash
  git clone https://github.com/fredtwistag/pulse-plugin.git ~/code/pulse
  cd ~/code/pulse
  pnpm install
  pnpm plugin:smoke    # 10/10
  ```
- [ ] **You've done the [quickstart](01-quickstart.md).** You've seen `pnpm dev` boot the dashboard on the fixture. If not, do that first.
- [ ] **The Pulse plugin is linked into Claude Code.** From `~/code/pulse`:
  ```bash
  ln -s "$PWD/plugins/twistag-pulse" "$HOME/.claude/plugins/twistag-pulse"
  ```
  Verify by opening Claude Code in any directory and confirming `/pulse-spec`, `/pulse-arch`, `/pulse-code`, `/pulse-guard`, `/pulse-ship` show in the slash-command autocomplete.

> **Gotcha:** if `/pulse-*` commands don't appear in autocomplete, restart Claude Code. Plugin loading happens at startup.

---

## Phase 1 — Scaffold a fresh demo

You'll build the rest of this tutorial on a brand-new throwaway Next.js app called `pulse-demo`. About 10 minutes.

- [ ] **Pick a parent directory.** This walkthrough uses `~/code/`. Adjust as you prefer; just keep the path stable.
- [ ] **Scaffold the app.** From outside the Pulse repo:
  ```bash
  cd ~/code
  pnpm dlx create-next-app@latest pulse-demo \
    --typescript --tailwind --app --use-pnpm \
    --eslint --src-dir --import-alias "@/*" \
    --no-turbopack
  cd pulse-demo
  ```
  When prompted to install packages, accept. The flags above produce a deterministic Next 15 + Tailwind v4 + TypeScript baseline with the App Router.

- [ ] **Initial commit.** `create-next-app` already did `git init` and a first commit. Verify with `git log --oneline`. You should see one commit on `main`.

- [ ] **Verify dev server.**
  ```bash
  pnpm dev
  # http://localhost:3000 should serve the Next.js starter page
  ```
  Stop with `Ctrl-C`.

> **Why Next.js?** Pulse's Ship sub-agent targets Vercel + GitHub Actions in v1, and the auto-extractors are tuned for Prisma/OpenAPI/Tailwind. A Next.js app exercises everything. If you want to use a different stack on a real project, the [`setup-on-existing-repo`](recipes/setup-on-existing-repo.md) recipe shows how — but for this walkthrough, stick with Next.

---

## Phase 2 — Install Pulse on the demo

Pulse needs three things in your project: a `.pulse/config.yaml`, the `docs/pulse/` directory (empty for now), and the pre-push hook. About 10 minutes.

- [ ] **Create the `.pulse/` directory** with a starter config copied from the plugin's template:
  ```bash
  mkdir -p .pulse docs/pulse
  cp ~/code/pulse/plugins/twistag-pulse/templates/config.yaml .pulse/config.yaml
  cp ~/code/pulse/plugins/twistag-pulse/templates/overrides.log.md .pulse/overrides.log.md
  ```

- [ ] **Edit `.pulse/config.yaml`** to set realistic-but-minimal values for this demo:
  ```yaml
  version: 1
  base_branch: main

  paths:
    artifacts: docs/pulse
    audit: .pulse/overrides.log.md
    reviews: .pulse/reviews

  ship:
    target: vercel
    vercel:
      project: pulse-demo
      team: ""
    test_command: pnpm test

  guard:
    spec_conformance: { enabled: true, severity_on_fail: error }
    security_regression:
      enabled: true
      severity_on_fail: error
      banned_patterns: []
      secret_scan: true
    convention_drift:
      enabled: true
      severity_on_fail: warning
      rules:
        - "Files under src/app use kebab-case for route segments."
        - "Components use named exports, not default exports."
    anti_pattern_repetition: { enabled: true, threshold: 3, severity_on_fail: warning }
    performance_pitfalls: { enabled: true, severity_on_fail: error }
    test_integrity: { enabled: true, severity_on_fail: error }
    dependency_hygiene:
      enabled: true
      allowlist_licenses: [MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause]
      severity_on_fail: error
    data_api_safety: { enabled: true, severity_on_fail: error }

  overrides:
    require_second_engineer: [security_regression, data_api_safety]
    weekly_threshold_per_engineer: 5
  ```

- [ ] **Install the pre-push hook:**
  ```bash
  node ~/code/pulse/plugins/twistag-pulse/scripts/install-hooks.mjs
  ```
  Expected output:
  ```
  installed pre-push → /Users/you/code/pulse-demo/.git/hooks/pre-push → /Users/you/code/pulse/plugins/twistag-pulse/hooks/pre-push.mjs

    Bypass once with:  PULSE_SKIP_GUARD=1 git push
    Remove with:       rm .git/hooks/pre-push
  ```

- [ ] **Verify the hook installs cleanly.** Add a `pnpm test` script that does nothing (so the test gate has something to call later):
  ```bash
  # Edit package.json — add to "scripts":
  #   "test": "echo 'placeholder — replace when you add real tests'"
  ```

- [ ] **Smoke-test the hook.** Stage a meaningless file and try to push to a fake remote:
  ```bash
  echo "demo" > demo.txt
  git add demo.txt && git commit -m "smoke: hook installed"
  git push origin main 2>&1 | head -3   # there's no remote configured yet
  ```
  You should see the hook fire and refuse — no review file exists yet for this sha:
  ```
  Pulse pre-push blocked.
  No review found for HEAD (xxxxxxx).
  ```
  Good. Reset:
  ```bash
  git reset --hard HEAD~1 && rm demo.txt
  ```

> **Gotcha:** if the hook output says `Pulse pre-push: no .pulse/ directory in this repo. Skipping.`, you forgot to `mkdir .pulse`. Re-run the install steps.

---

## Phase 3 — Write your first spec

The premise: you're going to add per-organization rate limiting to the demo. (It's a fake feature on a starter app — that's fine; we're learning Pulse, not building software.) About 15 minutes.

- [ ] **Open Claude Code in the pulse-demo directory.** From `~/code/pulse-demo`:
  ```bash
  claude
  ```

- [ ] **Run `/pulse-spec`** with a one-line ask:
  ```
  /pulse-spec add per-organization rate limit to the API
  ```

- [ ] **Answer the interview.** Claude will ask you one question at a time. Suggested answers to keep your demo aligned with the rest of this walkthrough:
  - **Size?** *Feature.* (It's bigger than a task — has a config story, a middleware story, a viewer story — but it's not an epic.)
  - **Parent epic?** *Create a new epic called `api-quality`.*
  - **What problem does this solve?** *Free-tier abuse — heavy users currently degrade the experience for everyone in their org. Per-org rate limiting bounds the blast radius.*
  - **Acceptance criteria?** Suggest:
    - Every public API request increments a per-org counter
    - Requests over the configured per-org rate get a 429 with `Retry-After`
    - Limits are configurable per org via an admin endpoint (future task; not in this feature)
  - **Out of scope?** *Per-user rate limits. Tiered limits (free vs paid). UI for showing org admins their current usage.*
  - **Surface area?** *Yes for API* (so the agent generates `api.md`), *no for db* (we're using an in-memory token bucket for v1), *no for UI*.
  - **Open questions?** *Whether the counter is in-memory (process-local) or Redis-backed.*

- [ ] **Confirm the proposed tree.** Claude shows you the artifact tree it intends to create. It should look something like:
  ```
  docs/pulse/epics/api-quality/spec.md
  docs/pulse/epics/api-quality/features/per-org-rate-limit/spec.md
  docs/pulse/epics/api-quality/features/per-org-rate-limit/tasks/middleware/spec.md
  docs/pulse/epics/api-quality/features/per-org-rate-limit/tasks/middleware/api.md
  ```
  Approve.

- [ ] **Verify the files exist and parse.**
  ```bash
  find docs/pulse -type f
  head -20 docs/pulse/epics/api-quality/spec.md
  ```
  Each `spec.md` should start with frontmatter (`id`, `type`, `status: draft`, `acceptance:` list).

- [ ] **Commit the spec.** You'll commit at the end of each phase so the dev workflow stays grokable:
  ```bash
  git add docs/pulse .pulse
  git commit -m "spec: add per-org rate limit feature"
  ```

> **Gotcha:** if `/pulse-spec` writes the tree at the wrong path, the most common cause is running it from the wrong CWD. Always run it from the repo root.

---

## Phase 4 — Architecture decision

`/pulse-arch` reads the spec, inspects the codebase, and proposes 2–3 implementation paths. You pick one. The chosen option becomes an ADR. About 10 minutes.

- [ ] **Run `/pulse-arch`** on the new task:
  ```
  /pulse-arch middleware
  ```

- [ ] **Read the options carefully.** Claude will present 2–3 implementation paths. For per-org rate limiting on a Next.js app you should see something like:
  - **Option A — Process-local token bucket** with a `Map<orgId, BucketState>` in the Next middleware. Fast, no infra, doesn't survive restarts or scale beyond one instance.
  - **Option B — Redis-backed token bucket** via Upstash. Survives restarts, scales horizontally, adds a dependency.
  - **Option C — Vercel Edge Config + KV.** Native to the platform, less general.

- [ ] **Pick Option A** for this demo — keeps the walkthrough deterministic, no Redis to set up. In a real project this would be the wrong call past prototype; that's fine, ADRs are point-in-time decisions.

- [ ] **Verify the ADR was written.**
  ```bash
  ls docs/pulse/adr
  # → ADR-001-per-org-rate-limit-storage.md (or similar slug)
  head -20 docs/pulse/adr/ADR-*.md
  ```
  The ADR's frontmatter should include `status: accepted`, `links.task: middleware`, and `created:` today.

- [ ] **Verify the spec was patched.** Open `docs/pulse/epics/api-quality/features/per-org-rate-limit/tasks/middleware/spec.md`. Its `links.adr` should now include the ADR id.

- [ ] **Commit:**
  ```bash
  git add docs/pulse
  git commit -m "arch: ADR-001 — process-local token bucket"
  ```

> **Gotcha:** if Claude tries to write code as part of `/pulse-arch`, push back. The skill should only write the ADR markdown. Code is `/pulse-code`'s job — this separation matters for the audit trail.

---

## Phase 5 — Implementation with TDD

`/pulse-code` reads the spec + ADR + conventions, drives a TDD loop one unit at a time, and ticks acceptance criteria as they pass. About 25 minutes.

- [ ] **Install a test runner.** Next 15's default scaffold doesn't include one. We'll use vitest:
  ```bash
  pnpm add -D vitest @vitest/coverage-v8
  # add to package.json scripts:
  #   "test": "vitest run"
  ```

- [ ] **Run `/pulse-code`** on the task:
  ```
  /pulse-code middleware
  ```

- [ ] **Approve the test plan.** Claude will propose the smallest credible TDD units. For per-org rate limit middleware you should see something like:
  - Unit 1: token bucket accumulates and refills per the configured rate.
  - Unit 2: middleware extracts org id from the request, increments the right bucket.
  - Unit 3: a request over the limit gets a 429 with a `Retry-After` header.

  Approve the order.

- [ ] **Watch the TDD loop run.** For each unit Claude will:
  1. Write a failing test.
  2. Run the suite — only the new test should fail.
  3. Write the minimal implementation.
  4. Re-run the FULL suite — green.
  5. Update the spec frontmatter, flipping the relevant acceptance from `- "[ ] X"` to `- "[x] X"`.

- [ ] **Verify the spec's acceptance ticks updated:**
  ```bash
  head -15 docs/pulse/epics/api-quality/features/per-org-rate-limit/tasks/middleware/spec.md
  ```
  Every acceptance criterion that has a passing test should now read `- "[x] ..."`.

- [ ] **Verify the status transitioned to `active`:** same file's frontmatter should show `status: active` (was `draft`).

- [ ] **Run the suite yourself** to be sure:
  ```bash
  pnpm test
  ```
  All green. Note the count of tests added.

- [ ] **Commit:**
  ```bash
  git add .
  git commit -m "code: per-org rate limit middleware + tests"
  ```

> **Gotcha:** if `/pulse-code` writes implementation before the test, push back. TDD discipline is what makes Guard's test-integrity check meaningful later. The skill's prompt is explicit about this; if it slips, file feedback so the prompt gets tuned.

---

## Phase 6 — Run Guard

`/pulse-guard` runs all 8 sub-agents on your diff, aggregates the verdicts, and writes a review file. About 15 minutes.

- [ ] **Run `/pulse-guard`** on the diff you just produced:
  ```
  /pulse-guard
  ```

- [ ] **Watch the 8 sub-agents dispatch.** They run in parallel. Each one returns a verdict block. Claude aggregates them into a single review.

- [ ] **Verify the review file was written:**
  ```bash
  ls .pulse/reviews
  head -25 .pulse/reviews/$(git rev-parse HEAD).md
  ```
  Frontmatter should include `verdicts:` with all 8 checks listed and an `overall:` summary.

- [ ] **Read every finding.** Even if the overall verdict is `pass`, scroll through. The most valuable parts are the warnings and info-level notes — they're calibration signal.

- [ ] **Now trip a check on purpose.** Pulse's value is what it catches; you should see it catch something. Add a deliberately bad commit:
  ```bash
  # Append a banned pattern to your test helper. First, add the pattern to the banlist:
  ```
  Edit `.pulse/config.yaml`'s `guard.security_regression.banned_patterns` to add a new entry:
  ```yaml
      banned_patterns:
        - "TODO: remove this auth bypass"
  ```
  Then add the banned line somewhere in your code:
  ```bash
  echo "// TODO: remove this auth bypass" >> src/middleware.ts
  git add . && git commit -m "deliberately tripping guard"
  ```

- [ ] **Re-run `/pulse-guard`:**
  ```
  /pulse-guard
  ```

- [ ] **Read the new review file.** Verify:
  - `verdicts.security-regression: fail`
  - `overall: fail`
  - The finding cites `src/middleware.ts` at the right line.

- [ ] **Try to push.** From the terminal:
  ```bash
  git push origin main 2>&1 | head -5
  ```
  The hook refuses with `overall=fail`. Good.

- [ ] **File an override.** This is the audit-trail half of Guard:
  ```
  /pulse-guard --override "approved by joao for the demo walkthrough; not a real banned pattern"
  ```
  Claude will refuse if the override reason doesn't contain `by <name>` (because `security_regression` is in `require_second_engineer`). Once accepted, the override appends to `.pulse/overrides.log.md` and the review's `overall:` flips to `overridden`.

- [ ] **Verify the override log:**
  ```bash
  tail -15 .pulse/overrides.log.md
  ```
  You should see a fenced `yaml` block with `sha`, `engineer`, `check: security-regression`, your reason, and `second_engineer: joao`.

- [ ] **Push (hook now allows):**
  ```bash
  git push origin main 2>&1 | head -3
  ```
  Will fail because there's no remote configured, but the *hook* allows it — that's what we wanted. You'll see `Pulse pre-push: review xxxxxxx overall=overridden. Proceeding.` before the git remote error.

- [ ] **Clean up the demo-only override.** Remove the banned line and the artificial banned-pattern entry from `.pulse/config.yaml`, commit, re-run `/pulse-guard`:
  ```bash
  # Remove the line from src/middleware.ts
  # Remove the banned_patterns entry
  git add . && git commit -m "clean: remove demo override material"
  ```
  Re-run `/pulse-guard` — should now be `pass`.

> **Gotcha:** if `--override` is rejected silently, check your reason for `by <name>` — Pulse's regex is `/by\s+\S+/i`. "approved by joao" passes; "approved (joao)" doesn't.

---

## Phase 7 — Generate deploy artifacts

`/pulse-ship` runs the test suite as a final gate and, if green, generates a deploy workflow + `vercel.json` + `rollback.sh`. About 10 minutes.

- [ ] **Make sure your tests are green:**
  ```bash
  pnpm test
  ```
  If any fail, fix them first — `/pulse-ship` will refuse to emit anything on red.

- [ ] **Run `/pulse-ship`:**
  ```
  /pulse-ship --task middleware
  ```

- [ ] **Verify the files written:**
  ```bash
  ls .github/workflows
  cat .github/workflows/deploy.yml | head -30
  cat vercel.json
  cat scripts/rollback.sh
  ```
  The workflow should have a `test` job that `needs:` runs before `deploy`, `concurrency.cancel-in-progress: false`, and a `production` environment.

- [ ] **Verify the rollback script is executable** with proper safety:
  ```bash
  bash -n scripts/rollback.sh   # syntax check
  head -5 scripts/rollback.sh   # should have set -euo pipefail
  ```

- [ ] **Verify the task transitioned to `shipped`:** open the task spec frontmatter, `status:` should be `shipped`, `updated:` today.

- [ ] **Try the deploy gate.** Break a test on purpose:
  ```bash
  # Edit one of your test files so an assertion fails.
  ```
  Now re-run `/pulse-ship`. It should REFUSE — print the failing output and not touch any deploy file.

- [ ] **Fix the test, re-run, confirm it allows:** restore the test, run `/pulse-ship` again, confirm it succeeds.

- [ ] **Commit:**
  ```bash
  git add . && git commit -m "ship: generate deploy workflow + rollback"
  ```

> **Gotcha:** the GitHub Actions workflow references `secrets.VERCEL_TOKEN`. If you actually push this to GitHub and trigger the workflow, you'll need to add that secret in repo settings. For the walkthrough we don't push to a real remote; the workflow file existing is enough.

---

## Phase 8 — Tour the dashboard against your demo

Until now you've been watching the dashboard render the bundled fixture. Now point it at YOUR demo and see everything you produced. About 10 minutes.

- [ ] **From the Pulse repo,** start the dashboard pointed at your demo:
  ```bash
  cd ~/code/pulse
  PULSE_REPO_ROOT=$HOME/code/pulse-demo pnpm dev
  ```

- [ ] **Open http://localhost:3000.** You should see:
  - Counts: 1 epic, 1 feature, 1 task, 1 ADR.
  - Guard health: pass rate, plus a sparkline showing your two reviews (the deliberately-failing one and the cleaned one).
  - Sidebar: the `api-quality` epic with its feature and task in the tree.

- [ ] **Click through every surface and find:**
  - The feature spec — your written acceptance, the proposed task list.
  - The task spec — `[x]` marks on the acceptance criteria from `/pulse-code`.
  - The task's `api.md` companion — auto-rendered with whatever you specified (Mermaid welcome).
  - The ADR — your chosen option, the rationale, the consequences.
  - The task page's "Architecture decisions" section linking to the ADR.
  - The ADR's "Decision graph" section linking back to the task.
  - `/reviews` — your two Guard reviews.
  - `/reviews/<the failing one>` — the security-regression fail finding, the override block, the second-engineer attribution.
  - `/audit` — the override entry, with filters by check and engineer.

- [ ] **Try the search box.** Sidebar input or `/search?q=`. Type something from your spec body — should land on the right artifact.

- [ ] **Try `/db`, `/api`, `/design`:**
  - `/db` — empty until you add a `prisma/schema.prisma`. The empty-state UI tells you exactly what to drop.
  - `/api` — empty unless you have an OpenAPI yaml. Same empty-state hint.
  - `/design` — should auto-extract from your Next.js scaffold's `app/globals.css` (Tailwind v4 inserts a default `@theme` import). If not, drop a CSS file with a `@theme {}` block.

- [ ] **Stop the dashboard** with `Ctrl-C`.

> **Gotcha:** if the dashboard loads but shows the FIXTURE content instead of your demo, you didn't set `PULSE_REPO_ROOT`. The env var must be set BEFORE `pnpm dev`.

---

## Wrap-up

You've used every Pulse skill at least once on a real project. Tick what's true:

- [ ] You produced a real artifact tree at `docs/pulse/` with epic → feature → task structure.
- [ ] You wrote an ADR via `/pulse-arch`.
- [ ] You ran a TDD loop via `/pulse-code` and watched acceptance criteria flip to `[x]`.
- [ ] You ran Guard, deliberately tripped a check, filed an override with a second engineer's name, and saw it land in `.pulse/audit`.
- [ ] You generated a deploy workflow + rollback script via `/pulse-ship`, and watched the test gate refuse on red.
- [ ] You toured every dashboard route against YOUR demo project.

That's enough to start using Pulse on a real Twistag client repo. The next steps depend on what kind of project you're moving to:

- **A greenfield project** — repeat the Phase 1–7 flow on the real repo. The shape is the same; only the acceptance criteria change.
- **An existing repo with code in it** — read the [`setup-on-existing-repo`](recipes/setup-on-existing-repo.md) recipe. You'll skip Phase 1 (no scaffolding) and Phase 7 (existing CI uses [diff-mode](recipes/existing-ci-diff-mode.md)).
- **A repo where you want to tune Guard** — read [`customizing-conventions`](recipes/customizing-conventions.md). The default config is a starting point, not the law.

If you have feedback on this walkthrough — a step that was unclear, an output snippet that didn't match what Claude produced, a gotcha that bit you — file it. The walkthrough is a living document.

---

## What to read next

- **[The methodology](03-methodology.md)** — the *why* behind everything you just did. Read this when you want the design intent in your head, not just the mechanics.
- **[The SDLC loop](workflows/sdlc-loop.md)** — the narrative version of the steps you took, deeper on each one.
- **[Plugin reference](reference/plugin.md)** — the canonical reference for every command, sub-agent, and flag.

---

**Cleanup (optional).** If you want to throw away the demo:

```bash
cd ~/code
rm -rf pulse-demo
```
