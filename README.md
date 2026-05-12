# Twistag Pulse

> Twistag's AI-native delivery methodology. Smaller teams. More impact. Less process.

Pulse codifies how Twistag ships ~90% spec-driven, AI-generated code on real client projects — and how we keep the remaining 10% (where senior judgment lives) honest, consistent, and auditable at that volume.

## What's in this repo

```
pulse/
├── plugins/twistag-pulse/   # Claude Code plugin — 5 delivery agents + 8-check Guard
├── apps/pulse-dashboard/    # Self-hosted Next.js dashboard — read-only artifact wiki
├── fixtures/                # Sample repo for local plugin + dashboard development
└── docs/pulse/              # This repo's own Pulse artifacts (we eat our own dog food)
```

## The methodology — three pillars

1. **Five delivery agents** (slash commands in the plugin):
   `/pulse-spec` · `/pulse-arch` · `/pulse-code` · `/pulse-guard` · `/pulse-ship`
2. **Eight-check agentic review layer** (Guard sub-agents, pre-push hook):
   spec conformance · security regression · convention drift · anti-pattern repetition · performance pitfalls · test integrity · dependency hygiene · data/API safety
3. **Pulse Dashboard** — read-only Next.js viewer over `docs/pulse/` + `.pulse/`, with GitHub-grade typography and api-docs-style navigation. Engineers and clients see specs, ADRs, DB models, API designs, design tokens, and the override audit log in one place.

## Status

**Slice 0 — Foundation.** Plugin manifest, smoke command, state convention templates, dashboard shell, dev DX. See [`docs/pulse/specs/2026-05-12-twistag-pulse-design.md`](docs/pulse/specs/2026-05-12-twistag-pulse-design.md) for the full vertical-slice build plan.

## Quick start

```bash
pnpm install
pnpm dev                  # runs the dashboard against fixtures/sample-repo
pnpm plugin:smoke         # verifies the plugin manifest is valid
```

## License

MIT
