# Setting up Pulse on an existing repo

For when you're bringing Pulse to a project that already has code in it. The [guided walkthrough](../02-guided-walkthrough.md) starts from a fresh scaffold; this recipe starts from "you have a real codebase already and you want to instrument it."

About 30 minutes for a small repo, longer if you also want to write specs for existing in-flight work.

---

## Prerequisites

- [ ] You've done the [quickstart](../01-quickstart.md) so the dashboard runs against the fixture.
- [ ] You've done the [guided walkthrough](../02-guided-walkthrough.md) on a fresh demo, or at least skimmed it.
- [ ] The Pulse plugin is symlinked into Claude Code.
- [ ] You have a clean working tree on the target repo (no uncommitted changes you can't lose).

---

## Phase 1 — Decide where Pulse fits

Pulse is additive. It doesn't replace your build, your CI, your test runner, or your deploy. It adds:

- A `docs/pulse/` directory of specs and ADRs.
- A `.pulse/` directory of config, reviews, and audit log.
- A pre-push hook.
- Five new slash commands available in Claude Code on this repo.

Things to confirm before you begin:

- [ ] **You have permission to push to the repo.** Pulse's contract is per-engineer; if you can't push, you can't use the pre-push hook.
- [ ] **There are no conflicting `docs/pulse/` or `.pulse/` directories.** `ls docs/pulse .pulse 2>/dev/null` should print nothing.
- [ ] **You have a sense of the existing CI.** Pulse's `/pulse-ship` will diff-mode against existing workflows; the [existing-ci-diff-mode](existing-ci-diff-mode.md) recipe covers this in depth.

---

## Phase 2 — Add the convention directories

- [ ] Create the directories:
  ```bash
  mkdir -p docs/pulse .pulse
  ```

- [ ] Drop the config template in:
  ```bash
  cp /path/to/pulse/plugins/twistag-pulse/templates/config.yaml .pulse/config.yaml
  cp /path/to/pulse/plugins/twistag-pulse/templates/overrides.log.md .pulse/overrides.log.md
  ```

- [ ] Open `.pulse/config.yaml` and tune for this project. The minimums you should set:
  - `base_branch` — `main`, `master`, or whatever your team uses.
  - `ship.target` — `vercel` for v1.
  - `ship.vercel.project` / `ship.vercel.team` — fill in if you'll use `/pulse-ship`.
  - `ship.test_command` — whatever runs your suite (`pnpm test`, `npm test`, `pytest`, etc).
  - `guard.security_regression.banned_patterns` — start empty; add as you find them.
  - `guard.convention_drift.rules` — start with 2–3 rules your team agrees on; you'll learn what to add over time.

- [ ] First commit (just the convention):
  ```bash
  git add docs/pulse .pulse
  git commit -m "chore: add pulse convention directories"
  ```

---

## Phase 3 — Install the pre-push hook

- [ ] Run the installer:
  ```bash
  node /path/to/pulse/plugins/twistag-pulse/scripts/install-hooks.mjs
  ```
  If your repo already has a pre-push hook, the installer backs it up to `.git/hooks/pre-push.pulse-backup-<ts>` before installing Pulse's.

- [ ] Verify the hook is in place:
  ```bash
  ls -la .git/hooks/pre-push
  ```
  Should be a symlink pointing at the plugin's `hooks/pre-push.mjs`.

- [ ] (Optional) test the hook refuses without a review. Try a no-op push:
  ```bash
  git commit --allow-empty -m "test: hook refuses without review"
  git push --dry-run 2>&1 | head -5
  ```
  You should see `Pulse pre-push blocked. No review found for HEAD...`. Reset:
  ```bash
  git reset --hard HEAD~1
  ```

---

## Phase 4 — Document the existing state (optional but recommended)

You don't have to write specs for code that already exists. But the first time you run `/pulse-spec` on a new feature, Claude will look around the repo to understand context. Helping it has compounding value.

- [ ] **Add a top-level `docs/pulse/db.md`** describing your DB conventions. If you have Prisma, the dashboard will auto-extract the schema; the narrative is for context (soft delete policy, migration safety, etc.).
- [ ] **Add a top-level `docs/pulse/api.md`** describing your API conventions (pagination shape, auth, error format).
- [ ] **Add a top-level `docs/pulse/design.md`** describing your design system conventions.

These are the same files the fixture has in [`fixtures/sample-repo/docs/pulse/`](../../fixtures/sample-repo/docs/pulse/) — use those as templates.

- [ ] Commit:
  ```bash
  git add docs/pulse
  git commit -m "docs: pulse project-wide narratives"
  ```

---

## Phase 5 — Write the first spec for in-flight work

You probably have something in flight. Walking it through `/pulse-spec` retroactively is the fastest way to surface its real acceptance criteria.

- [ ] Pick the smallest in-flight piece of work — ideally a single task, not an epic.
- [ ] Open Claude Code in the repo root.
- [ ] Run `/pulse-spec` with the task description:
  ```
  /pulse-spec retroactive: <what the in-flight work is>
  ```
- [ ] Answer the interview based on what's true now (not aspirational). The acceptance list should describe what "done" actually means for this work.
- [ ] Commit the spec:
  ```bash
  git add docs/pulse
  git commit -m "spec: <task slug>"
  ```

If the work is already partly implemented, that's fine — go to Phase 6 for the running-Guard step.

---

## Phase 6 — Run Guard on the next push

The acid test. Pick a small, ready-to-push change and walk it through:

- [ ] Make the change and commit normally.
- [ ] Run `/pulse-guard` from Claude Code in the repo.
- [ ] Read the verdict file at `.pulse/reviews/<sha>.md`.

What to expect on a first run:

- **Most checks will pass.** The 8 sub-agents are calibrated to flag the AI-volume failure modes; a normal change typically only trips one or two warnings.
- **Convention drift may warn a lot at first.** Your `guard.convention_drift.rules` is short; the sub-agent ALSO looks for consistency drift against neighbor files. If it surfaces real patterns your codebase follows, codify them as rules in `.pulse/config.yaml`. The next run will be quieter.
- **Test-integrity warnings on missing acceptance coverage are common.** If your in-flight retroactive spec has acceptance items, the sub-agent will flag any not covered by tests. That's signal — write the missing tests.

- [ ] **Iterate on the calibration.** For every false positive: ask whether it's the check being wrong or your codebase. Update `.pulse/config.yaml` accordingly and re-run.

- [ ] **Push.** Once `overall:` is `pass` (or `warning` you've read and accepted), `git push` will succeed.

---

## Phase 7 — Generate deploy artifacts (if you don't already have CI)

Skip this if you already have CI — go to the [existing-ci-diff-mode](existing-ci-diff-mode.md) recipe instead.

- [ ] Run `/pulse-ship`:
  ```
  /pulse-ship
  ```
- [ ] Review the generated `.github/workflows/deploy.yml`, `vercel.json`, `scripts/rollback.sh`.
- [ ] Add `VERCEL_TOKEN` to your GitHub repo secrets.
- [ ] Commit and push.

---

## Phase 8 — Set up the dashboard

Two patterns:

- **Dev-time only.** Each engineer runs the dashboard locally:
  ```bash
  cd /path/to/pulse
  PULSE_REPO_ROOT=/path/to/this-repo pnpm dev
  ```
- **Shared instance.** Build once, host on a small Next.js container or Vercel project, point it at a mirror of this repo. See [dashboard reference: self-hosting](../reference/dashboard.md#self-hosting).

- [ ] Pick a pattern and stand it up.
- [ ] Confirm the dashboard renders this repo's artifacts at every URL (sidebar tree, audit page, /db, /api, /design).

---

## Phase 9 — Tell the team

- [ ] Share the dashboard URL.
- [ ] Document in your team README: where `.pulse/config.yaml` lives, what `PULSE_SKIP_GUARD=1` is for, how to file an override.
- [ ] Link this wiki from your team's onboarding doc.

---

## What you've got now

- A `docs/pulse/` graph that grows as you write more specs.
- A pre-push hook that catches regressions before they ship.
- A dashboard your engineers and clients can both look at.
- An audit trail for every override.

The next 4–6 weeks are calibration: the convention rules need tuning to your project, the banned-patterns list needs to grow to match the patterns you actually want to kill. Watch `/audit` — overrides clustering on one check is a signal to tune that check.

---

**Related:** [Guided walkthrough](../02-guided-walkthrough.md) (greenfield equivalent) · [Existing CI diff-mode](existing-ci-diff-mode.md) · [Customizing conventions](customizing-conventions.md)
