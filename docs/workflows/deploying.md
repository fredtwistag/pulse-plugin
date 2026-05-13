# Deploying with Ship

This is the deep-dive on `/pulse-ship` — the test gate, what gets generated, how diff-mode works, and the rollback procedure. For the reference summary, see [Plugin reference: Ship sub-agents](../reference/plugin.md#ship-sub-agents).

---

## What Ship does

When you run `/pulse-ship`:

```
┌───────────────────────────────────────────────────────────────┐
│ 1. Read .pulse/config.yaml.ship                                │
│ 2. Run test_command  ←── HARD GATE: red here = full stop       │
│ 3. Detect existing CI surface                                  │
│ 4. Dispatch ship sub-agents in parallel                        │
│      ship-github-actions → .github/workflows/deploy.yml        │
│      ship-vercel         → vercel.json + scripts/rollback.sh   │
│ 5. Verify outputs parse and contain no inlined secrets         │
│ 6. (optional) --task <slug> → transition spec to `shipped`     │
│ 7. Report                                                       │
└───────────────────────────────────────────────────────────────┘
```

The test gate is non-negotiable. There is no `--skip-tests` flag. There never will be. The whole point of `/pulse-ship` is to keep "deploy" and "tests passed locally five minutes ago, probably still green" from drifting apart.

---

## The test gate in detail

Every invocation runs `.pulse/config.yaml.ship.test_command` (default: `pnpm test`).

### Refusal cases

`/pulse-ship` refuses, and writes nothing, if:

| Condition | Behavior |
|---|---|
| `test_command` returns non-zero | Print the failed output, refuse |
| `test_command` is `true`, `exit 0`, or `echo passed` | Refuse — this is the failure mode the skill exists to catch |
| `test_command` runs longer than 15 minutes | Refuse — long suites are an operational risk |
| Most recent `.pulse/reviews/<HEAD-sha>.md` has `overall: fail` without overrides | Refuse — Ship and Guard agree about red builds |
| Repo is not a git repo | Refuse |
| `--task <slug>` references a task that's already `status: shipped` | Print "already shipped on <date>", refuse to re-transition |
| `.pulse/config.yaml.ship` block is missing or incomplete | Refuse with a pointer to the template |

If the test_command is silent-fail-prone (e.g. a test runner that returns 0 even when no tests were found), that's on the project's test setup, not on Ship — but the dashboard's `test_integrity` Guard check will flag it before you get here.

---

## What gets generated

### `.github/workflows/deploy.yml`

The generated workflow has the shape below. The `ship-github-actions` sub-agent adapts commands and Node version to your `package.json`, but the SHAPE is invariant:

```yaml
name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false       # never cancel a deploy mid-flight

permissions:
  contents: read

jobs:
  test:                            # the gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: test                    # gated by test job
    runs-on: ubuntu-latest
    environment: production        # records deployment, applies any env protection rules
    steps:
      - …vercel deploy…
```

The five invariants `ship-github-actions` enforces, even in diff-mode:

1. **Test job `needs:`-gates the deploy job.**
2. **`concurrency.cancel-in-progress: false`** — never cancel a running deploy.
3. **`environment: production`** declared on the deploy job — GitHub deployments + protection rules.
4. **Secrets only via `${{ secrets.* }}`** — never inlined.
5. **Actions pinned to a major** (`@v4`), never `@latest` or unpinned.

If any of these is missing in an existing workflow you're in diff-mode against, the sub-agent proposes the minimum Edit to add it.

### `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "git": { "deploymentEnabled": { "main": true } },
  "github": { "enabled": false, "silent": true }
}
```

Two non-negotiables here:

1. **`github.enabled: false`.** This turns OFF Vercel's "auto-deploy on git push" feature. Why? Because the GH Actions workflow is the single canonical deploy path. If Vercel's auto-deploy and the GH Actions workflow both ran, you'd get duplicate deploys racing for the same alias. The workflow controls everything; Vercel is the runtime target only.
2. **`framework`** is set (or left null if undeterminable) — Vercel uses this to pick the build preset.

The sub-agent leaves `builds[]` / `routes[]` / `rewrites[]` / `redirects[]` *strictly alone*. Those are project-author territory.

### `scripts/rollback.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail                # ALWAYS

VERCEL_PROJECT="${VERCEL_PROJECT:-…}"
VERCEL_TEAM="${VERCEL_TEAM:-…}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN not set. Aborting." >&2
  exit 1
fi

target="${1:-}"
# If no argument, resolves the previous successful production deployment.
# If an argument, uses that deployment id.

pnpm dlx vercel promote "$target" --scope "$VERCEL_TEAM" --token "$VERCEL_TOKEN"
```

The shape is sacred for one reason: when something is breaking in production at 2am, an on-call engineer needs to read this script in 30 seconds and trust it. `set -euo pipefail` first, env-var token, no embedded secrets, no clever flags.

**Existing `scripts/rollback.sh` is never overwritten silently.** Rollback paths are load-bearing operationally; if the project already has a tested rollback, the ship-vercel sub-agent leaves it alone and prints a recommendation.

---

## Diff-mode — adopting Ship on a repo with existing CI

The common case: you've already got `.github/workflows/deploy.yml` (or a similar file). You don't want Pulse to rewrite it; you want it to *adopt* it.

`/pulse-ship` enters diff-mode automatically when it detects:

- An existing `.github/workflows/*.yml` that looks like a deploy workflow (mentions `vercel`, deploy job, production environment).
- An existing `vercel.json`.
- An existing `scripts/rollback.sh`.

In diff-mode each sub-agent does the **minimum** to satisfy its contract:

- `ship-github-actions` reads your workflow, finds what's missing against the five invariants above, and proposes targeted Edits.
- `ship-vercel` checks `github.enabled` and `framework` only; proposes a minimal patch if needed; leaves everything else alone.
- `rollback.sh` is checked but not modified.

The Edits are *proposed*. The engineer accepts each one. There's no "yes to all" — Pulse won't change your deploy path without your explicit per-edit consent.

See the [recipe: existing CI diff-mode](../recipes/existing-ci-diff-mode.md) for a worked walkthrough.

---

## Rollback procedure

The generated `scripts/rollback.sh` makes rollback a one-line operator action:

```bash
# Roll back to the previous production deployment
VERCEL_TOKEN=… ./scripts/rollback.sh

# Roll back to a specific deployment id
VERCEL_TOKEN=… ./scripts/rollback.sh dpl_abc123
```

What the script does:

1. Verifies `VERCEL_TOKEN` is set, exits with error if not.
2. If no deployment id argument, queries `vercel ls --prod` and picks the second-to-most-recent (i.e., the deployment before the current alias).
3. Calls `vercel promote <target>` to promote that deployment to the production alias.
4. Prints confirmation.

What it deliberately doesn't do:

- It doesn't run tests against the rolled-back deployment. That's the human's job — your incident response should include "check the rolled-back deployment is healthy" as an explicit step.
- It doesn't notify your team. Wire that into your on-call playbook; the script is the mechanism, not the communication.

---

## After a Ship run — what to check

Before you push the generated files:

- **`.github/workflows/deploy.yml`** — open it and read every step. The test job's `run:` commands should match your `package.json` scripts. The deploy job's secrets should match what you've added in GitHub repo settings.
- **`vercel.json`** — verify `framework` is right; verify nothing in `builds` / `routes` / `redirects` was touched if you had any.
- **`scripts/rollback.sh`** — `bash -n scripts/rollback.sh` to syntax-check. Run with `--help` if you wired one up; if not, just read it.
- **`docs/pulse/.../tasks/<task>/spec.md`** (if you used `--task`) — confirm `status: shipped` and `updated:` today.

Before the first deploy actually runs:

- **GitHub repo secrets.** The workflow references `secrets.VERCEL_TOKEN`. Add it under Settings → Secrets and variables → Actions. Without it, the deploy step fails.
- **Vercel project.** Confirm the project exists and matches `.pulse/config.yaml.ship.vercel.project`. If it doesn't exist yet, create it before the first push to main.
- **Branch protection on `main`** (recommended). Require PR review + status checks; the test job becomes a required status check.

---

## Triggering a deploy

Once the workflow is in place:

```bash
git push origin main
```

The push fires the workflow. Watch it in the Actions tab. The test job runs first; if it passes, the deploy job runs. If either fails, deployment doesn't happen — the alias stays on the previous deployment.

For deliberate manual deploys (e.g., re-running after a flaky test):

- GitHub Actions tab → `deploy` workflow → "Run workflow" button.

---

## What Ship doesn't do

To set expectations:

- **It doesn't deploy.** It generates the workflow; GitHub runs it.
- **It doesn't manage secrets.** You add `VERCEL_TOKEN` in GitHub settings yourself.
- **It doesn't manage Vercel project creation.** You create the project in Vercel first; Ship just generates config that references it.
- **It doesn't manage DNS, domains, or aliases.** Those are Vercel/registrar concerns.
- **It doesn't auto-merge.** The push has to come from you (or your team's normal merge process).

---

## Future targets

v1 supports Vercel + GitHub Actions. The sub-agent shape (`ship-<target>.md`) is intentionally pluggable. Likely v2 additions:

- `ship-fly` — Fly.io deploy via `fly deploy`.
- `ship-aws-ecs` — task definitions + service updates.
- `ship-cloud-run` — `gcloud run deploy` workflows.

Each new target is a new sub-agent file under `agents/`, plus a `target:` value the orchestrator can dispatch. No orchestration changes needed.

---

**Related:** [The SDLC loop](sdlc-loop.md) · [Plugin reference: Ship sub-agents](../reference/plugin.md#ship-sub-agents) · [Setup on existing repo](../recipes/setup-on-existing-repo.md)
