# The methodology

This page is the *explanation* half of the wiki: not "how do I do X with Pulse," but "why is Pulse shaped the way it is." Read it once and the rest clicks into place. About 30 minutes.

If you have not yet used Pulse, do the [quickstart](01-quickstart.md) first — it's easier to absorb the *why* once you've seen the *what*.

---

## The diagnosis: review broke at AI volume

Twistag ships ~90% AI-generated, spec-driven code. The remaining 10% is where senior engineers spend their judgment. That ratio is the fastest we have ever shipped — but it puts pressure on the part of the system nobody talks about: **what that volume does to the people reviewing it.**

When most of what an engineer is reading was not written by another human, the reading itself changes. Eyes skim. Attention drifts toward formatting because the formatting always looks tidy. AI does not write bad code most of the time — **it writes plausible code**. Code that passes the tests, looks fine, and quietly reintroduces the auth pattern the team killed six months ago.

> *If your AI usage went up 10× and your review process didn't, you don't have a faster team. You have a slower incident waiting to happen.*

For years our stack was Snyk, Sonar, Codacy, LinearB. Each one solved a slice. None of them were built for a world where most of the code is not written by a person. And on top of that, none of them talked to each other.

Pulse is what we built instead.

---

## The three pillars

| Pillar | What it does | Who owns the final call |
|---|---|---|
| **Five delivery agents** | Convert intent into shipped software across spec, architecture, code, quality, and deployment | Senior engineer |
| **Eight-check Guard** | Gate every push against the patterns tired reviewers miss | Senior engineer (after the layer clears) |
| **Pulse Dashboard** | Surface every project artifact in one screen for engineers and clients | Engineering leadership |

The agents handle volume. The review layer enforces consistency at that volume. The dashboard tells leadership where judgment is most needed. The engineer still owns every call — approves, overrides, pushes back. What Pulse changes is **what review looks like at this scale**.

### Pillar 1 — the five delivery agents

The five agents map to the phases of the delivery lifecycle. Each one removes a specific kind of friction.

| Agent | Phase | What it removes |
|---|---|---|
| **Spec** | Discovery → Specification | Ambiguous requirements, undocumented edge cases, missing acceptance criteria |
| **Arch** | Architecture | Late-binding architecture debates, decisions made in PR comments |
| **Code** | Implementation | Boilerplate, scaffolding, repetitive convention enforcement |
| **Guard** | Quality assurance | Drift between what was specified and what was built, plausible-looking regressions |
| **Ship** | Deployment | Manual rollback planning, environment drift, post-deploy monitoring set up after the incident |

The agents do not replace engineers. They remove the work that slows engineers down so the senior people Twistag hires spend their time on architecture decisions, complex problem-solving, and client collaboration — not on boilerplate, documentation, or deployment checklists.

That is the delivery side. Now the part that broke at AI volume: review.

### Pillar 2 — the eight-check agentic review layer

Guard sits between Code and a human approver. It is not a linter. It is not a security scanner with a pretty UI. It is eight specialised checks, each one tuned to a failure mode that shows up when most of the code in a pull request was not typed by a person.

| # | Check | What it catches | Why it matters at AI volume |
|---|---|---|---|
| 1 | **Spec conformance** | Drift between the diff and the agreed spec / acceptance criteria | AI tends to over-deliver: a flag here, a helper there, none of it asked for. Conformance keeps scope honest. |
| 2 | **Security regression** | Banned patterns reintroduced, secrets in code, deprecated auth/authz patterns | Plausible code can pass tests and quietly bring back a pattern the team killed months ago. This is the check that keeps that from shipping. |
| 3 | **Convention drift** | House style violations: naming, error handling, logging, file structure, module boundaries | AI writes code that looks tidy in isolation but fights the project's conventions in aggregate. Drift compounds across files. |
| 4 | **Anti-pattern repetition** | The same poor pattern echoed across multiple files in the same PR | One bad pattern is a code smell. The same bad pattern in eight files is a future refactor on the engineering budget. |
| 5 | **Performance pitfalls** | N+1 queries, hot-loop allocations, missing indexes, unbounded recursion, accidental quadratic work | Tests pass at test scale. Performance fails at production scale. The check models the difference. |
| 6 | **Test integrity** | Tautological assertions, tests that verify the implementation rather than the contract, missing edge cases | AI is excellent at writing tests that confirm whatever it just wrote. The check forces tests back onto the spec. |
| 7 | **Dependency & supply-chain hygiene** | New packages, version pinning, license risk, transitive CVEs, unused additions | A new dependency is a permanent decision made in a five-second autocomplete. The check makes that decision explicit. |
| 8 | **Data & API safety** | Breaking API contract changes, unsafe migrations, PII handling, schema compatibility | The change that breaks a client integration is rarely the one a human reviewer notices at 5pm on Friday. The check does. |

Each check produces a structured verdict — `pass`, `warning`, `fail`, or `overridden` — with the offending lines highlighted. A senior engineer then reads the *verdicts*, not the diff cold.

Two principles guard the layer itself:

1. **The human still owns every call.** The review layer surfaces what to look at; it does not approve or merge.
2. **Every override is logged, attributed, and visible on the dashboard.** If a team is overriding the same check repeatedly, that is signal — either the check is wrong, or the team is taking on debt with its eyes open. Either way, leadership sees it.

### Pillar 3 — the Pulse Dashboard

Guard fixed half of the review problem. The other half was visibility. The blog post that announced Pulse pitched a seven-category dashboard (Quality · Security · Cost · Activity · People · Adoption · Ops); the v1 we shipped is narrower and more useful: **the project's artifacts, on one screen.**

The dashboard is a read-only viewer over `docs/pulse/` + `.pulse/`. It renders:

- **Specs** — every epic, feature, task with frontmatter-driven metadata, ticked acceptance criteria, embedded Mermaid diagrams, and a clickable link graph that wires the whole tree together.
- **ADRs** — every architecture decision with its "Decides / Supersedes / Superseded-by" graph and back-links to the task it answers.
- **Reviews** — every Guard verdict, with finding-level file:line refs.
- **Audit** — the override log, sortable and filterable by check and engineer.
- **Project-wide views** — `/db` auto-extracts from your Prisma schema, `/api` from your OpenAPI spec, `/design` from Tailwind `@theme` blocks, each merged with the hand-authored narrative you keep alongside.
- **Search** — full-text across every artifact, ADR, review, and generated section.

The bigger seven-category metrics dashboard (Cost & ROI, People burnout, Adoption, Ops) is a v2 effort that pulls from external systems. v1 ships what's tractable and high-signal: the artifact wiki and the audit trail.

---

## The three principles

These hold the system together. They are also the parts a buyer in another industry can take and apply tomorrow.

### 1. Assume the code was not written by a human, and review accordingly.

When you stop expecting human authorship, you stop relying on the heuristics that depend on it (intent, comments, naming choices) and start building checks that work on the artefact regardless of who or what produced it. Most review processes still assume human authorship. Most code now isn't.

This is the principle behind every Guard sub-agent. None of them ask "did the author know what they were doing?" — that's a question with no answer when most authoring is AI. They all ask "is this artefact safe?"

### 2. Every override is data, not friction.

A check that fails and gets overridden is the most useful event in the system. It tells you:

- Whether the check is calibrated (overrides spike on one check → the check is wrong)
- Whether the team is taking on debt knowingly (overrides spike on one engineer → call it out at 1:1)
- Whether a particular pattern is becoming load-bearing (overrides spike on one type of finding → bake it into the convention)

Overrides are routed to the dashboard, not buried in a CI log. The audit trail is the value.

### 3. One screen for engineering health beats five tabs.

The cost of context-switching between tools is paid by the people whose judgment you most want focused. Pulling the most decision-relevant signal from each tool into one view is not about prettiness — it is about putting judgment in the place where the trade-offs are visible.

For v1 this means the project's own artifacts. For v2 — the hosted/SaaS version — this means external integrations folded in.

---

## What changes for engineers (and what doesn't)

**For engineers, judgment moves up the stack.** You are no longer reading every diff cold at 5pm because the agentic layer has already pre-read it for you. You're reading the verdicts, the overrides, the high-signal sections the layer flagged. The work is still demanding — arguably more so, because every interaction is non-trivial — but the volume of low-signal review is gone.

**What does NOT change:** the engineer still owns every call. Pulse doesn't approve PRs. Pulse doesn't merge. Pulse doesn't push. Pulse surfaces; humans decide.

**What does NOT change either:** the hiring bar. The senior product engineers Twistag hires know when "looks fine" isn't fine. AI made that instinct *more* valuable, not less.

---

## What changes for clients

Two things:

1. **Smaller teams deliver more.** A 5-person Twistag squad with Pulse produces what traditionally requires 8–10 engineers.
2. **Consistency stops depending on individual heroics.** The agentic review layer enforces the same 8 checks on sprint one and sprint twenty, regardless of which engineer is on duty.

The dashboard is also the audit trail. Every override, every escaped defect, every infra cost spike is attributed and timestamped. If a client asks why we shipped a particular release on a particular day, the answer is on the dashboard.

---

## What this means for buyers

If you're evaluating engineering partners, the question is no longer whether a team uses AI. Everyone uses AI. The question is whether AI is embedded in the delivery system — with review, visibility, and accountability around it — or bolted on top of a process that was designed for 10% of today's code volume.

Pulse is the system. The five delivery agents move work forward. The eight-check Guard keeps it production-grade. The dashboard tells us where judgment is being spent and whether it's paying back. Twistag built it because the alternative was waiting for the slow incident to land.

---

## Where this came from

The original product brief is preserved at [`docs/pulse/specs/2026-05-12-twistag-pulse-design.md`](pulse/specs/2026-05-12-twistag-pulse-design.md). It's the v1 design with the full vertical-slice build plan that was executed across 7 slice commits.

The phrase that anchored the design:

> *AI doesn't write bad code, mostly. It writes plausible code. Passes the tests, looks fine, and quietly reintroduces an auth pattern the team killed six months ago.*

Everything in Pulse exists because of that sentence.

---

**Next:** [Plugin reference](reference/plugin.md) when you want the canonical list of skills / commands / sub-agents, or [The SDLC loop](workflows/sdlc-loop.md) for the deeper narrative version of the phases.
