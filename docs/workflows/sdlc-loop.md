# The SDLC loop

A narrative walkthrough of the five-agent delivery cycle. This is the *explanation* version — read it when you want to understand each phase deeply, not just run the commands. For the hands-on equivalent, see the [guided walkthrough](../02-guided-walkthrough.md).

```
brief / transcript / ask
        │
        ▼
   /pulse-spec ────► docs/pulse/epics/<…>/spec.md + companions
        │
        ▼
   /pulse-arch ────► docs/pulse/adr/ADR-NNN-<…>.md   (patches spec.links.adr)
        │
        ▼
   /pulse-code ────► code + tests; spec acceptance flips to [x]
        │
        ▼
   /pulse-guard ───► .pulse/reviews/<sha>.md         (8 verdicts, overall)
        │
        ▼      (gate: pre-push hook)
        │
        ▼
   /pulse-ship ────► .github/workflows/deploy.yml + vercel.json + rollback.sh
                                                     (spec.status = shipped)
```

Each transition writes an artifact the dashboard renders. The graph is the audit trail.

---

## Phase 1 — Spec

**Skill:** `/pulse-spec`. **Input:** a brief or transcript. **Output:** an artifact tree.

The premise: AI is great at writing implementation code from a clear brief and bad at writing implementation code from an unclear one. Most of the value Spec produces is the **explicit acceptance criteria** — outcome-shaped, testable, machine-readable — that everything downstream is measured against.

### What "good" looks like

A well-formed Spec interview pins down:

- **Size.** Epic (multi-feature, multi-week), feature (one user-visible outcome, one sprint), task (one engineer, one or two days).
- **Why.** The problem this solves, for whom, what changes when it ships.
- **Acceptance.** Three to seven outcome-shaped criteria, each one something `/pulse-guard` could later check the diff against.
- **Out of scope.** Equally important. AI over-delivers by default; the out-of-scope list is your only defense.
- **Surface area.** Data? API? UI? Each "yes" earns a companion file (`db.md` / `api.md` / `design.md`).
- **Open questions.** Anything still TBD, with a human's name attached as the owner.

### What "bad" looks like

A few failure modes to recognize:

- **Vague acceptance.** "Improves performance" — not testable. "p95 admin endpoint latency ≤ 200ms under 100rps" — testable.
- **Aspirational acceptance.** "System handles 10× current load" when there's no measurement infrastructure to verify it. Break it into "load test scaffold exists" + "load test passes at 10× current."
- **Implementation-shaped acceptance.** "Uses a Redis token bucket." That's an ADR-level decision, not a spec-level outcome. Reword: "Per-org rate limit is enforced across server restarts."
- **No out-of-scope.** The spec implies a wider change than the team is ready for.

### Why this matters

Every Guard check downstream uses the spec as its source of truth. The spec-conformance sub-agent literally diffs your PR against the `acceptance:` list. The test-integrity sub-agent matches every acceptance criterion to a test in the diff and surfaces missing coverage. A weak spec produces weak Guard signal.

---

## Phase 2 — Arch

**Skill:** `/pulse-arch`. **Input:** a spec. **Output:** one ADR.

The architecture conversation happens **before code is written**, not in PR comments at 5pm Friday. Pulse's `/pulse-arch` is a forcing function: you can't skip from spec to code without leaving an ADR behind that says "here are the paths we considered, here's the one we're taking, here's what we accept by taking it."

### What "good" looks like

A well-formed ADR:

- **2–3 distinct options** — not three variants of the same idea. If only one option is credible, the ADR says that explicitly (which is itself useful: "we considered alternatives and rejected them because X").
- **Per-option pros + cons + caveats.** The "you'd reach for this if…" sentence at the end of each option is the most useful part.
- **A decision** — one chosen option, with the rationale in the *context of the spec's constraints*. "Because it's simpler" is not enough; "because the spec's p95 budget rules out a Redis round-trip" is.
- **Consequences** — what you gave up, not just what you got. Future-you reading this in 18 months will look here first.

### What "bad" looks like

- **Three variants of the same idea.** "Postgres with one column vs Postgres with three columns vs Postgres with JSONB." That's a column-design question, not an architecture question.
- **Decision before options.** The ADR opens with "We use Redis." Why? What was rejected? Useless to future readers.
- **No Consequences section.** The decision looks free. Decisions are never free.

### Why one ADR per invocation

Multi-decision asks become multi-invocations. If your spec needs decisions about (1) storage, (2) event distribution, and (3) permission model, that's three `/pulse-arch` invocations, three ADRs, three monotonic numbers. The dashboard's Decision graph (Decides / Supersedes / Superseded-by) only works if each ADR is one decision.

### Superseding, not deleting

When you later realize ADR-007 was wrong, you don't delete it. You write ADR-024 with `supersedes: ADR-007`, and `/pulse-arch` patches ADR-007's frontmatter to `status: superseded` + `superseded-by: ADR-024`. The audit trail is half the value.

---

## Phase 3 — Code

**Skill:** `/pulse-code`. **Input:** a spec + ADRs + `.pulse/config.yaml`. **Output:** code, tests, ticked acceptance.

This is the most TDD-disciplined skill in the system, because the tests it writes become the contract Guard's test-integrity sub-agent checks later.

### The loop

Per acceptance criterion (or smaller unit if the criterion decomposes):

1. **Red.** Write the failing test FIRST. The suite must show only this new test failing.
2. **Green.** Minimum implementation that makes it pass. No extra fields. No "while I'm in here" refactors.
3. **Refactor.** Only if the green code is genuinely worse than what the codebase already does nearby.
4. **Full suite.** Re-run the WHOLE suite, not just the new test. A passing test means nothing if its neighbor is now red.
5. **Tick acceptance.** If this unit completes an acceptance criterion, flip `- "[ ] X"` → `- "[x] X"` in the spec frontmatter.

When every criterion is `[x]`, stop. Don't go further.

### Status transitions

- `draft` → `active` on start (the act of running `/pulse-code` is the signal that implementation has begun).
- Never transitions to `shipped`. That's `/pulse-ship`'s job, after the test gate passes.

### Why TDD discipline matters

The test-integrity sub-agent's hardest job is detecting **tautological tests** — tests where the assertion mirrors the implementation. The cleanest way to produce non-tautological tests is to write them before the implementation exists, against the *spec's* acceptance, not against the code's shape.

If `/pulse-code` ever slips and writes implementation before the test, push back. The whole calibration depends on it.

### Convention enforcement

`/pulse-code` reads `.pulse/config.yaml.guard.convention_drift.rules` and enforces them while writing. This is intentional double-defense: the convention-drift sub-agent later checks the same rules on the diff, but if `/pulse-code` already enforced them, the check stays quiet. Conventions are written once and applied at write-time AND review-time.

---

## Phase 4 — Guard

**Skill:** `/pulse-guard`. **Input:** the current diff + linked spec.md paths + `.pulse/config.yaml`. **Output:** one review file in `.pulse/reviews/<sha>.md`.

The eight-check agentic review layer. See [the methodology page](../03-methodology.md#pillar-2--the-eight-check-agentic-review-layer) for the full taxonomy. The short version:

1. **Spec conformance** — diff vs acceptance list.
2. **Security regression** — banned patterns + secrets.
3. **Convention drift** — house style.
4. **Anti-pattern repetition** — same shape across N+ files.
5. **Performance pitfalls** — N+1, hot-loop allocs, unbounded recursion.
6. **Test integrity** — tautological / mocked / missing-coverage.
7. **Dependency hygiene** — license + import-presence + duplicates.
8. **Data/API safety** — migration safety, contract breakage, PII.

### How the orchestrator works

Eight sub-agents dispatched in PARALLEL (a single message with eight Agent tool calls). Each returns a structured YAML verdict. The orchestrator aggregates into one overall verdict and writes the immutable per-sha review file.

### Aggregation rules

```
overall = pass        if every check passes
overall = warning     if any warning, no fails
overall = fail        if any unoverridden fail
overall = overridden  if every fail has an active override entry
```

The pre-push hook reads only the `overall:` field — it doesn't re-run anything.

### When you should override

See the [overriding-guard workflow](overriding-guard.md). Short version: an override is a *deliberate, attributed, audit-logged* decision to accept a Guard fail. Use it when the check is wrong or when the team is taking on debt with eyes open. Never use it to "make the pipeline shut up" — that's the failure mode the audit log exists to surface.

### Calibration

Sub-agent calibration is the hardest ongoing work. False-positive patterns surface in the override log; high-override checks indicate a sub-agent prompt that needs tuning. The override audit is the feedback mechanism.

---

## Phase 5 — Ship

**Skill:** `/pulse-ship`. **Input:** `.pulse/config.yaml` + repo state. **Output:** deploy artifacts.

The non-negotiable rule: **never emit deploy artifacts on a red test suite.** Every invocation runs the test gate first. No exceptions, no skip flag.

### What gets generated (Vercel target)

- `.github/workflows/deploy.yml` — test job gates a deploy job, `concurrency.cancel-in-progress: false`, `production` environment declared.
- `vercel.json` — `github.enabled: false` so the GH Actions workflow is the single deploy path (no auto-deploy race).
- `scripts/rollback.sh` — operator-runnable, `set -euo pipefail`, no embedded `VERCEL_TOKEN`.

### Greenfield vs diff-mode

If your repo has no CI yet, `/pulse-ship` runs greenfield (writes from templates).

If your repo has existing CI, `/pulse-ship` runs diff-mode: it READS the existing workflow and proposes the **minimum** changes to satisfy the contract (test job gates deploy; no cancel-in-progress; production env). Edit-not-Write — the engineer reviews each change.

The asymmetric rule: existing `scripts/rollback.sh` is NEVER overwritten silently. Rollback paths are load-bearing operationally.

### `--task <slug>` transitions

When you invoke `/pulse-ship --task <slug>`, on successful generation the linked task's spec frontmatter flips from `status: active` to `status: shipped` and `updated:` becomes today. The dashboard renders the new state.

---

## The audit trail

Every step writes a git-tracked artifact:

| Phase | Artifact written |
|---|---|
| Spec | `docs/pulse/epics/<…>/*.md` |
| Arch | `docs/pulse/adr/ADR-NNN-*.md` (+ patches parent's `links.adr`) |
| Code | source + tests + ticked acceptance in spec frontmatter |
| Guard | `.pulse/reviews/<sha>.md` (+ optional `.pulse/overrides.log.md` entry) |
| Ship | `.github/workflows/deploy.yml` + `vercel.json` + `scripts/rollback.sh` (+ `status: shipped`) |

If a client asks why we shipped a particular release on a particular day, the answer is in git history. The dashboard renders that history as a navigable graph.

---

## Common deviations

- **Spec → Code, skipping Arch.** Acceptable for purely additive tasks where no decision is open (a new utility function, a copy edit). Anything that touches data or API shape: write the ADR.
- **Code → Ship, skipping Guard.** Never. The pre-push hook enforces this — Ship is fine, but the push is gated. If you bypass with `PULSE_SKIP_GUARD=1`, the audit log surfaces it on next dashboard reload.
- **Code → Code → Guard → Ship.** Normal — multiple `/pulse-code` invocations on the same task, one Guard at the end. Each Guard run is per-sha; the latest one before the push is what matters.

---

**Related:** [Overriding Guard](overriding-guard.md) · [Deploying with Ship](deploying.md) · [Plugin reference](../reference/plugin.md)
