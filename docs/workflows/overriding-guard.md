# Overriding Guard

Guard fails happen. Sometimes they're correct and you should fix the code; sometimes they're wrong or accepted-with-eyes-open and you should override. This page is the canonical guide for the override path: when to use it, how it works, what the audit captures, and how the feedback loop tunes Guard over time.

---

## The decision tree

When `/pulse-guard` returns `overall: fail`, three options:

1. **Fix the code.** Address the finding, re-run `/pulse-guard`. Default behavior; do this when you can.
2. **Update the rule.** If the check is calibrated wrong for this project (a banned pattern is too broad, a convention rule is too strict), edit `.pulse/config.yaml` and re-run. Commit the rule change as a separate commit with a clear message.
3. **Override.** Wave the failed check through with a documented reason. This is what this page is about.

The order matters. Override is option three of three. If you find yourself overriding the same check repeatedly, you're using the wrong option — go back to #2.

---

## When to override

Concrete cases:

- **Test fixtures trip security checks.** A test helper that intentionally contains the banned `Authorization: Bearer dev-token` pattern. The pattern is sound; the surface area filter is wrong. **Action:** override; file a follow-up to add path-based exemptions to `.pulse/config.yaml`.
- **A migration trips data-api-safety but is provably safe.** A column rename that the schema-aware check flags as breaking, but you've coordinated a deprecation cycle with all consumers. **Action:** override with the cycle plan in the reason.
- **A performance check trips on a non-hot path.** N+1 detected in a one-time admin import script. **Action:** override with the "this runs once at midnight against a tiny dataset" context.
- **A check matures faster than your tests can catch up.** A new test-integrity rule lands; your existing tests don't satisfy it; you're shipping a hotfix. **Action:** override now, schedule a hardening sprint.

Do NOT override:

- **To unblock CI without reading the finding.** That's not overriding — that's lying to the audit log.
- **Because the check is "annoying."** Surface the annoyance as feedback, tune the rule.
- **To ship a P0 fast.** Use `PULSE_SKIP_GUARD=1` for that — it's the explicit emergency exit. The audit log shows skips differently from overrides.

---

## How an override works

The mechanics:

```
/pulse-guard --override "<reason>"
```

This:

1. Re-reads the most recent review at `.pulse/reviews/<HEAD-sha>.md`. If none exists, runs the full Guard flow first.
2. For every check whose status is `fail`, appends a YAML block to `.pulse/overrides.log.md` with:
   - `sha` (full commit sha)
   - `base` (base branch)
   - `engineer` (from `git config user.name`)
   - `check` (the failing check id)
   - `reason` (your text, verbatim)
   - `second_engineer` (if applicable — see below)
   - `created` (ISO-8601 timestamp)
3. Checks `.pulse/config.yaml.overrides.require_second_engineer` against the failed check. If the check is in that list, the reason MUST contain `by <name>` (regex: `/by\s+\S+/i`). The matched name lands in `second_engineer`.
4. Rewrites the review's `overall:` field to `overridden` (if every fail is now overridden) or leaves it `fail` (if any unoverridden fail remains).

The override entry is **append-only**. You can't edit or delete an override. If you decide later it was wrong, document that as a new entry with `reason: "supersedes <previous-sha>'s override — was incorrect because …"`.

---

## The second-engineer requirement

By default `.pulse/config.yaml` requires a second engineer for two checks:

```yaml
overrides:
  require_second_engineer:
    - security_regression
    - data_api_safety
```

Both are checks where the failure mode is high-blast-radius (secrets in code, breaking API change, unsafe migration, PII exposure). A second engineer signs off via your reason text:

```
/pulse-guard --override "approved by joao for the deprecation cycle starting next sprint"
```

The regex `/by\s+\S+/i` matches `by joao`, `by Maria`, `by claire@twistag.com`. The matched name is captured to `second_engineer:` in the override log entry.

Two adjustments you can make per-project:

- **Add checks to the list.** A high-trust project might add `test_integrity` if the team has been burned by tests-of-mocks shipping.
- **Remove checks.** A solo-engineer project may legitimately have no second engineer; remove the check from the list and document why in a project README.

---

## What the dashboard surfaces

The override log feeds two views:

### `/audit` — every override, sortable + filterable

URL search params for `check=` and `engineer=` make filters bookmarkable. Common queries:

- "All overrides on `security-regression` in the last quarter" — bookmarked URL.
- "Every override Maria filed" — `/audit?engineer=maria`.
- "Every override on this PR" — surfaced inline on the review's `/reviews/[sha]` page.

### Homepage Guard health

The clickable sparkline on the homepage shows each recent review's `overall:`. An override-heavy sparkline (lots of accent-color pills) tells leadership the team is accepting a lot of Guard-flagged risk. That's a conversation, not an alarm — but it shouldn't be invisible.

---

## The calibration feedback loop

The override log is **how Guard tunes itself**. Over time you'll see patterns:

| Pattern | What it means | What to do |
|---|---|---|
| Repeated overrides on one check | The check is too strict or too broad for this project | Update `.pulse/config.yaml`; tighten the check's rule list or scope |
| Repeated overrides citing the same reason text | An exemption that should be promoted to a rule | Codify it: add a path exclusion, update the banned-pattern regex, etc. |
| Overrides clustering on one engineer | Either that engineer has unusual scope (e.g. infra work that legitimately hits all the checks), or there's a knowledge/calibration gap worth a 1:1 about | Bring it up at 1:1; not a punitive metric |
| Overrides clustering on one PR / sha | One change set is taking on a lot of debt at once | Surface in the next retro; was it the right call? |

The audit log is the answer to "is Guard working?" If overrides are rare and meaningful, yes. If overrides are frequent and rote, no — go fix the calibration.

---

## The emergency exit (`PULSE_SKIP_GUARD=1`)

For a P0 hotfix where you literally can't wait to run `/pulse-guard` (the LLM is down, the network is bad, the deploy must happen NOW):

```bash
PULSE_SKIP_GUARD=1 git push
```

The pre-push hook prints an explicit yellow warning and lets the push through without reading any review file. Use this only when:

- A genuine emergency is in flight.
- You'll run `/pulse-guard` retroactively on the deployed sha and address findings.
- You're prepared to defend the bypass on the next dashboard review.

`PULSE_SKIP_GUARD` does NOT write to `.pulse/overrides.log.md`. The fact that it was used is recorded only in the pre-push hook's stderr output. For more durable tracking, add a calendar reminder to retroactively review the sha — or just don't use it.

---

## Override storage format

Override entries live in `.pulse/overrides.log.md`. The file is structured for both humans and parsers:

- Human-readable headings between entries.
- Each entry is a single fenced ```yaml block — that's the only part the dashboard parses.

Example:

```markdown
## 2026-05-12T11:14:55Z — joao — security-regression

```yaml
sha: 9f8e7d6c5b4a3928176543210fedcba987654321
base: main
engineer: joao
check: security-regression
reason: "Banned literal `Authorization: Bearer dev-token` appears in src/test-helpers/admin-client.ts. The pattern is gated behind NODE_ENV !== 'production'. Filing PULSE-CFG-12 to add path exclusions to .pulse/config.yaml."
second_engineer: fred
created: 2026-05-12T11:14:55Z
```
```

The markdown headings are decorative; the YAML block is the source of truth.

---

## Frequently asked

**Q: Can I edit a previous override entry?**
A: No. The file is append-only. If you need to correct or contextualize, add a new entry that references the previous one.

**Q: Can I override an override?**
A: There's nothing to override — overrides aren't a check. If you want to *revoke* a previous override (e.g. because the underlying issue is now fixed in a later commit), just don't add a new override on the new sha; Guard will pass naturally.

**Q: Does an override carry forward to the next commit?**
A: No. Overrides are per-sha. Each new commit gets a new Guard review; if the same check fails again, you override again (with a fresh entry citing the new sha).

**Q: What if I disagree with the `require_second_engineer` requirement?**
A: Change `.pulse/config.yaml.overrides.require_second_engineer`. It's per-project config. Document the change in your project's README.

---

**Related:** [The SDLC loop](sdlc-loop.md) · [Plugin reference: Guard sub-agents](../reference/plugin.md#guard-sub-agents) · [Customizing conventions](../recipes/customizing-conventions.md)
