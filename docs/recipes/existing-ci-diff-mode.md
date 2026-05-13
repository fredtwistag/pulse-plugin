# Adopting Pulse on a repo with existing CI

For when you're bringing `/pulse-ship` to a project that already has a deploy workflow you don't want rewritten. Ship enters diff-mode automatically — this recipe explains what to expect and how to drive it.

About 15 minutes.

---

## The premise

Your repo already has:

- `.github/workflows/deploy.yml` (or `production.yml`, or whatever your team named it)
- Possibly a `vercel.json` you've tuned
- Possibly a `scripts/rollback.sh` you wrote yourself

You want Pulse's deploy contract — test job gates the deploy, no cancel-in-progress, production environment — without losing the customizations you've made.

Ship's contract: never overwrite, only Edit the minimum needed.

---

## Step 1 — Take stock

- [ ] List every workflow in `.github/workflows/`. Note which one deploys.
- [ ] Open it. Identify:
  - [ ] Whether there's a test/build step that runs before deploy.
  - [ ] Whether `concurrency.cancel-in-progress` is set (and to what).
  - [ ] Whether the deploy job declares an `environment:`.
  - [ ] Which secrets it references.
  - [ ] Whether actions are pinned to majors.

- [ ] Read your `vercel.json` if you have one. Note:
  - [ ] Is `github.enabled` set, and to what?
  - [ ] What's in `builds`, `routes`, `rewrites`, `redirects`?

- [ ] Read your `scripts/rollback.sh` if you have one. Confirm it has `set -euo pipefail`.

---

## Step 2 — Run `/pulse-ship` in diff-mode

- [ ] Make sure your tests pass:
  ```bash
  pnpm test
  ```

- [ ] Run `/pulse-ship`:
  ```
  /pulse-ship
  ```

- [ ] Watch what each sub-agent does:

### `ship-github-actions` diff-mode behavior

It reads your existing workflow and proposes targeted Edits for any of the five invariants that aren't already satisfied:

| Invariant | If missing, proposes |
|---|---|
| Test job `needs:`-gates the deploy job | Add a test job + `needs: [test]` on the deploy job |
| `concurrency.cancel-in-progress: false` | Change `true` → `false` with a one-line comment on why |
| `environment: production` on deploy job | Add the `environment:` key |
| Secrets via `${{ secrets.* }}` only | Refuse to proceed if a literal credential is found |
| Actions pinned to a major | Suggest pinning unpinned actions, won't auto-rewrite |

Each Edit is presented separately. You approve each one. **There is no "yes to all"** — that's deliberate. Your deploy path is too important to mass-edit.

### `ship-vercel` diff-mode behavior

It reads `vercel.json` if present. Three sub-modes:

| State | Behavior |
|---|---|
| No `vercel.json` | Writes from template (greenfield) |
| Exists, `github.enabled: false` set, `framework` set or null | **No-op.** Prints "vercel.json already Pulse-compatible — leaving alone." |
| Exists, missing `github.enabled: false` | Proposes a focused Edit. `builds`, `routes`, `rewrites`, `redirects` are NEVER touched. |

`scripts/rollback.sh`:

| State | Behavior |
|---|---|
| Doesn't exist | Writes from template |
| Exists, has `set -euo pipefail`, no embedded token, references right project | No-op |
| Exists, missing safety features | Prints a recommendation (does NOT overwrite) — you decide whether to update |

---

## Step 3 — Review each proposed Edit

For every Edit proposed, ask:

- **Does it preserve my project's intent?** A test job Pulse adds might use commands that aren't right for your repo (e.g. `pnpm install` when you use `npm`). Adjust before accepting.
- **Does it conflict with anything I've already done?** A Pulse Edit might propose adding an `environment:` key that overrides one you already have on a *different* job. Confirm placement.
- **Does my CI plan support it?** Adding `environment: production` may trigger your team's deployment protection rules; that might be desired or might block deploys until someone approves. Confirm before pushing.

If an Edit doesn't fit, **decline it**. Pulse's contract is to propose; yours is to decide.

---

## Step 4 — Confirm the rollback story

The most common diff-mode pitfall: Pulse leaves your existing `scripts/rollback.sh` alone (correct), but your rollback script was actually broken or out of date and you don't know.

- [ ] Read your rollback.sh line by line.
- [ ] Verify it has `set -euo pipefail` at the top.
- [ ] Verify the `VERCEL_PROJECT` / `VERCEL_TEAM` (or equivalent) values are current.
- [ ] Verify it doesn't embed a token.
- [ ] Run it with `--help` if you wired one up, or just `bash -n scripts/rollback.sh` to syntax-check.

If anything is wrong, fix it now. The day you need it is not the day to debug it.

---

## Step 5 — Verify and commit

- [ ] Run a syntax check on the workflow:
  ```bash
  # GitHub will reject malformed YAML on push; pre-validate locally if you have yamllint:
  yamllint .github/workflows/deploy.yml
  ```

- [ ] Commit the Pulse-proposed changes:
  ```bash
  git add .github/workflows .pulse
  git commit -m "ship: pulse diff-mode integration"
  ```

- [ ] Push (the pre-push hook may want a `/pulse-guard` run first):
  ```bash
  git push
  ```

---

## What if Pulse proposed nothing?

Possible — and good. It means your existing CI already satisfies the five invariants. Pulse just nods and moves on. The skill exits with "no changes needed" and an explanation of what it checked.

This is the long-run goal: a team whose existing patterns Pulse never has to correct. Diff-mode is for getting there from a non-Pulse starting point.

---

## What if I want Pulse to ignore my existing CI entirely?

Not supported in v1, by design. The contract is "test job gates deploy" — if your existing workflow can't satisfy that, you should fix the workflow, not opt out of the contract.

If you really need an exit (e.g. you're in the middle of migrating CI providers), the option is to temporarily delete `.github/workflows/deploy.yml`, let `/pulse-ship` run greenfield, then merge the resulting file with your old one by hand. Document the situation in `docs/pulse/_misc/migration-notes.md` for future-you.

---

## What if I'm not using GitHub Actions?

v1 supports GitHub Actions only. If you're on GitLab CI, CircleCI, Buildkite, etc., `/pulse-ship` doesn't help yet. You can still use the rest of Pulse — specs, ADRs, code, Guard — and continue running your existing CI manually until v2 adds more deploy adapters.

The contract Ship enforces (test-gates-deploy, no-cancel-in-progress, production environment, no-inline-secrets) is portable; document those four rules in your team's existing CI README and you're spiritually adopting Pulse's ship discipline without the tooling.

---

**Related:** [Deploying with Ship](../workflows/deploying.md) · [Setting up Pulse on an existing repo](setup-on-existing-repo.md) · [Plugin reference: Ship sub-agents](../reference/plugin.md#ship-sub-agents)
