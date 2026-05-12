# twistag-pulse — Claude Code plugin

The Claude Code plugin half of [Twistag Pulse](https://github.com/fredtwistag/pulse-plugin). Five delivery agents as slash commands, an 8-check pre-push Guard hook, and Twistag's `docs/pulse/` + `.pulse/` state convention.

## Install (development)

This plugin lives in the [`pulse`](https://github.com/fredtwistag/pulse-plugin) monorepo. To use it locally before marketplace publish:

```bash
# from this monorepo root
pnpm install
# point Claude Code at this directory
ln -s "$PWD/plugins/twistag-pulse" "$HOME/.claude/plugins/twistag-pulse"
```

## Slash commands

| Command | Phase | Use |
|---|---|---|
| `/pulse-spec <brief>` | Discovery → Spec | Turn an ask into specs + artifact stubs under `docs/pulse/` |
| `/pulse-arch <task-slug>` | Architecture | Propose 2-3 paths, write ADR |
| `/pulse-code <task-slug>` | Implementation | TDD loop against acceptance criteria |
| `/pulse-guard` | Pre-push review | Run 8 review sub-agents, block on `fail` |
| `/pulse-ship [target]` | Deploy | Generate workflow + rollback, test gate |

## State written to the host repo

```
docs/pulse/
  epics/<slug>/{spec.md, arch.md, features/<slug>/{spec.md, tasks/<slug>/{spec.md, db.md, api.md, design.md}}}
  adr/ADR-NNN-<slug>.md
  _generated/   # auto-extracted (Prisma, OpenAPI, Tailwind tokens)

.pulse/
  config.yaml          # conventions, banned patterns, deploy target, override policy
  overrides.log.md     # append-only audit
  reviews/<sha>.md     # per-push Guard verdicts
```

Templates for each artifact live in [`templates/`](./templates).

## Status

**v0.1.0 — Slice 0 (Foundation).** Manifest, skill skeletons, slash commands, state templates, smoke test. Slice 1 (full `/pulse-spec` + dashboard render) is next.

See [`docs/pulse/specs/`](../../docs/pulse/specs/) at the repo root for the full plan and slice schedule.
