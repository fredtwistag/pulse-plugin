# Troubleshooting

Common gotchas, in one place. If something isn't here, the [glossary](glossary.md) might have a definition that helps, or the relevant reference page will.

---

## Install / setup

### `pnpm: command not found`

You don't have pnpm installed. Recommended:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

This uses Corepack (bundled with Node 16+) to install pnpm system-wide. Verify with `pnpm --version`.

### `Ignored build scripts: sharp@0.33.5`

Harmless warning. Pnpm 11 prints this for native deps that haven't been explicitly approved to run install scripts. Pulse's `package.json` has `pnpm.onlyBuiltDependencies: [sharp]` which authorizes it, but the warning still appears in some terminal outputs. Sharp ships prebuilt binaries for common platforms; the warning doesn't break anything.

### `pnpm install` fails with peer dependency errors

Most often a Node version mismatch. Verify with:

```bash
node --version    # must be 20+
```

If your `nvm`/`fnm`/`asdf` version is wrong, switch:

```bash
nvm use 22        # or whatever's specified in package.json engines
```

### Plugin smoke test fails

If `pnpm plugin:smoke` reports anything but 10/10, the plugin tree is broken. Most common causes:

- **Cloned the repo as a partial / shallow clone** — missing files. Re-clone fully.
- **Edited a SKILL.md, removed a sub-agent reference** — the smoke test cross-checks that the `pulse-guard` and `pulse-ship` SKILL.md files name every sub-agent by id.

Read the FAIL output; it tells you exactly which check failed and why.

---

## Claude Code plugin

### `/pulse-*` commands don't appear in autocomplete

The plugin isn't linked into Claude Code's plugin directory, OR Claude Code hasn't picked up the link.

Verify the symlink exists:

```bash
ls -la ~/.claude/plugins/twistag-pulse
# Should print: ... twistag-pulse -> /path/to/pulse/plugins/twistag-pulse
```

If missing:

```bash
ln -s "$(pwd)/plugins/twistag-pulse" "$HOME/.claude/plugins/twistag-pulse"
# from inside the cloned pulse repo
```

If present but autocomplete still doesn't show, **restart Claude Code**. Plugin loading happens at startup.

### Skills exist but Claude says "I don't know that command"

Symptom: `/pulse-spec foo` returns "I don't have access to a `pulse-spec` command."

Check that the `commands/` directory has the matching `.md` file:

```bash
ls plugins/twistag-pulse/commands/
# Should list pulse-spec.md pulse-arch.md pulse-code.md pulse-guard.md pulse-ship.md
```

If any are missing, your plugin tree is broken — see the smoke-test entry above.

---

## Pre-push hook

### `Pulse pre-push: no .pulse/ directory in this repo. Skipping.`

You're running the hook on a repo without Pulse instrumented. That's the expected behavior; the hook short-circuits.

To fix, either:

- Add `.pulse/` to the repo (see [setup-on-existing-repo](recipes/setup-on-existing-repo.md)).
- Remove the hook from this repo if you don't want Pulse here: `rm .git/hooks/pre-push`.

### `Pulse pre-push blocked. No review found for HEAD (xxxxxxx).`

Expected when you push without running `/pulse-guard` first. Run it:

```
/pulse-guard
```

Then `git push` again.

### `Pulse pre-push blocked. Review xxxxxxx overall=fail.`

The most recent Guard run found a `fail`. Two paths:

- Fix the finding, re-run `/pulse-guard`, push again.
- Override: `/pulse-guard --override "<reason — must contain 'by <name>' for high-stakes checks>"`. See [overriding-guard](workflows/overriding-guard.md).

### I need to push RIGHT NOW

```bash
PULSE_SKIP_GUARD=1 git push
```

Use sparingly. The hook prints a yellow warning. See [the emergency exit section](workflows/overriding-guard.md#the-emergency-exit-pulse_skip_guard1).

### Hook fires but skips the review check

If you see `Pulse pre-push: review xxxxxxx overall=overridden. Proceeding.` and you didn't override anything — that's because the review file's `overall:` is `overridden`, which the hook allows. The override entry is in `.pulse/overrides.log.md`; check who added it.

### Pre-push hook re-installs as a backup file

When you run `node install-hooks.mjs` against a repo that already has a `pre-push` hook (yours, not Pulse's), it backs the old one up to `.git/hooks/pre-push.pulse-backup-<ts>` before symlinking Pulse's in. If you want both, you'll need a wrapper script that chains them — file an issue.

---

## `/pulse-spec`

### Spec files written at the wrong path

Most common cause: running `/pulse-spec` from the wrong CWD. The skill writes to `docs/pulse/...` relative to the current working directory.

Fix: open Claude Code at the repo root, not in a subdirectory.

### Companion `db.md` / `api.md` / `design.md` not appearing on the task page in the dashboard

Two possibilities:

- The companion file has `type: task` or `status:` in its frontmatter — companions use the lighter `kind:` frontmatter only. Delete those fields.
- The dashboard is pointed at the wrong `PULSE_REPO_ROOT`. Verify with the dashboard's homepage; the "Artifacts root" path should match where your specs were written.

### Spec interview repeats questions Claude already asked

Could be context window pressure — Claude is forgetting earlier turns. Solutions:

- Be brief in your interview answers.
- If it keeps happening, restart the conversation and supply the brief in the first message.

---

## `/pulse-arch`

### `/pulse-arch` writes code instead of an ADR

Push back. The skill's prompt is explicit that it produces ADRs only, never code. If it slips, file the conversation as feedback so the prompt can be tuned.

### ADR number isn't monotonic

`/pulse-arch` scans `docs/pulse/adr/` for the highest `ADR-NNN-` prefix and adds 1. If your ADR filenames don't follow that pattern, the auto-numbering won't work. Rename existing ADRs to `ADR-001-…`, `ADR-002-…`, etc.

---

## `/pulse-code`

### Tests pass but acceptance ticks don't update

`/pulse-code` updates the spec frontmatter as criteria pass. If it forgets, push back — that's the bookkeeping half of the skill. The spec file is at `docs/pulse/epics/<…>/tasks/<slug>/spec.md`; the `acceptance:` list is in the frontmatter.

### Implementation written before the test

Push back. TDD discipline is non-negotiable in this skill — it's what makes the test-integrity Guard check meaningful. File feedback.

### `/pulse-code` transitions status to `shipped`

Bug — it shouldn't. `shipped` is `/pulse-ship`'s job. File it.

---

## `/pulse-guard`

### `/pulse-guard` reports `pass` but I know there's a problem

Two scenarios:

- **The problem isn't in the diff.** Guard reads the diff vs the base branch, not the whole codebase. Pre-existing issues are invisible to it.
- **The check that should fire is disabled.** Check `.pulse/config.yaml.guard.<check_name>.enabled`.

### Verdict file already exists for this sha

Per-sha review files are immutable. Two options:

- `git commit --amend` to change the sha.
- `git rebase` to consolidate / reorder.

Don't manually delete the review file — it's an audit record.

### `--override` is rejected even though I have a reason

Check the regex match. The reason for an override on `security_regression` or `data_api_safety` MUST contain `by <name>` — regex `/by\s+\S+/i`.

- ✓ `"approved by joao for the demo"`
- ✓ `"reviewed by Maria — accepting tech debt"`
- ✗ `"joao approved it"` (no `by`)
- ✗ `"approved by"`  (no `<name>`)
- ✗ `"approved (joao)"` (different syntax)

### Override entry doesn't show on the dashboard

The dashboard parses `.pulse/overrides.log.md` for fenced ```yaml blocks. If your entry isn't in such a block, it's invisible. Check the file format — see [state-convention reference: override-log entries](reference/state-convention.md#override-log-entries-pulseoverrideslogmd).

---

## `/pulse-ship`

### `/pulse-ship` refuses with "test_command red"

Your tests are failing locally. Fix them first. Run `pnpm test` (or whatever `.pulse/config.yaml.ship.test_command` resolves to) to see the failures.

### `/pulse-ship` refuses with "test_command suspicious"

You set `test_command: true` or `test_command: exit 0` or similar. This is the failure mode the skill exists to catch — change it to your real test command.

### Generated workflow uses commands that don't exist in my package.json

The `ship-github-actions` sub-agent reads `package.json` and uses what's there. If it inferred wrong, edit the workflow file and re-run; OR add the missing scripts to `package.json` and re-run.

### Diff-mode proposes nothing

Means your existing CI already satisfies the five invariants Ship enforces. Good — adoption is a no-op for you. See [existing-ci-diff-mode](recipes/existing-ci-diff-mode.md).

### Existing `scripts/rollback.sh` was not touched

Deliberate. Rollback paths are load-bearing operationally; the sub-agent never overwrites an existing rollback silently. If it has a recommendation, it's printed in the report.

---

## Dashboard

### Dashboard loads but shows fixture content instead of my project

You didn't set `PULSE_REPO_ROOT` before `pnpm dev`. Set it:

```bash
PULSE_REPO_ROOT=/path/to/your/repo pnpm dev
```

The env var must be set BEFORE the dev server starts. Restart if you set it after.

### Dashboard shows fixture content even with PULSE_REPO_ROOT set

You set `PULSE_REPO_ROOT` to a path that doesn't have `docs/pulse/` in it. The dashboard logs the resolved artifacts root on the homepage — check it matches your expectation.

### Sidebar doesn't show my new spec

The dashboard reads at request time. Reload the page. If your spec was written while the page was open, a hard refresh (Cmd-Shift-R) might be needed.

If reload doesn't help, verify the spec file is at the expected path:

```bash
find docs/pulse -name "spec.md"
```

And that it parses (no broken frontmatter):

```bash
head -10 docs/pulse/epics/<...>/spec.md
```

The dashboard surfaces parse errors as a red "Parser errors" section on the homepage when they occur — check there.

### Mermaid diagrams render as code blocks, not as diagrams

The Mermaid bundle is dynamic-imported client-side. If your network blocks the import or your browser has JS disabled, Mermaid silently falls back. Check the browser console.

### `/db` is empty even though I have a Prisma schema

The Prisma extractor looks in `prisma/schema.prisma`, `schema.prisma`, or `db/schema.prisma`. If your schema is elsewhere, the extractor doesn't find it. Move or symlink.

### `/design` is empty even though I use Tailwind v4

The Tailwind extractor scans CSS files for `@theme { }` blocks (up to 3 directories deep, up to 50 files). If your tokens live in a TS config file (Tailwind v3 style), the extractor doesn't see them — v1 supports the CSS-first config only.

### Search returns nothing

The index includes every artifact body + companion + ADR + review + generated section. If your search returns nothing:

- Try a single word, not a phrase.
- The search is case-insensitive but exact-substring; it doesn't fuzzy-match. "audi" matches "audit"; "audti" doesn't.
- Verify the term actually appears in your artifacts (`grep -r "term" docs/pulse/`).

### Dashboard build fails with `Error: Missing field 'negated' on ScannerOptions.sources`

Known bug in Tailwind v4.0.0. The package.json pins to v4.3.0+; if you've downgraded, restore.

---

## File state

### Spec frontmatter parses as a Date object and crashes the page

The dashboard's parser normalizes YAML dates to ISO-date strings, so this shouldn't happen. If it does, the parse normalization has a bug — file an issue with the offending frontmatter.

### "Unplaced artifacts" appears on the homepage

You have `.md` files under `docs/pulse/` that don't match the convention (`epics/<slug>/spec.md`, etc.). The homepage lists them in a "Unplaced artifacts" section.

Move them to the right location, or rename to match the convention. Slice 6 surfaces them on a dedicated page in a future iteration; for now they're informational.

---

## Still stuck?

The wiki has:

- **[Plugin reference](reference/plugin.md)** — every command and flag.
- **[State convention reference](reference/state-convention.md)** — every config field.
- **[Dashboard reference](reference/dashboard.md)** — every route and extractor.
- **[Glossary](glossary.md)** — every term defined.

If none of those help, file an issue on the repo with:

1. What you tried.
2. What you expected.
3. What happened instead.
4. The relevant snippet from `.pulse/config.yaml` if any.

Good bug reports are themselves Pulse-style: outcomes-shaped, evidence-cited.
